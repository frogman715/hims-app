import type { ReactNode } from "react";

type WorkspaceStateProps = {
  eyebrow?: string;
  title: string;
  description: string;
  tone?: "default" | "danger";
  action?: ReactNode;
};

export function WorkspaceLoadingState({ label }: { label: string }) {
  return (
    <div className="section-stack">
      <section className="surface-card flex min-h-[260px] items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-cyan-700" />
          <p className="mt-4 text-sm font-semibold text-slate-600">{label}</p>
        </div>
      </section>
    </div>
  );
}

export function WorkspaceState({
  eyebrow = "Workspace",
  title,
  description,
  tone = "default",
  action,
}: WorkspaceStateProps) {
  const toneClassName =
    tone === "danger"
      ? "border-rose-200 bg-rose-50"
      : "border-slate-200 bg-white";
  const eyebrowClassName =
    tone === "danger" ? "text-rose-700" : "text-cyan-700";

  return (
    <div className="section-stack">
      <section className={`surface-card mx-auto max-w-4xl border p-8 text-center shadow-sm ${toneClassName}`}>
        <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${eyebrowClassName}`}>{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
        {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
      </section>
    </div>
  );
}
