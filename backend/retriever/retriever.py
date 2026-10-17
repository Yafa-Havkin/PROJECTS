"""
Phoenix RAG Bot — Hybrid Retriever.

Fuses semantic (vector) and lexical (BM25) search with Reciprocal Rank Fusion
(RRF), then reranks the merged candidates. Returns the top chunks or a
:class:`NoContentSignal`.

Flow: embed query → (vector ‖ BM25) → RRF merge → rerank → top-5.
"""

from __future__ import annotations

import asyncio
import logging

from backend.indexer.embedder import Embedder
from backend.indexer.vectorstore import ChromaVectorStore
from backend.models import Chunk, NoContentSignal, ScoredChunk
from backend.retriever.bm25_index import BM25Index
from backend.retriever.reranker import Reranker

RRF_K: int = 60
DEFAULT_TOP_K: int = 10
VECTOR_SEARCH_K: int = 10
BM25_SEARCH_K: int = 10

logger = logging.getLogger("phoenix_rag_bot.retriever")


class HybridRetriever:
    """Hybrid (vector + BM25) retriever with RRF fusion and reranking."""

    def __init__(
        self,
        vectorstore: ChromaVectorStore,
        bm25_index: BM25Index,
        embedder: Embedder,
        reranker: Reranker,
    ) -> None:
        self._vectorstore = vectorstore
        self._bm25_index = bm25_index
        self._embedder = embedder
        self._reranker = reranker

    async def retrieve(
        self, query: str, top_k: int = DEFAULT_TOP_K
    ) -> list[ScoredChunk] | NoContentSignal:
        """Retrieve the most relevant chunks for a query (or a NoContentSignal)."""
        try:
            vector_task = asyncio.to_thread(self._vector_search, query)
            bm25_task = asyncio.to_thread(self._bm25_index.search, query, BM25_SEARCH_K)
            vector_results, bm25_results = await asyncio.gather(vector_task, bm25_task)
        except Exception:  # noqa: BLE001
            logger.error(
                "Hybrid search failed (embedding or vector store unavailable); "
                "returning retrieval_error signal.",
                exc_info=True,
            )
            return NoContentSignal(reason="retrieval_error")

        merged = self._rrf_merge(vector_results, bm25_results, top_k)
        if not merged:
            logger.info("Hybrid search produced no candidates for query.")
            return NoContentSignal(reason="no_relevant_content")

        reranked = await self._reranker.rerank(query, merged)
        if not reranked:
            logger.info(
                "Reranker filtered out all %d candidate(s) (below threshold).",
                len(merged),
            )
            return NoContentSignal(reason="no_relevant_content")

        return reranked

    def _vector_search(self, query: str) -> list[ScoredChunk]:
        embedding = self._embedder.embed_query(query)
        return self._vectorstore.search(embedding, VECTOR_SEARCH_K)

    def _rrf_merge(
        self,
        vector_results: list[ScoredChunk],
        bm25_results: list[tuple[Chunk, int]],
        top_k: int,
    ) -> list[ScoredChunk]:
        """Fuse vector + BM25 results with Reciprocal Rank Fusion."""
        if top_k <= 0:
            return []

        rrf_scores: dict[str, float] = {}
        chunk_by_id: dict[str, Chunk] = {}

        for rank, scored in enumerate(vector_results):
            chunk = scored.chunk
            rrf_scores[chunk.chunk_id] = (
                rrf_scores.get(chunk.chunk_id, 0.0) + 1.0 / (RRF_K + rank)
            )
            chunk_by_id.setdefault(chunk.chunk_id, chunk)

        for chunk, rank in bm25_results:
            rrf_scores[chunk.chunk_id] = (
                rrf_scores.get(chunk.chunk_id, 0.0) + 1.0 / (RRF_K + rank)
            )
            chunk_by_id.setdefault(chunk.chunk_id, chunk)

        ranked_ids = sorted(
            rrf_scores, key=lambda cid: rrf_scores[cid], reverse=True
        )[:top_k]

        return [
            ScoredChunk(chunk=chunk_by_id[cid], relevance_score=rrf_scores[cid])
            for cid in ranked_ids
        ]
