import Link from "next/link";
import { notFound } from "next/navigation";
import { getVesselComplianceDetail } from "@/lib/compliance-vessel-detail";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function statusClass(value: string) {
  if (value === "NON_COMPLIANT") return "bg-rose-100 text-rose-700";
  if (value === "NO_RECORD") return "bg-amber-100 text-amber-800";
  return "bg-emerald-100 text-emerald-700";
}

export default async function VesselComplianceDetailPage(
  props: { params: Promise<{ id: string }> }
) {
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
                Back to Fleet Board
              </Link>
              <Link href="/compliance/rest-hours" className="rounded-full bg-cyan-700 px-4 py-2 text-sm font-semibold text-white">
                Rest-Hour Register
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Onboard crew</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{data.summary.onboardCrew}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Mobilization queue</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{data.summary.mobilizationCrew}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-sm text-amber-700">Crew with blockers</p>
            <p className="mt-2 text-3xl font-semibold text-amber-900">{data.summary.crewWithBlockers}</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
            <p className="text-sm text-rose-700">Missing rest-hour logs</p>
            <p className="mt-2 text-3xl font-semibold text-rose-900">{data.summary.missingRestHourRegisters}</p>
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
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(member.restHourStatus)}`}>
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
