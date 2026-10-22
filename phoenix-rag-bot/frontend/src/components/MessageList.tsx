import { useEffect, useRef } from "react";
import type { Message } from "../types";
import UserMessage from "./UserMessage";
import BotMessage from "./BotMessage";
import type { ChatRepresentative } from "../utils/chatRepresentatives";

interface Props {
  messages: Message[];
  representative: ChatRepresentative;
  showEvidence?: boolean;
  personaId?: string;
  disabled?: boolean;
  onQuestion?: (question: string) => void;
}

/** Renders the conversation; auto-scrolls to the newest message. */
export default function MessageList({
  messages,
  representative,
  showEvidence = false,
  personaId = "customer",
  disabled = false,
  onQuestion,
}: Props) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center py-10 text-center">
        <img
          src={representative.image}
          alt="נציג הפניקס"
          className="mb-3 h-16 w-16 rounded-full object-cover shadow-glow ring-2 ring-white"
        />
        <h2 className="text-lg font-bold text-phoenix-navy">
          שלום! אני העוזר הדיגיטלי של הפניקס
        </h2>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          אפשר לשאול אותי על ביטוח רכב, דירה, בריאות, נסיעות, חיסכון ופנסיה —
          אענה על בסיס המידע שבאתר הפניקס.
        </p>
        <div className="mt-5 flex max-w-md flex-wrap justify-center gap-2">
          {(personaId === "agent"
            ? [
                "מהם הכיסויים המרכזיים בביטוח בריאות?",
                "מה ההבדל בין קרן פנסיה לביטוח מנהלים?",
                "מה מכסה ביטוח מבנה לדירה?",
              ]
            : [
                "מה כולל ביטוח בריאות?",
                "מה מכסה ביטוח מבנה לדירה?",
                "מה ההבדל בין ביטוח חובה למקיף?",
              ]
          ).map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => onQuestion?.(question)}
              disabled={disabled}
              className="rounded-full border border-phoenix/20 bg-white px-3 py-2 text-sm text-phoenix-navy shadow-sm transition hover:border-phoenix hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {question}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((m) =>
        m.role === "user" ? (
          <UserMessage key={m.id} message={m} />
        ) : (
          <BotMessage
            key={m.id}
            message={m}
            representative={representative}
            showEvidence={showEvidence}
            onQuestion={onQuestion}
            disabled={disabled}
          />
        )
      )}
      <div ref={endRef} />
    </div>
  );
}
