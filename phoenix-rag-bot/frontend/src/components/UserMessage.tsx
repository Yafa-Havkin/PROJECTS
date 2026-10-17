import type { Message } from "../types";

/** A user's chat bubble (right-aligned, Phoenix orange). */
export default function UserMessage({ message }: { message: Message }) {
  return (
    <div className="flex animate-fade-in items-start justify-end gap-2">
      <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-phoenix to-phoenix-dark px-4 py-2.5 text-white shadow-sm">
        <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
          {message.content}
        </p>
      </div>
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm">
        🙂
      </div>
    </div>
  );
}
