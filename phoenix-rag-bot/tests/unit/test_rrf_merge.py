"""Tests for the RRF fusion in HybridRetriever._rrf_merge."""

from backend.retriever.retriever import RRF_K, HybridRetriever
from tests.conftest import make_chunk, scored


def _retriever() -> HybridRetriever:
    # Collaborators are unused by _rrf_merge, so None is fine here.
    return HybridRetriever(None, None, None, None)  # type: ignore[arg-type]


def test_merge_empty_returns_empty():
    assert _retriever()._rrf_merge([], [], top_k=10) == []


def test_chunk_in_both_lists_scores_highest():
    r = _retriever()
    shared_url = "https://fnx.co.il/a"
    vec = [scored(shared_url, "a", index=0), scored("https://fnx.co.il/b", "b", index=0)]
    bm = [(make_chunk(shared_url, "a", 0), 0)]
    merged = r._rrf_merge(vec, bm, top_k=10)
    # The shared chunk appears in both → should rank first.
    assert merged[0].chunk.url == shared_url
    # Its score = 1/(K+0) [vector] + 1/(K+0) [bm25].
    assert abs(merged[0].relevance_score - (2.0 / (RRF_K + 0))) < 1e-9


def test_top_k_caps_results():
    r = _retriever()
    vec = [scored(f"https://fnx.co.il/{i}", "x", index=i) for i in range(10)]
    merged = r._rrf_merge(vec, [], top_k=3)
    assert len(merged) == 3


def test_results_sorted_descending():
    r = _retriever()
    vec = [scored(f"https://fnx.co.il/{i}", "x", index=i) for i in range(5)]
    merged = r._rrf_merge(vec, [], top_k=5)
    scores = [m.relevance_score for m in merged]
    assert scores == sorted(scores, reverse=True)
