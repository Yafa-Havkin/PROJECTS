"""
Phoenix RAG Bot — Answer Generator.

Assembles a grounded, Hebrew prompt from the persona's system prompt, the
retrieved chunks (with their source URLs), and the recent conversation history,
then streams the answer token-by-token via the resilient Gemini client.

Grounding rules (enforced in the prompt + by short-circuiting on no content):
  - Answer ONLY from the supplied chunks; never invent facts.
  - If there is no relevant content, return a fixed Hebrew "not found" message
    WITHOUT calling the LLM at all.
  - Always end with a "מקורות:" section listing the source URLs.
"""

from __future__ import annotations

import asyncio
import logging
from collections.abc import AsyncGenerator

from backend.config.models import PersonaConfig, TenantConfig
from backend.llm.gemini_client import GeminiClient, GeminiError
from backend.models import NoContentSignal, ScoredChunk, Turn

#: Sentinels placed on the bridge queue to mark end-of-stream / failure.
_STREAM_DONE = object()

logger = logging.getLogger("phoenix_rag_bot.generator")

#: Hebrew message shown when retrieval found nothing relevant (Req: no source → referral).
NOT_FOUND_MESSAGE = (
    "המידע המבוקש אינו מופיע באתר הפניקס. "
    "ניתן לפנות לשירות הלקוחות של הפניקס לקבלת מידע נוסף."
)

#: Hebrew message shown on a backend/LLM failure (Req 7.4) — no stack traces.
BACKEND_ERROR_MESSAGE = "אירעה שגיאה זמנית בשירות. אנא נסו שוב מאוחר יותר."


class AnswerGenerator:
    """Builds the grounded prompt and streams the Hebrew answer."""

    def __init__(
        self,
        tenant_config: TenantConfig,
        api_key: str | None = None,
        client: GeminiClient | None = None,
    ) -> None:
        self._tenant = tenant_config
        self._client = client or GeminiClient(
            generation_models=tenant_config.generation_models,
            embedding_model=tenant_config.embedding_model,
            api_keys=[api_key] if api_key else None,
            request_timeout=tenant_config.request_timeout_seconds,
        )

    async def generate_stream(
        self,
        query: str,
        retrieval: list[ScoredChunk] | NoContentSignal,
        persona: PersonaConfig,
        history: list[Turn],
    ) -> AsyncGenerator[str, None]:
        """Stream the Hebrew answer for a query (Req 6.5, 7.4).

        Yields the "not found" message immediately (no LLM call) when retrieval
        produced no relevant content. On an LLM failure yields the Hebrew error
        message rather than raising.
        """
        if isinstance(retrieval, NoContentSignal) or not retrieval:
            logger.info("No relevant content; returning not-found message without LLM call.")
            yield NOT_FOUND_MESSAGE
            return

        prompt = self._build_prompt(query, retrieval, persona, history)

        # The client's generate_stream is a BLOCKING generator (it does network
        # I/O with `requests`). Iterating it directly inside this async
        # generator would block the event loop and stall other requests. So we
        # run it in a worker thread and bridge fragments back through an
        # asyncio.Queue — the event loop stays free while we await the queue.
        queue: asyncio.Queue[object] = asyncio.Queue()
        loop = asyncio.get_running_loop()

        def _produce() -> None:
            try:
                for fragment in self._client.generate_stream(prompt):
                    loop.call_soon_threadsafe(queue.put_nowait, fragment)
            except GeminiError:
                logger.error(
                    "LLM generation failed across all models/keys.", exc_info=True
                )
                loop.call_soon_threadsafe(queue.put_nowait, BACKEND_ERROR_MESSAGE)
            except Exception:  # noqa: BLE001 — never let the worker die silently.
                logger.error("Unexpected generation error.", exc_info=True)
                loop.call_soon_threadsafe(queue.put_nowait, BACKEND_ERROR_MESSAGE)
            finally:
                loop.call_soon_threadsafe(queue.put_nowait, _STREAM_DONE)

        worker = asyncio.create_task(asyncio.to_thread(_produce))
        try:
            while True:
                item = await queue.get()
                if item is _STREAM_DONE:
                    break
                yield item  # type: ignore[misc]
        finally:
            await worker

    # ------------------------------------------------------------------ #
    def _build_prompt(
        self,
        query: str,
        chunks: list[ScoredChunk],
        persona: PersonaConfig,
        history: list[Turn],
    ) -> str:
        """Assemble the full grounded prompt (system + context + history + question)."""
        context_blocks: list[str] = []
        for i, scored in enumerate(chunks, start=1):
            chunk = scored.chunk
            context_blocks.append(
                f"[מקור {i}] (כותרת: {chunk.heading})\n"
                f"כתובת: {chunk.url}\n"
                f"{chunk.text}"
            )
        context = "\n\n".join(context_blocks)

        history_text = ""
        if history:
            lines = []
            for turn in history[-6:]:
                speaker = "משתמש" if turn.role == "user" else "עוזר"
                lines.append(f"{speaker}: {turn.content}")
            history_text = "\n".join(lines)

        parts = [persona.system_prompt.strip(), ""]
        parts.append(
            "ענה אך ורק על בסיס קטעי המקור הבאים מאתר הפניקס. "
            "אל תשתמש בידע חיצוני ואל תמציא מידע. "
            "אם התשובה אינה נמצאת בקטעים — אמור שאין לך מידע בנושא והפנה "
            "לשירות הלקוחות. אל תוסיף מדור 'מקורות:' — המקורות מוצגים אוטומטית על ידי המערכת. "
            "חשוב: הכלל את כתובות ה-URL רק של הקטעים שבהם השתמשת בפועל לניסוח התשובה — אל תכלול קישורים שאינם קשורים ישירות לתשובה."
        )
        parts.append("")
        parts.append("=== קטעי מקור ===")
        parts.append(context)
        if history_text:
            parts.append("")
            parts.append("=== היסטוריית שיחה ===")
            parts.append(history_text)
        parts.append("")
        parts.append("=== שאלת המשתמש ===")
        parts.append(query)
        parts.append("")
        parts.append("התשובה שלך (בעברית):")
        return "\n".join(parts)
