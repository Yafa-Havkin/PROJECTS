/**
 * App — the root shell of the Phoenix RAG Bot chat UI.
 *
 * Owns the single ChatState and wires the children: DisclaimerBanner,
 * PersonaToggle, MessageList, LoadingIndicator, MessageInput.
 *
 * - Session handling: useSession creates the session on mount; the "שיחה חדשה"
 *   button and a persona switch both start a fresh session + clear messages.
 * - Streaming: handleSend appends a user message + an empty streaming assistant
 *   message, flips isGenerating, and streams tokens via useChat.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatState, Message, PersonaInfo } from "./types";
import { useSession } from "./hooks/useSession";
import { useChat } from "./hooks/useChat";
import DisclaimerBanner from "./components/DisclaimerBanner";
import PersonaToggle from "./components/PersonaToggle";
import MessageList from "./components/MessageList";
import LoadingIndicator from "./components/LoadingIndicator";
import MessageInput from "./components/MessageInput";

const DEFAULT_PERSONA_ID = "customer";

let messageCounter = 0;
function nextMessageId(): string {
  messageCounter += 1;
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `msg-${messageCounter}`;
}

interface PersonasResponse {
  personas: PersonaInfo[];
}

function App() {
  const { sessionId, newSession } = useSession();

  const [state, setState] = useState<ChatState>({
    sessionId: "",
    messages: [],
    activePersonaId: DEFAULT_PERSONA_ID,
    isGenerating: false,
    availablePersonas: [],
  });

  useEffect(() => {
    setState((prev) => ({ ...prev, sessionId }));
  }, [sessionId]);

  // Load personas once on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/personas");
        if (!response.ok) throw new Error(`status ${response.status}`);
        const data = (await response.json()) as PersonasResponse;
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          availablePersonas: data.personas,
          activePersonaId: data.personas[0]?.persona_id ?? prev.activePersonaId,
        }));
      } catch (err) {
        console.error("Failed to load personas", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const streamingIdRef = useRef<string | null>(null);

  const updateMessage = useCallback((id: string, patch: Partial<Message>) => {
    setState((prev) => ({
      ...prev,
      messages: prev.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  }, []);

  const appendToMessage = useCallback((id: string, text: string) => {
    setState((prev) => ({
      ...prev,
      messages: prev.messages.map((m) =>
        m.id === id ? { ...m, content: m.content + text } : m
      ),
    }));
  }, []);

  const { sendMessage } = useChat({
    onToken: (text) => {
      const id = streamingIdRef.current;
      if (id) appendToMessage(id, text);
    },
    onSources: (urls) => {
      const id = streamingIdRef.current;
      if (id) updateMessage(id, { sources: urls });
    },
    onDone: () => {
      const id = streamingIdRef.current;
      if (id) updateMessage(id, { isStreaming: false });
      streamingIdRef.current = null;
      setState((prev) => ({ ...prev, isGenerating: false }));
    },
    onError: (message) => {
      const id = streamingIdRef.current;
      if (id) {
        updateMessage(id, {
          content: message,
          isError: true,
          isStreaming: false,
          sources: undefined,
        });
      }
      streamingIdRef.current = null;
      setState((prev) => ({ ...prev, isGenerating: false }));
    },
  });

  const handleSend = useCallback(
    (text: string) => {
      if (state.isGenerating) return;

      const userMessage: Message = {
        id: nextMessageId(),
        role: "user",
        content: text,
      };
      const assistantId = nextMessageId();
      const assistantMessage: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        isStreaming: true,
      };

      streamingIdRef.current = assistantId;
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage, assistantMessage],
        isGenerating: true,
      }));

      void sendMessage({
        sessionId: state.sessionId,
        query: text,
        personaId: state.activePersonaId,
      });
    },
    [state.isGenerating, state.sessionId, state.activePersonaId, sendMessage]
  );

  const handlePersonaChange = useCallback(
    (personaId: string) => {
      if (personaId === state.activePersonaId) return;
      // Switching persona starts a FRESH conversation.
      streamingIdRef.current = null;
      setState((prev) => ({
        ...prev,
        activePersonaId: personaId,
        messages: [],
        isGenerating: false,
      }));
      void newSession();
    },
    [newSession, state.activePersonaId]
  );

  const handleNewSession = useCallback(async () => {
    if (state.isGenerating) return;
    streamingIdRef.current = null;
    setState((prev) => ({ ...prev, messages: [], isGenerating: false }));
    await newSession();
  }, [newSession, state.isGenerating]);

  return (
    <div dir="rtl" className="flex min-h-screen flex-col items-center px-4 py-6">
      <div className="flex min-h-[calc(100vh-3rem)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
        {/* ===== Header ===== */}
        <header className="bg-gradient-to-l from-phoenix-navy via-phoenix-navy-light to-phoenix-navy px-6 pb-5 pt-5 text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-phoenix-glow via-phoenix to-phoenix-dark text-2xl shadow-glow">
                🔥
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight">
                  הפניקס
                  <span className="mr-2 font-medium text-white/70">— בוט מידע</span>
                </h1>
                <p className="text-xs text-white/60">
                  עונה על בסיס התוכן הציבורי באתר הפניקס
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleNewSession()}
              disabled={state.isGenerating}
              className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-phoenix-navy shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              + שיחה חדשה
            </button>
          </div>

          <div className="mt-4">
            <PersonaToggle
              personas={state.availablePersonas}
              activePersonaId={state.activePersonaId}
              onChange={handlePersonaChange}
              disabled={state.isGenerating}
            />
          </div>
        </header>

        {/* ===== Disclaimer ===== */}
        <div className="px-6">
          <DisclaimerBanner />
        </div>

        {/* ===== Chat area ===== */}
        <main className="flex-1 overflow-y-auto px-6 py-5">
          <MessageList messages={state.messages} />
          <LoadingIndicator visible={state.isGenerating} />
        </main>

        {/* ===== Composer ===== */}
        <footer className="border-t border-slate-200/70 bg-white/70 px-6 py-4">
          <MessageInput onSubmit={handleSend} disabled={state.isGenerating} />
          <p className="mt-2 text-center text-[11px] text-slate-400">
            המידע מבוסס על אתר הפניקס בלבד • אינו מהווה ייעוץ אישי
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
