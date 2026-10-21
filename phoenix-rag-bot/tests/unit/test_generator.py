"""Generator tests — not-found short-circuit, streaming, and LLM-failure path."""

import asyncio

from backend.config.models import PersonaConfig, TenantConfig
from backend.generator.generator import (
    BACKEND_ERROR_MESSAGE,
    NOT_FOUND_MESSAGE,
    AnswerGenerator,
)
from backend.llm.gemini_client import GeminiError
from backend.models import NoContentSignal
from tests.conftest import FakeGeminiClient, scored


def _tenant() -> TenantConfig:
    return TenantConfig(
        tenant_id="t", company_name="הפניקס", crawl_url="https://fnx.co.il",
        crawl_max_depth=1, crawl_timeout_minutes=1, vectorstore_path="./x",
        default_persona_id="customer", persona_config_paths=[],
    )


def _persona() -> PersonaConfig:
    return PersonaConfig(persona_id="customer", name="לקוח", system_prompt="היה נחמד")


async def _collect(agen) -> str:
    return "".join([chunk async for chunk in agen])


def test_no_content_returns_not_found_without_llm():
    client = FakeGeminiClient()
    gen = AnswerGenerator(_tenant(), client=client)
    out = asyncio.run(
        _collect(
            gen.generate_stream(
                "q", NoContentSignal(reason="no_relevant_content"), _persona(), []
            )
        )
    )
    assert out == NOT_FOUND_MESSAGE
    assert client.stream_calls == 0  # LLM must NOT be called


def test_retrieval_error_returns_backend_error_without_llm():
    client = FakeGeminiClient()
    gen = AnswerGenerator(_tenant(), client=client)
    out = asyncio.run(
        _collect(
            gen.generate_stream(
                "q", NoContentSignal(reason="retrieval_error"), _persona(), []
            )
        )
    )
    assert out == BACKEND_ERROR_MESSAGE
    assert client.stream_calls == 0


def test_empty_list_returns_not_found():
    gen = AnswerGenerator(_tenant(), client=FakeGeminiClient())
    out = asyncio.run(_collect(gen.generate_stream("q", [], _persona(), [])))
    assert out == NOT_FOUND_MESSAGE


def test_streams_tokens_from_client():
    client = FakeGeminiClient(stream_tokens=["ביטוח ", "רכב ", "מקיף"])
    gen = AnswerGenerator(_tenant(), client=client)
    cands = [scored("https://fnx.co.il/a", "תוכן", 0.9)]
    out = asyncio.run(_collect(gen.generate_stream("q", cands, _persona(), [])))
    assert out == "ביטוח רכב מקיף"


def test_llm_failure_yields_hebrew_error():
    client = FakeGeminiClient(stream_raises=GeminiError("all keys exhausted"))
    gen = AnswerGenerator(_tenant(), client=client)
    cands = [scored("https://fnx.co.il/a", "תוכן", 0.9)]
    out = asyncio.run(_collect(gen.generate_stream("q", cands, _persona(), [])))
    assert out == BACKEND_ERROR_MESSAGE


def test_prompt_does_not_allow_substituting_a_different_insurance_type():
    gen = AnswerGenerator(_tenant(), client=FakeGeminiClient())
    prompt = gen._build_prompt(
        "האם יש ביטוח בריאות משפחתי?",
        [scored("https://fnx.co.il/travel", "ביטוח נסיעות קבוצתי", 0.9)],
        _persona(),
        [],
    )

    assert "אל תענה עליה בעזרת מקור שמתאר סוג ביטוח אחר" in prompt
    assert "אמור שאין לך מידע מספיק בנושא" in prompt
    assert "אל תכתוב כתובות URL, קישורי Markdown או מדור 'מקורות:'" in prompt
