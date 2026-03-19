import { getWelfareTrackerData } from "@/lib/compliance-welfare";

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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function WelfarePage() {
  const data = await getWelfareTrackerData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">MLC Welfare Desk</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Grievance, welfare, and rest-hour tracking</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Track active grievance and welfare communication, sign-off closure obligations, and current digital coverage for
            rest-hour monitoring.
          </p>
          <p className="mt-3 text-xs font-medium text-slate-500">Generated {formatTimestamp(data.generatedAt)}</p>
        </section>

        <section className="grid gap-4 md:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Open grievances</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{data.summary.openGrievances}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Welfare cases</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{data.summary.welfareCases}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Sign-off closures pending</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{data.summary.signOffClosuresPending}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-sm text-amber-700">Fleet without rest register</p>
            <p className="mt-2 text-3xl font-semibold text-amber-900">{data.summary.activeFleetWithoutRestRegister}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-sm text-amber-700">Crew needing manual rest log</p>
            <p className="mt-2 text-3xl font-semibold text-amber-900">{data.summary.onboardCrewRequiringManualRestTracking}</p>
          </div>
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
                      <div className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <div>{item.priority}</div>
                        <div>{item.status}</div>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">Opened {formatDate(item.createdAt)}</p>
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
                      <div className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <div>{item.priority}</div>
                        <div>{item.status}</div>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">Opened {formatDate(item.createdAt)}</p>
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
                      <p className="text-sm text-slate-500">Sign-off {formatDate(item.signOffDate)} • {item.status}</p>
                    </div>
                    <div className="text-sm font-medium text-slate-700">{item.missingItems.join(", ")}</div>
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
