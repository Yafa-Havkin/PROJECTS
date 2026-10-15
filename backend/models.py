"""
Phoenix RAG Bot — core domain models.

These dataclasses are the shared vocabulary passed between the crawler,
indexer, retriever, generator, and API layers. They are deliberately plain
(no behaviour) so every component agrees on the same simple shapes.
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass, field
from datetime import datetime


def make_chunk_id(url: str, chunk_index: int) -> str:
    """Deterministically derive a chunk id from its URL and index.

    The same (url, chunk_index) always yields the same id, so re-crawling a
    page produces stable ids and ``upsert`` updates rather than duplicates.

    Args:
        url: The source page URL.
        chunk_index: The 0-based position of the chunk within the page.

    Returns:
        A hex SHA-256 digest string identifying the chunk.
    """
    raw = f"{url}#{chunk_index}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


@dataclass
class Chunk:
    """A single embeddable unit of text extracted from a crawled page.

    Attributes:
        chunk_id: Deterministic id (see :func:`make_chunk_id`).
        url: Source page URL (always carried so answers can cite it).
        heading: Section heading the text was extracted under.
        text: The clean plain-text content of the chunk.
        chunk_index: 0-based position of the chunk within its page.
        crawled_at: UTC timestamp when the chunk was produced.
    """

    chunk_id: str
    url: str
    heading: str
    text: str
    chunk_index: int
    crawled_at: datetime


@dataclass
class ScoredChunk:
    """A chunk paired with a relevance score.

    The score's meaning depends on the stage: an RRF fused score after
    retrieval merge, or a 0..1 relevance score after reranking.
    """

    chunk: Chunk
    relevance_score: float


@dataclass
class NoContentSignal:
    """Sentinel returned by the retriever when there is nothing to answer from.

    Attributes:
        reason: ``"retrieval_error"`` (embedding/store failure) or
            ``"no_relevant_content"`` (nothing found / all filtered out).
    """

    reason: str


@dataclass
class Turn:
    """A single conversation turn (user or assistant)."""

    role: str  # "user" | "assistant"
    content: str


@dataclass
class Session:
    """An in-memory chat session.

    Attributes:
        session_id: Opaque unique id handed to the frontend.
        persona_id: The persona currently active for this session.
        history: Ordered list of conversation turns.
    """

    session_id: str
    persona_id: str
    history: list[Turn] = field(default_factory=list)
