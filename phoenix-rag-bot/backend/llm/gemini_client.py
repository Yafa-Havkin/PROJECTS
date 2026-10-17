"""
Phoenix RAG Bot — resilient Gemini client with model + API-key fallback.

This is the single choke point through which ALL Gemini traffic flows
(embedding, reranking, answer generation). It adds the resilience the raw SDK
lacks on a TLS-inspecting / rate-limited network:

* **Model fallback** — a 503 ("model busy"), 404 ("model retired"), or timeout
  on one chat model transparently rolls over to the next model in the tenant's
  ``generation_models`` list.
* **API-key fallback** — a 429 ("quota/rate limit") or auth failure on one key
  rolls over to the next key supplied via the environment
  (``GEMINI_API_KEY``, ``GEMINI_API_KEY_2``, ``GEMINI_API_KEY_3`` …).
* **Hard timeouts** — plain ``requests`` calls with an explicit per-request
  timeout, so a stalled connection fails fast instead of hanging forever.

Using the REST endpoints directly (rather than ``google-generativeai``) also
sidesteps the gRPC SSL-handshake failures seen on certificate-inspecting
networks: ``requests`` honours the system / certifi trust store.
"""

from __future__ import annotations

import json
import logging
import os
import time
from collections.abc import Iterator

import requests

logger = logging.getLogger("phoenix_rag_bot.gemini")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
_API_BASE = "https://generativelanguage.googleapis.com/v1beta"

#: Primary key env var, then numbered fallbacks are probed: _2, _3, ...
_PRIMARY_KEY_ENV = "GEMINI_API_KEY"
_MAX_KEYS = 5

#: Status codes that should trigger a MODEL rollover (busy / retired / bad).
_MODEL_ROLLOVER_STATUSES = frozenset({404, 503})
#: Status codes that should trigger an API-KEY rollover (quota / auth).
_KEY_ROLLOVER_STATUSES = frozenset({429, 401, 403})

#: Transient-503 in-model retry policy before giving up on a model.
_PER_MODEL_503_RETRIES = 2
_503_BACKOFF_SECONDS = 2.0


class GeminiError(RuntimeError):
    """Raised when every (model, key) combination has been exhausted."""


class _StreamRollover(RuntimeError):
    """Internal: a streaming attempt failed before producing any token."""


def _discover_api_keys() -> list[str]:
    """Collect all configured Gemini API keys from the environment, in order.

    Looks up ``GEMINI_API_KEY`` first, then ``GEMINI_API_KEY_2`` …
    ``GEMINI_API_KEY_{_MAX_KEYS}``. Blank / missing entries are skipped.

    Returns:
        An ordered list of distinct non-empty API keys (may be empty).
    """
    keys: list[str] = []
    primary = os.environ.get(_PRIMARY_KEY_ENV, "").strip()
    if primary:
        keys.append(primary)
    for n in range(2, _MAX_KEYS + 1):
        val = os.environ.get(f"{_PRIMARY_KEY_ENV}_{n}", "").strip()
        if val and val not in keys:
            keys.append(val)
    return keys


class GeminiClient:
    """A resilient facade over the Gemini REST API."""

    def __init__(
        self,
        generation_models: list[str],
        embedding_model: str,
        api_keys: list[str] | None = None,
        request_timeout: int = 90,
    ) -> None:
        self._generation_models = list(generation_models) or ["gemini-flash-lite-latest"]
        self._embedding_model = embedding_model
        self._api_keys = api_keys if api_keys is not None else _discover_api_keys()
        self._read_timeout = request_timeout
        self._timeout = (10, request_timeout)

        if not self._api_keys:
            logger.warning(
                "GeminiClient constructed with no API keys; calls will fail "
                "until %s (or a numbered variant) is set.",
                _PRIMARY_KEY_ENV,
            )
        else:
            logger.info(
                "GeminiClient ready — %d key(s), models=%s, embed=%s, timeout=%ds",
                len(self._api_keys),
                self._generation_models,
                self._embedding_model,
                self._read_timeout,
            )

    # ------------------------------------------------------------------ #
    # Embedding
    # ------------------------------------------------------------------ #
    def embed(self, text: str, task_type: str = "retrieval_document") -> list[float]:
        """Embed a single text, rolling over across keys on quota/auth errors.

        Args:
            text: The text to embed.
            task_type: Gemini task type (document vs. query).

        Returns:
            The embedding vector.

        Raises:
            GeminiError: If embedding fails across all keys.
        """
        if not self._api_keys:
            raise GeminiError("no API keys configured for embedding")

        last_detail = "no keys"
        model = self._embedding_model
        payload = {
            "model": model,
            "content": {"parts": [{"text": text}]},
            "taskType": task_type.upper(),
        }
        for key in self._api_keys:
            url = f"{_API_BASE}/{model}:embedContent?key={key}"
            try:
                resp = requests.post(url, json=payload, timeout=self._timeout)
            except requests.RequestException as exc:
                last_detail = f"network error: {exc}"
                logger.warning("embed: network error — trying next key.")
                continue
            if resp.status_code == 200:
                try:
                    return resp.json()["embedding"]["values"]
                except (KeyError, json.JSONDecodeError) as exc:
                    raise GeminiError(f"malformed embedding response: {exc}") from exc
            if resp.status_code in _KEY_ROLLOVER_STATUSES:
                last_detail = f"HTTP {resp.status_code}"
                logger.warning(
                    "embed: HTTP %s on a key — trying next key.", resp.status_code
                )
                continue
            # Non-recoverable for embedding (there is only one embed model).
            last_detail = f"HTTP {resp.status_code}: {resp.text[:120]}"
            logger.error("embed: non-recoverable HTTP %s.", resp.status_code)
            break
        raise GeminiError(f"embedding failed across all keys: {last_detail}")

    # ------------------------------------------------------------------ #
    # Generation (full)
    # ------------------------------------------------------------------ #
    def generate(self, prompt: str) -> str:
        """Generate a full answer, falling back across models and keys.

        Args:
            prompt: The fully-assembled prompt text.

        Returns:
            The generated answer text.

        Raises:
            GeminiError: If every (model, key) combination fails.
        """
        last_detail = "no models/keys available"
        for model in self._generation_models:
            for key in self._api_keys:
                status, text_or_err = self._generate_once(model, key, prompt)
                if status == 200:
                    return text_or_err
                last_detail = f"{model}: {status} {text_or_err[:120]}"
                if status in _KEY_ROLLOVER_STATUSES:
                    logger.warning("generate: HTTP %s on %s — trying next key.", status, model)
                    continue  # next key, same model
                if status in _MODEL_ROLLOVER_STATUSES or status == "TIMEOUT":
                    logger.warning("generate: %s on %s — trying next model.", status, model)
                    break  # next model
                logger.warning("generate: HTTP %s on %s — trying next model.", status, model)
                break
        raise GeminiError(f"Generation failed across all models/keys: {last_detail}")

    def _generate_once(
        self, model: str, key: str, prompt: str
    ) -> tuple[int | str, str]:
        """One generate attempt with transient-503 retries.

        Returns:
            ``(200, text)`` on success, otherwise ``(status_or_"TIMEOUT", detail)``.
        """
        url = f"{_API_BASE}/models/{model}:generateContent?key={key}"
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        for attempt in range(_PER_MODEL_503_RETRIES + 1):
            try:
                resp = requests.post(url, json=payload, timeout=self._timeout)
            except requests.Timeout:
                return "TIMEOUT", "read timed out"
            except requests.RequestException as exc:
                return "TIMEOUT", f"network error: {exc}"
            if resp.status_code == 200:
                try:
                    text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                    return 200, text
                except (KeyError, IndexError, json.JSONDecodeError):
                    return 200, ""  # empty / safety-blocked response
            if resp.status_code == 503 and attempt < _PER_MODEL_503_RETRIES:
                time.sleep(_503_BACKOFF_SECONDS * (attempt + 1))
                continue
            return resp.status_code, resp.text
        return 503, "model busy after retries"

    # ------------------------------------------------------------------ #
    # Generation (streaming)
    # ------------------------------------------------------------------ #
    def generate_stream(self, prompt: str) -> Iterator[str]:
        """Stream an answer token-by-token, falling back across models/keys.

        Args:
            prompt: The fully-assembled prompt text.

        Yields:
            Answer text fragments as they arrive.

        Raises:
            GeminiError: If no model/key produced any output.
        """
        last_detail = "no models/keys available"
        for model in self._generation_models:
            for key in self._api_keys:
                try:
                    produced = False
                    for fragment in self._stream_once(model, key, prompt):
                        produced = True
                        yield fragment
                    if produced:
                        return
                    last_detail = f"{model}: empty stream"
                except _StreamRollover as exc:
                    last_detail = f"{model}: {exc}"
                    logger.warning("generate_stream: %s on %s — trying next.", exc, model)
                    continue
        raise GeminiError(f"Streaming generation failed: {last_detail}")

    def _stream_once(self, model: str, key: str, prompt: str) -> Iterator[str]:
        """One streaming attempt via the SSE streamGenerateContent endpoint.

        Raises:
            _StreamRollover: If the attempt fails before any token is produced.
        """
        url = (
            f"{_API_BASE}/models/{model}:streamGenerateContent"
            f"?alt=sse&key={key}"
        )
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        try:
            resp = requests.post(
                url, json=payload, timeout=self._timeout, stream=True
            )
        except requests.Timeout as exc:
            raise _StreamRollover("TIMEOUT") from exc
        except requests.RequestException as exc:
            raise _StreamRollover(f"network error: {exc}") from exc

        if resp.status_code != 200:
            detail = f"HTTP {resp.status_code}"
            resp.close()
            raise _StreamRollover(detail)

        resp.encoding = "utf-8"
        for raw_line in resp.iter_lines():
            if not raw_line:
                continue
            line = raw_line.decode("utf-8") if isinstance(raw_line, bytes) else raw_line
            if not line.startswith("data:"):
                continue
            data = line[len("data:"):].strip()
            if data == "[DONE]":
                break
            try:
                obj = json.loads(data)
                text = obj["candidates"][0]["content"]["parts"][0]["text"]
                if text:
                    yield text
            except (KeyError, IndexError, json.JSONDecodeError):
                continue
