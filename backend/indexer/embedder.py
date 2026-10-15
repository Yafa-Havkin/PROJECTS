"""
Phoenix RAG Bot — Embedder & Indexer

Turns crawled :class:`~backend.models.Chunk` objects into embedding vectors via
the shared :class:`~backend.llm.gemini_client.GeminiClient` (which handles model
and API-key fallback) and persists them to a
:class:`~backend.indexer.vectorstore.ChromaVectorStore`.

Key behaviours
--------------
* **Batching** — chunks are embedded in groups of at most ``MAX_BATCH_SIZE``
  (100), flushed incrementally so an interrupted run keeps saved progress.
* **De-duplication** — the same page can be reached via several links, so the
  chunk list may contain duplicate ids; repeats are dropped before upsert
  (ChromaDB rejects duplicate ids in one batch).
* **Resilient calls** — the underlying client rolls over across API keys on
  quota/rate-limit errors.
* **Graceful degradation** — a chunk whose embedding ultimately fails is logged
  and skipped rather than aborting the whole run.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

from backend.config.models import TenantConfig
from backend.indexer.vectorstore import ChromaVectorStore
from backend.llm.gemini_client import GeminiClient, GeminiError
from backend.models import Chunk

logger = logging.getLogger("phoenix_rag_bot.embedder")

MAX_BATCH_SIZE = 100
TASK_TYPE = "retrieval_document"
QUERY_TASK_TYPE = "retrieval_query"


@dataclass
class IndexingResult:
    """Summary of a single :meth:`Embedder.index_chunks` run."""

    total_chunks: int
    embedded_chunks: int
    failed_chunks: int
    failed_chunk_ids: list[str] = field(default_factory=list)


class Embedder:
    """Creates embeddings via :class:`GeminiClient` and indexes them."""

    def __init__(
        self,
        tenant_config: TenantConfig,
        vectorstore: ChromaVectorStore,
        api_key: str | None = None,
        client: GeminiClient | None = None,
    ) -> None:
        self.tenant_config = tenant_config
        self.vectorstore = vectorstore
        self._client = client or GeminiClient(
            generation_models=tenant_config.generation_models,
            embedding_model=tenant_config.embedding_model,
            api_keys=[api_key] if api_key else None,
            request_timeout=tenant_config.request_timeout_seconds,
        )

    def index_chunks(self, chunks: list[Chunk]) -> IndexingResult:
        """Embed and store a list of chunks, flushing every 100 (crash-safe)."""
        total = len(chunks)
        if total == 0:
            logger.info("index_chunks called with no chunks; nothing to do.")
            return IndexingResult(0, 0, 0, [])

        embedded_count = 0
        failed_chunk_ids: list[str] = []

        # Drop duplicate chunk_ids (same text ⇒ same id) so ChromaDB does not
        # reject a batch that contains repeats.
        seen_ids: set[str] = set()
        unique_chunks: list[Chunk] = []
        for chunk in chunks:
            if chunk.chunk_id in seen_ids:
                continue
            seen_ids.add(chunk.chunk_id)
            unique_chunks.append(chunk)

        duplicates_dropped = total - len(unique_chunks)
        if duplicates_dropped:
            logger.info(
                "Dropped %d duplicate chunk(s); %d unique chunk(s) to embed.",
                duplicates_dropped,
                len(unique_chunks),
            )

        buf_chunks: list[Chunk] = []
        buf_embeddings: list[list[float]] = []

        def _flush() -> None:
            nonlocal embedded_count
            if buf_chunks:
                self.vectorstore.upsert_many(buf_chunks, buf_embeddings)
                embedded_count += len(buf_chunks)
                buf_chunks.clear()
                buf_embeddings.clear()

        for index, chunk in enumerate(unique_chunks):
            try:
                vector = self._client.embed(chunk.text, task_type=TASK_TYPE)
                buf_chunks.append(chunk)
                buf_embeddings.append(vector)
            except GeminiError as exc:
                failed_chunk_ids.append(chunk.chunk_id)
                logger.error("Embedding failed for chunk %s: %s", chunk.chunk_id, exc)

            if (index + 1) % MAX_BATCH_SIZE == 0:
                _flush()
                logger.info(
                    "Embedded %d/%d chunks so far (saved).",
                    embedded_count,
                    len(unique_chunks),
                )

        _flush()

        result = IndexingResult(
            total_chunks=total,
            embedded_chunks=embedded_count,
            failed_chunks=len(failed_chunk_ids),
            failed_chunk_ids=failed_chunk_ids,
        )
        logger.info(
            "Indexing complete: %d/%d chunks embedded, %d failed.",
            result.embedded_chunks,
            result.total_chunks,
            result.failed_chunks,
        )
        return result

    def embed_query(self, query: str) -> list[float]:
        """Embed a single search query (failures raise, not swallowed)."""
        return self._client.embed(query, task_type=QUERY_TASK_TYPE)

    def sync_vectorstore(
        self, new_chunks: list[Chunk], existing_urls: set[str]
    ) -> IndexingResult:
        """Reconcile the store with a fresh crawl: purge stale URLs, upsert new."""
        new_urls = {chunk.url for chunk in new_chunks}
        stale_urls = existing_urls - new_urls
        for url in stale_urls:
            self.vectorstore.delete_by_url(url)
        logger.info(
            "Re-crawl sync: deleted %d stale URL(s), indexing %d fresh chunk(s).",
            len(stale_urls),
            len(new_chunks),
        )
        return self.index_chunks(new_chunks)
