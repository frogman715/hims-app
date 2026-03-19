import Link from "next/link";
import { requireUser } from "@/lib/authz";
import { getComplianceControlCenterData } from "@/lib/compliance-control-center";

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(value: string | null) {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getToneClasses(tone: "slate" | "emerald" | "amber" | "rose" | "cyan") {
  switch (tone) {
    case "emerald":
      return "border-emerald-200 bg-emerald-50 text-emerald-950";
    case "amber":
      return "border-amber-200 bg-amber-50 text-amber-950";
    case "rose":
      return "border-rose-200 bg-rose-50 text-rose-950";
    case "cyan":
      return "border-cyan-200 bg-cyan-50 text-cyan-950";
    default:
      return "border-slate-200 bg-white text-slate-950";
  }
}

function getSeverityClasses(severity: string) {
  const normalized = severity.toUpperCase();
  if (normalized === "CRITICAL") return "bg-rose-100 text-rose-700";
  if (normalized === "HIGH") return "bg-amber-100 text-amber-800";
  if (normalized === "MEDIUM") return "bg-cyan-100 text-cyan-800";
  return "bg-slate-100 text-slate-700";
}

export default async function ComplianceControlCenterPage() {
  await requireUser({
    redirectIfCrew: "/m/crew",
    allowedRoles: ["DIRECTOR", "CDMO", "OPERATIONAL", "ACCOUNTING", "HR_ADMIN"],
    redirectOnDisallowed: "/dashboard",
  });

  const data = await getComplianceControlCenterData();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#eef6ff_48%,_#f8fafc_100%)] px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 text-slate-50 shadow-2xl">
          <div className="grid gap-6 px-6 py-8 lg:grid-cols-[1.15fr,0.85fr] lg:px-8">
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
                Phase 2 Control Center
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  MLC and IMO compliance control center
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                  One operating picture for crew readiness, statutory document validity, external compliance,
                  internal audit pressure, and corrective action exposure across the digital shipping workflow.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-slate-200">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Crew welfare</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Certificate validity</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Audit and CAPA</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Flag readiness</span>
              </div>
              <p className="text-xs font-medium text-slate-400">
                Snapshot generated {formatTimestamp(data.generatedAt)}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-400">Readiness pool</p>
                <p className="mt-2 text-3xl font-semibold text-white">{data.summary.readiness.crewPool}</p>
                <p className="mt-1 text-sm text-slate-300">Standby crew monitored for deployment</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-400">Compliance score</p>
                <p className="mt-2 text-3xl font-semibold text-white">{data.summary.qms.complianceScore}%</p>
                <p className="mt-1 text-sm text-slate-300">Document and audit coverage trend</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-400">Critical QMS alerts</p>
                <p className="mt-2 text-3xl font-semibold text-white">{data.summary.qms.criticalAlerts}</p>
                <p className="mt-1 text-sm text-slate-300">Items needing immediate management action</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-400">Overdue CAPA</p>
                <p className="mt-2 text-3xl font-semibold text-white">{data.summary.audits.overdueCorrectiveActions}</p>
                <p className="mt-1 text-sm text-slate-300">Corrective actions already past due</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.cards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className={`rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${getToneClasses(card.tone)}`}
            >
              <p className="text-sm font-semibold uppercase tracking-wide opacity-75">{card.label}</p>
              <p className="mt-2 text-4xl font-semibold">{card.value}</p>
              <p className="mt-2 text-sm opacity-80">{card.detail}</p>
            </Link>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700">Standards Matrix</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">Operational coverage by standard</h2>
              </div>
              <Link href="/dashboard" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">
                Back to dashboard
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {data.standards.map((item) => (
                <Link
                  key={item.code}
                  href={item.href}
                  className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-cyan-300 hover:bg-cyan-50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold uppercase tracking-wide text-cyan-700">{item.code}</div>
                      <div className="mt-1 font-semibold text-slate-900">{item.title}</div>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
                    </div>
                    <span className="text-sm font-semibold text-cyan-700">Open</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">Command Summary</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Immediate management signals</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Ready to deploy</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{data.summary.readiness.readyToDeploy}</p>
                <p className="mt-1 text-sm text-slate-600">Crew currently passing core MLC/STCW checks.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Expiring certifications</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{data.summary.hrCompliance.expiringCertifications}</p>
                <p className="mt-1 text-sm text-slate-600">HR certification expiries requiring follow-up.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Overdue trainings</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{data.summary.hrCompliance.overdueTrainings}</p>
                <p className="mt-1 text-sm text-slate-600">Mandatory training plans beyond target date.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Open audits</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{data.summary.audits.openAudits}</p>
                <p className="mt-1 text-sm text-slate-600">Planned and in-progress audits still active.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-700">Crew Readiness Watch</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">Blocked or review-required crew</h2>
              </div>
              <Link href="/crewing/readiness" className="text-sm font-semibold text-rose-700 hover:text-rose-800">
                Open readiness
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {data.readinessWatch.length === 0 ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                  No standby crew are currently blocked by tracked readiness items.
                </div>
              ) : (
                data.readinessWatch.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="block rounded-2xl border border-slate-200 px-4 py-4 transition hover:border-rose-300 hover:bg-rose-50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{item.fullName}</p>
                        <p className="text-sm text-slate-500">
                          {item.crewCode ?? "No code"} • {item.rank}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-rose-700">{item.issue}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
                      </div>
                      <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                        Review
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">Expiring Documents</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">Next 30 days</h2>
                </div>
                <Link href="/crewing/readiness-board" className="text-sm font-semibold text-amber-700 hover:text-amber-800">
                  Open board
                </Link>
              </div>
              <div className="mt-5 space-y-3">
                {data.expiringDocuments.length === 0 ? (
                  <p className="text-sm text-slate-500">No active crew documents expiring in the next 30 days.</p>
                ) : (
                  data.expiringDocuments.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 transition hover:border-amber-300 hover:bg-amber-50"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{item.crewName}</p>
                        <p className="text-sm text-slate-500">{item.docType}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Expiry</p>
                        <p className="text-sm font-medium text-slate-700">{formatShortDate(item.expiryDate)}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700">External Queue</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">Flag and principal compliance</h2>
                </div>
                <Link href="/compliance/external" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">
                  Manage
                </Link>
              </div>
              <div className="mt-5 space-y-3">
                {data.externalQueue.length === 0 ? (
                  <p className="text-sm text-slate-500">No external compliance items currently blocked or pending.</p>
                ) : (
                  data.externalQueue.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="block rounded-2xl border border-slate-200 px-4 py-4 transition hover:border-cyan-300 hover:bg-cyan-50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-900">{item.crewName}</p>
                          <p className="text-sm text-slate-500">{item.rank} • {item.systemType}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getSeverityClasses(item.status)}`}>
                          {item.status.replaceAll("_", " ")}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">Expiry: {formatShortDate(item.expiryDate)}</p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-700">QMS Alert Deck</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">Audit, document, and NC pressure</h2>
              </div>
              <Link href="/quality/qms-dashboard" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
                Open QMS
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {data.qmsAlerts.length === 0 ? (
                <p className="text-sm text-slate-500">No active alerts from the advanced QMS analytics feed.</p>
              ) : (
                data.qmsAlerts.map((alert) => (
                  <div key={alert.id} className="rounded-2xl border border-slate-200 px-4 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{alert.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{alert.description}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getSeverityClasses(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Due {formatShortDate(alert.dueDate)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-700">Non-Conformity Queue</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">Open findings requiring closure</h2>
              </div>
              <Link href="/nonconformity" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
                Open register
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {data.nonconformities.length === 0 ? (
                <p className="text-sm text-slate-500">No open non-conformities in the current queue.</p>
              ) : (
                data.nonconformities.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="block rounded-2xl border border-slate-200 px-4 py-4 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{item.status.replaceAll("_", " ")}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getSeverityClasses(item.severity)}`}>
                        {item.severity}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">Due {formatShortDate(item.dueDate)}</p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
