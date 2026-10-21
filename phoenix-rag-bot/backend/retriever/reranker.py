"""
Reranker — דירוג מחדש של candidate chunks לפי רלוונטיות לשאלה.

לאחר שה-HybridRetriever מיזג תוצאות וקטוריות ו-BM25 (RRF), אנו שולחים את
המועמדים בבקשה אחת ל-Gemini כדי לדרג אותם. המודל מחזיר ציון לכל מועמד,
ואנו ממיינים לפי הציון, מסננים לפי סף, ומחזירים את ה-top-5.

עמידות לשגיאות:
  - כשל כולל ב-Gemini (חריגה) → fallback לסדר ה-RRF המקורי.
  - תשובת JSON פגומה או חלקית → fallback לסדר RRF.
  - כל הציונים 0.0 או אף candidate לא עבר את הסף → fallback לסדר RRF.
"""

from __future__ import annotations

import asyncio
import json
import logging
import math
import re

from backend.llm.gemini_client import GeminiClient
from backend.models import ScoredChunk

#: מספר התוצאות המרבי שה-Reranker מחזיר.
TOP_N: int = 5

#: סף רלוונטיות — chunks עם ציון מתחת לסף נחשבים לא-רלוונטיים.
RELEVANCE_THRESHOLD: float = 0.4

_LOGGER_NAME: str = "phoenix_rag_bot.reranker"

RERANK_PROMPT: str = """\
You are a relevance scoring engine. Score each passage independently for how well it answers the query.
Return ONLY a JSON object in this exact form, with every passage index exactly once:
{{"scores": [{{"index": 0, "score": <float between 0.0 and 1.0>}}]}}
Do not include any explanation, markdown, or extra text.

Scoring rubric:
- 0.9-1.0: Passage directly and completely answers the query.
- 0.7-0.8: Passage is highly relevant but does not fully answer the query.
- 0.5-0.6: Passage is partially relevant to the query.
- 0.3-0.4: Passage is only tangentially related to the query.
- 0.0-0.2: Passage is not relevant to the query.

Query:
{query}

Passages:
{passages}
"""

_logger = logging.getLogger(_LOGGER_NAME)


class Reranker:
    """מדרג מחדש candidate chunks לפי רלוונטיות באמצעות Gemini."""

    def __init__(self, client: GeminiClient) -> None:
        self._client = client

    async def rerank(
        self, query: str, candidates: list[ScoredChunk]
    ) -> list[ScoredChunk]:
        """מדרג candidates בקריאת Gemini אחת ומחזיר את ה-top-5 (עם fallback)."""
        if not candidates:
            return []

        try:
            prompt = self._build_prompt(query, candidates)
            raw = await asyncio.to_thread(self._client.generate, prompt)
            scores = self._parse_scores(raw, len(candidates))
        except Exception:  # noqa: BLE001
            _logger.warning(
                "Gemini reranking failed; falling back to top-%d RRF-ordered candidates.",
                TOP_N,
                exc_info=True,
            )
            return candidates[:TOP_N]

        if scores is None:
            _logger.warning(
                "Reranker returned malformed or incomplete scores; "
                "falling back to top-%d RRF-ordered candidates.",
                TOP_N,
            )
            return candidates[:TOP_N]

        if all(score <= 0.0 for score in scores):
            _logger.warning(
                "Reranker produced no usable scores (all 0.0 — likely API quota/timeout); "
                "falling back to top-%d RRF-ordered candidates.",
                TOP_N,
            )
            return candidates[:TOP_N]

        rescored = [
            ScoredChunk(chunk=candidate.chunk, relevance_score=score)
            for candidate, score in zip(candidates, scores, strict=True)
        ]
        rescored.sort(key=lambda sc: sc.relevance_score, reverse=True)

        relevant = [sc for sc in rescored if sc.relevance_score >= RELEVANCE_THRESHOLD]
        if not relevant:
            _logger.warning(
                "No candidate cleared the %.1f rerank threshold; falling back to "
                "top-%d RRF-ordered candidates so the bot still answers.",
                RELEVANCE_THRESHOLD,
                TOP_N,
            )
            return candidates[:TOP_N]

        return relevant[:TOP_N]

    @staticmethod
    def _build_prompt(query: str, candidates: list[ScoredChunk]) -> str:
        passages = "\n\n".join(
            f"[Passage index={index}]\n{candidate.chunk.text}"
            for index, candidate in enumerate(candidates)
        )
        return RERANK_PROMPT.format(query=query, passages=passages)

    @staticmethod
    def _parse_scores(raw: str, candidate_count: int) -> list[float] | None:
        """Parse a complete indexed score list; malformed output triggers fallback."""
        if not raw:
            return None
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```[a-zA-Z]*\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned).strip()

        try:
            payload = json.loads(cleaned)
        except (json.JSONDecodeError, ValueError):
            return None
        if not isinstance(payload, dict):
            return None

        raw_scores = payload.get("scores")
        if not isinstance(raw_scores, list) or len(raw_scores) != candidate_count:
            return None

        scores: list[float | None] = [None] * candidate_count
        for item in raw_scores:
            if not isinstance(item, dict):
                return None
            index = item.get("index")
            value = item.get("score")
            if (
                isinstance(index, bool)
                or not isinstance(index, int)
                or not 0 <= index < candidate_count
                or scores[index] is not None
                or isinstance(value, bool)
                or not isinstance(value, (int, float))
            ):
                return None
            score = float(value)
            if not math.isfinite(score):
                return None
            scores[index] = max(0.0, min(1.0, score))

        if any(score is None for score in scores):
            return None
        return [score for score in scores if score is not None]
