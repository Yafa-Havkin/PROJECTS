"""
Phoenix RAG Bot — configuration dataclasses (TenantConfig, PersonaConfig).

All company-specific behaviour is driven by these config objects (loaded from
YAML), never hardcoded in source — so the same codebase serves any tenant by
swapping the config files (Req 10.x).
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class PersonaConfig:
    """A single persona (e.g. "customer" or "agent").

    Attributes:
        persona_id: Stable id used in requests/config.
        name: Human-readable display name for the UI toggle.
        system_prompt: The system prompt that defines tone + rules.
        tone: Free-text tone label.
        include_clause_citations: Whether to cite policy clauses (agent mode).
        include_customer_service_ref: Whether to add a service-desk referral.
        content_restrictions: List of restriction tags.
        preferred_content_types: Content types this persona favours.
    """

    persona_id: str
    name: str
    system_prompt: str
    tone: str = "neutral"
    include_clause_citations: bool = False
    include_customer_service_ref: bool = True
    content_restrictions: list[str] = field(default_factory=list)
    preferred_content_types: list[str] = field(default_factory=list)


@dataclass
class TenantConfig:
    """Company-wide configuration for one tenant (e.g. Phoenix).

    Everything company-specific lives here so the code stays generic.
    """

    tenant_id: str
    company_name: str
    crawl_url: str
    crawl_max_depth: int
    crawl_timeout_minutes: int
    vectorstore_path: str
    default_persona_id: str
    persona_config_paths: list[str]
    recrawl_schedule: str | None = None  # Cron expression, e.g. "0 2 * * 0"

    # --- LLM resilience settings (model + request-timeout fallback) ---------
    # Only REAL, currently-available Gemini alias models are listed (verified
    # against the live API). The fast "lite" model is first because it has the
    # most generous free-tier quota; the heavier models follow as fallbacks.
    generation_models: list[str] = field(
        default_factory=lambda: [
            "gemini-flash-lite-latest",
            "gemini-flash-latest",
            "gemini-pro-latest",
        ]
    )
    # Embedding model used for indexing and query embedding.
    embedding_model: str = "models/gemini-embedding-2"
    # Per-request HTTP timeout (seconds) for LLM calls. Generous because
    # TLS-inspecting networks (e.g. NetFree) slow long requests.
    request_timeout_seconds: int = 90
