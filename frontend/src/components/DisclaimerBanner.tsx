import { useState } from "react";

/** First-load disclaimer: info is from the public Phoenix site, not personal advice. */
export default function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="mt-4 flex items-start gap-2 rounded-xl bg-phoenix-gold/10 px-4 py-2.5 text-xs text-phoenix-navy ring-1 ring-phoenix-gold/30">
      <span className="text-sm">ℹ️</span>
      <p className="flex-1 leading-relaxed">
        המידע מבוסס על התוכן הציבורי באתר הפניקס בלבד ואינו מהווה ייעוץ אישי.
        לכל עניין אישי יש לפנות לשירות הלקוחות של הפניקס.
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded-full px-2 text-slate-400 transition hover:text-slate-600"
        aria-label="סגירה"
      >
        ✕
      </button>
    </div>
  );
}
