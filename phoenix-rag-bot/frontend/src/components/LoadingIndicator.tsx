/** Three bouncing dots shown while the bot is generating an answer. */
export default function LoadingIndicator({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="mt-4 flex items-center gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-phoenix-glow via-phoenix to-phoenix-dark text-sm">
        🔥
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-white px-4 py-3 ring-1 ring-slate-200">
        <span className="h-2 w-2 animate-bounce-dot rounded-full bg-phoenix [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-bounce-dot rounded-full bg-phoenix [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-bounce-dot rounded-full bg-phoenix [animation-delay:300ms]" />
      </div>
    </div>
  );
}
