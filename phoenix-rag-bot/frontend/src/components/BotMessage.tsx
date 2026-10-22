import type { Message } from "../types";
import { sanitizeAnswerContent } from "../utils/sanitizeAnswerContent";
import { getFollowUpQuestions } from "../utils/followUpQuestions";
import type { ChatRepresentative } from "../utils/chatRepresentatives";

interface Props {
  message: Message;
  representative: ChatRepresentative;
  showEvidence?: boolean;
  onQuestion?: (question: string) => void;
  disabled?: boolean;
}

/** The bot's chat bubble (left-aligned) with optional sources list. */
export default function BotMessage({
  message,
  representative,
  showEvidence = false,
  onQuestion,
  disabled = false,
}: Props) {
  const isError = message.isError;
  const hasSources = (message.sources?.length ?? 0) > 0;
  const followUpQuestions = message.sources
    ? getFollowUpQuestions(message.sources)
    : [];
  const trustedSource = message.sources?.find((source) => {
    try {
      const url = new URL(source);
      return (
        url.protocol === "https:" &&
        (url.hostname === "fnx.co.il" || url.hostname.endsWith(".fnx.co.il"))
      );
    } catch {
      return false;
    }
  });
  return (
    <div className="flex animate-fade-in items-start gap-2">
      <img
        src={representative.image}
        alt="נציג הפניקס"
        className="mt-0.5 h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
      />
      <div
        className={[
          "max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm",
          isError
            ? "bg-red-50 text-red-700 ring-1 ring-red-200"
            : "bg-white text-phoenix-navy ring-1 ring-slate-200",
        ].join(" ")}
      >
        <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
          {sanitizeAnswerContent(message.content)}
          {message.isStreaming && (
            <span className="ms-0.5 inline-block h-4 w-1.5 animate-pulse bg-phoenix align-middle" />
          )}
        </p>

        {showEvidence && !isError && !message.isStreaming && message.sources !== undefined && (
          <p
            className={[
              "mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
              hasSources
                ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                : "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
            ].join(" ")}
            aria-label={
              hasSources
                ? `צורפו ${message.sources?.length} מקורות לתשובה`
                : "לא צורפו מקורות לתשובה"
            }
          >
            <span aria-hidden="true">{hasSources ? "✓" : "!"}</span>
            {hasSources
              ? `מבוסס על ${message.sources?.length} ${message.sources?.length === 1 ? "מקור" : "מקורות"}`
              : "לא נמצאו מקורות"}
          </p>
        )}

        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 border-t border-slate-100 pt-2">
            <p className="mb-1 text-xs font-semibold text-slate-500">מקורות:</p>
            <ul className="space-y-1">
              {message.sources.map((url) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-xs text-phoenix hover:underline"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {trustedSource && !isError && !message.isStreaming && (
          <a
            href={trustedSource}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-phoenix/15 bg-orange-50/70 px-3 py-2.5 text-sm text-phoenix-navy transition hover:border-phoenix/40 hover:bg-orange-50"
          >
            <span>
              <span className="block font-semibold">מידע נוסף באתר הפניקס</span>
              <span className="text-xs text-slate-500">פתיחת עמוד המקור</span>
            </span>
            <span aria-hidden="true" className="text-phoenix">←</span>
          </a>
        )}

        {followUpQuestions.length > 0 && !isError && !message.isStreaming && (
          <div className="mt-3">
            <p className="mb-2 text-xs font-semibold text-slate-500">
              אפשר להמשיך ולשאול
            </p>
            <div className="flex flex-wrap gap-2">
              {followUpQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => onQuestion?.(question)}
                  disabled={disabled}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-phoenix-navy transition hover:border-phoenix/50 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
