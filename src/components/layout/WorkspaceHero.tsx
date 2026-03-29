import Link from "next/link";
import type { ReactNode } from "react";

type Highlight = {
  label: string;
  value: ReactNode;
  detail?: string;
};

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  highlights?: Highlight[];
  helperLinks?: Array<{
    href: string;
    label: string;
  }>;
};

export function WorkspaceHero({
  eyebrow = "Workspace",
  title,
  subtitle,
  actions,
  highlights = [],
  helperLinks = [],
}: Props) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_34%),linear-gradient(135deg,#ffffff_0%,#f8fbff_52%,#edf6ff_100%)] p-6 shadow-sm">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
          {subtitle ? <div className="mt-3 text-sm leading-6 text-slate-600">{subtitle}</div> : null}
          {helperLinks.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {helperLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      {highlights.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {highlights.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
              <div className="mt-2 text-2xl font-semibold text-slate-950">{item.value}</div>
              {item.detail ? <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
