"""SSE frame formatting tests."""

import json

from backend.api.models import (
    DoneEvent,
    ErrorEvent,
    SourcesEvent,
    TokenEvent,
    sse_format,
)


def _parse(frame: str) -> dict:
    assert frame.startswith("data: ")
    assert frame.endswith("\n\n")
    return json.loads(frame[len("data: "):].strip())


def test_token_event_frame():
    obj = _parse(sse_format(TokenEvent(content="שלום")))
    assert obj == {"type": "token", "content": "שלום"}


def test_sources_event_frame():
    obj = _parse(sse_format(SourcesEvent(urls=["https://a", "https://b"])))
    assert obj == {"type": "sources", "urls": ["https://a", "https://b"]}


def test_done_event_frame():
    obj = _parse(sse_format(DoneEvent()))
    assert obj == {"type": "done"}


def test_error_event_frame():
    obj = _parse(sse_format(ErrorEvent(message="שגיאה")))
    assert obj == {"type": "error", "message": "שגיאה"}


def test_hebrew_is_not_escaped():
    # ensure_ascii=False keeps Hebrew readable on the wire.
    frame = sse_format(TokenEvent(content="ביטוח"))
    assert "ביטוח" in frame
