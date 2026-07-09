"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "inverse"
  | "translucent";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-rice-500 text-white hover:bg-rice-600 active:bg-rice-700 shadow-sm shadow-rice-500/30",
  secondary:
    "bg-rice-100 text-rice-800 hover:bg-rice-200 active:bg-rice-300",
  danger: "bg-red-500 text-white hover:bg-red-600 active:bg-red-700",
  ghost: "bg-transparent text-rice-700 hover:bg-rice-100",
  // 2 variant dùng trên nền gradient cam (không override màu qua className
  // vì thứ tự class không quyết định được utility nào thắng):
  inverse: "bg-white text-rice-700 hover:bg-rice-100 active:bg-rice-200",
  translucent: "bg-white/20 text-white hover:bg-white/30 active:bg-white/40",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {loading && (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}
