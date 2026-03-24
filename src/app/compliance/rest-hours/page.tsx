import Link from "next/link";
import { requireAuthorizedUser } from "@/lib/authz";
import { PermissionLevel } from "@/lib/permissions";
import RestHourRegisterClient from "./RestHourRegisterClient";
import { getRestHourRegisterData } from "@/lib/compliance-rest-hours";

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

export default async function RestHourRegisterPage() {
  await requireAuthorizedUser({
    redirectIfCrew: "/m/crew",
    module: "compliance",
    requiredLevel: PermissionLevel.VIEW_ACCESS,
    redirectOnDisallowed: "/dashboard",
  });

  const data = await getRestHourRegisterData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700">MLC Welfare</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Digital rest-hour register</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Capture daily work and rest hours per vessel and crew, expose MLC minimum rest breaches,
                and close manual register gaps before audit or deployment.
              </p>
              <p className="mt-3 text-xs font-medium text-slate-500">Generated {formatTimestamp(data.generatedAt)}</p>
            </div>
            <div className="flex gap-3">
              <Link href="/compliance/welfare" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                Welfare Tracker
              </Link>
              <Link href="/compliance/fleet-board" className="rounded-full bg-cyan-700 px-4 py-2 text-sm font-semibold text-white">
                Fleet Readiness
              </Link>
            </div>
          </div>
        </section>

        <RestHourRegisterClient initialData={data} />
      </div>
    </div>
  );
}
