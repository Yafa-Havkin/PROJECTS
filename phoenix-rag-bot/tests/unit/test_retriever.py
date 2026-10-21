"""Retrieval timing logs should expose stage costs without logging queries."""

import asyncio
import logging

from backend.retriever.retriever import HybridRetriever
from tests.conftest import make_chunk, scored


def test_retrieve_logs_stage_durations_without_query_text(caplog):
    class FakeEmbedder:
        def embed_query(self, query):
            return [0.1, 0.2]

    class FakeVectorStore:
        def search(self, embedding, limit):
            return [
                scored("https://fnx.co.il/health", "מידע על בריאות", index=0),
                scored("https://fnx.co.il/health/faq", "שאלות על בריאות", index=1),
            ]

    class FakeBM25:
        def search(self, query, limit):
            return [(make_chunk("https://fnx.co.il/health", "מידע על בריאות"), 0)]

    class FakeReranker:
        async def rerank(self, query, candidates):
            return candidates

    retriever = HybridRetriever(
        vectorstore=FakeVectorStore(),
        bm25_index=FakeBM25(),
        embedder=FakeEmbedder(),
        reranker=FakeReranker(),
    )
    query = "שאלה סודית לא אמורה להופיע בלוגים"
    caplog.set_level(logging.INFO, logger="phoenix_rag_bot.retriever")

    results = asyncio.run(retriever.retrieve(query))

    assert len(results) == 2
    assert "stage=query_embedding duration_ms=" in caplog.text
    assert "stage=vector_search duration_ms=" in caplog.text
    assert "stage=bm25_search duration_ms=" in caplog.text
    assert "stage=rrf_merge duration_ms=" in caplog.text
    assert "stage=rerank duration_ms=" in caplog.text
    assert "retrieval_complete duration_ms=" in caplog.text
    assert "outcome=ok results=2" in caplog.text
    assert query not in caplog.text


def test_single_candidate_skips_reranker_and_reuses_normalized_query(caplog):
    class FakeEmbedder:
        calls = 0

        def embed_query(self, query):
            self.calls += 1
            return [0.1, 0.2]

    class FakeVectorStore:
        def search(self, embedding, limit):
            return [scored("https://fnx.co.il/health", "מידע על בריאות")]

    class FakeBM25:
        def search(self, query, limit):
            return []

    class UnexpectedReranker:
        async def rerank(self, query, candidates):
            raise AssertionError("A single candidate does not need reranking")

    embedder = FakeEmbedder()
    retriever = HybridRetriever(
        vectorstore=FakeVectorStore(),
        bm25_index=FakeBM25(),
        embedder=embedder,
        reranker=UnexpectedReranker(),
    )
    caplog.set_level(logging.INFO, logger="phoenix_rag_bot.retriever")

    first = asyncio.run(retriever.retrieve("מה כולל הביטוח?"))
    second = asyncio.run(retriever.retrieve("מה כולל הביטוח"))

    assert len(first) == len(second) == 1
    assert embedder.calls == 1
    assert "route=single_candidate_direct" in caplog.text
    assert "retrieval_cache_hit results=1" in caplog.text
