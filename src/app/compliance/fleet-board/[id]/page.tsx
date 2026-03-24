import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthorizedUser } from "@/lib/authz";
import { PermissionLevel } from "@/lib/permissions";
import { getVesselComplianceDetail } from "@/lib/compliance-vessel-detail";
import { getFleetActivityBadgeClasses } from "@/lib/fleet-ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function VesselComplianceDetailPage(
  props: { params: Promise<{ id: string }> }
) {
  await requireAuthorizedUser({
    redirectIfCrew: "/m/crew",
    module: "compliance",
    requiredLevel: PermissionLevel.VIEW_ACCESS,
    redirectOnDisallowed: "/dashboard",
  });

  const { id } = await props.params;
  const data = await getVesselComplianceDetail(id);

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700">Vessel Detail</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">{data.vessel.name}</h1>
              <p className="mt-2 text-sm text-slate-600">
                {data.vessel.type} • Flag {data.vessel.flag} • IMO {data.vessel.imoNumber ?? "-"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Principal: {data.vessel.principalName} ({data.vessel.principalCountry})
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/compliance/fleet-board" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                Back to Fleet Readiness
              </Link>
              <Link href="/compliance/rest-hours" className="rounded-full bg-cyan-700 px-4 py-2 text-sm font-semibold text-white">
                Rest-Hour Register
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-sm text-emerald-700">Onboard crew</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-900">{data.summary.onboardCrew}</p>
            <p className="mt-1 text-sm text-emerald-800">Live deployed crew on this vessel.</p>
          </div>
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm">
            <p className="text-sm text-cyan-700">Operational queue</p>
            <p className="mt-2 text-3xl font-semibold text-cyan-900">{data.summary.mobilizationCrew}</p>
            <p className="mt-1 text-sm text-cyan-800">Prepare joining crew linked to this vessel.</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-sm text-amber-700">Crew with blockers</p>
            <p className="mt-2 text-3xl font-semibold text-amber-900">{data.summary.crewWithBlockers}</p>
            <p className="mt-1 text-sm text-amber-800">Open readiness blockers requiring action.</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
            <p className="text-sm text-rose-700">Missing rest-hour logs</p>
            <p className="mt-2 text-3xl font-semibold text-rose-900">{data.summary.missingRestHourRegisters}</p>
            <p className="mt-1 text-sm text-rose-800">No digital rest-hour coverage in the review window.</p>
          </div>
        </section>

        <section className="rounded-3xl border border-cyan-100 bg-cyan-50/60 p-4 shadow-sm">
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-800">ONBOARD = live deployed crew</span>
            <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-cyan-800">PLANNED / ASSIGNED / ACTIVE = operational pipeline</span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-800">NO RECORD = manual follow-up required</span>
            <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700">NON COMPLIANT = immediate escalation</span>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Onboard crew blockers</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {data.onboardCrew.map((member) => (
                <div key={member.crewId} className="px-6 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{member.fullName}</p>
                      <p className="text-sm text-slate-500">{member.rank} • {member.crewCode ?? "No crew code"}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getFleetActivityBadgeClasses(member.restHourStatus)}`}>
                      {member.restHourStatus.replaceAll("_", " ")}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    {member.blockers.length > 0 ? (
                      member.blockers.map((blocker, index) => <li key={`${member.crewId}-${index}`}>• {blocker}</li>)
                    ) : (
                      <li>• No active blocker recorded.</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Prepare joining crew blockers</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {data.mobilizationCrew.map((member) => (
                <div key={member.prepareJoiningId} className="px-6 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{member.fullName}</p>
                      <p className="text-sm text-slate-500">
                        {member.rank} • {member.crewCode ?? "No crew code"} • {member.status}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getFleetActivityBadgeClasses(member.status)}`}>
                      {member.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="mt-3">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      Forms {member.approvedRequiredForms}/{member.requiredForms}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    {member.blockers.length > 0 ? (
                      member.blockers.map((blocker, index) => <li key={`${member.prepareJoiningId}-${index}`}>• {blocker}</li>)
                    ) : (
                      <li>• No active blocker recorded.</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
