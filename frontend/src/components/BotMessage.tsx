import type { Message } from "../types";

/** The bot's chat bubble (left-aligned) with optional sources list. */
export default function BotMessage({ message }: { message: Message }) {
  const isError = message.isError;
  return (
    <div className="flex animate-fade-in items-start gap-2">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-phoenix-glow via-phoenix to-phoenix-dark text-sm">
        🔥
      </div>
      <div
        className={[
          "max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm",
          isError
            ? "bg-red-50 text-red-700 ring-1 ring-red-200"
            : "bg-white text-phoenix-navy ring-1 ring-slate-200",
        ].join(" ")}
      >
        <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
          {message.content}
          {message.isStreaming && (
            <span className="ms-0.5 inline-block h-4 w-1.5 animate-pulse bg-phoenix align-middle" />
          )}
        </p>

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
      </div>
    </div>
  );
}
