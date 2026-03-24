import Link from "next/link";
import { requireAuthorizedUser } from "@/lib/authz";
import { PermissionLevel } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildCrewReadinessDashboard, type CrewReadinessRecord } from "@/lib/crewing-readiness";
import { canAccessOfficePath, getPrimaryOfficeRole } from "@/lib/office-access";

function formatGeneratedAt(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCheckBadge(status: CrewReadinessRecord["checks"]["passport"]["status"]) {
  if (status === "READY") return "bg-emerald-100 text-emerald-700";
  if (status === "EXPIRING_SOON") return "bg-amber-100 text-amber-800";
  if (status === "NOT_REQUIRED") return "bg-slate-100 text-slate-600";
  return "bg-rose-100 text-rose-700";
}

function getCheckLabel(status: CrewReadinessRecord["checks"]["passport"]["status"]) {
  if (status === "READY") return "Ready";
  if (status === "EXPIRING_SOON") return "Expiring Soon";
  if (status === "MISSING") return "Missing";
  if (status === "EXPIRED") return "Expired";
  if (status === "UNVERIFIED") return "Unverified";
  if (status === "PENDING") return "Pending";
  return "Not Required";
}

function getPriorityAction(crew: CrewReadinessRecord) {
  if (crew.isReadyToDeploy) {
    return "Ready for deployment review. Proceed to application or joining preparation.";
  }

  const firstGap = crew.gaps[0];
  if (!firstGap) {
    return "Review biodata, documents, and joining preparation before deployment.";
  }

  return `${firstGap.label}: ${firstGap.detail}`;
}

export default async function ReadinessPage() {
  await requireAuthorizedUser({
    redirectIfCrew: "/m/crew",
    module: "crewing",
    requiredLevel: PermissionLevel.VIEW_ACCESS,
  });

  const session = await getServerSession(authOptions);
  const roles = getPrimaryOfficeRole(session?.user?.roles, session?.user?.role);
  const isSystemAdmin = session?.user?.isSystemAdmin === true;

  const canOpenPrepareJoining = canAccessOfficePath("/crewing/prepare-joining", roles, isSystemAdmin);
  const canOpenDocuments = canAccessOfficePath("/crewing/documents", roles, isSystemAdmin);
  const canOpenBiodata = canAccessOfficePath("/crewing/seafarers/example/biodata", roles, isSystemAdmin);
  const canOpenCrewDocuments = canAccessOfficePath("/crewing/seafarers/example/documents", roles, isSystemAdmin);
  const canOpenCrewMedical = canAccessOfficePath("/crewing/seafarers/example/medical", roles, isSystemAdmin);
  const canOpenCrewTraining = canAccessOfficePath("/crewing/seafarers/example/trainings", roles, isSystemAdmin);
  const canCreateApplication = canAccessOfficePath("/api/applications", roles, isSystemAdmin, "POST");

  const crews = await prisma.crew.findMany({
    where: {
      status: "STANDBY",
      recruitments: {
        none: {
          status: {
            in: ["APPLICANT", "SCREENING", "INTERVIEW", "SELECTED", "APPROVED", "ON_HOLD", "WITHDRAWN", "REJECTED"],
          },
        },
      },
    },
    orderBy: { fullName: "asc" },
    include: {
      documents: {
        where: { isActive: true },
        select: {
          id: true,
          docType: true,
          expiryDate: true,
        },
      },
      medicalChecks: {
        orderBy: { expiryDate: "desc" },
        take: 5,
        select: {
          id: true,
          expiryDate: true,
          result: true,
        },
      },
      orientations: {
        orderBy: { startDate: "desc" },
        take: 3,
        select: {
          id: true,
          startDate: true,
          status: true,
          remarks: true,
        },
      },
      prepareJoinings: {
        where: {
          status: {
            in: ["PENDING", "DOCUMENTS", "MEDICAL", "TRAINING", "TRAVEL", "READY"],
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: {
          id: true,
          status: true,
          orientationCompleted: true,
          trainingRemarks: true,
          vessel: {
            select: {
              name: true,
            },
          },
          principal: {
            select: {
              name: true,
            },
          },
        },
      },
      assignments: {
        where: {
          status: {
            in: ["PLANNED", "ASSIGNED", "ACTIVE"],
          },
        },
        orderBy: { startDate: "desc" },
        take: 1,
        select: {
          id: true,
          status: true,
          vessel: {
            select: {
              name: true,
            },
          },
          principal: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  const dashboard = buildCrewReadinessDashboard(crews);
  const queuedForJoining = dashboard.crew.filter((crew) => crew.deploymentContext?.toLowerCase().includes("prepare joining")).length;
  const readyForApplication = dashboard.readyToDeploy.length;
  const urgentGapCount = dashboard.notReady.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">Crew Readiness</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Deployment Readiness Dashboard</h1>
              <p className="mt-2 max-w-4xl text-sm text-slate-600">
                Active standby crew only. Readiness is computed from live passport, seaman book, medical, and recorded
                training or Prepare Joining data already in the system. This dashboard supports office review and does
                not auto-approve deployment.
              </p>
              <p className="mt-3 text-xs font-medium text-slate-500">
                Last generated: {formatGeneratedAt(dashboard.generatedAt)} • Expiring soon threshold: {dashboard.expiryWarningDays} days
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {canCreateApplication ? (
                <Link href="/crewing/applications/new" className="rounded-full bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800">
                  Create Application
                </Link>
              ) : (
                <span className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600">
                  View Only
                </span>
              )}
              {canOpenPrepareJoining ? (
                <Link href="/crewing/prepare-joining" className="rounded-full bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800">
                  Prepare Joining
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Standby crew pool</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{dashboard.totals.crewPool}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-sm text-emerald-700">Ready to Deploy</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-900">{dashboard.totals.readyToDeploy}</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
            <p className="text-sm text-rose-700">Not Ready</p>
            <p className="mt-2 text-3xl font-semibold text-rose-900">{dashboard.totals.notReady}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-sm text-amber-700">Expiring Soon</p>
            <p className="mt-2 text-3xl font-semibold text-amber-900">{dashboard.totals.expiringSoon}</p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Office Action Queue</p>
            <p className="mt-3 text-2xl font-semibold text-cyan-950">{urgentGapCount}</p>
            <p className="mt-1 text-sm text-cyan-900">Standby crew need immediate readiness follow-up before deployment planning can continue.</p>
            {canOpenPrepareJoining ? (
              <Link href="/crewing/prepare-joining" className="mt-4 inline-flex rounded-full border border-cyan-300 bg-white px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:border-cyan-500 hover:text-cyan-900">
                Open Prepare Joining
              </Link>
            ) : null}
          </div>
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Ready For Deployment Review</p>
            <p className="mt-3 text-2xl font-semibold text-emerald-950">{readyForApplication}</p>
            <p className="mt-1 text-sm text-emerald-900">
              {canCreateApplication
                ? "Crew records currently meet the readiness rules and can move to office review for deployment."
                : "Crew records currently meet the readiness rules. This role can review readiness but cannot open a new application."}
            </p>
            {canCreateApplication ? (
              <Link href="/crewing/applications/new" className="mt-4 inline-flex rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-500 hover:text-emerald-900">
                Create Application
              </Link>
            ) : (
              <span className="mt-4 inline-flex rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700">
                Review Only
              </span>
            )}
          </div>
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Joining Follow-Up</p>
            <p className="mt-3 text-2xl font-semibold text-amber-950">{queuedForJoining}</p>
            <p className="mt-1 text-sm text-amber-900">Crew records already linked to live Prepare Joining activity and still need office follow-up.</p>
            {canOpenDocuments ? (
              <Link href="/crewing/documents?filter=expiring" className="mt-4 inline-flex rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-800 transition hover:border-amber-500 hover:text-amber-900">
                Review Documents
              </Link>
            ) : null}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Ready to Deploy</h2>
              <p className="mt-1 text-sm text-slate-500">Crew with current essential documents and medical clearance, and no explicit training hold in the live dataset.</p>
            </div>
            <div className="divide-y divide-slate-100">
              {dashboard.readyToDeploy.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-slate-500">No standby crew currently meet the ready-to-deploy rules.</div>
              ) : (
                dashboard.readyToDeploy.map((crew) => (
                  <div key={crew.id} className="px-6 py-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{crew.fullName}</p>
                        <p className="text-sm text-slate-500">
                          {crew.crewCode ?? "No code"} • {crew.rank} • {crew.crewStatus}
                        </p>
                        {crew.deploymentContext ? <p className="mt-1 text-sm text-slate-600">{crew.deploymentContext}</p> : null}
                        <p className="mt-2 text-sm font-medium text-emerald-800">{getPriorityAction(crew)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {canOpenBiodata ? (
                          <Link href={`/crewing/seafarers/${crew.id}/biodata`} className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-700">
                            Biodata
                          </Link>
                        ) : null}
                        {canCreateApplication ? (
                          <Link href="/crewing/applications/new" className="rounded-full border border-cyan-300 px-3 py-1.5 text-sm font-semibold text-cyan-700 transition hover:border-cyan-600 hover:text-cyan-800">
                            Create Application
                          </Link>
                        ) : (
                          <span className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600">
                            Review Only
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-slate-900">Missing Items Summary</h2>
              </div>
              <div className="p-6">
                {dashboard.missingItemsSummary.length === 0 ? (
                  <p className="text-sm text-slate-500">No blocking readiness gaps in the current standby pool.</p>
                ) : (
                  <div className="space-y-3">
                    {dashboard.missingItemsSummary.map((item) => (
                      <div key={item.type} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                        <div>
                          <p className="font-semibold text-slate-900">{item.label}</p>
                          <p className="text-sm text-slate-500">Crew blocked by this requirement</p>
                        </div>
                        <div className="rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white">{item.count}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-slate-900">Expiring Soon</h2>
                <p className="mt-1 text-sm text-slate-500">Early warning items that will need follow-up within the next {dashboard.expiryWarningDays} days.</p>
              </div>
              <div className="divide-y divide-slate-100">
                {dashboard.expiringSoon.length === 0 ? (
                  <div className="px-6 py-10 text-center text-sm text-slate-500">No passport, seaman book, or medical items are nearing expiry.</div>
                ) : (
                  dashboard.expiringSoon.map((item) => (
                    <div key={item.id} className="px-6 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-900">{item.fullName}</p>
                          <p className="text-sm text-slate-500">
                            {item.crewCode ?? "No code"} • {item.rank}
                          </p>
                          <p className="mt-1 text-sm text-slate-700">{item.label}</p>
                          <p className="text-sm text-amber-800">{item.detail}</p>
                        </div>
                      {canOpenBiodata ? (
                        <Link href={`/crewing/seafarers/${item.crewId}/biodata`} className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-700">
                          Review Crew
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Not Ready</h2>
            <p className="mt-1 text-sm text-slate-500">Standby crew blocked by missing, expired, unverified, or explicitly pending readiness items.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {dashboard.notReady.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-slate-500">No standby crew are currently blocked by readiness gaps.</div>
            ) : (
              dashboard.notReady.map((crew) => (
                <div key={crew.id} className="px-6 py-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{crew.fullName}</p>
                      <p className="text-sm text-slate-500">
                        {crew.crewCode ?? "No code"} • {crew.rank} • {crew.crewStatus}
                      </p>
                      {crew.deploymentContext ? <p className="mt-1 text-sm text-slate-600">{crew.deploymentContext}</p> : null}
                      <p className="mt-2 text-sm font-medium text-rose-700">{getPriorityAction(crew)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {canOpenBiodata ? (
                        <Link href={`/crewing/seafarers/${crew.id}/biodata`} className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-700">
                          Biodata
                        </Link>
                      ) : null}
                      {canOpenPrepareJoining ? (
                        <Link href="/crewing/prepare-joining" className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-700">
                          Prepare Joining
                        </Link>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {crew.gaps.map((gap, index) => (
                      <span key={`${crew.id}-${gap.type}-${index}`} className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                        {gap.label}: {gap.detail}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Crew Readiness Detail</h2>
            <p className="mt-1 text-sm text-slate-500">Per-crew drill-down using the current operational record only.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {dashboard.crew.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-slate-500">No standby crew are available for readiness review.</div>
            ) : (
              dashboard.crew.map((crew) => (
                <details key={crew.id} className="group px-6 py-5">
                  <summary className="flex cursor-pointer list-none flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold text-slate-900">{crew.fullName}</p>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${crew.isReadyToDeploy ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                          {crew.isReadyToDeploy ? "Ready to Deploy" : "Not Ready"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">
                        {crew.crewCode ?? "No code"} • {crew.rank} • {crew.crewStatus}
                      </p>
                      {crew.deploymentContext ? <p className="mt-1 text-sm text-slate-600">{crew.deploymentContext}</p> : null}
                      <p className="mt-2 text-sm font-medium text-slate-700">{getPriorityAction(crew)}</p>
                    </div>
                    <div className="text-sm font-semibold text-cyan-700 transition group-open:text-cyan-800">Open detail</div>
                  </summary>

                  <div className="mt-5 grid gap-4 lg:grid-cols-4">
                    {[
                      { label: "Passport", value: crew.checks.passport },
                      { label: "Seaman Book", value: crew.checks.seamanBook },
                      { label: "Medical", value: crew.checks.medical },
                      { label: "Training", value: crew.checks.training },
                    ].map((item) => (
                      <div key={`${crew.id}-${item.label}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-slate-900">{item.label}</p>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getCheckBadge(item.value.status)}`}>
                            {getCheckLabel(item.value.status)}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-slate-700">{item.value.detail}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {canOpenBiodata ? (
                      <Link href={`/crewing/seafarers/${crew.id}/biodata`} className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-700">
                        Biodata
                      </Link>
                    ) : null}
                    {canOpenCrewDocuments ? (
                      <Link href={`/crewing/seafarers/${crew.id}/documents`} className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-700">
                        Documents
                      </Link>
                    ) : null}
                    {canOpenCrewMedical ? (
                      <Link href={`/crewing/seafarers/${crew.id}/medical`} className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-700">
                        Medical
                      </Link>
                    ) : null}
                    {canOpenCrewTraining ? (
                      <Link href={`/crewing/seafarers/${crew.id}/trainings`} className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-700">
                        Trainings
                      </Link>
                    ) : null}
                    {canOpenPrepareJoining ? (
                      <Link href="/crewing/prepare-joining" className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-700">
                        Prepare Joining
                      </Link>
                    ) : null}
                    {canCreateApplication && crew.isReadyToDeploy ? (
                      <Link href="/crewing/applications/new" className="rounded-full border border-cyan-300 px-3 py-1.5 text-sm font-semibold text-cyan-700 transition hover:border-cyan-600 hover:text-cyan-800">
                        Create Application
                      </Link>
                    ) : !canCreateApplication && crew.isReadyToDeploy ? (
                      <span className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600">
                        Review Ready Crew
                      </span>
                    ) : null}
                    {canOpenDocuments ? (
                      <Link href="/crewing/documents?filter=expiring" className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-700">
                        Expiring Documents
                      </Link>
                    ) : null}
                  </div>
                </details>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
