import Link from "next/link";
import { getEscalationCenterData } from "@/lib/compliance-escalations";
import { getEscalationNotificationOverview } from "@/lib/compliance-escalation-notifications";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSeverityClasses(severity: string) {
  if (severity === "CRITICAL") return "bg-rose-100 text-rose-700";
  if (severity === "HIGH") return "bg-amber-100 text-amber-800";
  return "bg-cyan-100 text-cyan-800";
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function EscalationsPage() {
  const [data, notificationLogs] = await Promise.all([
    getEscalationCenterData(),
    getEscalationNotificationOverview(),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50 px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-700">Rules Engine</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Auto escalation center</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Advisory escalation queue generated from expiry, overdue CAPA, external compliance blockers, and deployment readiness gaps.
                Notification workflow is available through <span className="font-semibold text-slate-900">POST /api/compliance/escalations/notify</span>.
              </p>
              <p className="mt-3 text-xs font-medium text-slate-500">Generated {formatTimestamp(data.generatedAt)}</p>
            </div>
            <Link href="/compliance/control-center" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
              Back to Control Center
            </Link>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-4">
          {data.ruleCatalog.map((rule) => (
            <div key={rule.code} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">{rule.code}</p>
              <p className="mt-2 font-semibold text-slate-900">{rule.description}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Live escalation queue</h2>
          <div className="mt-5 space-y-3">
            {data.items.length === 0 ? (
              <p className="text-sm text-slate-500">No items currently match the escalation rules.</p>
            ) : (
              data.items.map((item) => (
                <Link key={item.id} href={item.href} className="block rounded-2xl border border-slate-200 px-4 py-4 transition hover:border-rose-300 hover:bg-rose-50">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {item.ruleCode} • owner {item.owner}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getSeverityClasses(item.severity)}`}>
                      {item.severity}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Notification audit trail</h2>
          <div className="mt-5 space-y-3">
            {notificationLogs.length === 0 ? (
              <p className="text-sm text-slate-500">No escalation notification has been logged yet.</p>
            ) : (
              notificationLogs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-slate-200 px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{log.subject}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {log.recipientEmail ?? "No recipient mapped"} • owner {log.ownerRole}
                      </p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {log.ruleCode} • created {formatTimestamp(log.createdAt)}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${log.status === "SENT" ? "bg-emerald-100 text-emerald-700" : log.status === "FAILED" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"}`}>
                      {log.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
