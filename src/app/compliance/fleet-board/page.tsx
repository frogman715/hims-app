import Link from "next/link";
import { getFleetComplianceBoard } from "@/lib/compliance-fleet-board";

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

function getRiskClasses(riskLevel: string) {
  if (riskLevel === "CRITICAL") return "bg-rose-100 text-rose-700";
  if (riskLevel === "HIGH") return "bg-amber-100 text-amber-800";
  if (riskLevel === "MEDIUM") return "bg-cyan-100 text-cyan-800";
  return "bg-emerald-100 text-emerald-700";
}

export default async function FleetBoardPage() {
  const data = await getFleetComplianceBoard();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700">Fleet Operations</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Vessel-by-vessel compliance board</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Read one board for active vessel exposure: onboard crew, mobilization queue, document expiry, external compliance,
                and open non-conformities.
              </p>
              <p className="mt-3 text-xs font-medium text-slate-500">Generated {formatTimestamp(data.generatedAt)}</p>
            </div>
            <div className="flex gap-3">
              <Link href="/compliance/control-center" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                Control Center
              </Link>
              <Link href="/crewing/principals" className="rounded-full bg-cyan-700 px-4 py-2 text-sm font-semibold text-white">
                Fleet Management
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Active vessels</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{data.totals.activeVessels}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Active crew onboard</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{data.totals.activeCrew}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Mobilization queue</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{data.totals.mobilizationQueue}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-sm text-amber-700">High-risk vessels</p>
            <p className="mt-2 text-3xl font-semibold text-amber-900">{data.totals.highRiskVessels}</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Fleet compliance register</h2>
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
                      <div>Onboard / active: {row.activeCrew}</div>
                      <div className="text-slate-500">Mobilization: {row.mobilizationQueue}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{row.expiringDocuments}</td>
                    <td className="px-6 py-4 text-slate-700">{row.externalIssues}</td>
                    <td className="px-6 py-4 text-slate-700">{row.openNonconformities}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getRiskClasses(row.riskLevel)}`}>
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
    </div>
  );
}
