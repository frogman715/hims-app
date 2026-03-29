"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";
import { Button } from "@/components/ui/Button";

export default function SalaryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="section-stack">
        <section className="surface-card flex min-h-[320px] items-center justify-center p-8">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-cyan-700" />
            <p className="mt-4 text-sm text-slate-600">Loading payroll workspace...</p>
          </div>
        </section>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const summaryCards = [
    {
      title: "Crew Wages",
      description: "Process contract wages, payroll records, and salary preparation for seafarers.",
      href: "/accounting/wages",
      tag: "Payroll",
    },
    {
      title: "Allotments",
      description: "Maintain family allotment instructions and approved transfer values.",
      href: "/accounting/allotments",
      tag: "Transfer",
    },
  ];

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Payroll Desk"
        title="Crew Salaries And Payroll"
        subtitle="Coordinate crew salary administration, wage references, and approved allotment processing from one payroll workspace."
        helperLinks={[
          { href: "/accounting", label: "Accounting Workspace" },
          { href: "/accounting/wages", label: "Wages" },
          { href: "/accounting/allotments", label: "Allotments" },
        ]}
        highlights={[
          {
            label: "Linked Modules",
            value: summaryCards.length,
            detail: "Core payroll desks available from this workspace.",
          },
          {
            label: "Primary Focus",
            value: "Crew Payroll",
            detail: "Monthly pay preparation, wage control, and finance follow-up.",
          },
          {
            label: "Transfer Control",
            value: "Allotments",
            detail: "Beneficiary transfer instructions should stay aligned with approved payroll values.",
          },
        ]}
        actions={(
          <Link href="/accounting">
            <Button size="sm">Back to Accounting</Button>
          </Link>
        )}
      />

      <section className="surface-card space-y-6 p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)]">
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/80 p-5">
            <h2 className="text-base font-semibold text-slate-900">Payroll control note</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Use this hub to access crew payroll functions, maintain wage records, and keep allotment instructions aligned with approved salary administration procedures.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Desk Scope</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              <li>Review wage processing references.</li>
              <li>Control family allotment values.</li>
              <li>Support monthly salary preparation.</li>
            </ul>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {summaryCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{card.tag}</p>
              <h3 className="mt-3 text-xl font-semibold text-slate-900">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
              <div className="mt-5 text-sm font-semibold text-cyan-700">Open module</div>
            </Link>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Wage Processing</h3>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              <li>Monthly wage calculations for active crew records.</li>
              <li>Allowance, overtime, and payroll support references.</li>
              <li>Operational review before salary release.</li>
              <li>Coordination with approved finance workflows.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Allotment Management</h3>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              <li>Maintain beneficiary transfer instructions.</li>
              <li>Reference active sea contracts when setting values.</li>
              <li>Keep transfer amounts traceable and current.</li>
              <li>Support payroll reconciliation and follow-up.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
