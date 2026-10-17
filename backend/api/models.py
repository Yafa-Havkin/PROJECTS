"""
Phoenix RAG Bot — API request/response + SSE event models.

Pydantic models for the request/response bodies, plus small dataclasses for the
Server-Sent Events (token / sources / done / error) and a helper that formats
them into SSE wire frames.
"""

from __future__ import annotations

import json
from dataclasses import dataclass

from pydantic import BaseModel, Field

#: Maximum accepted length (characters) for a user question. Requests longer
#: than this are rejected with HTTP 422 before any work is done, bounding
#: prompt size and protecting the backend from abuse.
MAX_QUERY_LENGTH = 2000
MAX_ID_LENGTH = 128


# --------------------------------------------------------------------------- #
# Request / response bodies
# --------------------------------------------------------------------------- #
class ChatRequest(BaseModel):
    """POST /api/chat body.

    ``query`` is length-bounded (1..MAX_QUERY_LENGTH) so an empty or absurdly
    long question is rejected up front rather than reaching the LLM.
    """

    session_id: str = Field(..., min_length=1, max_length=MAX_ID_LENGTH)
    query: str = Field(..., min_length=1, max_length=MAX_QUERY_LENGTH)
    persona_id: str = Field(..., min_length=1, max_length=MAX_ID_LENGTH)


class HealthResponse(BaseModel):
    status: str


class PersonaInfo(BaseModel):
    persona_id: str
    name: str


class PersonasResponse(BaseModel):
    personas: list[PersonaInfo]


class NewSessionResponse(BaseModel):
    session_id: str


# --------------------------------------------------------------------------- #
# SSE events
# --------------------------------------------------------------------------- #
@dataclass
class TokenEvent:
    """A fragment of the streamed answer."""

    content: str
    type: str = "token"


@dataclass
class SourcesEvent:
    """The distinct source URLs for the answer."""

    urls: list[str]
    type: str = "sources"


@dataclass
class DoneEvent:
    """Terminal success marker."""

    type: str = "done"


@dataclass
class ErrorEvent:
    """Terminal error marker carrying a user-facing Hebrew message."""

    message: str
    type: str = "error"


def sse_format(event: object) -> str:
    """Serialise an SSE event dataclass into a ``data: {json}\\n\\n`` frame.

    Args:
        event: One of the ``*Event`` dataclasses above.

    Returns:
        A single SSE frame string ready to write to the stream.
    """
    if isinstance(event, TokenEvent):
        payload = {"type": event.type, "content": event.content}
    elif isinstance(event, SourcesEvent):
        payload = {"type": event.type, "urls": event.urls}
    elif isinstance(event, DoneEvent):
        payload = {"type": event.type}
    elif isinstance(event, ErrorEvent):
        payload = {"type": event.type, "message": event.message}
    else:  # pragma: no cover — defensive
        payload = {"type": "error", "message": "unknown event"}
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"
