import { useEffect, useState } from "react";

const LOADING_MESSAGES = [
  "מחפש במידע הרלוונטי באתר הפניקס...",
  "בודק אילו מקורות מתאימים לשאלה...",
  "מכין תשובה מבוססת מידע...",
];

/** Three bouncing dots shown while the bot is generating an answer. */
export default function LoadingIndicator({ visible }: { visible: boolean }) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!visible) {
      setMessageIndex(0);
      return;
    }

    const intervalId = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length);
    }, 3500);

    return () => window.clearInterval(intervalId);
  }, [visible]);

  if (!visible) return null;

  return (
    <div role="status" aria-live="polite" className="mt-4 flex items-center gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-phoenix-glow via-phoenix to-phoenix-dark text-sm">
        🔥
      </div>
      <div className="flex items-center gap-3 rounded-2xl rounded-tl-sm bg-white px-4 py-3 ring-1 ring-slate-200">
        <span className="flex shrink-0 items-center gap-1" aria-hidden="true">
          <span className="h-2 w-2 animate-bounce-dot rounded-full bg-phoenix [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-bounce-dot rounded-full bg-phoenix [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-bounce-dot rounded-full bg-phoenix [animation-delay:300ms]" />
        </span>
        <span className="text-sm text-slate-600">{LOADING_MESSAGES[messageIndex]}</span>
      </div>
    </div>
  );
}
