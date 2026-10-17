"""
Phoenix RAG Bot — configuration loader.

Loads the tenant YAML and persona YAMLs into typed dataclasses. On a missing
or malformed tenant file the process exits with a clear message (Req 10.5);
a missing/malformed persona falls back to the default persona (Req 9.8).
"""

from __future__ import annotations

import logging
import sys

import yaml

from backend.config.models import PersonaConfig, TenantConfig

logger = logging.getLogger("phoenix_rag_bot.config")


class ConfigLoader:
    """Loads and caches the tenant + persona configuration from YAML files."""

    def __init__(self, tenant_path: str) -> None:
        """Load the tenant config immediately so failures surface at startup.

        Args:
            tenant_path: Path to the tenant YAML (e.g. config/phoenix.yaml).
        """
        self._tenant_path = tenant_path
        self._tenant: TenantConfig | None = None
        self._personas: dict[str, PersonaConfig] = {}
        self._tenant = self._load_tenant_file(tenant_path)
        logger.info("ConfigLoader initialised with tenant config: %s", tenant_path)

    # ------------------------------------------------------------------ #
    # Public API
    # ------------------------------------------------------------------ #
    def load_tenant(self) -> TenantConfig:
        """Return the loaded tenant config (loaded in __init__)."""
        assert self._tenant is not None  # guaranteed by __init__
        return self._tenant

    def list_personas(self) -> list[str]:
        """Return the configured persona ids, in declared order."""
        tenant = self.load_tenant()
        ids: list[str] = []
        for path in tenant.persona_config_paths:
            try:
                persona = self._load_persona_file(path)
                ids.append(persona.persona_id)
                self._personas[persona.persona_id] = persona
            except Exception:  # noqa: BLE001
                logger.warning("Skipping unreadable persona config: %s", path)
        return ids

    def load_persona(self, persona_id: str) -> PersonaConfig:
        """Return a persona by id, falling back to the default persona (Req 9.8).

        Args:
            persona_id: The requested persona id.

        Returns:
            The matching :class:`PersonaConfig`, or the tenant default if the
            requested persona is missing/unreadable.
        """
        if not self._personas:
            self.list_personas()  # populate cache

        if persona_id in self._personas:
            return self._personas[persona_id]

        tenant = self.load_tenant()
        default_id = tenant.default_persona_id
        if default_id in self._personas:
            logger.warning(
                "Persona '%s' not found; falling back to default '%s'.",
                persona_id,
                default_id,
            )
            return self._personas[default_id]

        # Last resort: synthesise a minimal safe customer persona.
        logger.error("No personas loaded; using a built-in minimal persona.")
        return PersonaConfig(
            persona_id="customer",
            name="מצב לקוח",
            system_prompt=(
                "אתה העוזר הדיגיטלי של חברת הפניקס. ענה בעברית אך ורק על בסיס "
                "המידע שסופק לך, וצרף מקורות."
            ),
        )

    # ------------------------------------------------------------------ #
    # Internal helpers
    # ------------------------------------------------------------------ #
    def _load_tenant_file(self, path: str) -> TenantConfig:
        try:
            with open(path, "r", encoding="utf-8") as fh:
                data = yaml.safe_load(fh)
        except FileNotFoundError:
            logger.error("Tenant config file not found: %s", path)
            sys.exit(f"FATAL: tenant config not found: {path}")
        except yaml.YAMLError as exc:
            logger.error("Tenant config is not valid YAML: %s", exc)
            sys.exit(f"FATAL: tenant config is not valid YAML: {path}")

        try:
            return TenantConfig(
                tenant_id=data["tenant_id"],
                company_name=data["company_name"],
                crawl_url=data["crawl_url"],
                crawl_max_depth=int(data["crawl_max_depth"]),
                crawl_timeout_minutes=int(data["crawl_timeout_minutes"]),
                vectorstore_path=data["vectorstore_path"],
                default_persona_id=data["default_persona_id"],
                persona_config_paths=list(data["persona_config_paths"]),
                recrawl_schedule=data.get("recrawl_schedule"),
            )
        except (KeyError, TypeError, ValueError) as exc:
            logger.error("Tenant config is missing required fields: %s", exc)
            sys.exit(f"FATAL: tenant config is missing required fields: {exc}")

    def _load_persona_file(self, path: str) -> PersonaConfig:
        with open(path, "r", encoding="utf-8") as fh:
            data = yaml.safe_load(fh)
        return PersonaConfig(
            persona_id=data["persona_id"],
            name=data["name"],
            system_prompt=data["system_prompt"],
            tone=data.get("tone", "neutral"),
            include_clause_citations=bool(data.get("include_clause_citations", False)),
            include_customer_service_ref=bool(
                data.get("include_customer_service_ref", True)
            ),
            content_restrictions=list(data.get("content_restrictions", [])),
            preferred_content_types=list(data.get("preferred_content_types", [])),
        )
