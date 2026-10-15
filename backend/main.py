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
_DEFAULT_CORS_ORIGINS = "http://localhost:5173,http://localhost:3000"

_LOG_FORMAT = "%(asctime)s %(levelname)-8s %(name)s | %(message)s"
_LOG_DATEFMT = "%Y-%m-%d %H:%M:%S"

logging.basicConfig(level=logging.INFO, format=_LOG_FORMAT, datefmt=_LOG_DATEFMT)
logger = logging.getLogger("phoenix_rag_bot.main")


def _parse_cors_origins() -> list[str]:
    """Parse the comma-separated CORS origins env var into a clean list."""
    raw = os.environ.get(_ENV_CORS_ORIGINS, _DEFAULT_CORS_ORIGINS)
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


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
        )
    )

    logger.info(
        "Startup complete — company=%s, indexed_chunks=%d, personas=%s",
        tenant.company_name,
        chunk_count,
        config_loader.list_personas(),
    )

    yield

    logger.info("Shutting down Phoenix RAG Bot. Nothing to clean up.")


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
