import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatState, Message, PersonaInfo } from "./types";
import { apiUrl } from "./api";
import { useSession } from "./hooks/useSession";
import { useChat } from "./hooks/useChat";
import DisclaimerBanner from "./components/DisclaimerBanner";
import PersonaToggle from "./components/PersonaToggle";
import MessageList from "./components/MessageList";
import LoadingIndicator from "./components/LoadingIndicator";
import MessageInput from "./components/MessageInput";
import {
  pickChatRepresentative,
  type ChatRepresentative,
} from "./utils/chatRepresentatives";

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
  const [chatOpen, setChatOpen] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [chatRepresentative, setChatRepresentative] =
    useState<ChatRepresentative>(() => pickChatRepresentative());

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

  useEffect(() => {
    if (!chatOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setChatOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [chatOpen]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(apiUrl("/api/personas"));
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
    return () => { cancelled = true; };
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
    onToken: (text) => { const id = streamingIdRef.current; if (id) appendToMessage(id, text); },
    onSources: (urls) => { const id = streamingIdRef.current; if (id) updateMessage(id, { sources: urls }); },
    onDone: () => {
      const id = streamingIdRef.current;
      if (id) updateMessage(id, { isStreaming: false });
      streamingIdRef.current = null;
      setState((prev) => ({ ...prev, isGenerating: false }));
    },
    onError: (message) => {
      const id = streamingIdRef.current;
      if (id) updateMessage(id, { content: message, isError: true, isStreaming: false, sources: undefined });
      streamingIdRef.current = null;
      setState((prev) => ({ ...prev, isGenerating: false }));
    },
  });

  const handleSend = useCallback(
    (text: string) => {
      if (state.isGenerating) return;
      const userMessage: Message = { id: nextMessageId(), role: "user", content: text };
      const assistantId = nextMessageId();
      const assistantMessage: Message = { id: assistantId, role: "assistant", content: "", isStreaming: true };
      streamingIdRef.current = assistantId;
      setState((prev) => ({ ...prev, messages: [...prev.messages, userMessage, assistantMessage], isGenerating: true }));
      void sendMessage({ sessionId: state.sessionId, query: text, personaId: state.activePersonaId });
    },
    [state.isGenerating, state.sessionId, state.activePersonaId, sendMessage]
  );

  const handlePersonaChange = useCallback(
    (personaId: string) => {
      if (personaId === state.activePersonaId) return;
      streamingIdRef.current = null;
      setState((prev) => ({ ...prev, activePersonaId: personaId, messages: [], isGenerating: false }));
      setChatRepresentative((previous) =>
        pickChatRepresentative(previous.id),
      );
      void newSession();
    },
    [newSession, state.activePersonaId]
  );

  const handleNewSession = useCallback(async () => {
    if (state.isGenerating) return;
    streamingIdRef.current = null;
    setState((prev) => ({ ...prev, messages: [], isGenerating: false }));
    setChatRepresentative((previous) =>
      pickChatRepresentative(previous.id),
    );
    await newSession();
  }, [newSession, state.isGenerating]);

  const latestMessage = state.messages[state.messages.length - 1];
  const waitingForFirstToken =
    state.isGenerating &&
    latestMessage?.role === "assistant" &&
    latestMessage.content.length === 0;

  return (
    <div dir="rtl" className="relative min-h-screen">

      {/* ===== Phoenix website mock ===== */}
      <div className="phoenix-site">
        {/* Top bar */}
        <div className="phoenix-topbar">
          <span className="phoenix-topbar-links">כניסה לאזור אישי | צור קשר | נגישות</span>
        </div>

        {/* Main nav */}
        <nav className="phoenix-nav">
          <div className="phoenix-nav-inner">
            <div className="phoenix-logo">
              <span className="phoenix-logo-icon">🔥</span>
              <span className="phoenix-logo-text">הפניקס</span>
            </div>
            <div className="phoenix-nav-links">
              {["ביטוח רכב", "ביטוח בריאות", "ביטוח חיים", "פנסיה וחיסכון", "ביטוח דירה", "אודות"].map((item) => (
                <a key={item} href="#" className="phoenix-nav-link">{item}</a>
              ))}
            </div>
          </div>
        </nav>

        {/* Hero */}
        <div className="phoenix-hero">
          <div className="phoenix-hero-content">
            <h1 className="phoenix-hero-title">הביטוח שמבין אותך</h1>
            <p className="phoenix-hero-sub">פתרונות ביטוח ופיננסים מותאמים אישית לכל שלב בחיים</p>
            <div className="phoenix-hero-btns">
              <button className="phoenix-btn-primary">לקבלת הצעת מחיר</button>
              <button className="phoenix-btn-secondary">גלה את המוצרים שלנו</button>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="phoenix-cards">
          {[
            { icon: "🚗", title: "ביטוח רכב", desc: "ביטוח מקיף, צד ג' ואובדן טוטאלי" },
            { icon: "🏥", title: "ביטוח בריאות", desc: "כיסוי רפואי מקיף לכל המשפחה" },
            { icon: "🏠", title: "ביטוח דירה", desc: "הגנה על הבית ותכולתו" },
            { icon: "💰", title: "פנסיה וחיסכון", desc: "תכנון פיננסי לעתיד בטוח" },
          ].map((card) => (
            <div key={card.title} className="phoenix-card">
              <span className="phoenix-card-icon">{card.icon}</span>
              <h3 className="phoenix-card-title">{card.title}</h3>
              <p className="phoenix-card-desc">{card.desc}</p>
              <a href="#" className="phoenix-card-link">למידע נוסף ←</a>
            </div>
          ))}
        </div>
      </div>

      {/* ===== Chat bubble button ===== */}
      {chatOpen && (
        <button
          type="button"
          className="chat-backdrop"
          onClick={() => setChatOpen(false)}
          aria-label="סגירת הצ׳אט"
        />
      )}
      <button
        onClick={() => setChatOpen((o) => !o)}
        className="chat-bubble-btn"
        aria-label="פתח צ'אט"
        aria-expanded={chatOpen}
        aria-controls="phoenix-chat-window"
      >
        {chatOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm0 14H6l-2 2V4h16v12z"/>
          </svg>
        )}
        {!chatOpen && <span className="chat-bubble-label">צ'אט AI</span>}
      </button>

      {/* ===== Chat window ===== */}
      {chatOpen && (
        <div
          id="phoenix-chat-window"
          role="dialog"
          aria-label="עוזר הפניקס"
          aria-modal="true"
          className={[
            "chat-window",
            chatExpanded && "chat-window--expanded",
            state.activePersonaId === "agent" && "chat-window--agent",
          ].filter(Boolean).join(" ")}
          dir="rtl"
        >
          {/* Header */}
          <header className="chat-window-header">
            <div className="flex items-center gap-2">
              <img
                src={chatRepresentative.image}
                alt="נציג הפניקס"
                className="h-10 w-10 rounded-full border-2 border-white/70 object-cover"
              />
              <div>
                <div className="font-bold text-sm">עוזר הפניקס</div>
                <div className="text-xs text-white/75">
                  {state.activePersonaId === "agent"
                    ? "מצב סוכן · מקצועי ומפורט"
                    : "מצב לקוח · ברור ונגיש"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => void handleNewSession()}
                disabled={state.isGenerating}
                className="text-xs bg-white/20 hover:bg-white/30 rounded-full px-3 py-1 transition disabled:opacity-50"
              >
                + חדש
              </button>
              <button
                onClick={() => setChatExpanded((e) => !e)}
                className="text-white/70 hover:text-white transition"
                aria-label="הגדל/הקטן"
              >
                {chatExpanded ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" />
                    <line x1="10" y1="14" x2="3" y2="21" /><line x1="21" y1="3" x2="14" y2="10" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
                    <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                )}
              </button>
              <button onClick={() => setChatOpen(false)} className="text-white/70 hover:text-white transition">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </header>

          {/* Persona toggle */}
          <div className="chat-window-persona">
            <PersonaToggle
              personas={state.availablePersonas}
              activePersonaId={state.activePersonaId}
              onChange={handlePersonaChange}
              disabled={state.isGenerating}
            />
          </div>

          {/* Disclaimer */}
          <div className="px-3">
            <DisclaimerBanner />
          </div>

          {/* Messages */}
          <main className="chat-window-messages">
            <MessageList
              messages={state.messages}
              representative={chatRepresentative}
              showEvidence={state.activePersonaId === "agent"}
              personaId={state.activePersonaId}
              disabled={state.isGenerating}
              onQuestion={handleSend}
            />
            <LoadingIndicator
              visible={waitingForFirstToken}
              representative={chatRepresentative}
            />
          </main>

          {/* Input */}
          <footer className="chat-window-footer">
            <MessageInput onSubmit={handleSend} disabled={state.isGenerating} />
          </footer>
        </div>
      )}
    </div>
  );
}

export default App;
