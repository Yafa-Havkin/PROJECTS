import { useState, type FormEvent, type KeyboardEvent } from "react";

interface Props {
  onSubmit: (text: string) => void;
  disabled?: boolean;
}

/** The question composer: a textarea + send button. Enter sends, Shift+Enter = newline. */
export default function MessageInput({ onSubmit, disabled }: Props) {
  const [text, setText] = useState("");

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setText("");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
        placeholder="כתבו שאלה על מוצרי ושירותי הפניקס…"
        className="max-h-32 flex-1 resize-none rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-[15px] text-phoenix-navy outline-none transition focus:border-phoenix focus:ring-2 focus:ring-phoenix/30 disabled:bg-slate-50"
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="shrink-0 rounded-2xl bg-gradient-to-br from-phoenix to-phoenix-dark px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
      >
        שליחה
      </button>
    </form>
  );
}
