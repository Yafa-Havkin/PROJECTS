"""Readiness endpoint tests."""

import asyncio
import json
import logging
from types import SimpleNamespace

import pytest

from backend.api import chat
from backend.api.models import ChatRequest
from backend.generator.generator import BACKEND_ERROR_MESSAGE
from backend.models import NoContentSignal
from tests.conftest import scored


@pytest.mark.parametrize(
    ("indexed_chunks", "key_configured", "status_code", "issues"),
    [
        (1763, True, 200, []),
        (0, True, 503, ["vector_store_empty"]),
        (1763, False, 503, ["gemini_api_key_missing"]),
        (0, False, 503, ["vector_store_empty", "gemini_api_key_missing"]),
    ],
)
def test_readiness_reports_index_and_gemini_configuration(
    monkeypatch, indexed_chunks, key_configured, status_code, issues
):
    services = SimpleNamespace(
        vectorstore=SimpleNamespace(count=lambda: indexed_chunks),
        gemini_api_key_configured=key_configured,
    )
    monkeypatch.setattr(chat, "get_services", lambda: services)

    response = asyncio.run(chat.readiness())

    assert response.status_code == status_code
    assert json.loads(response.body) == {
        "status": "ready" if status_code == 200 else "not_ready",
        "indexed_chunks": indexed_chunks,
        "gemini_api_key_configured": key_configured,
        "issues": issues,
    }


def test_chat_reports_retrieval_error_as_error_event(monkeypatch):
    class FakeRetriever:
        async def retrieve(self, query):
            return NoContentSignal(reason="retrieval_error")

    services = SimpleNamespace(
        session_manager=SimpleNamespace(
            update_persona=lambda *args: None,
            add_turn=lambda *args: None,
            get_history=lambda *args: [],
        ),
        config_loader=SimpleNamespace(load_persona=lambda persona_id: object()),
        retriever=FakeRetriever(),
        generator=SimpleNamespace(),
    )
    monkeypatch.setattr(chat, "get_services", lambda: services)

    response = asyncio.run(
        chat.chat(
            ChatRequest(
                session_id="test-session",
                query="שאלת בדיקה",
                persona_id="customer",
            )
        )
    )

    async def collect_body():
        return [chunk async for chunk in response.body_iterator]

    body = asyncio.run(collect_body())

    assert response.status_code == 200
    assert body == [
        chat.sse_format(chat.ErrorEvent(message=BACKEND_ERROR_MESSAGE))
    ]


def test_chat_logs_retrieval_time_to_first_token_and_total(monkeypatch, caplog):
    class FakeRetriever:
        async def retrieve(self, query):
            return [scored("https://fnx.co.il/health", "מידע על בריאות")]

    async def generate_stream(*args):
        yield "תשובה"

    services = SimpleNamespace(
        session_manager=SimpleNamespace(
            update_persona=lambda *args: None,
            add_turn=lambda *args: None,
            get_history=lambda *args: [],
        ),
        config_loader=SimpleNamespace(load_persona=lambda persona_id: object()),
        retriever=FakeRetriever(),
        generator=SimpleNamespace(generate_stream=generate_stream),
    )
    monkeypatch.setattr(chat, "get_services", lambda: services)
    caplog.set_level(logging.INFO, logger="phoenix_rag_bot.api")

    response = asyncio.run(
        chat.chat(
            ChatRequest(
                session_id="test-session",
                query="שאלת בדיקה",
                persona_id="customer",
            )
        )
    )

    async def collect_body():
        return [chunk async for chunk in response.body_iterator]

    body = asyncio.run(collect_body())

    assert any('"type": "token"' in event for event in body)
    assert any('"type": "done"' in event for event in body)
    assert "chat_stage stage=retrieval duration_ms=" in caplog.text
    assert "chat_stage stage=time_to_first_token duration_ms=" in caplog.text
    assert "chat_stage stage=generation duration_ms=" in caplog.text
    assert "chat_stage stage=complete duration_ms=" in caplog.text
