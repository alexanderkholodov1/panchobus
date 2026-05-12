import { cn } from "@/lib/utils";
import type { CSSProperties, ReactNode } from "react";

type Variant = "default" | "success" | "warning" | "error" | "info" | "neutral" | "primary";

const variants: Record<Variant, string> = {
  default: "bg-surface-2 text-foreground border border-border",
  success: "bg-state-ok/15 text-state-ok border border-state-ok/30",
  warning: "bg-state-warn/15 text-state-warn border border-state-warn/30",
  error: "bg-state-error/15 text-state-error border border-state-error/30",
  info: "bg-usfq-red-tint text-usfq-red border border-usfq-red/20",
  neutral: "bg-muted/15 text-muted border border-muted/30",
  primary: "bg-primary text-primary-foreground"
};

export function Badge({
  variant = "default",
  className,
  style,
  children
}: {
  variant?: Variant;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-x