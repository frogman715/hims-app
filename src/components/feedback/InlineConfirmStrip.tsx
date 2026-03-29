"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { AppNoticeTone } from "@/lib/app-notice";

interface InlineConfirmStripProps {
  tone?: Extract<AppNoticeTone, "warning" | "error" | "info">;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
  className?: string;
}

const toneClasses: Record<NonNullable<InlineConfirmStripProps["tone"]>, string> = {
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-rose-200 bg-rose-50 text-rose-900",
  info: "border-sky-200 bg-sky-50 text-sky-900",
};

export function InlineConfirmStrip({
  tone = "warning",
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isProcessing = false,
  className,
}: InlineConfirmStripProps) {
  return (
    <div className={cn("rounded-2xl border px-4 py-4 shadow-sm", toneClasses[tone], className)}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-sm opacity-90">{message}</p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={isProcessing}>
            {cancelLabel}
          </Button>
          <Button type="button" size="sm" onClick={onConfirm} disabled={isProcessing}>
            {isProcessing ? "Processing..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
