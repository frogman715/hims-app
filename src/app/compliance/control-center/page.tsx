import Link from "next/link";
import { requireAuthorizedUser } from "@/lib/authz";
import { PermissionLevel } from "@/lib/permissions";
import { getComplianceControlCenterData } from "@/lib/compliance-control-center";
import { getSeverityBadgeClasses } from "@/lib/severity-ui";
import StatCard from "@/components/ui/StatCard";
import { formatDateLabel, formatDateTimeLabel, formatStatusLabel } from "@/lib/formatters";

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

function getContractToneClasses(band: string) {
  if (band === "EXPIRED") return "bg-rose-100 text-rose-700";
  if (band === "CRITICAL") return "bg-rose-100 text-rose-700";
  if (band === "URGENT") return "bg-amber-100 text-amber-800";
  if (band === "FOLLOW_UP") return "bg-cyan-100 text-cyan-800";
  return "bg-slate-100 text-slate-700";
}

export default async function ComplianceControlCenterPage() {
  await requireAuthorizedUser({
    redirectIfCrew: "/m/crew",
    module: "compliance",
    requiredLevel: PermissionLevel.VIEW_ACCESS,
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
                MLC / IMO Command Deck
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  MLC and IMO compliance control center
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                  One operating picture for crew readiness, statutory document validity, audit pressure,
                  corrective action exposure, and verification support across the digital shipping workflow.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-slate-200">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Crew welfare</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Certificate validity</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Audit and CAPA</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Flag readiness</span>
              </div>
              <div className="grid gap-3 pt-2 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Command focus</p>
                  <p className="mt-2 text-lg font-semibold text-white">Signals first</p>
                  <p className="mt-1 text-sm text-slate-300">Management signals are grouped before users move into detailed desks.</p>
                  <p className="mt-1 text-xs text-slate-400">This page is for monitoring, not direct record entry.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Operating rhythm</p>
                  <p className="mt-2 text-lg font-semibold text-white">Daily command review</p>
                  <p className="mt-1 text-sm text-slate-300">Readiness, expiry, audit, and closure pressure stay visible on one page.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Support tools</p>
                  <p className="mt-2 text-lg font-semibold text-white">Separate from core flow</p>
                  <p className="mt-1 text-sm text-slate-300">Verification shortcuts remain available without competing with core MLC and IMO controls.</p>
                  <p className="mt-1 text-xs text-slate-400">Crewing remains the execution department for update and processing work.</p>
                </div>
              </div>
              <p className="text-xs font-medium text-slate-400">
                Snapshot generated {formatDateTimeLabel(data.generatedAt, "en-GB")}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-cyan-950/20">
                <p className="text-sm text-slate-400">Readiness pool</p>
                <p className="mt-2 text-3xl font-semibold text-white">{data.summary.readiness.crewPool}</p>
                <p className="mt-1 text-sm text-slate-300">Standby crew monitored for deployment review</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-cyan-950/20">
                <p className="text-sm text-slate-400">Compliance score</p>
                <p className="mt-2 text-3xl font-semibold text-white">{data.summary.qms.complianceScore}%</p>
                <p className="mt-1 text-sm text-slate-300">Document and audit coverage trend</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-cyan-950/20">
                <p className="text-sm text-slate-400">Critical QMS alerts</p>
                <p className="mt-2 text-3xl font-semibold text-white">{data.summary.qms.criticalAlerts}</p>
                <p className="mt-1 text-sm text-slate-300">Items requiring immediate management follow-up</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-cyan-950/20">
                <p className="text-sm text-slate-400">Overdue CAPA</p>
                <p className="mt-2 text-3xl font-semibold text-white">{data.summary.audits.overdueCorrectiveActions}</p>
                <p className="mt-1 text-sm text-slate-300">Corrective actions already beyond target date</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700">Signal Board</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Command cards for immediate attention</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Use these cards to review exposure and decide which operational desk needs follow-up next.
              </p>
            </div>
            <Link
              href="/compliance"
              className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
            >
              Back to operations hub
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
          </div>
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
              <StatCard label="Ready to deploy" value={data.summary.readiness.readyToDeploy} description="Crew currently passing core MLC/STCW checks." tone="emerald" />
              <StatCard label="Expiring certifications" value={data.summary.hrCompliance.expiringCertifications} description="HR certification expiries requiring follow-up." tone="amber" />
              <StatCard label="Overdue trainings" value={data.summary.hrCompliance.overdueTrainings} description="Mandatory training plans beyond target date." tone="rose" />
              <StatCard label="Open audits" value={data.summary.audits.openAudits} description="Planned and in-progress audits still active." tone="slate" />
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
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-700">Contract Expiry Watch</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">Onboard contracts in alert range</h2>
                </div>
                <Link href="/crewing/crew-list" className="text-sm font-semibold text-rose-700 hover:text-rose-800">
                  Open crew list
                </Link>
              </div>
              <div className="mt-5 space-y-3">
                {data.contractExpiryWatch.length === 0 ? (
                  <p className="text-sm text-slate-500">No onboard contracts are currently inside the monitored alert window.</p>
                ) : (
                  data.contractExpiryWatch.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="block rounded-2xl border border-slate-200 px-4 py-4 transition hover:border-rose-300 hover:bg-rose-50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-900">{item.crewName}</p>
                          <p className="text-sm text-slate-500">
                            {item.rank} • {item.vesselName}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{item.nextAction}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getContractToneClasses(item.band)}`}>
                          {formatStatusLabel(item.band)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-slate-700">
                        Contract end {formatDateLabel(item.contractEnd, "en-GB")} • {item.daysRemaining} day(s) remaining
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </div>

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
                        <p className="text-sm font-medium text-slate-700">{formatDateLabel(item.expiryDate, "en-GB")}</p>
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
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getSeverityBadgeClasses(item.status)}`}>
                          {formatStatusLabel(item.status)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">Expiry: {formatDateLabel(item.expiryDate, "en-GB")}</p>
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
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getSeverityBadgeClasses(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Due {formatDateLabel(alert.dueDate, "en-GB")}
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
                        <p className="mt-1 text-sm text-slate-500">{formatStatusLabel(item.status)}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getSeverityBadgeClasses(item.severity)}`}>
                        {item.severity}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">Due {formatDateLabel(item.dueDate, "en-GB")}</p>
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
