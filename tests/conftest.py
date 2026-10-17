"""Shared pytest fixtures + helpers (fakes so tests need no network/quota)."""

from __future__ import annotations

from datetime import datetime, timezone

import pytest

from backend.models import Chunk, ScoredChunk


def make_chunk(url: str, text: str, index: int = 0, heading: str = "כותרת") -> Chunk:
    """Build a Chunk with a deterministic id for tests."""
    from backend.models import make_chunk_id

    return Chunk(
        chunk_id=make_chunk_id(url, index),
        url=url,
        heading=heading,
        text=text,
        chunk_index=index,
        crawled_at=datetime.now(timezone.utc),
    )


def scored(url: str, text: str, score: float = 0.5, index: int = 0) -> ScoredChunk:
    """Build a ScoredChunk for tests."""
    return ScoredChunk(chunk=make_chunk(url, text, index), relevance_score=score)


class FakeGeminiClient:
    """A stand-in GeminiClient for tests.

    Configure its behaviour per method:
      - generate_return / generate_raises
      - stream_tokens / stream_raises
    """

    def __init__(
        self,
        generate_return: str = '{"score": 0.9}',
        generate_raises: Exception | None = None,
        stream_tokens: list[str] | None = None,
        stream_raises: Exception | None = None,
    ) -> None:
        self.generate_return = generate_return
        self.generate_raises = generate_raises
        self.stream_tokens = stream_tokens if stream_tokens is not None else ["שלום"]
        self.stream_raises = stream_raises
        self.generate_calls = 0
        self.stream_calls = 0

    def generate(self, prompt: str) -> str:  # noqa: D401
        self.generate_calls += 1
        if self.generate_raises is not None:
            raise self.generate_raises
        return self.generate_return

    def generate_stream(self, prompt: str):
        self.stream_calls += 1
        if self.stream_raises is not None:
            raise self.stream_raises
        yield from self.stream_tokens

    def embed(self, text: str, task_type: str = "retrieval_document") -> list[float]:
        return [0.1, 0.2, 0.3]


@pytest.fixture
def fake_client() -> FakeGeminiClient:
    return FakeGeminiClient()
