import Link from "next/link";
import { requireAuthorizedUser } from "@/lib/authz";
import { PermissionLevel } from "@/lib/permissions";
import { getFleetComplianceBoard } from "@/lib/compliance-fleet-board";
import { getFleetRiskBadgeClasses } from "@/lib/fleet-ui";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";
import StatCard from "@/components/ui/StatCard";

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

export default async function FleetBoardPage() {
  await requireAuthorizedUser({
    redirectIfCrew: "/m/crew",
    module: "compliance",
    requiredLevel: PermissionLevel.VIEW_ACCESS,
    redirectOnDisallowed: "/dashboard",
  });

  const data = await getFleetComplianceBoard();

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Compliance Workspace"
        title="Fleet readiness board"
        subtitle={(
          <>
            Read one board for active fleet exposure: onboard crew, mobilization queue, document expiry, external compliance,
            and open non-conformities.
            <span className="mt-2 block text-xs font-medium text-slate-500">Generated {formatTimestamp(data.generatedAt)}</span>
          </>
        )}
        highlights={[
          {
            label: "Active Fleet",
            value: data.totals.activeVessels,
            detail: "Master vessels currently in active operating status.",
          },
          {
            label: "Onboard Crew",
            value: data.totals.activeCrew,
            detail: "Live deployed crew across the active fleet.",
          },
          {
            label: "Operational Queue",
            value: data.totals.mobilizationQueue,
            detail: "Prepare-joining workload tied to active vessels.",
          },
          {
            label: "High-Risk Vessels",
            value: data.totals.highRiskVessels,
            detail: "Units needing immediate review for readiness blockers.",
          },
        ]}
        helperLinks={[
          { href: "/compliance/control-center", label: "Control Center" },
          { href: "/crewing/principals", label: "Fleet & Principals" },
          { href: "/compliance/rest-hours", label: "Rest-Hour Register" },
        ]}
        actions={(
          <>
            <Link href="/compliance/control-center" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700">
              Control Center
            </Link>
            <Link href="/crewing/principals" className="rounded-full bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800">
              Fleet & Principals
            </Link>
          </>
        )}
      />

      <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="Active fleet" value={data.totals.activeVessels} description="Master vessels with active operating status." tone="slate" />
          <StatCard label="Onboard crew" value={data.totals.activeCrew} description="Crew currently deployed across the onboard fleet." tone="emerald" />
          <StatCard label="Operational queue" value={data.totals.mobilizationQueue} description="Prepare joining workload and mobilization pipeline." tone="cyan" />
          <StatCard label="High-risk vessels" value={data.totals.highRiskVessels} description="Immediate review needed for readiness blockers." tone="amber" />
      </section>

      <section className="rounded-3xl border border-cyan-100 bg-cyan-50/60 p-4 shadow-sm">
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">Active Fleet = master vessel status ACTIVE</span>
            <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-cyan-800">Operational Queue = prepare joining pipeline for the active fleet</span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-800">Onboard Crew = live deployed crew onboard</span>
          </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Fleet readiness register</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Vessel</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Principal / Flag</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Crew</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Expiry</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">External</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">NC</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.vessels.map((row) => (
                  <tr key={row.vesselId} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <Link href={`/compliance/fleet-board/${row.vesselId}`} className="font-semibold text-slate-900 hover:text-cyan-700">
                        {row.vesselName}
                      </Link>
                      <div className="text-slate-500">{row.vesselType}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <div>{row.principalName}</div>
                      <div className="text-slate-500">{row.principalCountry} • {row.flag}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <div className="font-semibold text-slate-900">Onboard: {row.activeCrew}</div>
                      <div className="text-slate-500">Mobilization: {row.mobilizationQueue}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                        {row.expiringDocuments}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">
                        {row.externalIssues}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                        {row.openNonconformities}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getFleetRiskBadgeClasses(row.riskLevel)}`}>
                        {row.riskLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </section>
    </div>
  );
}
