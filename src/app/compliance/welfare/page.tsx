import { requireAuthorizedUser } from "@/lib/authz";
import { PermissionLevel } from "@/lib/permissions";
import { getWelfareTrackerData } from "@/lib/compliance-welfare";
import StatCard from "@/components/ui/StatCard";
import { formatDateLabel, formatDateTimeLabel, formatStatusLabel } from "@/lib/formatters";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WelfarePage() {
  await requireAuthorizedUser({
    redirectIfCrew: "/m/crew",
    module: "compliance",
    requiredLevel: PermissionLevel.VIEW_ACCESS,
    redirectOnDisallowed: "/dashboard",
  });

  const data = await getWelfareTrackerData();

  return (
    <div className="section-stack mx-auto max-w-7xl px-6 py-8">
      <WorkspaceHero
        eyebrow="MLC Welfare Desk"
        title="Grievance, welfare, and rest-hour tracking"
        subtitle="Track active grievance and welfare communication, sign-off closure obligations, and current digital coverage for rest-hour monitoring."
        helperLinks={[
          { href: "/compliance/rest-hours", label: "Rest-hour register" },
          { href: "/compliance/fleet-board", label: "Fleet board" },
          { href: "/dashboard", label: "Dashboard" },
        ]}
        highlights={[
          { label: "Open Grievances", value: data.summary.openGrievances.toLocaleString("id-ID"), detail: "Cases requiring welfare review or response." },
          { label: "Welfare Cases", value: data.summary.welfareCases.toLocaleString("id-ID"), detail: "Active welfare follow-up across the fleet." },
          { label: "Sign-off Closures", value: data.summary.signOffClosuresPending.toLocaleString("id-ID"), detail: "Crew departures awaiting closure items." },
          { label: "Generated", value: formatDateTimeLabel(data.generatedAt, "en-GB"), detail: "Latest tracker snapshot time." },
        ]}
      />

      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-5">
          <StatCard label="Open grievances" value={data.summary.openGrievances} description="Cases requiring welfare review or response." tone="slate" />
          <StatCard label="Welfare cases" value={data.summary.welfareCases} description="Active crew welfare follow-up across the fleet." tone="slate" />
          <StatCard label="Sign-off closures pending" value={data.summary.signOffClosuresPending} description="Crew departures awaiting closure items." tone="slate" />
          <StatCard label="Fleet without rest register" value={data.summary.activeFleetWithoutRestRegister} description="Active fleet still lacking digital rest-hour records." tone="amber" />
          <StatCard label="Manual rest tracking" value={data.summary.onboardCrewRequiringManualRestTracking} description="Onboard crew still monitored outside the digital register." tone="cyan" />
        </section>

        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-amber-900">Rest-hour tracking status</h2>
          <p className="mt-2 text-sm leading-6 text-amber-900/90">
            The current system does not yet store a dedicated onboard work/rest hour register. This page now surfaces the fleet
            coverage gap so operational teams can track vessels and crew still requiring manual bridge or vessel-side records
            until a digital rest-hour log is added.
          </p>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Active grievances</h2>
            <div className="mt-5 space-y-3">
              {data.grievances.length === 0 ? (
                <p className="text-sm text-slate-500">No active grievance or crew dispute cases.</p>
              ) : (
                data.grievances.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 px-4 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{item.subject}</p>
                        <p className="text-sm text-slate-500">{item.crewName} • {item.type}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 text-right text-xs font-semibold uppercase tracking-wide">
                        <StatusBadge status={item.priority} label={formatStatusLabel(item.priority)} />
                        <StatusBadge status={item.status} label={formatStatusLabel(item.status)} />
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">Opened {formatDateLabel(item.createdAt, "en-GB")}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Welfare cases</h2>
            <div className="mt-5 space-y-3">
              {data.welfareCases.length === 0 ? (
                <p className="text-sm text-slate-500">No active crew welfare cases.</p>
              ) : (
                data.welfareCases.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 px-4 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{item.subject}</p>
                        <p className="text-sm text-slate-500">{item.crewName} • {item.type}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 text-right text-xs font-semibold uppercase tracking-wide">
                        <StatusBadge status={item.priority} label={formatStatusLabel(item.priority)} />
                        <StatusBadge status={item.status} label={formatStatusLabel(item.status)} />
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">Opened {formatDateLabel(item.createdAt, "en-GB")}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Sign-off closure queue</h2>
          <div className="mt-5 space-y-3">
            {data.signOffQueue.length === 0 ? (
              <p className="text-sm text-slate-500">No pending sign-off closure obligations.</p>
            ) : (
              data.signOffQueue.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{item.crewName}</p>
                      <p className="text-sm text-slate-500">Sign-off {formatDateLabel(item.signOffDate, "en-GB")} • {formatStatusLabel(item.status)}</p>
                    </div>
                    <StatusBadge status={item.status} label={formatStatusLabel(item.status)} />
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-700">{item.missingItems.join(", ")}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
