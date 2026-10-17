/** Shared frontend types for the Phoenix RAG Bot chat UI. */

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  isStreaming?: boolean;
  isError?: boolean;
}

export interface PersonaInfo {
  persona_id: string;
  name: string;
}

export interface ChatState {
  sessionId: string;
  messages: Message[];
  activePersonaId: string;
  isGenerating: boolean;
  availablePersonas: PersonaInfo[];
}

/** SSE event shapes emitted by POST /api/chat. */
export type SSEEvent =
  | { type: "token"; content: string }
  | { type: "sources"; urls: string[] }
  | { type: "done" }
  | { type: "error"; message: string };
