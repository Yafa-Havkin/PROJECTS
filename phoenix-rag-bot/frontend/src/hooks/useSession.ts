/**
 * useSession — manages the chat session id.
 *
 * On mount it POSTs to /api/session/new and stores the returned session_id.
 * newSession() re-POSTs to obtain a fresh id (clears history / starts over).
 * Fetch errors are handled gracefully: logged, session id left empty.
 */
import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "../api";

interface NewSessionResponse {
  session_id: string;
}

interface UseSessionResult {
  sessionId: string;
  newSession: () => Promise<string>;
}

async function requestNewSession(): Promise<string> {
  const response = await fetch(apiUrl("/api/session/new"), { method: "POST" });
  if (!response.ok) {
    throw new Error(`session/new failed with status ${response.status}`);
  }
  const data = (await response.json()) as NewSessionResponse;
  return data.session_id;
}

export function useSession(): UseSessionResult {
  const [sessionId, setSessionId] = useState<string>("");

  const newSession = useCallback(async (): Promise<string> => {
    try {
      const id = await requestNewSession();
      setSessionId(id);
      return id;
    } catch (err) {
      console.error("Failed to create a new session", err);
      setSessionId("");
      return "";
    }
  }, []);

  useEffect(() => {
    void newSession();
  }, [newSession]);

  return { sessionId, newSession };
}
