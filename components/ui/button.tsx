import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "default", size = "default", ...props },
    ref
  ) => {
    const variantStyles = {
      default: "bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm",
      outline: "border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-900",
      secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
      ghost: "hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900",
      destructive: "bg-rose-600 text-white hover:bg-rose-700",
    };

    const sizeStyles = {
      default: "h-9 px-4 py-2 text-sm",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-10 rounded-md px-8 text-base",
      icon: "h-9 w-9",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
