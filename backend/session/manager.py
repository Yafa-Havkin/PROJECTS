"""
Phoenix RAG Bot — in-memory session manager.

Holds conversation state (history + active persona) per session id. Simple and
process-local: starting a new session clears history (Req 6.4).

Bounded memory: at most ``MAX_SESSIONS`` are kept. When the cap is exceeded the
least-recently-used session is evicted, so a long-running server with many
visitors cannot grow unbounded. History per session is also capped to the most
recent ``MAX_HISTORY_TURNS`` turns.
"""

from __future__ import annotations

import logging
import uuid
from collections import OrderedDict

from backend.models import Session, Turn

logger = logging.getLogger("phoenix_rag_bot.session")

#: Keep only the most recent turns in context to bound prompt size.
MAX_HISTORY_TURNS = 12

#: Hard cap on concurrently-tracked sessions (LRU eviction beyond this).
MAX_SESSIONS = 1000


class SessionManager:
    """Creates and tracks in-memory chat sessions with an LRU cap."""

    def __init__(self, default_persona_id: str, max_sessions: int = MAX_SESSIONS) -> None:
        self._default_persona_id = default_persona_id
        self._max_sessions = max_sessions
        # OrderedDict acts as an LRU: most-recently-used is moved to the end.
        self._sessions: "OrderedDict[str, Session]" = OrderedDict()

    def create_session(self) -> Session:
        """Create a fresh, empty session with the default persona."""
        session_id = str(uuid.uuid4())
        session = Session(
            session_id=session_id,
            persona_id=self._default_persona_id,
            history=[],
        )
        self._sessions[session_id] = session
        self._touch_and_evict(session_id)
        logger.info("Created new session %s", session_id)
        return session

    def _touch_and_evict(self, session_id: str) -> None:
        """Mark a session as most-recently-used and evict the oldest if over cap."""
        self._sessions.move_to_end(session_id)
        while len(self._sessions) > self._max_sessions:
            evicted_id, _ = self._sessions.popitem(last=False)
            logger.info("Evicted least-recently-used session %s (cap reached).", evicted_id)

    def _get_or_create(self, session_id: str) -> Session:
        session = self._sessions.get(session_id)
        if session is None:
            session = Session(
                session_id=session_id,
                persona_id=self._default_persona_id,
                history=[],
            )
            self._sessions[session_id] = session
        self._touch_and_evict(session_id)
        return session

    def update_persona(self, session_id: str, persona_id: str) -> None:
        """Set the active persona for a session (takes effect immediately)."""
        session = self._get_or_create(session_id)
        if session.persona_id != persona_id:
            session.persona_id = persona_id
            logger.info("Session %s switched to persona %s", session_id, persona_id)

    def add_turn(self, session_id: str, role: str, content: str) -> None:
        """Append a conversation turn, trimming to the most recent turns."""
        session = self._get_or_create(session_id)
        session.history.append(Turn(role=role, content=content))
        if len(session.history) > MAX_HISTORY_TURNS:
            session.history = session.history[-MAX_HISTORY_TURNS:]

    def get_history(self, session_id: str) -> list[Turn]:
        """Return the conversation history for a session (possibly empty)."""
        return self._get_or_create(session_id).history
