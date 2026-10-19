/**
 * useChat — the SSE streaming engine for the chat.
 *
 * Exposes sendMessage which POSTs to /api/chat and streams the Server-Sent
 * Events back, dispatching each to the caller callbacks:
 *   token   -> onToken(text)
 *   sources -> onSources(urls)
 *   done    -> onDone()
 *   error   -> onError(message)
 *
 * On any network throw, non-OK response, missing body, or error event, onError
 * is called with a Hebrew message and onDone is NOT called.
 */
import { useCallback } from "react";
import { apiUrl } from "../api";
import type { SSEEvent } from "../types";

const GENERIC_ERROR_MESSAGE = "אירעה שגיאה זמנית בשירות. אנא נסו שוב מאוחר יותר.";

interface UseChatCallbacks {
  onToken: (text: string) => void;
  onSources: (urls: string[]) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

interface SendMessageParams {
  sessionId: string;
  query: string;
  personaId: string;
}

interface UseChatResult {
  sendMessage: (params: SendMessageParams) => Promise<void>;
}

function parseFrame(frame: string): SSEEvent | null {
  const dataLines = frame
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice("data:".length).trimStart());
  if (dataLines.length === 0) return null;
  const payload = dataLines.join("\n");
  try {
    return JSON.parse(payload) as SSEEvent;
  } catch {
    return null;
  }
}

export function useChat(callbacks: UseChatCallbacks): UseChatResult {
  const { onToken, onSources, onDone, onError } = callbacks;

  const sendMessage = useCallback(
    async ({ sessionId, query, personaId }: SendMessageParams): Promise<void> => {
      let response: Response;
      try {
        response = await fetch(apiUrl("/api/chat"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            query,
            persona_id: personaId,
          }),
        });
      } catch (err) {
        console.error("chat request failed to send", err);
        onError(GENERIC_ERROR_MESSAGE);
        return;
      }

      if (!response.ok || !response.body) {
        console.error("chat request returned a bad response", response.status);
        onError(GENERIC_ERROR_MESSAGE);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;

      const handle = (event: SSEEvent): boolean => {
        switch (event.type) {
          case "token":
            onToken(event.content);
            return false;
          case "sources":
            onSources(event.urls);
            return false;
          case "done":
            onDone();
            return true;
          case "error":
            onError(event.message || GENERIC_ERROR_MESSAGE);
            return true;
        }
      };

      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let sep: number;
          while ((sep = buffer.indexOf("\n\n")) !== -1) {
            const frame = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 2);
            const event = parseFrame(frame);
            if (!event) continue;
            if (handle(event)) {
              finished = true;
              await reader.cancel().catch(() => undefined);
              return;
            }
          }
        }

        const tail = buffer.trim();
        if (!finished && tail.length > 0) {
          const event = parseFrame(tail);
          if (event && handle(event)) finished = true;
        }
      } catch (err) {
        console.error("error while reading chat stream", err);
        if (!finished) {
          onError(GENERIC_ERROR_MESSAGE);
          return;
        }
      }

      if (!finished) {
        onError(GENERIC_ERROR_MESSAGE);
      }
    },
    [onToken, onSources, onDone, onError]
  );

  return { sendMessage };
}
