"use client";

import { createContext, useCallback, useContext, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Check, AlertTriangle, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info" | "warning";
interface Toast { id: string; title: string; description?: string; variant: ToastVariant; }

let externalToast: ((t: Omit<Toast, "id">) => void) | null = null;
export function toast(t: Omit<Toast, "id">) { externalToast?.(t); }

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);

  const addToast = useCallback((t: Omit<Toast, "id">) => {
    const id = String(Date.now() + Math.random());
    setItems((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== id)), 4500);
  }, []);

  useEffect(() => { externalToast = addToast; return () => { externalToast = null; }; }, [addToast]);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {items.map((t) => (
        <div key={t.id} className={cn("pointer-events-auto animate-in flex items-start gap-3 rounded-xl border border-border bg-surface shadow-card-lg p-4",
          t.variant === "success" && "border-l-4 border-l-state-ok",
          t.variant === "error" && "border-l-4 border-l-state-error",
          t.variant === "warning" && "border-l-4 border-l-state-warn",
          t.variant === "info" && "border-l-4 border-l-usfq-red")}>
          <div className="shrink-0 mt-0.5">
            {t.variant === "success" && <Check className="w-5 h-5 text-state-ok" />}
            {t.variant === "error" && <AlertTriangle className="w-5 h-5 text-state-error" />}
            {t.variant === "warning" && <AlertTriangle className="w-5 h-5 text-state-warn" />}
            {t.variant === "info" && <Info className="w-5 h-5 text-usfq-red" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{t.title}</p>
            {t.description && <p className="text-xs text-muted mt-0.5">{t.description}</p>}
          </div>
          <button onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))} className="shrink-0 text-muted hover:text-foreground" aria-label="Cerrar">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function useToast() { return { toast }; }
