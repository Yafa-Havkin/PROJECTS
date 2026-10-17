"""
Phoenix RAG Bot — in-memory BM25 lexical index.

Complements the semantic vector search with exact keyword matching, which
matters a lot for Hebrew product/term names. Rebuilt in memory at startup from
the persisted corpus.
"""

from __future__ import annotations

import logging
import re

from rank_bm25 import BM25Okapi

from backend.indexer.vectorstore import ChromaVectorStore
from backend.models import Chunk

logger = logging.getLogger("phoenix_rag_bot.bm25")

#: Tokenizer: keep Hebrew/Latin/digit runs, lowercase, drop punctuation.
_TOKEN_RE = re.compile(r"[\w\u0590-\u05FF]+", re.UNICODE)


def _tokenize(text: str) -> list[str]:
    """Tokenize text into lowercased word tokens (Hebrew-aware)."""
    return [t.lower() for t in _TOKEN_RE.findall(text)]


class BM25Index:
    """A lexical BM25 index over a fixed corpus of chunks."""

    def __init__(self, chunks: list[Chunk]) -> None:
        self._chunks = chunks
        self._tokenized = [_tokenize(c.text) for c in chunks]
        # BM25Okapi requires a non-empty corpus; guard the empty case.
        self._bm25 = BM25Okapi(self._tokenized) if self._tokenized else None
        logger.info("BM25 index built with %d documents", len(chunks))

    @classmethod
    def from_vectorstore(cls, vectorstore: ChromaVectorStore) -> "BM25Index":
        """Build the index from every chunk persisted in the vector store."""
        return cls(vectorstore.get_all_chunks())

    def search(self, query: str, k: int) -> list[tuple[Chunk, int]]:
        """Return up to ``k`` keyword hits as ``(chunk, rank)`` tuples.

        Args:
            query: The user's query text.
            k: Max number of hits to return.

        Returns:
            ``(chunk, rank)`` pairs, best first, where ``rank`` is a 0-based
            position (0 = best). Chunks with a zero BM25 score are excluded.
        """
        if self._bm25 is None or not self._chunks:
            return []
        tokens = _tokenize(query)
        if not tokens:
            return []
        scores = self._bm25.get_scores(tokens)
        ranked = sorted(
            range(len(scores)), key=lambda i: scores[i], reverse=True
        )
        hits: list[tuple[Chunk, int]] = []
        rank = 0
        for idx in ranked:
            if scores[idx] <= 0.0:
                break
            hits.append((self._chunks[idx], rank))
            rank += 1
            if rank >= k:
                break
        return hits
