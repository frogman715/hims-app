import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";
import { Button } from "@/components/ui/Button";
import { ADMIN_MAINTENANCE_SCOPES, hasAdminMaintenanceScope } from "@/lib/admin-access";
import { ACTIVE_APPLICATION_STATUSES, detectDuplicateApplicationGroups } from "@/lib/crewing-hardening";
import { buildMaritimeRegulatoryReadiness } from "@/lib/maritime-regulatory-readiness";
import {
  ACTIVE_CONTRACT_STATUSES,
  ACTIVE_DOCUMENT_CONTROL_STATUSES,
  ACTIVE_RECRUITMENT_STATUSES,
  detectContractOverlapGroups,
  detectDuplicateDocumentRegistryGroups,
  detectDuplicateRecruitmentGroups,
} from "@/lib/data-quality-hardening";

export default async function SystemHealthPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  // Only DIRECTOR can access this page
  if (!hasAdminMaintenanceScope({
    roles: session.user.roles,
    role: session.user.role,
    isSystemAdmin: session.user.isSystemAdmin === true,
    adminMaintenanceScopes: session.user.adminMaintenanceScopes,
  }, ADMIN_MAINTENANCE_SCOPES.SYSTEM_HEALTH)) {
    redirect("/403");
  }

  // Get system health data
  const [
    totalCrew,
    activeContracts,
    expiringContracts,
    totalPrincipals,
    totalVessels,
    activePrepareJoining,
    failedEscalationNotifications,
    activeApplications,
    activeContractRecords,
    activeRecruitments,
    activeControlledDocuments,
    crewRegulatoryRecords,
  ] = await Promise.all([
    prisma.crew.count(),
    prisma.employmentContract.count({
      where: { status: 'ACTIVE' }
    }),
    (async () => {
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return prisma.employmentContract.count({
        where: {
          status: 'ACTIVE',
          contractEnd: {
            lte: thirtyDaysLater,
            gte: now
          }
        }
      });
    })(),
    prisma.principal.count(),
    prisma.vessel.count(),
    prisma.prepareJoining.count({
      where: {
        status: {
          in: ['PENDING', 'DOCUMENTS', 'MEDICAL', 'TRAINING', 'TRAVEL', 'READY', 'DISPATCHED'],
        },
      },
    }),
    prisma.escalationNotificationLog.count({
      where: { status: 'FAILED' },
    }),
    prisma.application.findMany({
      where: {
        status: {
          in: [...ACTIVE_APPLICATION_STATUSES],
        },
      },
      select: {
        id: true,
        crewId: true,
        principalId: true,
        position: true,
        status: true,
        createdAt: true,
        crew: {
          select: { fullName: true },
        },
        principal: {
          select: { name: true },
        },
      },
    }),
    prisma.employmentContract.findMany({
      where: {
        status: {
          in: [...ACTIVE_CONTRACT_STATUSES],
        },
      },
      select: {
        id: true,
        crewId: true,
        contractNumber: true,
        contractKind: true,
        status: true,
        contractStart: true,
        contractEnd: true,
        crew: {
          select: { fullName: true },
        },
      },
    }),
    prisma.recruitment.findMany({
      where: {
        status: {
          in: [...ACTIVE_RECRUITMENT_STATUSES],
        },
      },
      select: {
        id: true,
        status: true,
        recruitmentDate: true,
        crew: {
          select: {
            fullName: true,
            rank: true,
            email: true,
            phone: true,
          },
        },
      },
    }),
    prisma.documentControl.findMany({
      where: {
        status: {
          in: ACTIVE_DOCUMENT_CONTROL_STATUSES,
        },
      },
      select: {
        id: true,
        code: true,
        title: true,
        documentType: true,
        department: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.crew.findMany({
      where: {
        status: {
          in: ["STANDBY", "ONBOARD"],
        },
      },
      select: {
        id: true,
        fullName: true,
        passportExpiry: true,
        seamanBookExpiry: true,
        documents: {
          where: { isActive: true },
          select: {
            docType: true,
            expiryDate: true,
          },
        },
        medicalChecks: {
          orderBy: { checkDate: "desc" },
          take: 1,
          select: {
            result: true,
            expiryDate: true,
          },
        },
      },
    }),
  ]);

  const duplicateNominationGroups = detectDuplicateApplicationGroups(activeApplications);
  const duplicateNominationAlerts = duplicateNominationGroups.length;
  const contractOverlapGroups = detectContractOverlapGroups(activeContractRecords);
  const contractOverlapAlerts = contractOverlapGroups.length;
  const duplicateRecruitmentGroups = detectDuplicateRecruitmentGroups(activeRecruitments);
  const duplicateRecruitmentAlerts = duplicateRecruitmentGroups.length;
  const duplicateControlledDocumentGroups = detectDuplicateDocumentRegistryGroups(activeControlledDocuments);
  const duplicateControlledDocumentAlerts = duplicateControlledDocumentGroups.length;
  const regulatoryAlerts = {
    mlcMedicalAlerts: 0,
    stcwComplianceAlerts: 0,
    travelDocumentAlerts: 0,
  };

  crewRegulatoryRecords.forEach((crew) => {
    const readiness = buildMaritimeRegulatoryReadiness({
      documents: crew.documents,
      passportExpiry: crew.passportExpiry,
      seamanBookExpiry: crew.seamanBookExpiry,
      medicalChecks: crew.medicalChecks,
    });

    readiness.buckets.forEach((bucket) => {
      if (bucket.status === "APPROVED") {
        return;
      }

      if (bucket.code === "MLC_2006") {
        regulatoryAlerts.mlcMedicalAlerts += 1;
      } else if (bucket.code === "STCW_2010") {
        regulatoryAlerts.stcwComplianceAlerts += 1;
      } else if (bucket.code === "TRAVEL_DOCUMENTS") {
        regulatoryAlerts.travelDocumentAlerts += 1;
      }
    });
  });

  const totalRegulatoryAlerts =
    regulatoryAlerts.mlcMedicalAlerts +
    regulatoryAlerts.stcwComplianceAlerts +
    regulatoryAlerts.travelDocumentAlerts;
  const totalIntegrityAlerts =
    duplicateNominationAlerts +
    contractOverlapAlerts +
    duplicateRecruitmentAlerts +
    duplicateControlledDocumentAlerts +
    failedEscalationNotifications +
    totalRegulatoryAlerts;

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Admin Monitoring"
        title="System health"
        subtitle="Operational snapshot of core maritime records, contract status, and controlled administrative services."
        helperLinks={[
          { href: '/admin/users', label: 'User Management' },
          { href: '/admin/audit-logs', label: 'Audit Logs' },
        ]}
        highlights={[
          { label: 'Crew Records', value: totalCrew.toLocaleString(), detail: 'Total crew records currently available in the system.' },
          { label: 'Active Contracts', value: activeContracts.toLocaleString(), detail: 'Employment contracts currently live in the platform.' },
          { label: 'Expiring ≤ 30 Days', value: expiringContracts.toLocaleString(), detail: 'Contracts approaching expiry inside the next 30 days.' },
          { label: 'Integrity Alerts', value: totalIntegrityAlerts.toLocaleString(), detail: 'Duplicate workflows, contract overlaps, document duplication, and failed escalations requiring admin follow-up.' },
        ]}
        actions={(
          <Link href="/dashboard">
            <Button size="sm">Dashboard</Button>
          </Link>
        )}
      />

      <section className="surface-card space-y-6 p-6">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">1. Check core services</p>
            <p className="mt-2 text-sm text-slate-600">Review database, API, and authentication status before diagnosing user-facing issues.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">2. Review data coverage</p>
            <p className="mt-2 text-sm text-slate-600">Use record totals to detect gaps in master data, contracts, fleet, or principal coverage.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">3. Escalate abnormal signals</p>
            <p className="mt-2 text-sm text-slate-600">Unexpected drops, spikes, or service failures should be reviewed with admin and operational owners.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">Duplicate nomination alerts</p>
            <p className="mt-2 text-3xl font-semibold text-amber-900">{duplicateNominationAlerts.toLocaleString()}</p>
            <p className="mt-2 text-sm text-amber-800">Active nomination groups that should be consolidated into one workflow path.</p>
          </div>
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
            <p className="text-sm font-semibold text-cyan-900">Active prepare joining</p>
            <p className="mt-2 text-3xl font-semibold text-cyan-900">{activePrepareJoining.toLocaleString()}</p>
            <p className="mt-2 text-sm text-cyan-800">Live mobilization records currently carrying operational workload.</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm font-semibold text-rose-900">Failed escalation deliveries</p>
            <p className="mt-2 text-3xl font-semibold text-rose-900">{failedEscalationNotifications.toLocaleString()}</p>
            <p className="mt-2 text-sm text-rose-800">Notification attempts that require email configuration or recipient follow-up.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
            <p className="text-sm font-semibold text-cyan-900">MLC medical alerts</p>
            <p className="mt-2 text-3xl font-semibold text-cyan-900">{regulatoryAlerts.mlcMedicalAlerts.toLocaleString()}</p>
            <p className="mt-2 text-sm text-cyan-800">Crew records with medical fitness compliance gaps that can block deployment.</p>
          </div>
          <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
            <p className="text-sm font-semibold text-violet-900">STCW certificate alerts</p>
            <p className="mt-2 text-3xl font-semibold text-violet-900">{regulatoryAlerts.stcwComplianceAlerts.toLocaleString()}</p>
            <p className="mt-2 text-sm text-violet-800">Crew records with missing, expiring, or blocked STCW certificate coverage.</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">Travel document alerts</p>
            <p className="mt-2 text-3xl font-semibold text-amber-900">{regulatoryAlerts.travelDocumentAlerts.toLocaleString()}</p>
            <p className="mt-2 text-sm text-amber-800">Passport, seaman book, or visa readiness issues requiring office follow-up.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <p className="text-sm font-semibold text-orange-900">Contract overlap alerts</p>
            <p className="mt-2 text-3xl font-semibold text-orange-900">{contractOverlapAlerts.toLocaleString()}</p>
            <p className="mt-2 text-sm text-orange-800">Crew with overlapping active or draft contracts that should be consolidated into one live agreement path.</p>
          </div>
          <div className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-4">
            <p className="text-sm font-semibold text-fuchsia-900">Duplicate recruitment alerts</p>
            <p className="mt-2 text-3xl font-semibold text-fuchsia-900">{duplicateRecruitmentAlerts.toLocaleString()}</p>
            <p className="mt-2 text-sm text-fuchsia-800">Candidate intake records that appear to represent the same person and should be merged into one workflow.</p>
          </div>
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
            <p className="text-sm font-semibold text-sky-900">Document registry alerts</p>
            <p className="mt-2 text-3xl font-semibold text-sky-900">{duplicateControlledDocumentAlerts.toLocaleString()}</p>
            <p className="mt-2 text-sm text-sky-800">Controlled documents with matching title, type, and department that should move to revision control instead of duplication.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Workflow integrity watch</h2>
          <p className="mt-1 text-sm text-slate-600">
            Use this section to review duplicate active nominations before they create conflicting mobilization or approval paths.
          </p>
          {duplicateNominationGroups.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
              No duplicate nomination groups are currently detected in the active application workflow.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {duplicateNominationGroups.slice(0, 6).map((group) => (
                <div key={group.key} className="rounded-2xl border border-slate-200 px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{group.crewName}</p>
                      <p className="text-sm text-slate-500">
                        {group.position} • {group.principalName}
                      </p>
                      <p className="mt-2 text-sm text-slate-700">
                        {group.count} active nomination records are open across statuses: {group.statuses.join(", ")}.
                      </p>
                    </div>
                    <Link href="/crewing/applications">
                      <Button size="sm" variant="secondary">Open Nominations</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Data quality watch</h2>
          <p className="mt-1 text-sm text-slate-600">
            Review overlapping contracts, duplicate candidate intake, and duplicate document registry records before they distort downstream reporting and approvals.
          </p>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">Contract overlaps</p>
              {contractOverlapGroups.length === 0 ? (
                <p className="mt-2 text-sm text-emerald-700">No overlapping active or draft contracts are currently detected.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {contractOverlapGroups.slice(0, 3).map((group) => (
                    <div key={group.key} className="rounded-2xl border border-slate-200 px-3 py-3">
                      <p className="font-semibold text-slate-900">{group.crewName}</p>
                      <p className="mt-1 text-sm text-slate-600">{group.contractNumbers.join(", ")}</p>
                      <p className="mt-1 text-sm text-slate-700">{group.count} overlapping contract records across statuses: {group.statuses.join(", ")}.</p>
                    </div>
                  ))}
                  <Link href="/contracts">
                    <Button size="sm" variant="secondary">Open Contracts</Button>
                  </Link>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">Duplicate recruitment intake</p>
              {duplicateRecruitmentGroups.length === 0 ? (
                <p className="mt-2 text-sm text-emerald-700">No duplicate candidate intake groups are currently detected.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {duplicateRecruitmentGroups.slice(0, 3).map((group) => (
                    <div key={group.key} className="rounded-2xl border border-slate-200 px-3 py-3">
                      <p className="font-semibold text-slate-900">{group.candidateName}</p>
                      <p className="mt-1 text-sm text-slate-600">{group.position} • Match source: {group.matchedBy.replace("_", " ")}</p>
                      <p className="mt-1 text-sm text-slate-700">{group.count} active recruitment records across statuses: {group.statuses.join(", ")}.</p>
                    </div>
                  ))}
                  <Link href="/hr/recruitment">
                    <Button size="sm" variant="secondary">Open Recruitment</Button>
                  </Link>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">Duplicate controlled documents</p>
              {duplicateControlledDocumentGroups.length === 0 ? (
                <p className="mt-2 text-sm text-emerald-700">No duplicate controlled document groups are currently detected.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {duplicateControlledDocumentGroups.slice(0, 3).map((group) => (
                    <div key={group.key} className="rounded-2xl border border-slate-200 px-3 py-3">
                      <p className="font-semibold text-slate-900">{group.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{group.department} • {group.documentType}</p>
                      <p className="mt-1 text-sm text-slate-700">{group.count} active records across codes: {group.codes.join(", ")}.</p>
                    </div>
                  ))}
                  <Link href="/documents">
                    <Button size="sm" variant="secondary">Open Documents</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Regulatory readiness watch</h2>
          <p className="mt-1 text-sm text-slate-600">
            Review live MLC 2006 medical fitness, STCW 2010 certificate coverage, and travel-document signals from the same admin layer used for integrity monitoring.
          </p>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">MLC 2006 medical fitness</p>
              <p className="mt-2 text-3xl font-semibold text-cyan-900">{regulatoryAlerts.mlcMedicalAlerts.toLocaleString()}</p>
              <p className="mt-2 text-sm text-slate-700">Use readiness and prepare joining desks to clear medical blockers before nomination or release.</p>
              <Link href="/crewing/readiness">
                <Button size="sm" variant="secondary" className="mt-4">Open Readiness</Button>
              </Link>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">STCW 2010 certificate coverage</p>
              <p className="mt-2 text-3xl font-semibold text-violet-900">{regulatoryAlerts.stcwComplianceAlerts.toLocaleString()}</p>
              <p className="mt-2 text-sm text-slate-700">Track certificate gaps that can prevent director release, owner review, or joining clearance.</p>
              <Link href="/crewing/documents?filter=expiring">
                <Button size="sm" variant="secondary" className="mt-4">Open Documents</Button>
              </Link>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">Travel paper readiness</p>
              <p className="mt-2 text-3xl font-semibold text-amber-900">{regulatoryAlerts.travelDocumentAlerts.toLocaleString()}</p>
              <p className="mt-2 text-sm text-slate-700">Follow up passport, seaman book, and visa issues before mobilization commitments are confirmed.</p>
              <Link href="/crewing/prepare-joining">
                <Button size="sm" variant="secondary" className="mt-4">Open Prepare Joining</Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/80 px-5 py-4 text-sm leading-6 text-slate-700">
          Use this board to review core data coverage and confirm that critical platform services remain available for office and operational users.
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-2xl bg-cyan-100 p-3">
              <svg className="h-6 w-6 text-cyan-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Total Crew</p>
              <p className="text-2xl font-bold text-slate-900">{totalCrew.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-2xl bg-emerald-100 p-3">
              <svg className="h-6 w-6 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Active Contracts</p>
              <p className="text-2xl font-bold text-slate-900">{activeContracts.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-2xl bg-amber-100 p-3">
              <svg className="h-6 w-6 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Expiring Contracts (&lt; 30 days)</p>
              <p className="text-2xl font-bold text-slate-900">{expiringContracts.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-2xl bg-violet-100 p-3">
              <svg className="h-6 w-6 text-violet-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Total Principals</p>
              <p className="text-2xl font-bold text-slate-900">{totalPrincipals.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-2xl bg-indigo-100 p-3">
              <svg className="h-6 w-6 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Total Vessels</p>
              <p className="text-2xl font-bold text-slate-900">{totalVessels.toLocaleString()}</p>
            </div>
          </div>
        </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">System Status</h2>
        <p className="mt-1 text-sm text-slate-600">
          Core service indicators below reflect the current application availability used by office desks.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex items-center rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="mr-3 h-3 w-3 rounded-full bg-emerald-500"></div>
            <div>
              <p className="font-medium text-emerald-800">Database</p>
              <p className="text-sm text-emerald-700">Connected</p>
            </div>
          </div>
          <div className="flex items-center rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="mr-3 h-3 w-3 rounded-full bg-emerald-500"></div>
            <div>
              <p className="font-medium text-emerald-800">API Services</p>
              <p className="text-sm text-emerald-700">Operational</p>
            </div>
          </div>
          <div className="flex items-center rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="mr-3 h-3 w-3 rounded-full bg-emerald-500"></div>
            <div>
              <p className="font-medium text-emerald-800">Authentication</p>
              <p className="text-sm text-emerald-700">Active</p>
            </div>
          </div>
        </div>
        </div>
      </section>
    </div>
  );
}
