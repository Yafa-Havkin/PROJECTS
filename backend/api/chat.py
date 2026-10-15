"""
Chat API endpoints for the Phoenix RAG Bot.

* ``GET  /api/health``      — liveness probe.
* ``GET  /api/personas``    — personas for the PersonaToggle.
* ``POST /api/session/new`` — create a fresh, empty session.
* ``POST /api/chat``        — ask a question; answer streams back as SSE
  (token* → sources → done), or a single error event on failure.
"""

from __future__ import annotations

import logging
from collections.abc import AsyncGenerator
from dataclasses import dataclass

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from backend.api.models import (
    ChatRequest,
    DoneEvent,
    ErrorEvent,
    HealthResponse,
    NewSessionResponse,
    PersonaInfo,
    PersonasResponse,
    SourcesEvent,
    TokenEvent,
    sse_format,
)
from backend.config.loader import ConfigLoader
from backend.generator.generator import BACKEND_ERROR_MESSAGE, AnswerGenerator
from backend.models import NoContentSignal, ScoredChunk
from backend.retriever.retriever import HybridRetriever
from backend.session.manager import SessionManager

logger = logging.getLogger("phoenix_rag_bot.api")

_SSE_HEADERS: dict[str, str] = {
    "Cache-Control": "no-cache",
    "X-Accel-Buffering": "no",
    "Connection": "keep-alive",
}


@dataclass
class AppServices:
    """Container for the shared singletons the endpoints depend on."""

    config_loader: ConfigLoader
    session_manager: SessionManager
    retriever: HybridRetriever
    generator: AnswerGenerator


_services: AppServices | None = None


def set_services(services: AppServices) -> None:
    """Install the shared :class:`AppServices` (called by main.py at startup)."""
    global _services
    _services = services


def get_services() -> AppServices:
    """Return the installed services, or raise if the app wasn't initialised."""
    if _services is None:
        raise RuntimeError("AppServices not initialised. Call set_services() at startup.")
    return _services


router = APIRouter(prefix="/api")


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Liveness probe."""
    return HealthResponse(status="ok")


@router.get("/personas", response_model=PersonasResponse)
async def personas() -> PersonasResponse:
    """List the personas available to the PersonaToggle."""
    services = get_services()
    persona_infos: list[PersonaInfo] = []
    for persona_id in services.config_loader.list_personas():
        persona_config = services.config_loader.load_persona(persona_id)
        persona_infos.append(PersonaInfo(persona_id=persona_id, name=persona_config.name))
    return PersonasResponse(personas=persona_infos)


@router.post("/session/new", response_model=NewSessionResponse)
async def new_session() -> NewSessionResponse:
    """Create a fresh, empty chat session and return its id."""
    services = get_services()
    session = services.session_manager.create_session()
    return NewSessionResponse(session_id=session.session_id)


@router.post("/chat")
async def chat(request: ChatRequest) -> StreamingResponse:
    """Answer a question as a Server-Sent Events stream."""
    services = get_services()

    async def event_generator() -> AsyncGenerator[str, None]:
        services.session_manager.update_persona(request.session_id, request.persona_id)
        services.session_manager.add_turn(request.session_id, "user", request.query)

        persona = services.config_loader.load_persona(request.persona_id)
        history = services.session_manager.get_history(request.session_id)

        try:
            result = await services.retriever.retrieve(request.query)

            answer_parts: list[str] = []
            async for token in services.generator.generate_stream(
                request.query, result, persona, history
            ):
                answer_parts.append(token)
                yield sse_format(TokenEvent(content=token))

            source_urls = _extract_source_urls(result)
            yield sse_format(SourcesEvent(urls=source_urls))

            services.session_manager.add_turn(
                request.session_id, "assistant", "".join(answer_parts)
            )
            yield sse_format(DoneEvent())
        except Exception:  # noqa: BLE001
            logger.error(
                "Chat stream failed for session %s", request.session_id, exc_info=True
            )
            yield sse_format(ErrorEvent(message=BACKEND_ERROR_MESSAGE))

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers=_SSE_HEADERS,
    )


def _extract_source_urls(
    result: list[ScoredChunk] | NoContentSignal,
) -> list[str]:
    """Return the distinct source URLs for a retrieval result, preserving order."""
    if isinstance(result, NoContentSignal):
        return []
    seen: set[str] = set()
    ordered_urls: list[str] = []
    for scored in result:
        url = scored.chunk.url
        if url not in seen:
            seen.add(url)
            ordered_urls.append(url)
    return ordered_urls
