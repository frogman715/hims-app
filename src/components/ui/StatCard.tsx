import type { ReactNode } from "react";

type StatCardTone = "slate" | "cyan" | "emerald" | "amber" | "rose";

type Props = {
  label: string;
  value: ReactNode;
  description?: string;
  tone?: StatCardTone;
  icon?: ReactNode;
  className?: string;
};

const toneClasses: Record<StatCardTone, string> = {
  slate: "border-slate-200 bg-slate-50 text-slate-900",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-900",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
  amber: "border-amber-200 bg-amber-50 text-amber-900",
  rose: "border-rose-200 bg-rose-50 text-rose-900",
};

const labelClasses: Record<StatCardTone, string> = {
  slate: "text-slate-500",
  cyan: "text-cyan-700",
  emerald: "text-emerald-700",
  amber: "text-amber-700",
  rose: "text-rose-700",
};

const descriptionClasses: Record<StatCardTone, string> = {
  slate: "text-slate-600",
  cyan: "text-cyan-800",
  emerald: "text-emerald-800",
  amber: "text-amber-800",
  rose: "text-rose-800",
};

export default function StatCard({
  label,
  value,
  description,
  tone = "slate",
  icon,
  className = "",
}: Props) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${toneClasses[tone]} ${className}`.trim()}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-sm ${labelClasses[tone]}`}>{label}</p>
          <p className="mt-2 text-3xl font-semibold">{value}</p>
          {description ? <p className={`mt-1 text-sm ${descriptionClasses[tone]}`}>{description}</p> : null}
        </div>
        {icon ? <div className="text-lg opacity-80">{icon}</div> : null}
      </div>
    </div>
  );
}
