"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import es, { type Dict } from "./es";
import en from "./en";
import { parseISODate } from "@/lib/utils";

export type Lang = "es" | "en";
const DICTS: Record<Lang, Dict> = { es, en };
const STORAGE_KEY = "panchobus-lang";

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
  /** Formats a YYYY-MM-DD date (or Date) in the current language. */
  fmtDate: (d: string | Date, opts?: Intl.DateTimeFormatOptions) => string;
  /** Formats a timestamp's clock time in the current language. */
  fmtTime: (iso: string | Date) => string;
  /** Formats a timestamp as short date + time. */
  fmtDateTime: (iso: string | Date) => string;
  /** "5 min ago" style relative time. */
  fmtRelative: (iso: string | Date) => string;
  /** Returns obj[`${field}_en`] in English when present, else obj[field]. */
  localized: <T extends object>(obj: T, field: keyof T & string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function detectInitial(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "es" || stored === "en") return stored;
    return navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
  } catch {
    return "es";
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Static pages are prerendered in Spanish; the stored or browser language is applied after mount.
  const [lang, setLangState] = useState<Lang>("es");

  useEffect(() => {
    setLangState(detectInitial());
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* ignore */ }
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const t = DICTS[lang];
    const toDate = (d: string | Date) =>
      typeof d === "string" ? (/^\d{4}-\d{2}-\d{2}$/.test(d) ? parseISODate(d) : new Date(d)) : d;
    return {
      lang,
      setLang,
      t,
      fmtDate: (d, opts = { weekday: "long", day: "numeric", month: "long" }) =>
        toDate(d).toLocaleDateString(t.locale, opts),
      fmtTime: (d) => toDate(d).toLocaleTimeString(t.locale, { hour: "2-digit", minute: "2-digit" }),
      fmtDateTime: (d) =>
        toDate(d).toLocaleString(t.locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
      fmtRelative: (d) => {
        const mins = Math.floor((Date.now() - toDate(d).getTime()) / 60000);
        if (mins < 1) return t.relative.now;
        if (mins < 60) return t.relative.minutes(mins);
        const hours = Math.floor(mins / 60);
        if (hours < 24) return t.relative.hours(hours);
        return t.relative.days(Math.floor(hours / 24));
      },
      localized: (obj, field) => {
        const record = obj as Record<string, unknown>;
        const translated = lang === "en" ? record[`${field}_en`] : undefined;
        return String((typeof translated === "string" && translated) || record[field] || "");
      },
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
