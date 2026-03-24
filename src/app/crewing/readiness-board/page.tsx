import Link from "next/link";
import { requireAuthorizedUser } from "@/lib/authz";
import { PermissionLevel } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessOfficePath, getPrimaryOfficeRole } from "@/lib/office-access";

type ReminderItem = {
  id: string;
  crewId: string;
  crewCode: string | null;
  fullName: string;
  rank: string;
  crewStatus: string;
  readinessStatus: string;
  vesselName: string | null;
  principalName: string | null;
  reminderType: string;
  dueLabel: string;
};

function formatDate(value: Date | null) {
  if (!value) return "No date";
  return value.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatReadinessLabel(value: string) {
  if (value === "READY") return "Ready for Review";
  if (value === "DOCUMENT_ALERT") return "Blocked by Missing/Expiring Items";
  if (value === "DOCUMENTS") return "Documents In Progress";
  if (value === "MEDICAL") return "Medical In Progress";
  if (value === "TRAINING") return "Training In Progress";
  if (value === "TRAVEL") return "Travel In Progress";
  if (value === "PENDING") return "Pending Office Review";
  return value;
}

function getReadinessBadge(value: string) {
  if (value === "READY") return "bg-emerald-100 text-emerald-700";
  if (value === "DOCUMENT_ALERT") return "bg-rose-100 text-rose-700";
  if (value === "TRAVEL") return "bg-sky-100 text-sky-700";
  if (value === "MEDICAL" || value === "TRAINING" || value === "DOCUMENTS") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
}

function getNextAction(item: ReminderItem) {
  if (item.readinessStatus === "READY") {
    return "Complete final joining review and confirm movement timing.";
  }
  if (item.readinessStatus === "DOCUMENT_ALERT") {
    return "Check expiring documents and coordinate renewal before deployment.";
  }
  if (item.readinessStatus === "DOCUMENTS") {
    return "Finish document verification before moving to medical and travel steps.";
  }
  if (item.readinessStatus === "MEDICAL") {
    return "Confirm medical completion and update the joining record.";
  }
  if (item.readinessStatus === "TRAINING") {
    return "Verify orientation or training completion before dispatch review.";
  }
  if (item.readinessStatus === "TRAVEL") {
    return "Finalize tickets, hotel, and transport plan.";
  }
  return "Review the current joining record and clear the next blocker.";
}

export default async function ReadinessBoardPage() {
  await requireAuthorizedUser({
    redirectIfCrew: "/m/crew",
    module: "crewing",
    requiredLevel: PermissionLevel.VIEW_ACCESS,
  });

  const session = await getServerSession(authOptions);
  const roles = getPrimaryOfficeRole(session?.user?.roles, session?.user?.role);
  const isSystemAdmin = session?.user?.isSystemAdmin === true;
  const canOpenDocuments = canAccessOfficePath("/crewing/documents", roles, isSystemAdmin);
  const canOpenDataQuality = canAccessOfficePath("/crewing/data-quality", roles, isSystemAdmin);
  const canOpenBiodata = canAccessOfficePath("/crewing/seafarers/candidate/biodata", roles, isSystemAdmin);
  const canOpenPrepareJoining = canAccessOfficePath("/crewing/prepare-joining", roles, isSystemAdmin);

  const now = new Date();
  const fourteenDaysFromNow = new Date(now);
  fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

  const [prepareJoinings, expiringDocuments] = await Promise.all([
    prisma.prepareJoining.findMany({
      where: {
        status: {
          in: ["PENDING", "DOCUMENTS", "MEDICAL", "TRAINING", "TRAVEL", "READY"],
        },
      },
      orderBy: { updatedAt: "desc" },
      include: {
        crew: {
          select: {
            id: true,
            crewCode: true,
            fullName: true,
            rank: true,
            crewStatus: true,
          },
        },
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
      take: 40,
    }),
    prisma.crewDocument.findMany({
      where: {
        isActive: true,
        expiryDate: {
          gte: now,
          lte: fourteenDaysFromNow,
        },
      },
      orderBy: { expiryDate: "asc" },
      include: {
        crew: {
          select: {
            id: true,
            crewCode: true,
            fullName: true,
            rank: true,
            crewStatus: true,
          },
        },
      },
      take: 40,
    }),
  ]);

  const reminderItems: ReminderItem[] = [
    ...prepareJoinings.map((item) => ({
      id: `pj-${item.id}`,
      crewId: item.crew.id,
      crewCode: item.crew.crewCode,
      fullName: item.crew.fullName,
      rank: item.crew.rank,
      crewStatus: item.crew.crewStatus,
      readinessStatus: item.status,
      vesselName: item.vessel?.name ?? null,
      principalName: item.principal?.name ?? null,
      reminderType: "Prepare Joining",
      dueLabel: item.departureDate ? `Departure ${formatDate(item.departureDate)}` : "Follow up required",
    })),
    ...expiringDocuments.map((item) => ({
      id: `doc-${item.id}`,
      crewId: item.crew.id,
      crewCode: item.crew.crewCode,
      fullName: item.crew.fullName,
      rank: item.crew.rank,
      crewStatus: item.crew.crewStatus,
      readinessStatus: "DOCUMENT_ALERT",
      vesselName: null,
      principalName: null,
      reminderType: `${item.docType} Expiry`,
      dueLabel: `Expires ${formatDate(item.expiryDate)}`,
    })),
  ].sort((left, right) => left.fullName.localeCompare(right.fullName));

  const summary = {
    total: reminderItems.length,
    prepareJoining: prepareJoinings.length,
    documentAlerts: expiringDocuments.length,
    readyToMove: prepareJoinings.filter((item) => item.status === "READY").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Reminder Queue
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Readiness Board</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Active prepare-joining follow-ups and near-term document expiry reminders in one board for office action.
            </p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              Advisory only. Reminder queue items are queued only and are not sent automatically. This board does not replace manual Prepare Joining.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/crewing/readiness" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
              Readiness Hub
            </Link>
            <Link href="/crewing/prepare-joining" className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
              Prepare Joining
            </Link>
            {canOpenDocuments ? (
              <Link href="/crewing/documents" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                Documents
              </Link>
            ) : null}
            {canOpenDataQuality ? (
              <Link href="/crewing/data-quality" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                Data Quality
              </Link>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total reminders</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{summary.total}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Prepare joining</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{summary.prepareJoining}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Document alerts</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{summary.documentAlerts}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Ready to move</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{summary.readyToMove}</p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Board Purpose</p>
            <p className="mt-3 text-sm text-slate-700">
              Use this board to decide who needs document follow-up, who should move to Prepare Joining review, and which crew can proceed to dispatch.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Priority Queue</p>
            <p className="mt-3 text-2xl font-semibold text-amber-950">{summary.documentAlerts + summary.prepareJoining - summary.readyToMove}</p>
            <p className="mt-1 text-sm text-amber-900">Crew still need manual office follow-up before they are ready to move.</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Ready To Move</p>
            <p className="mt-3 text-2xl font-semibold text-emerald-950">{summary.readyToMove}</p>
            <p className="mt-1 text-sm text-emerald-900">Prepare Joining records already marked ready and waiting for final movement handling.</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Queue</h2>
            <p className="mt-1 text-sm text-slate-500">Review due items, then jump directly to biodata, documents, or Prepare Joining from the same row.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Crew</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Reminder</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Readiness</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Vessel / Principal</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Due</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reminderItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                      No active reminders.
                    </td>
                  </tr>
                ) : (
                  reminderItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{item.fullName}</div>
                        <div className="text-slate-500">
                          {item.crewCode ?? "No code"} • {item.rank} • {item.crewStatus}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{item.reminderType}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getReadinessBadge(item.readinessStatus)}`}>
                          {formatReadinessLabel(item.readinessStatus)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {item.vesselName ?? "-"}
                        {item.principalName ? ` / ${item.principalName}` : ""}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {canOpenBiodata ? (
                          <Link href={`/crewing/seafarers/${item.crewId}/biodata`} className="font-medium text-emerald-700 hover:text-emerald-800">
                            {item.dueLabel}
                          </Link>
                        ) : (
                          item.dueLabel
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <p className="text-sm text-slate-700">{getNextAction(item)}</p>
                          <div className="flex flex-wrap gap-2">
                            {canOpenBiodata ? (
                              <Link href={`/crewing/seafarers/${item.crewId}/biodata`} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-emerald-500 hover:text-emerald-700">
                                Biodata
                              </Link>
                            ) : null}
                            {canOpenDocuments ? (
                              <Link href="/crewing/documents?filter=expiring" className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-emerald-500 hover:text-emerald-700">
                                Documents
                              </Link>
                            ) : null}
                            {canOpenPrepareJoining ? (
                              <Link href="/crewing/prepare-joining" className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-emerald-500 hover:text-emerald-700">
                                Prepare Joining
                              </Link>
                            ) : null}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
