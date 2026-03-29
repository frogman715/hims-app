"use client";

import { cn } from "@/lib/utils";
import type { AppNoticeTone } from "@/lib/app-notice";

interface InlineNoticeProps {
  tone: AppNoticeTone;
  message: string;
  title?: string;
  onDismiss?: () => void;
  className?: string;
}

const toneClasses: Record<AppNoticeTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-rose-200 bg-rose-50 text-rose-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-sky-200 bg-sky-50 text-sky-900",
};

export function InlineNotice({ tone, message, title, onDismiss, className }: InlineNoticeProps) {
  return (
    <div className={cn("rounded-2xl border px-4 py-3 shadow-sm", toneClasses[tone], className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {title ? <p className="text-sm font-semibold">{title}</p> : null}
          <p className={cn("text-sm", title ? "mt-1" : "")}>{message}</p>
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full border border-current px-3 py-1 text-xs font-semibold"
          >
            Dismiss
          </button>
        ) : null}
      </div>
    </div>
  );
}
