"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className={cn("h-9 w-[104px] rounded-full bg-surface-2 border border-border", className)} />;

  const options = [
    { value: "light", icon: Sun, label: t.theme.light },
    { value: "system", icon: Monitor, label: t.theme.system },
    { value: "dark", icon: Moon, label: t.theme.dark }
  ] as const;

  return (
    <div role="radiogroup" aria-label={t.theme.label} className={cn("inline-flex items-center bg-surface-2 border border-border rounded-full p-0.5", className)}>
      {options.map((opt) => {
        const Icon = opt.icon;
        return (
          <button key={opt.value} type="button" role="radio" aria-checked={theme === opt.value} aria-label={opt.label} title={opt.label} onClick={() => setTheme(opt.value)}
            className={cn("h-8 w-8 inline-flex items-center justify-center rounded-full transition-colors", theme === opt.value ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground")}>
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}
