import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";

/**
 * Small set of UI primitives, in the spirit of shadcn/ui.
 *
 * The point of that approach is that the components live in your repo and you
 * own them, rather than being imported from a package you then fight. These are
 * deliberately tiny: a handful of variants, one monochrome palette (white,
 * black, and red reserved for errors), and consistent focus rings so keyboard
 * users can always see where they are.
 *
 * Every interactive element here has a visible focus state and a disabled state.
 * That is the whole accessibility story, and it is worth the few extra lines.
 */

/* ------------------------------------------------------------------ Button */

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-slate-900 text-white hover:bg-slate-700",
  secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400",
  ghost: "text-slate-600 hover:bg-slate-100",
  // The only colour in the app, and only for something going wrong.
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-2.5 text-base",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300",
        "disabled:cursor-not-allowed disabled:opacity-40",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------- Card */

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7", className)}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------- Badge */

export function Badge({
  children,
  tone = "muted",
  className,
}: {
  children: ReactNode;
  tone?: "muted" | "solid" | "error";
  className?: string;
}) {
  const tones = {
    muted: "bg-slate-100 text-slate-700 ring-slate-200",
    solid: "bg-slate-900 text-white ring-slate-900",
    error: "bg-red-50 text-red-800 ring-red-100",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------ Input / Label */

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
      {children}
    </label>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...rest}
      className={cn(
        "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-800 transition",
        "placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200",
        "disabled:bg-slate-50 disabled:text-slate-400",
        className,
      )}
    />
  );
}

/* ---------------------------------------------------------------- Progress */

export function Progress({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("h-2 overflow-hidden rounded-full bg-slate-200", className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full bg-slate-900 transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ------------------------------------------------------- Spinner / Skeleton */

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4 animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-full bg-slate-200", className)} />;
}
