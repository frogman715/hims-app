import Link from "next/link";
import ExternalComplianceManager from "@/components/compliance/ExternalComplianceManager";
import { requireAuthorizedUser } from "@/lib/authz";
import { PermissionLevel } from "@/lib/permissions";

const workflowSteps = [
  {
    step: "01",
    title: "Command Center",
    detail: "Open one executive view for MLC, IMO, audit pressure, CAPA exposure, certificate expiry, and deployment blockers.",
    href: "/compliance/control-center",
    cta: "Open command center",
  },
  {
    step: "02",
    title: "Readiness Monitoring",
    detail: "Review readiness exposure, blocked crew, and deployment watch items before the crewing desk continues with joining actions.",
    href: "/crewing/readiness-board",
    cta: "Open readiness watch",
    secondaryHref: "/crewing/readiness",
    secondaryLabel: "Open action desk",
  },
  {
    step: "03",
    title: "Fleet Readiness and Requirement Oversight",
    detail: "Monitor active-fleet exposure, principal requirements, flag-state rules, and crew blockers vessel by vessel before deployment approval.",
    href: "/compliance/fleet-board",
    cta: "Open fleet readiness board",
    secondaryHref: "/compliance/requirement-matrix",
    secondaryLabel: "Requirement matrix",
  },
  {
    step: "04",
    title: "Welfare and Rest Hours",
    detail: "Track grievances, welfare cases, and rest-hour coverage so MLC welfare controls and fatigue monitoring stay visible.",
    href: "/compliance/welfare",
    cta: "Open welfare tracker",
    secondaryHref: "/compliance/rest-hours",
    secondaryLabel: "Rest-hour register",
  },
  {
    step: "05",
    title: "Audit and Escalation",
    detail: "Use QMS, audit, non-conformity, and escalation workflows to close corrective actions and overdue operational issues.",
    href: "/quality/qms-dashboard",
    cta: "Open QMS dashboard",
    secondaryHref: "/compliance/escalations",
    secondaryLabel: "Escalation center",
  },
];

const quickLinks = [
  { label: "Control Center", href: "/compliance/control-center" },
  { label: "Fleet Readiness", href: "/compliance/fleet-board" },
  { label: "Readiness Watch", href: "/crewing/readiness-board" },
  { label: "Welfare Tracker", href: "/compliance/welfare" },
  { label: "Rest-Hour Register", href: "/compliance/rest-hours" },
  { label: "Requirement Matrix", href: "/compliance/requirement-matrix" },
  { label: "Escalation Center", href: "/compliance/escalations" },
  { label: "Non-Conformities", href: "/nonconformity" },
];

export default async function CompliancePage() {
  const { session } = await requireAuthorizedUser({
    redirectIfCrew: "/m/crew",
    module: "compliance",
    requiredLevel: PermissionLevel.VIEW_ACCESS,
    redirectOnDisallowed: "/dashboard",
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.14),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef6ff_55%,_#f8fafc_100%)] px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 text-slate-50 shadow-2xl">
          <div className="grid gap-6 px-6 py-8 lg:grid-cols-[1.2fr,0.8fr] lg:px-8">
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
                MLC / IMO Operations Hub
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  Compliance operations with one clear office sequence
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                  This page is not a feature index. It is the working sequence for the office team: start from the
                  control center, clear crew readiness, confirm vessel and principal requirements, review welfare and
                  rest hours, then close the loop through audit and escalation.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-slate-200">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">MLC 2006</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">IMO STCW</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">IMO ISM</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Crew welfare</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Vessel readiness</span>
              </div>
              <div className="grid gap-3 pt-2 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Primary sequence</p>
                  <p className="mt-2 text-lg font-semibold text-white">Control to closure</p>
                  <p className="mt-1 text-sm text-slate-300">A single office flow from compliance watch to corrective action.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Operational focus</p>
                  <p className="mt-2 text-lg font-semibold text-white">Readiness first</p>
                  <p className="mt-1 text-sm text-slate-300">Crew, vessel, and document blockers are surfaced before the action desk moves forward.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Support tools</p>
                  <p className="mt-2 text-lg font-semibold text-white">Portals only</p>
                  <p className="mt-1 text-sm text-slate-300">Verification shortcuts stay available without crowding the main workflow.</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Current desk</p>
              <p className="mt-2 text-2xl font-semibold text-white">{session.user?.name ?? "User"}</p>
              <p className="mt-1 text-sm text-slate-300">{session.user?.email ?? "No email"}</p>
              <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">Recommended route</p>
                <p className="mt-2 text-lg font-semibold text-white">Start from control, then move into readiness and joining.</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  Compliance owns monitoring, escalation, and oversight. Crewing remains the execution desk for input, update, and joining actions.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {quickLinks.slice(0, 4).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-white transition hover:border-cyan-300 hover:bg-cyan-400/10"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700">Operations Sequence</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Oversight first, execution second</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                This sequence is for monitoring, review, and escalation. Operational input and record updates stay inside the crewing department.
              </p>
            </div>
            <Link
              href="/compliance/control-center"
              className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
            >
              Open command view
            </Link>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {workflowSteps.map((item) => (
            <article
              key={item.step}
              className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,_rgba(248,250,252,0.96),_rgba(255,255,255,1))] p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700">Step {item.step}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">{item.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.detail}</p>
                </div>
                <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 sm:block">
                  Oversight desk
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={item.href}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {item.cta}
                </Link>
                {item.secondaryHref && item.secondaryLabel ? (
                  <Link
                    href={item.secondaryHref}
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-400 hover:text-cyan-700"
                  >
                    {item.secondaryLabel}
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Secondary Tools</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Supporting desks outside the command flow</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                These pages support monitoring and follow-up, but they should not compete with the command sequence or the crewing action desks.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700">Verification Support</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Verification shortcuts</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              KOSMA training, Dephub certificate checks, and visa portals remain available as launchers only. They support the office desk without becoming a separate workflow.
            </p>
          </div>
          <ExternalComplianceManager compact />
        </section>
      </div>
    </div>
  );
}
