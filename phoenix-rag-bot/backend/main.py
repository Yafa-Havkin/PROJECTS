"""
Phoenix RAG Bot — FastAPI application entry point.

Builds the app and wires every runtime singleton during startup. All
company-specific behaviour is driven by env vars / the TenantConfig file:

* ``PHOENIX_TENANT_CONFIG`` — path to the TenantConfig YAML (default: config/phoenix.yaml).
* ``GEMINI_API_KEY`` (+ _2.._5) — Gemini API keys (fallback chain).
* ``PHOENIX_CORS_ORIGINS``  — comma-separated allowed origins, or "*" for any.

Run locally with::

    python -m backend.main
    # or: uvicorn backend.main:app --host 0.0.0.0 --port 8000
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.chat import AppServices, router, set_services
from backend.config.loader import ConfigLoader
from backend.generator.generator import AnswerGenerator
from backend.indexer.embedder import Embedder
from backend.indexer.vectorstore import ChromaVectorStore
from backend.llm.gemini_client import GeminiClient
from backend.retriever.bm25_index import BM25Index
from backend.retriever.reranker import Reranker
from backend.retriever.retriever import HybridRetriever
from backend.session.manager import SessionManager

_ENV_TENANT_CONFIG = "PHOENIX_TENANT_CONFIG"
_DEFAULT_TENANT_CONFIG = "config/phoenix.yaml"
_ENV_API_KEY = "GEMINI_API_KEY"
_ENV_CORS_ORIGINS = "PHOENIX_CORS_ORIGINS"
_DEFAULT_CORS_ORIGINS = (
    "http://localhost:5173,http://localhost:3000,"
    "https://projects-production-77a3.up.railway.app"
)

#: Opt-in flag for the in-process scheduled re-crawl. Off by default so the API
#: server and the (CPU/quota-heavy) crawl are decoupled unless explicitly asked.
_ENV_ENABLE_SCHEDULER = "PHOENIX_ENABLE_SCHEDULER"

_LOG_FORMAT = "%(asctime)s %(levelname)-8s %(name)s | %(message)s"
_LOG_DATEFMT = "%Y-%m-%d %H:%M:%S"

logging.basicConfig(level=logging.INFO, format=_LOG_FORMAT, datefmt=_LOG_DATEFMT)
logger = logging.getLogger("phoenix_rag_bot.main")


def _parse_cors_origins() -> list[str]:
    """Parse the comma-separated CORS origins env var into a clean list."""
    raw = os.environ.get(_ENV_CORS_ORIGINS, _DEFAULT_CORS_ORIGINS)
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


def _env_truthy(name: str) -> bool:
    """Return True when the named env var is set to a truthy string."""
    return os.environ.get(name, "").strip().lower() in {"1", "true", "yes", "on"}


def _maybe_start_scheduler(tenant_path: str, tenant):  # type: ignore[no-untyped-def]
    """Start the scheduled re-crawl job if enabled, else return None.

    The job re-runs the offline crawl+index pipeline (same code path as the
    CLI) on the tenant's ``recrawl_schedule`` cron expression. It is gated
    behind ``PHOENIX_ENABLE_SCHEDULER`` so a plain API deployment is never
    burdened by an unexpected crawl.

    Args:
        tenant_path: Path to the tenant YAML (passed to the pipeline).
        tenant: The loaded TenantConfig (for the cron expression).

    Returns:
        The started scheduler, or ``None`` if scheduling is disabled/unavailable.
    """
    if not _env_truthy(_ENV_ENABLE_SCHEDULER):
        return None
    cron = getattr(tenant, "recrawl_schedule", None)
    if not cron:
        logger.info("Scheduler enabled but no recrawl_schedule configured; skipping.")
        return None

    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        from apscheduler.triggers.cron import CronTrigger
    except Exception:  # noqa: BLE001
        logger.warning("APScheduler not available; scheduled re-crawl disabled.")
        return None

    def _run_recrawl() -> None:
        import argparse
        import asyncio as _asyncio

        from backend.crawler.cli import run_pipeline

        logger.info("Scheduled re-crawl starting (cron=%s).", cron)
        args = argparse.Namespace(
            tenant=tenant_path, sync=True, api_key=None, log_level="INFO"
        )
        try:
            _asyncio.run(run_pipeline(args))
            logger.info("Scheduled re-crawl finished.")
        except Exception:  # noqa: BLE001
            logger.exception("Scheduled re-crawl failed.")

    try:
        scheduler = BackgroundScheduler(daemon=True)
        scheduler.add_job(_run_recrawl, CronTrigger.from_crontab(cron), id="recrawl")
        scheduler.start()
        logger.info("Scheduled re-crawl registered (cron=%s, mode=sync).", cron)
        return scheduler
    except Exception:  # noqa: BLE001
        logger.exception("Failed to start the re-crawl scheduler.")
        return None


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Build and install all runtime singletons on startup; log on shutdown."""
    tenant_path = os.environ.get(_ENV_TENANT_CONFIG, _DEFAULT_TENANT_CONFIG)

    config_loader = ConfigLoader(tenant_path)
    tenant = config_loader.load_tenant()

    try:
        vectorstore = ChromaVectorStore(tenant.vectorstore_path)
        chunk_count = vectorstore.count()
    except Exception:  # noqa: BLE001
        logger.exception(
            "Failed to open ChromaDB at %s; starting with an empty store.",
            tenant.vectorstore_path,
        )
        vectorstore = ChromaVectorStore(tenant.vectorstore_path)
        chunk_count = 0

    if chunk_count == 0:
        logger.warning(
            "Vector store is empty (0 chunks). Run the crawler CLI "
            "(python -m backend.crawler.cli --tenant %s) to populate it.",
            tenant_path,
        )

    bm25_index = BM25Index.from_vectorstore(vectorstore)

    gemini_client = GeminiClient(
        generation_models=tenant.generation_models,
        embedding_model=tenant.embedding_model,
        request_timeout=tenant.request_timeout_seconds,
    )
    embedder = Embedder(tenant, vectorstore, client=gemini_client)
    reranker = Reranker(client=gemini_client)
    retriever = HybridRetriever(vectorstore, bm25_index, embedder, reranker)
    generator = AnswerGenerator(tenant, client=gemini_client)

    session_manager = SessionManager(tenant.default_persona_id)

    set_services(
        AppServices(
            config_loader=config_loader,
            session_manager=session_manager,
            retriever=retriever,
            generator=generator,
            vectorstore=vectorstore,
            gemini_api_key_configured=gemini_client.has_api_keys,
        )
    )

    # --- Scheduled re-crawl (opt-in) --------------------------------------
    # When PHOENIX_ENABLE_SCHEDULER is truthy AND the tenant defines a
    # recrawl_schedule cron, start an APScheduler job that re-runs the full
    # crawl+index pipeline on that schedule. Off by default so the live API is
    # never disturbed by a heavy crawl unless the operator opts in.
    scheduler = _maybe_start_scheduler(tenant_path, tenant)

    logger.info(
        "Startup complete — company=%s, indexed_chunks=%d, personas=%s, scheduler=%s",
        tenant.company_name,
        chunk_count,
        config_loader.list_personas(),
        "on" if scheduler else "off",
    )

    yield

    if scheduler is not None:
        scheduler.shutdown(wait=False)
    logger.info("Shutting down Phoenix RAG Bot.")


def create_app() -> FastAPI:
    """Construct the FastAPI application with CORS and the chat router mounted."""
    app = FastAPI(title="Phoenix RAG Bot", version="0.1.0", lifespan=lifespan)

    # Setting PHOENIX_CORS_ORIGINS="*" allows any origin (handy for a public
    # read-only demo / cloud deployment). Otherwise an explicit allow-list.
    origins = _parse_cors_origins()
    if origins == ["*"]:
        app.add_middleware(
            CORSMiddleware,
            allow_origin_regex=".*",
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    else:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    app.include_router(router)
    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=False)
