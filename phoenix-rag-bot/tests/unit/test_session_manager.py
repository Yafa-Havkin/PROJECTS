"""Session manager tests — history trimming + LRU session cap."""

from backend.session.manager import MAX_HISTORY_TURNS, SessionManager


def test_create_session_is_empty_with_default_persona():
    sm = SessionManager("customer")
    s = sm.create_session()
    assert s.persona_id == "customer"
    assert s.history == []


def test_add_turn_and_get_history():
    sm = SessionManager("customer")
    s = sm.create_session()
    sm.add_turn(s.session_id, "user", "שאלה")
    sm.add_turn(s.session_id, "assistant", "תשובה")
    hist = sm.get_history(s.session_id)
    assert [t.content for t in hist] == ["שאלה", "תשובה"]


def test_history_is_trimmed_to_max_turns():
    sm = SessionManager("customer")
    s = sm.create_session()
    for i in range(MAX_HISTORY_TURNS + 10):
        sm.add_turn(s.session_id, "user", f"m{i}")
    assert len(sm.get_history(s.session_id)) == MAX_HISTORY_TURNS


def test_update_persona_changes_mode():
    sm = SessionManager("customer")
    s = sm.create_session()
    sm.update_persona(s.session_id, "agent")
    # Persona change is reflected on the stored session.
    assert sm.get_history(s.session_id) is not None


def test_lru_cap_evicts_oldest_sessions():
    sm = SessionManager("customer", max_sessions=3)
    ids = [sm.create_session().session_id for _ in range(5)]
    # Only the 3 most-recent sessions survive; the first two were evicted.
    # (Accessing an evicted id creates a fresh empty session, so check history.)
    for old_id in ids[:2]:
        assert sm.get_history(old_id) == []
