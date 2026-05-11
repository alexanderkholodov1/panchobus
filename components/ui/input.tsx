import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn("w-full h-11 px-3.5 rounded-lg bg-surface border border-border text-foreground placeholder:text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50", className)} {...props} />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn("w-full px-3.5 py-2.5 rounded-lg bg-surface border border-border text-foreground placeholder:text-muted transition-colors min-h-[88px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50", className)} {...props} />
  )
);
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn("w-full h-11 px-3 rounded-lg bg-surface border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary", className)} {...props}>{children}</select>
  )
);
Select.displayName = "Select";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("block text-sm font-medium mb-1.5 text-foreground", className)} {...props} />;
}
