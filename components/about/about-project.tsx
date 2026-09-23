"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Info, X, Github, RotateCcw, AlertTriangle, CheckCircle2, Compass, Layers, UserRound } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const REPO_URL = "https://github.com/alexanderkholodov1/panchobus";

const AboutContext = createContext<{ open: () => void } | null>(null);

/** Hosts the "About this project" dialog once, so any button on any page can open it. */
export function AboutProjectProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  return (
    <AboutContext.Provider value={{ open }}>
      {children}
      {isOpen && <AboutDialog onClose={() => setIsOpen(false)} />}
    </AboutContext.Provider>
  );
}

export function useAboutProject() {
  const ctx = useContext(AboutContext);
  if (!ctx) throw new Error("useAboutProject must be used inside AboutProjectProvider");
  return ctx;
}

/** Round "i" button used in headers and the app shell. */
export function AboutButton({ className, withLabel = false }: { className?: string; withLabel?: boolean }) {
  const { open } = useAboutProject();
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={open}
      aria-label={t.about.button}
      title={t.about.button}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-surface-2 text-muted hover:text-foreground transition-colors",
        withLabel ? "h-9 px-3 text-xs font-medium" : "h-9 w-9",
        className
      )}
    >
      <Info className="w-4 h-4" />
      {withLabel && <span>{t.about.button}</span>}
    </button>
  );
}

/** Thin notice shown above public pages: this is a portfolio artefact with synthetic data. */
export function DemoRibbon() {
  const { open } = useAboutProject();
  const { t } = useI18n();
  return (
    <div className="bg-[#1A1718] text-white/85 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
        <span>{t.ribbon.text}</span>
        <button type="button" onClick={open} className="inline-flex items-center gap-1 font-semibold text-white underline underline-offset-2 hover:no-underline">
          <Info className="w-3.5 h-3.5" />
          {t.ribbon.cta}
        </button>
      </div>
    </div>
  );
}

function AboutDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const resetDemo = () => {
    db.resetDemo();
    try {
      localStorage.removeItem("panchobus-session-userid");
    } catch { /* ignore */ }
    window.location.assign("/");
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/55 p-0 sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-surface w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-card-lg animate-in"
      >
        <div className="sticky top-0 bg-gradient-to-br from-usfq-red to-[#8C0F18] text-white px-6 py-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-white/75">{t.about.kicker}</p>
            <h2 id="about-title" className="font-display text-2xl sm:text-3xl mt-1">{t.about.title}</h2>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label={t.common.close} className="p-2 rounded-lg hover:bg-white/15 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6 text-sm leading-relaxed">
          <p className="text-base">{t.about.intro}</p>

          <section className="space-y-2">
            <h3 className="font-display text-lg flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-primary" />{t.about.problemTitle}</h3>
            <ul className="space-y-1.5">
              {t.about.problems.map((p) => (
                <li key={p} className="flex gap-2 text-muted"><span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />{p}</li>
              ))}
            </ul>
            <p className="text-xs text-muted pt-1">{t.about.researchNote}</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-display text-lg flex items-center gap-2"><Compass className="w-4 h-4 text-primary" />{t.about.tryTitle}</h3>
            <ol className="space-y-1.5 list-decimal pl-5 text-muted marker:text-primary marker:font-semibold">
              {t.about.tryItems.map((p) => <li key={p}>{p}</li>)}
            </ol>
          </section>

          <section className="space-y-2">
            <h3 className="font-display text-lg flex items-center gap-2"><Layers className="w-4 h-4 text-primary" />{t.about.scopeTitle}</h3>
            <p className="text-muted">{t.about.scope}</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-display text-lg flex items-center gap-2"><UserRound className="w-4 h-4 text-primary" />{t.about.creditTitle}</h3>
            <p className="text-muted">{t.about.credit}</p>
            <p className="text-xs text-muted">{t.about.disclaimer}</p>
          </section>

          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border">
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="sm:flex-1">
              <Button variant="outline" className="w-full"><Github className="w-4 h-4" />{t.about.repo}</Button>
            </a>
            {db.isDemo() && (
              confirmReset ? (
                <Button variant="danger" className="sm:flex-1" onClick={resetDemo}>
                  <CheckCircle2 className="w-4 h-4" />{t.common.confirm}
                </Button>
              ) : (
                <Button variant="secondary" className="sm:flex-1" onClick={() => setConfirmReset(true)}>
                  <RotateCcw className="w-4 h-4" />{t.about.reset}
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
