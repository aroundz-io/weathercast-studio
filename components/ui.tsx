"use client";

import React from "react";
import { TagTone } from "@/lib/types";

export type Status = "idle" | "loading" | "done" | "error";

export function cn(...c: (string | false | null | undefined)[]): string {
  return c.filter(Boolean).join(" ");
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className)}
      viewBox="0 0 24 24"
      fill="none"
      width="16"
      height="16"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Button({
  children,
  onClick,
  disabled,
  loading,
  variant = "primary",
  size = "md",
  className,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "ghost" | "subtle";
  size?: "md" | "sm";
  className?: string;
  type?: "button" | "submit";
}) {
  const variants = {
    primary:
      "bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-glow hover:brightness-110",
    ghost: "border border-white/15 text-slate-200 hover:bg-white/5",
    subtle: "bg-white/5 text-slate-200 hover:bg-white/10 border border-white/10",
  };
  const sizes = { md: "px-4 py-2 text-sm", sm: "px-3 py-1.5 text-xs" };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function PanelHeader({
  step,
  title,
  subtitle,
  right,
}: {
  step: number;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sm font-bold text-sky-300 ring-1 ring-sky-500/30">
          {step}
        </span>
        <div>
          <h2 className="text-sm font-bold tracking-tight text-white">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/10", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-400 transition-[width] duration-200 ease-out"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

const TAG_TONES: Record<TagTone, string> = {
  good: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  info: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
  warn: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  danger: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
};

export function TagPill({
  tone,
  icon,
  children,
}: {
  tone: TagTone;
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
        TAG_TONES[tone]
      )}
    >
      {icon && <span aria-hidden>{icon}</span>}
      {children}
    </span>
  );
}

export function StatusBadge({ status, idleLabel }: { status: Status; idleLabel?: string }) {
  const map: Record<Status, { label: string; cls: string; dot: string }> = {
    idle: { label: idleLabel ?? "대기", cls: "text-slate-400", dot: "bg-slate-500" },
    loading: { label: "생성 중", cls: "text-sky-300", dot: "bg-sky-400 animate-pulse-soft" },
    done: { label: "완료", cls: "text-emerald-300", dot: "bg-emerald-400" },
    error: { label: "오류", cls: "text-rose-300", dot: "bg-rose-400" },
  };
  const s = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", s.cls)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-400">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-white/10 bg-ink-900/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20";
