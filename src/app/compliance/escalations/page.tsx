import Link from "next/link";
import { requireAuthorizedUser } from "@/lib/authz";
import { PermissionLevel } from "@/lib/permissions";
import { getEscalationCenterData } from "@/lib/compliance-escalations";
import { getEscalationNotificationOverview } from "@/lib/compliance-escalation-notifications";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  await requireAuthorizedUser({
    redirectIfCrew: "/m/crew",
    module: "compliance",
    requiredLevel: PermissionLevel.VIEW_ACCESS,
    redirectOnDisallowed: "/dashboard",
  });

  const data = await getEscalationCenterData();
  const notificationLogs = await getEscalationNotificationOverview().catch((error) => {
    console.error("Failed to load escalation notification audit trail:", error);
    return [];
  });
  const criticalItems = data.items.filter((item) => item.severity === "CRITICAL").length;
  const failedNotifications = notificationLogs.filter((log) => log.status === "FAILED").length;

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Compliance Workspace"
        title="Auto escalation center"
        subtitle={(
          <>
            Advisory escalation queue generated from expiry, overdue CAPA, external compliance blockers, and deployment readiness gaps.
            Notification workflow is available through <span className="font-semibold text-slate-900">POST /api/compliance/escalations/notify</span>.
            <span className="mt-2 block text-xs font-medium text-slate-500">Generated {formatTimestamp(data.generatedAt)}</span>
          </>
        )}
        highlights={[
          {
            label: "Open Escalations",
            value: data.items.length,
            detail: "Active items currently matching the rules engine.",
          },
          {
            label: "Critical Priority",
            value: criticalItems,
            detail: "Cases requiring immediate management attention.",
          },
          {
            label: "Rule Catalog",
            value: data.ruleCatalog.length,
            detail: "Configured escalation rules exposed to this workspace.",
          },
          {
            label: "Failed Notifications",
            value: failedNotifications,
            detail: "Notification logs that require delivery follow-up.",
          },
        ]}
        helperLinks={[
          { href: "/compliance/control-center", label: "Control Center" },
          { href: "/quality/qmr-dashboard", label: "QMR Dashboard" },
          { href: "/quality/risks", label: "Risk Register" },
        ]}
        actions={(
          <Link href="/compliance/control-center" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-300 hover:text-rose-700">
            Control Center
          </Link>
        )}
      />

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
                    <StatusBadge status={item.severity} />
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
                    <StatusBadge status={log.status} />
                  </div>
                </div>
              ))
            )}
          </div>
      </section>
    </div>
  );
}
