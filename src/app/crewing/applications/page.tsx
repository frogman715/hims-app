"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense, useCallback } from "react";
import Link from "next/link";
import { UserRole } from "@/lib/permissions";
import { normalizeToUserRoles } from "@/lib/type-guards";
import { getApplicationWorkflowMeta } from "@/lib/application-workflow";
import { WorkspaceEmptyState } from "@/components/feedback/WorkspaceEmptyState";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface Application {
  id: string;
  position: string;
  applicationDate: string;
  status: string;
  hgiStage: string;
  cvReadyAt: string | null;
  hasPrepareJoining: boolean;
  reviewedBy: string | null;
  reviewedAt: string | null;
  remarks: string | null;
  crew: {
    id: string;
    fullName: string;
    nationality: string | null;
    rank: string;
    phone: string | null;
    email: string | null;
  };
  principal: {
    id: string;
    name: string;
  } | null;
}

const STAGE_FILTERS = [
  { value: 'ALL', label: 'All Workflow Stages', icon: '📋' },
  { value: 'DRAFT', label: 'Draft Intake', icon: '📝' },
  { value: 'DOCUMENT_CHECK', label: 'Document Review', icon: '🔍' },
  { value: 'CV_READY', label: 'CV Ready for Internal Approval', icon: '🗂️' },
  { value: 'SUBMITTED_TO_DIRECTOR', label: 'Waiting Director Review', icon: '🧭' },
  { value: 'DIRECTOR_APPROVED', label: 'Approved for Principal Review', icon: '✅' },
  { value: 'SENT_TO_OWNER', label: 'Waiting Principal Decision', icon: '💼' },
  { value: 'OWNER_APPROVED', label: 'Principal Approved', icon: '🤝' },
  { value: 'PRE_JOINING', label: 'Handed to Prepare Joining', icon: '✈️' },
  { value: 'OWNER_REJECTED', label: 'Principal Rejected', icon: '❌' },
] as const;

function getWorkflowOwner(stage: string) {
  switch (stage) {
    case 'DRAFT':
    case 'DOCUMENT_CHECK':
    case 'CV_READY':
      return 'Crewing Document Control';
    case 'SUBMITTED_TO_DIRECTOR':
    case 'DIRECTOR_APPROVED':
      return 'Director';
    case 'SENT_TO_OWNER':
    case 'OWNER_APPROVED':
    case 'OWNER_REJECTED':
      return 'Principal';
    case 'PRE_JOINING':
      return 'Operational Control';
    default:
      return 'Review Only';
  }
}

function ApplicationsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>(searchParams.get('stage') || 'ALL');
  const userRoles = normalizeToUserRoles(session?.user?.roles);
  const canDocumentFlow = userRoles.includes(UserRole.CDMO);
  const canDirectorFlow = userRoles.includes(UserRole.DIRECTOR);
  const canCreateApplications = canDocumentFlow;

  const fetchApplications = useCallback(async () => {
    if (status === "loading") {
      return;
    }
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = '/api/applications';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setApplications(data.data || data);
      } else {
        setError("Failed to fetch applications");
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  }, [router, session, status]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleStatusChange = async (applicationId: string, newStatus: string, requireNote = false) => {
    try {
      setError(null);
      let remarks: string | undefined;
      if (requireNote) {
        const note = window.prompt('Enter a rejection or cancellation note for audit trail:');
        if (!note || note.trim().length < 3) {
          setError('A clear rejection note is required.');
          return;
        }
        remarks = note.trim();
      }
      const response = await fetch(`/api/crewing/applications/${applicationId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus, remarks })
      });

      if (response.ok) {
        fetchApplications();
      } else {
        const payload = await response.json().catch(() => null);
        setError(payload?.error || "Failed to update application status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      setError(error instanceof Error ? error.message : "Failed to update application status");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-slate-900" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <section className="surface-card border-rose-200 bg-rose-50 p-6">
        <h3 className="text-lg font-semibold text-rose-900">Error Loading Applications</h3>
        <p className="mt-2 text-sm text-rose-700">{error}</p>
        <div className="mt-4">
          <Button type="button" variant="danger" size="sm" onClick={() => fetchApplications()}>
            Try Again
          </Button>
        </div>
      </section>
    );
  }

  const getStatusBadge = (stage: string) => {
    const workflow = getApplicationWorkflowMeta(stage);
    return <StatusBadge status={stage} label={workflow.label} className="px-3 py-2" />;
  };

  const getNextAction = (status: string) => {
    const nextActions: Record<string, string> = {
      RECEIVED: 'Crewing Document Control starts intake and validates the nomination package.',
      REVIEWING: 'Crewing Document Control completes certificate review and confirms CV readiness.',
      INTERVIEW: 'Director reviews the completed nomination package for internal approval.',
      PASSED: 'Director releases the case to principal review.',
      OFFERED: 'Wait for principal approval or rejection in the principal portal.',
      ACCEPTED: 'Operational Control continues this case in Prepare Joining.',
      REJECTED: 'Keep the principal rejection visible and traceable.',
      CANCELLED: 'Stop workflow and keep the case closed for audit history.',
      FAILED: 'Selection ended without hire. Keep the case for historical reference.',
    };

    return nextActions[status] || 'Review the record and confirm the next office action.';
  };

  const visibleApplications = applications.filter((application) =>
    selectedStatus === 'ALL' ? true : application.hgiStage === selectedStatus
  );

  return (
    <div className="section-stack">
      <section className="surface-card p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Nomination Workflow</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Deployment applications</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Track nomination, screening, internal approval, and handover to principal and operations in one office board.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => router.push("/crewing/workflow")}>
              Workflow
            </Button>
            {canCreateApplications ? (
              <Link href="/crewing/applications/new" className="action-pill text-sm">
                Register nomination
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="surface-card border-sky-200 bg-sky-50/70 p-5">
        <p className="text-sm font-semibold text-sky-900">Main flow</p>
        <p className="mt-1 text-sm text-sky-800">
          Recruitment → Hired → Seafarer → Readiness → Application → Principal Approval → Prepare Joining → Assignment / Onboard. Use this page only after readiness review is complete and the deployment case is tied to a real seafarer, rank, and principal.
        </p>
        <p className="mt-2 text-sm font-medium text-sky-900">
          Next step: document control moves the case to CV Ready, director approves internally, principal decides, then Operations takes over only after the case is visible as Principal Approved or Pre-Joining.
        </p>
      </section>

      <section className="surface-card p-5">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {STAGE_FILTERS.map((option) => {
            const isActive = selectedStatus === option.value;
            const activeClasses = isActive
              ? "border-sky-600 bg-sky-600 text-white shadow-sm"
              : "border-slate-300 bg-white text-slate-700 hover:border-sky-400 hover:text-sky-700";

            return (
              <button
                key={option.value}
                onClick={() => setSelectedStatus(option.value)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all ${activeClasses}`}
              >
                {option.icon} {option.label}
              </button>
            );
          })}
        </div>
      </section>

      {visibleApplications.length === 0 ? (
        <section className="surface-card p-12 text-center">
            <WorkspaceEmptyState
              title="No nomination records in this workflow view"
              message={`No nomination records are currently sitting in stage ${selectedStatus}.`}
            />
            <div className="mt-6">
            {canCreateApplications ? (
              <Link href="/crewing/applications/new" className="action-pill">
                Register nomination
              </Link>
            ) : null}
            </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-4">
            {visibleApplications.map((application) => (
              <div
                key={application.id}
                className="surface-card p-6 transition-all duration-200 hover:border-sky-300"
              >
                {(() => {
                  const workflow = getApplicationWorkflowMeta(application.hgiStage);
                  return (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-sky-600 text-lg font-bold text-white">
                          {(application.crew.fullName || "C").charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900">
                          {application.crew.fullName || `Crew ${application.crew.id}`}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {application.crew.nationality || 'N/A'} • Current: {application.crew.rank}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
                      <div>
                        <div className="text-sm text-slate-500 mb-1">Applied Position</div>
                        <div className="font-semibold text-slate-900">{application.position}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-500 mb-1">Principal</div>
                        <div className="font-semibold text-slate-900">
                          {application.principal?.name || 'Any'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-500 mb-1">Application Date</div>
                        <div className="font-semibold text-slate-900">
                          {new Date(application.applicationDate).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-500 mb-1">Status</div>
                        {getStatusBadge(application.hgiStage)}
                      </div>
                      <div>
                        <div className="text-sm text-slate-500 mb-1">Current Owner</div>
                        <div className="font-semibold text-slate-900">{getWorkflowOwner(application.hgiStage)}</div>
                      </div>
                    </div>

                    <div className="flex gap-4 text-sm text-slate-600">
                      {application.crew.phone && (
                        <div className="flex items-center gap-1">
                          📱 {application.crew.phone}
                        </div>
                      )}
                      {application.crew.email && (
                        <div className="flex items-center gap-1">
                          ✉️ {application.crew.email}
                        </div>
                      )}
                    </div>

                    {application.remarks && (
                      <div className="mt-3 rounded-lg bg-slate-100 p-3">
                        <div className="text-sm text-slate-500 mb-1">Remarks</div>
                        <div className="text-sm text-slate-700">{application.remarks}</div>
                      </div>
                    )}

                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next Action</div>
                      <div className="mt-1 text-sm text-slate-800">{workflow.nextStep || getNextAction(application.status)}</div>
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col gap-2">
                    <Link
                      href={`/crewing/applications/${application.id}`}
                      className="rounded-lg bg-sky-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-sky-700"
                    >
                      View Details
                    </Link>
                    
                    <a
                      href={`/api/forms/cr-02/${application.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-violet-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-violet-700"
                    >
                      📄 Download CR-02
                    </a>
                    
                    {canDocumentFlow && application.hgiStage === 'DRAFT' && (
                      <button
                        onClick={() => handleStatusChange(application.id, 'REVIEWING')}
                        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                        >
                          Begin Document Review
                        </button>
                    )}
                    
                    {canDocumentFlow && application.hgiStage === 'DOCUMENT_CHECK' && (
                      <>
                        <button
                          onClick={async () => {
                            try {
                              setError(null);
                              const response = await fetch(`/api/crewing/applications/${application.id}/cv-ready`, {
                                method: 'POST',
                              });
                              const payload = await response.json().catch(() => null);
                          if (!response.ok) {
                                setError(payload?.error || 'Failed to mark CV ready');
                                return;
                              }
                              fetchApplications();
                            } catch (markError) {
                              setError(markError instanceof Error ? markError.message : 'Failed to mark CV ready');
                            }
                          }}
                          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
                        >
                          Confirm CV Ready
                        </button>
                        <button
                          onClick={() => handleStatusChange(application.id, 'CANCELLED', true)}
                          className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
                        >
                          Close with Note
                        </button>
                      </>
                    )}

                    {canDocumentFlow && application.hgiStage === 'CV_READY' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(application.id, 'INTERVIEW')}
                          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
                        >
                          Submit for Director Review
                        </button>
                        <button
                          onClick={() => handleStatusChange(application.id, 'CANCELLED', true)}
                          className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
                        >
                          Close with Note
                        </button>
                      </>
                    )}

                    {canDirectorFlow && application.hgiStage === 'SUBMITTED_TO_DIRECTOR' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(application.id, 'PASSED')}
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                          Approve for Principal Review
                        </button>
                        <button
                          onClick={() => handleStatusChange(application.id, 'CANCELLED', true)}
                          className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
                        >
                          Close with Note
                        </button>
                      </>
                    )}

                    {canDirectorFlow && application.hgiStage === 'DIRECTOR_APPROVED' && (
                      <button
                        onClick={() => handleStatusChange(application.id, 'OFFERED')}
                        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                      >
                        Release to Principal
                      </button>
                    )}

                    {application.hgiStage === 'SENT_TO_OWNER' ? (
                      <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-900">
                        Waiting for principal decision
                      </div>
                    ) : null}
                  </div>
                </div>
                  );
                })()}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default function Applications() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-slate-900" />
      </div>
    }>
      <ApplicationsContent />
    </Suspense>
  );
}
