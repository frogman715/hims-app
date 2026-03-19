import { getRequirementMatrix } from "@/lib/compliance-requirement-matrix";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatDate(value: string | null) {
  if (!value) return "No agreement expiry";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function RequirementMatrixPage() {
  const data = await getRequirementMatrix();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">Principal and Flag Matrix</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Principal / flag-state requirement matrix</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Baseline requirement matrix combining principal governance and flag-state expectations so deployment teams can review
            what must be checked before mobilization.
          </p>
        </section>

        <div className="space-y-6">
          {data.principals.map((principal) => (
            <section key={principal.principalId} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">{principal.principalName}</h2>
                  <p className="text-sm text-slate-500">
                    {principal.country} • Agreement expiry {formatDate(principal.agreementExpiry)}
                  </p>
                </div>
                <div className="text-sm text-slate-500">{principal.vessels.length} active vessel(s)</div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                {principal.vessels.length === 0 ? (
                  <p className="text-sm text-slate-500">No active vessels mapped to this principal.</p>
                ) : (
                  principal.vessels.map((vessel) => (
                    <div key={vessel.vesselId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div>
                        <p className="font-semibold text-slate-900">{vessel.vesselName}</p>
                        <p className="text-sm text-slate-500">{vessel.vesselType} • {vessel.flag}</p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {vessel.requirements.map((item) => (
                          <div key={`${vessel.vesselId}-${item.code}`} className="rounded-xl border border-blue-200 bg-white px-3 py-2">
                            <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">{item.code}</div>
                            <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                            <div className="mt-1 text-xs leading-5 text-slate-600">{item.rationale}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
