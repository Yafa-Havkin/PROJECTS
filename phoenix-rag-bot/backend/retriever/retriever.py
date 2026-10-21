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
import time
import unicodedata
from collections import OrderedDict

from backend.indexer.embedder import Embedder
from backend.indexer.vectorstore import ChromaVectorStore
from backend.models import Chunk, NoContentSignal, ScoredChunk
from backend.retriever.bm25_index import BM25Index
from backend.retriever.reranker import Reranker

RRF_K: int = 60
DEFAULT_TOP_K: int = 10
VECTOR_SEARCH_K: int = 10
BM25_SEARCH_K: int = 10
RETRIEVAL_CACHE_TTL_SECONDS: float = 300.0
RETRIEVAL_CACHE_MAX_ENTRIES: int = 128

logger = logging.getLogger("phoenix_rag_bot.retriever")


class _RetrievalCache:
    """Bounded, process-local cache for recently successful normalized queries."""

    def __init__(
        self,
        max_entries: int = RETRIEVAL_CACHE_MAX_ENTRIES,
        ttl_seconds: float = RETRIEVAL_CACHE_TTL_SECONDS,
    ) -> None:
        self._max_entries = max_entries
        self._ttl_seconds = ttl_seconds
        self._entries: OrderedDict[
            tuple[str, int], tuple[float, list[ScoredChunk]]
        ] = OrderedDict()

    def get(self, query: str, top_k: int) -> list[ScoredChunk] | None:
        key = (self._normalize_query(query), top_k)
        entry = self._entries.get(key)
        if entry is None:
            return None

        expires_at, results = entry
        if expires_at <= time.monotonic():
            del self._entries[key]
            return None

        self._entries.move_to_end(key)
        return list(results)

    def put(self, query: str, top_k: int, results: list[ScoredChunk]) -> None:
        key = (self._normalize_query(query), top_k)
        self._entries[key] = (time.monotonic() + self._ttl_seconds, list(results))
        self._entries.move_to_end(key)
        while len(self._entries) > self._max_entries:
            self._entries.popitem(last=False)

    @staticmethod
    def _normalize_query(query: str) -> str:
        normalized = unicodedata.normalize("NFKC", query).casefold()
        normalized = " ".join(normalized.split())
        return normalized.rstrip("?!.,:; ")


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
        self._cache = _RetrievalCache()

    async def retrieve(
        self, query: str, top_k: int = DEFAULT_TOP_K
    ) -> list[ScoredChunk] | NoContentSignal:
        """Retrieve the most relevant chunks for a query (or a NoContentSignal)."""
        started_at = time.perf_counter()
        outcome = "retrieval_error"
        result_count = 0

        def log_completion() -> None:
            logger.info(
                "retrieval_complete duration_ms=%.1f outcome=%s results=%d",
                (time.perf_counter() - started_at) * 1000,
                outcome,
                result_count,
            )

        cached = self._cache.get(query, top_k)
        if cached is not None:
            logger.info("retrieval_cache_hit results=%d", len(cached))
            outcome = "cache_hit"
            result_count = len(cached)
            log_completion()
            return cached

        try:
            vector_task = asyncio.to_thread(self._vector_search, query)
            bm25_task = asyncio.to_thread(self._bm25_search, query)
            vector_results, bm25_results = await asyncio.gather(vector_task, bm25_task)
        except Exception:  # noqa: BLE001
            logger.error(
                "Hybrid search failed (embedding or vector store unavailable); "
                "returning retrieval_error signal.",
                exc_info=True,
            )
            log_completion()
            return NoContentSignal(reason="retrieval_error")

        merge_started_at = time.perf_counter()
        merged = self._rrf_merge(vector_results, bm25_results, top_k)
        logger.info(
            "retrieval_stage stage=rrf_merge duration_ms=%.1f "
            "vector_results=%d bm25_results=%d candidates=%d",
            (time.perf_counter() - merge_started_at) * 1000,
            len(vector_results),
            len(bm25_results),
            len(merged),
        )
        if not merged:
            logger.info("Hybrid search produced no candidates for query.")
            outcome = "no_candidates"
            log_completion()
            return NoContentSignal(reason="no_relevant_content")

        if len(merged) == 1:
            logger.info(
                "retrieval_route route=single_candidate_direct candidates=1 "
                "reranker_skipped=true"
            )
            result_count = 1
            outcome = "ok"
            self._cache.put(query, top_k, merged)
            log_completion()
            return merged

        rerank_started_at = time.perf_counter()
        reranked = await self._reranker.rerank(query, merged)
        logger.info(
            "retrieval_stage stage=rerank duration_ms=%.1f "
            "candidates=%d results=%d",
            (time.perf_counter() - rerank_started_at) * 1000,
            len(merged),
            len(reranked),
        )
        if not reranked:
            logger.info(
                "Reranker filtered out all %d candidate(s) (below threshold).",
                len(merged),
            )
            outcome = "reranker_empty"
            log_completion()
            return NoContentSignal(reason="no_relevant_content")

        outcome = "ok"
        result_count = len(reranked)
        self._cache.put(query, top_k, reranked)
        log_completion()
        return reranked

    def _vector_search(self, query: str) -> list[ScoredChunk]:
        embedding_started_at = time.perf_counter()
        embedding = self._embedder.embed_query(query)
        logger.info(
            "retrieval_stage stage=query_embedding duration_ms=%.1f",
            (time.perf_counter() - embedding_started_at) * 1000,
        )
        vector_started_at = time.perf_counter()
        results = self._vectorstore.search(embedding, VECTOR_SEARCH_K)
        logger.info(
            "retrieval_stage stage=vector_search duration_ms=%.1f results=%d",
            (time.perf_counter() - vector_started_at) * 1000,
            len(results),
        )
        return results

    def _bm25_search(self, query: str) -> list[tuple[Chunk, int]]:
        started_at = time.perf_counter()
        results = self._bm25_index.search(query, BM25_SEARCH_K)
        logger.info(
            "retrieval_stage stage=bm25_search duration_ms=%.1f results=%d",
            (time.perf_counter() - started_at) * 1000,
            len(results),
        )
        return results

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
