import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "success"
    | "warning"
    | "destructive"
    | "info";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-zinc-900 text-zinc-100 hover:bg-zinc-800",
    secondary: "bg-zinc-100 text-zinc-800 hover:bg-zinc-200",
    outline: "border border-zinc-200 text-zinc-800",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    destructive: "bg-rose-50 text-rose-700 border border-rose-200",
    info: "bg-blue-50 text-blue-700 border border-blue-200",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
