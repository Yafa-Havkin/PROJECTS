"""Reranker tests — scoring, threshold, and the quota-resilience fallbacks."""

import asyncio

from backend.llm.gemini_client import GeminiError
from backend.retriever.reranker import TOP_N, Reranker
from tests.conftest import FakeGeminiClient, scored


def _run(coro):
    return asyncio.run(coro)


def test_empty_candidates_returns_empty():
    rr = Reranker(client=FakeGeminiClient())
    assert _run(rr.rerank("q", [])) == []


def test_scores_are_batched_once_then_kept_and_sorted():
    client = FakeGeminiClient(
        generate_return=(
            '{"scores":[{"index":0,"score":0.2},'
            '{"index":1,"score":0.9},{"index":2,"score":0.6}]}'
        )
    )
    rr = Reranker(client=client)
    cands = [scored(f"https://fnx.co.il/{i}", "txt", index=i) for i in range(3)]
    out = _run(rr.rerank("q", cands))
    assert [sc.chunk.url for sc in out] == [
        "https://fnx.co.il/1",
        "https://fnx.co.il/2",
    ]
    assert [sc.relevance_score for sc in out] == [0.9, 0.6]
    assert client.generate_calls == 1


def test_all_zero_scores_fall_back_to_rrf_order():
    # Model returns an un-parseable score → 0.0 for every candidate.
    client = FakeGeminiClient(generate_return="not json")
    rr = Reranker(client=client)
    cands = [scored(f"https://fnx.co.il/{i}", "txt", index=i) for i in range(4)]
    out = _run(rr.rerank("q", cands))
    # Must NOT silence the bot — falls back to the RRF-ordered candidates.
    assert len(out) == min(TOP_N, len(cands))
    assert [c.chunk.url for c in out] == [c.chunk.url for c in cands[:TOP_N]]


def test_api_failure_falls_back_to_rrf_order():
    client = FakeGeminiClient(generate_raises=GeminiError("boom"))
    rr = Reranker(client=client)
    cands = [scored(f"https://fnx.co.il/{i}", "txt", index=i) for i in range(6)]
    out = _run(rr.rerank("q", cands))
    assert len(out) == TOP_N
    assert [c.chunk.url for c in out] == [c.chunk.url for c in cands[:TOP_N]]


def test_below_threshold_still_answers_via_fallback():
    # All candidates score a real but sub-threshold value → still fall back to
    # RRF order rather than returning empty (so the bot answers).
    client = FakeGeminiClient(
        generate_return=(
            '{"scores":[{"index":0,"score":0.1},'
            '{"index":1,"score":0.1},{"index":2,"score":0.1}]}'
        )
    )
    rr = Reranker(client=client)
    cands = [scored(f"https://fnx.co.il/{i}", "txt", index=i) for i in range(3)]
    out = _run(rr.rerank("q", cands))
    assert len(out) == 3


def test_incomplete_batched_scores_fall_back_to_rrf_order():
    client = FakeGeminiClient(
        generate_return='{"scores":[{"index":0,"score":0.9}]}'
    )
    rr = Reranker(client=client)
    cands = [scored(f"https://fnx.co.il/{i}", "txt", index=i) for i in range(3)]

    out = _run(rr.rerank("q", cands))

    assert [chunk.chunk.url for chunk in out] == [
        chunk.chunk.url for chunk in cands
    ]


def test_fenced_batched_scores_are_parsed():
    client = FakeGeminiClient(
        generate_return=(
            '```json\n{"scores":[{"index":0,"score":0.8},'
            '{"index":1,"score":0.7}]}\n```'
        )
    )
    rr = Reranker(client=client)
    cands = [scored(f"https://fnx.co.il/{i}", "txt", index=i) for i in range(2)]

    out = _run(rr.rerank("q", cands))

    assert [chunk.relevance_score for chunk in out] == [0.8, 0.7]
