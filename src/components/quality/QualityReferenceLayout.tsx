import Link from "next/link";
import type { ReactNode } from "react";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";

type Props = {
  eyebrow: string;
  title: string;
  subtitle: string;
  docInfo: string;
  badges?: string[];
  children: ReactNode;
};

export function QualityReferenceLayout({
  eyebrow,
  title,
  subtitle,
  docInfo,
  badges = [],
  children,
}: Props) {
  return (
    <div className="section-stack mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <WorkspaceHero
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        helperLinks={[
          { href: "/quality", label: "Quality workspace" },
          { href: "/quality/forms/reference", label: "Forms library" },
          { href: "/dashboard", label: "Dashboard" },
        ]}
        highlights={[
          { label: "Document Info", value: docInfo, detail: "Current reference shown in this workspace." },
          { label: "Use", value: "Reference only", detail: "Operational approvals and actions stay in their live desks." },
          { label: "Scope", value: badges.join(" / ") || "Controlled document", detail: "Read as a management reference, not a transaction page." },
        ]}
        actions={(
          <Link
            href="/quality"
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700"
          >
            Back to quality workspace
          </Link>
        )}
      />

      <section className="surface-card p-8">
        <div className="prose prose-slate max-w-none">{children}</div>
      </section>
    </div>
  );
}
