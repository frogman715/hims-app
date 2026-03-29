'use client';

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";

type HrModuleCard = {
  title: string;
  description: string;
  href: string;
  icon: string;
  accent: string;
  note: string;
};

const HR_MODULES: HrModuleCard[] = [
  {
    title: "Employee Records",
    description: "Maintain staff profiles, office roles, and employment information.",
    href: "/hr/employees",
    icon: "👥",
    accent: "bg-sky-100 text-sky-700",
    note: "Master personnel file",
  },
  {
    title: "Attendance Control",
    description: "Review attendance entries, late logs, and time administration.",
    href: "/hr/attendance",
    icon: "🕒",
    accent: "bg-emerald-100 text-emerald-700",
    note: "Daily office discipline",
  },
  {
    title: "Leave Administration",
    description: "Track leave requests, balances, and approval follow-up.",
    href: "/hr/leaves",
    icon: "🏖️",
    accent: "bg-amber-100 text-amber-700",
    note: "Absence planning",
  },
  {
    title: "Disciplinary Records",
    description: "Manage warnings, sanctions, and personnel case history.",
    href: "/hr/disciplinary",
    icon: "⚖️",
    accent: "bg-rose-100 text-rose-700",
    note: "Controlled case records",
  },
  {
    title: "Recruitment Desk",
    description: "Handle interview workflow, candidate review, and hiring actions.",
    href: "/hr/recruitment",
    icon: "🎯",
    accent: "bg-violet-100 text-violet-700",
    note: "Talent intake workflow",
  },
  {
    title: "Orientation Program",
    description: "Schedule and monitor orientation for new office personnel.",
    href: "/hr/orientation",
    icon: "🎓",
    accent: "bg-cyan-100 text-cyan-700",
    note: "New employee induction",
  },
];

const HR_PRIORITIES = [
  "Keep employee master records accurate before attendance or disciplinary updates.",
  "Use recruitment and orientation as one controlled handover into active personnel records.",
  "Maintain readable, auditable office administration suitable for management review.",
];

export default function HR() {
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
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-slate-900" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="HR Workspace"
        title="Human resources and office administration"
        subtitle="Central working page for employee records, attendance, leave, recruitment, discipline, and orientation with clean office administration and management-ready visibility."
        helperLinks={[
          { href: "/hr/employees", label: "Employees" },
          { href: "/hr/recruitment", label: "Recruitment" },
          { href: "/hr/orientation", label: "Orientation" },
          { href: "/dashboard", label: "Dashboard" },
        ]}
        highlights={[
          { label: "Core Areas", value: HR_MODULES.length.toLocaleString("id-ID"), detail: "Main HR modules available from this workspace." },
          { label: "Control Model", value: "Traceable", detail: "Built for readable, auditable office administration." },
          { label: "Daily Focus", value: "Attendance + Leave", detail: "Keep routine people administration stable first." },
          { label: "Talent Flow", value: "Recruitment → Orientation", detail: "Use one structured handoff into active personnel records." },
        ]}
        actions={(
          <Link href="/dashboard" className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700">
            Back to dashboard
          </Link>
        )}
      />

      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="surface-card p-6">
          <div className="surface-card__header">
            <h3 className="text-lg font-semibold text-slate-900">Operating sequence</h3>
            <p className="mt-1 text-sm text-slate-600">Keep HR work structured so personnel administration remains readable and audit-friendly.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Step 1</p>
              <p className="mt-2 text-base font-semibold text-slate-900">Employee setup</p>
              <p className="mt-1 text-sm text-slate-600">Create or validate the employee record before downstream actions.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Step 2</p>
              <p className="mt-2 text-base font-semibold text-slate-900">Daily control</p>
              <p className="mt-1 text-sm text-slate-600">Attendance, leave, and discipline stay consistent under one desk.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Step 3</p>
              <p className="mt-2 text-base font-semibold text-slate-900">Talent intake</p>
              <p className="mt-1 text-sm text-slate-600">Recruitment and orientation complete the office onboarding cycle.</p>
            </div>
          </div>
        </div>

        <div className="surface-card p-6">
          <div className="surface-card__header">
            <h3 className="text-lg font-semibold text-slate-900">Desk priorities</h3>
          </div>
          <ul className="space-y-3">
            {HR_PRIORITIES.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                <span className="badge-soft bg-slate-100 text-slate-700">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="surface-card p-6">
        <div className="surface-card__header">
          <h3 className="text-lg font-semibold text-slate-900">HR modules</h3>
          <p className="mt-1 text-sm text-slate-600">Direct access to the main internal-office functions used by HR and management staff.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {HR_MODULES.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-sm"
            >
              <div className="flex items-start gap-4">
                <span className={`badge-soft text-lg ${module.accent}`}>{module.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-base font-semibold text-slate-900 transition group-hover:text-cyan-800">{module.title}</h4>
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{module.note}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{module.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
