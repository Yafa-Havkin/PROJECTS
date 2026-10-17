"""
Phoenix RAG Bot — ChromaDB vector store wrapper.

Persists embedded chunks and serves nearest-neighbour semantic search. The
store is created on disk at ``vectorstore_path`` so the index survives restarts
and ships with the deployed app.
"""

from __future__ import annotations

import logging

import chromadb
from chromadb.config import Settings

from backend.models import Chunk, ScoredChunk

logger = logging.getLogger("phoenix_rag_bot.vectorstore")

_COLLECTION_NAME = "phoenix_chunks"


def _metadata_from_chunk(chunk: Chunk) -> dict[str, object]:
    """Build the Chroma metadata dict stored alongside a chunk's embedding."""
    return {
        "url": chunk.url,
        "heading": chunk.heading,
        "chunk_index": chunk.chunk_index,
        "crawled_at": chunk.crawled_at.isoformat(),
    }


def _chunk_from_record(chunk_id: str, document: str, metadata: dict) -> Chunk:
    """Reconstruct a :class:`Chunk` from a stored Chroma record."""
    from datetime import datetime

    crawled_raw = metadata.get("crawled_at")
    try:
        crawled_at = datetime.fromisoformat(crawled_raw) if crawled_raw else datetime.now()
    except (TypeError, ValueError):
        crawled_at = datetime.now()

    return Chunk(
        chunk_id=chunk_id,
        url=str(metadata.get("url", "")),
        heading=str(metadata.get("heading", "")),
        text=document,
        chunk_index=int(metadata.get("chunk_index", 0)),
        crawled_at=crawled_at,
    )


class ChromaVectorStore:
    """A thin persistence + search wrapper around a ChromaDB collection."""

    def __init__(self, path: str) -> None:
        """Open (or create) the persistent collection at ``path``.

        Args:
            path: Filesystem directory for the ChromaDB persistent client.
        """
        self._client = chromadb.PersistentClient(
            path=path,
            settings=Settings(anonymized_telemetry=False, allow_reset=False),
        )
        self._collection = self._client.get_or_create_collection(
            name=_COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
        logger.info(
            "ChromaVectorStore ready (path=%s, collection=%s)", path, _COLLECTION_NAME
        )

    # ------------------------------------------------------------------ #
    def count(self) -> int:
        """Return the number of chunks currently stored."""
        return self._collection.count()

    def upsert_many(
        self, chunks: list[Chunk], embeddings: list[list[float]]
    ) -> None:
        """Insert or update a batch of chunks with their embeddings.

        Args:
            chunks: The chunks to store.
            embeddings: Parallel list of embedding vectors (same length/order).
        """
        if not chunks:
            return
        self._collection.upsert(
            ids=[chunk.chunk_id for chunk in chunks],
            embeddings=embeddings,
            documents=[chunk.text for chunk in chunks],
            metadatas=[_metadata_from_chunk(chunk) for chunk in chunks],
        )

    def search(self, embedding: list[float], k: int) -> list[ScoredChunk]:
        """Return the ``k`` nearest chunks to a query embedding.

        Args:
            embedding: The query embedding vector.
            k: Number of neighbours to return.

        Returns:
            Scored chunks ordered nearest-first. The score is ``1 - distance``
            (cosine), so higher is more similar.
        """
        result = self._collection.query(
            query_embeddings=[embedding],
            n_results=k,
            include=["documents", "metadatas", "distances"],
        )
        ids = (result.get("ids") or [[]])[0]
        docs = (result.get("documents") or [[]])[0]
        metas = (result.get("metadatas") or [[]])[0]
        dists = (result.get("distances") or [[]])[0]

        scored: list[ScoredChunk] = []
        for cid, doc, meta, dist in zip(ids, docs, metas, dists):
            chunk = _chunk_from_record(cid, doc, meta or {})
            scored.append(ScoredChunk(chunk=chunk, relevance_score=1.0 - float(dist)))
        return scored

    def get_all_chunks(self) -> list[Chunk]:
        """Return every stored chunk (used to build the BM25 index)."""
        result = self._collection.get(include=["documents", "metadatas"])
        ids = result.get("ids") or []
        docs = result.get("documents") or []
        metas = result.get("metadatas") or []
        return [
            _chunk_from_record(cid, doc, meta or {})
            for cid, doc, meta in zip(ids, docs, metas)
        ]

    def get_all_urls(self) -> set[str]:
        """Return the distinct source URLs currently stored."""
        result = self._collection.get(include=["metadatas"])
        metas = result.get("metadatas") or []
        return {str(m.get("url", "")) for m in metas if m}

    def delete_by_url(self, url: str) -> None:
        """Delete every chunk belonging to a given source URL."""
        self._collection.delete(where={"url": url})
