import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  default: "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] shadow-sm",
  primary: "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] shadow-sm",
  secondary: "bg-surface-2 text-foreground hover:bg-border/40 border border-border",
  ghost: "hover:bg-surface-2 text-foreground",
  outline: "border border-border text-foreground hover:bg-surface-2",
  danger: "bg-state-error text-white hover:opacity-90 active:scale-[0.98] shadow-sm"
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-lg",
  md: "h-10 px-4 text-sm rounded-lg",
  lg: "h-12 px-6 text-base rounded-xl"
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap",
        variants[variant], sizes[size], className
      )}
      {...props}
    >
      {loading && <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden />}
      {children}
    </button>
  )
);
Button.displayName = "Button";
