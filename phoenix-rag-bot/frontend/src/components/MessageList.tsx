import { useEffect, useRef } from "react";
import type { Message } from "../types";
import UserMessage from "./UserMessage";
import BotMessage from "./BotMessage";

interface Props {
  messages: Message[];
  showEvidence?: boolean;
}

/** Renders the conversation; auto-scrolls to the newest message. */
export default function MessageList({ messages, showEvidence = false }: Props) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center py-10 text-center">
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-phoenix-glow via-phoenix to-phoenix-dark text-3xl shadow-glow">
          🔥
        </div>
        <h2 className="text-lg font-bold text-phoenix-navy">
          שלום! אני העוזר הדיגיטלי של הפניקס
        </h2>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          אפשר לשאול אותי על ביטוח רכב, דירה, בריאות, נסיעות, חיסכון ופנסיה —
          אענה על בסיס המידע שבאתר הפניקס.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((m) =>
        m.role === "user" ? (
          <UserMessage key={m.id} message={m} />
        ) : (
          <BotMessage key={m.id} message={m} showEvidence={showEvidence} />
        )
      )}
      <div ref={endRef} />
    </div>
  );
}
