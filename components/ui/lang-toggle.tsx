"use client";

import { useI18n, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** ES | EN segmented switch. The choice is stored per browser. */
export function LangToggle({ className }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  return (
    <div
      role="radiogroup"
      aria-label={t.language.label}
      className={cn("inline-flex items-center bg-surface-2 border border-border rounded-full p-0.5", className)}
    >
      {(["es", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={lang === l}
          aria-label={l === "es" ? "Español" : "English"}
          lang={l}
          onClick={() => setLang(l)}
          className={cn(
            "h-8 px-2.5 rounded-full text-xs font-semibold tracking-wide transition-colors",
            lang === l ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
          )}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
