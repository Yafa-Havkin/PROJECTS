from __future__ import annotations

from pathlib import Path

from backend.main import _runtime_vectorstore_path


def test_runtime_vectorstore_path_uses_source_outside_vercel(
    monkeypatch, tmp_path: Path
) -> None:
    source = tmp_path / "chroma"
    source.mkdir()
    monkeypatch.delenv("VERCEL", raising=False)

    assert _runtime_vectorstore_path(str(source)) == str(source)


def test_runtime_vectorstore_path_copies_index_to_writable_directory(
    monkeypatch, tmp_path: Path
) -> None:
    source = tmp_path / "source"
    source.mkdir()
    (source / "index.sqlite3").write_text("index", encoding="utf-8")
    runtime = tmp_path / "runtime"
    monkeypatch.setenv("VERCEL", "1")
    monkeypatch.setattr("backend.main.tempfile.gettempdir", lambda: str(runtime))

    resolved = Path(_runtime_vectorstore_path(str(source)))

    assert resolved == runtime / "phoenix-rag-bot-chroma"
    assert (resolved / "index.sqlite3").read_text(encoding="utf-8") == "index"
