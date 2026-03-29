"use client";

import { cn } from "@/lib/utils";
import { getStatusPresentation } from "@/lib/ui-vocabulary";

interface StatusBadgeProps {
  status: string | null | undefined;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const presentation = getStatusPresentation(status);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
        presentation.className,
        className
      )}
    >
      {label ?? presentation.label}
    </span>
  );
}
