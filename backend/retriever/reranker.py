"""
Reranker — דירוג מחדש של candidate chunks לפי רלוונטיות לשאלה.

לאחר שה-HybridRetriever מיזג תוצאות וקטוריות ו-BM25 (RRF), אנו שולחים כל
candidate בנפרד ל-Gemini עם prompt ייעודי לציון רלוונטיות. המודל מחזיר
JSON ``{"score": <float>}``, אנו ממיינים לפי הציון, מסננים לפי סף, ומחזירים
את ה-top-5.

עמידות לשגיאות:
  - כשל כולל ב-Gemini (חריגה) → fallback לסדר ה-RRF המקורי.
  - כל הציונים 0.0 (חזרו ריקים תחת עומס/מכסה) → fallback לסדר RRF.
  - אף candidate לא עבר את הסף → fallback לסדר RRF (לא "משתיקים" את הבוט).
  - תשובת JSON פגומה ל-candidate בודד → ציון 0.0.
"""

from __future__ import annotations

import asyncio
import json
import logging
import re

from backend.llm.gemini_client import GeminiClient
from backend.models import ScoredChunk

#: מספר התוצאות המרבי שה-Reranker מחזיר.
TOP_N: int = 5

#: סף רלוונטיות — chunks עם ציון מתחת לסף נחשבים לא-רלוונטיים.
RELEVANCE_THRESHOLD: float = 0.4

_LOGGER_NAME: str = "phoenix_rag_bot.reranker"

RERANK_PROMPT: str = """\
You are a relevance scoring engine. Score how well the passage answers the query.
Return ONLY a JSON object in the exact form: {{"score": <float between 0.0 and 1.0>}}
Do not include any explanation, markdown, or extra text.

Scoring rubric:
- 0.9-1.0: Passage directly and completely answers the query.
- 0.7-0.8: Passage is highly relevant but does not fully answer the query.
- 0.5-0.6: Passage is partially relevant to the query.
- 0.3-0.4: Passage is only tangentially related to the query.
- 0.0-0.2: Passage is not relevant to the query.

Query:
{query}

Passage:
{passage}
"""

_JSON_OBJECT_RE: re.Pattern[str] = re.compile(r"\{.*?\}", re.DOTALL)

_logger = logging.getLogger(_LOGGER_NAME)


class Reranker:
    """מדרג מחדש candidate chunks לפי רלוונטיות באמצעות Gemini."""

    def __init__(self, client: GeminiClient) -> None:
        self._client = client

    async def rerank(
        self, query: str, candidates: list[ScoredChunk]
    ) -> list[ScoredChunk]:
        """מדרג מחדש candidates לפי רלוונטיות ומחזיר את ה-top-5 (עם fallback)."""
        if not candidates:
            return []

        try:
            scores = await asyncio.gather(
                *(self._score_candidate(query, candidate) for candidate in candidates)
            )
        except Exception:  # noqa: BLE001
            _logger.warning(
                "Gemini reranking failed; falling back to top-%d RRF-ordered candidates.",
                TOP_N,
                exc_info=True,
            )
            return candidates[:TOP_N]

        # כל הציונים 0.0 → ה-reranker לא הפיק אות אמיתי (מכסה/עומס) → RRF.
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

        # אם שום candidate לא עבר את הסף — כמעט תמיד ציונים לא-אמינים (חלק
        # מהקריאות המקביליות חזרו ריקות). החיפוש כבר העלה את הקטעים הטובים,
        # לכן נופלים חזרה ל-RRF במקום להשתיק את הבוט.
        if not relevant:
            _logger.warning(
                "No candidate cleared the %.1f rerank threshold; falling back to "
                "top-%d RRF-ordered candidates so the bot still answers.",
                RELEVANCE_THRESHOLD,
                TOP_N,
            )
            return candidates[:TOP_N]

        return relevant[:TOP_N]

    async def _score_candidate(self, query: str, candidate: ScoredChunk) -> float:
        """מחשב ציון רלוונטיות יחיד עבור candidate (חריגת API מתפשטת, JSON פגום → 0.0)."""
        prompt = RERANK_PROMPT.format(query=query, passage=candidate.chunk.text)
        raw = await asyncio.to_thread(self._client.generate, prompt)
        return self._parse_score(raw)

    @staticmethod
    def _parse_score(raw: str) -> float:
        """מחלץ ומנרמל ציון מתוך תשובת JSON גולמית; כל כשל פרסור → 0.0."""
        if not raw:
            return 0.0
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```[a-zA-Z]*\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned).strip()

        payload: object = None
        try:
            payload = json.loads(cleaned)
        except (json.JSONDecodeError, ValueError):
            match = _JSON_OBJECT_RE.search(cleaned)
            if match is None:
                return 0.0
            try:
                payload = json.loads(match.group(0))
            except (json.JSONDecodeError, ValueError):
                return 0.0

        if not isinstance(payload, dict) or "score" not in payload:
            return 0.0
        try:
            score = float(payload["score"])
        except (TypeError, ValueError):
            return 0.0
        return max(0.0, min(1.0, score))
