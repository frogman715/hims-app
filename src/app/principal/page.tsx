'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getApplicationWorkflowMeta } from '@/lib/application-workflow';
import { buildMaritimeRegulatoryReadiness } from '@/lib/maritime-regulatory-readiness';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface PrincipalListDocument {
  id: string;
  docType: string;
  expiryDate: string | null;
}

interface PrincipalListMedical {
  id: string;
  expiryDate: string | null;
  result: string;
}

interface PrincipalListSeaService {
  id: string;
  vesselName: string;
  companyName?: string | null;
  vesselType?: string | null;
  rank: string;
  signOnDate: string;
  signOffDate?: string | null;
  verificationStatus: string;
}

interface PrincipalApplication {
  id: string;
  position: string | null;
  applicationDate: string | null;
  status: string;
  hgiStage: string;
  crew: {
    id: string;
    fullName: string | null;
    rank: string | null;
    nationality: string | null;
    passportExpiry?: string | null;
    seamanBookExpiry?: string | null;
    documents: PrincipalListDocument[];
    medicalChecks: PrincipalListMedical[];
    seaServiceHistories: PrincipalListSeaService[];
  };
  principal: {
    id: string;
    name: string;
  } | null;
}

interface PrincipalApplicationResponse {
  data: PrincipalApplication[];
  total: number;
  principal: {
    id: string;
    name: string | null;
  };
}

const FILTERS = [
  { value: 'ALL', label: 'All Decisions' },
  { value: 'SENT_TO_OWNER', label: 'Waiting for Review' },
  { value: 'PRE_JOINING', label: 'Approved' },
  { value: 'OWNER_REJECTED', label: 'Owner Rejected' },
];

function formatDate(value?: string | null) {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function normaliseMedicalResult(result?: string | null) {
  const normalized = result?.trim().toUpperCase() ?? 'PENDING';
  if (normalized === 'PASS' || normalized === 'FIT') {
    return 'APPROVED';
  }
  if (normalized === 'FAIL' || normalized === 'UNFIT') {
    return 'FAILED';
  }
  return 'PENDING';
}

export default function PrincipalPortalPage() {
  const [applications, setApplications] = useState<PrincipalApplication[]>([]);
  const [principalName, setPrincipalName] = useState<string>('Principal Portal');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadApplications = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/principal/applications', {
          cache: 'no-store',
          signal: controller.signal,
        });
        const payload = (await response.json().catch(() => null)) as PrincipalApplicationResponse | null;

        if (!response.ok || !payload) {
          throw new Error((payload as { error?: string } | null)?.error || 'Failed to load principal submissions');
        }

        setApplications(payload.data ?? []);
        setPrincipalName(payload.principal?.name?.trim() || 'Principal Portal');
      } catch (loadError) {
        if ((loadError as Error).name === 'AbortError') {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : 'Failed to load principal submissions');
      } finally {
        setLoading(false);
      }
    };

    void loadApplications();

    return () => controller.abort();
  }, []);

  const summary = useMemo(() => {
    const readinessRisks = applications.filter((item) => {
      const readiness = buildMaritimeRegulatoryReadiness({
        documents: item.crew.documents ?? [],
        passportExpiry: item.crew.passportExpiry,
        seamanBookExpiry: item.crew.seamanBookExpiry,
        medicalChecks: item.crew.medicalChecks ?? [],
      });
      return readiness.overallStatus !== 'APPROVED';
    }).length;

    return {
      pending: applications.filter((item) => item.hgiStage === 'SENT_TO_OWNER').length,
      approved: applications.filter((item) => item.hgiStage === 'PRE_JOINING').length,
      rejected: applications.filter((item) => item.hgiStage === 'OWNER_REJECTED').length,
      readinessRisks,
    };
  }, [applications]);

  const visibleApplications = useMemo(
    () => applications.filter((application) => (selectedStatus === 'ALL' ? true : application.hgiStage === selectedStatus)),
    [applications, selectedStatus]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-slate-800" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe_0%,#f8fafc_42%,#eef2ff_100%)] p-6 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white/95 p-6 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.35)] backdrop-blur sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Principal Review Desk</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{principalName}</h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
            Review only the submissions assigned to your principal account. This desk surfaces readiness risks, recent sea service, and the controlled decision path before a candidate is released to mobilization.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Waiting Review</div>
            <div className="mt-2 text-3xl font-semibold text-slate-950">{summary.pending}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Approved for Mobilization</div>
            <div className="mt-2 text-3xl font-semibold text-emerald-700">{summary.approved}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rejected by Principal</div>
            <div className="mt-2 text-3xl font-semibold text-rose-700">{summary.rejected}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Readiness Risks</div>
            <div className="mt-2 text-3xl font-semibold text-amber-700">{summary.readinessRisks}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {FILTERS.map((filter) => {
            const active = filter.value === selectedStatus;
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setSelectedStatus(filter.value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-300 bg-white text-slate-700 hover:border-slate-500'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {visibleApplications.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">No submissions available</h2>
            <p className="mt-3 text-sm text-slate-600">
              There are no principal review records in this status right now.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleApplications.map((application) => {
              const workflow = getApplicationWorkflowMeta(application.hgiStage);
              const latestService = application.crew.seaServiceHistories?.[0] ?? null;
              const latestMedical = application.crew.medicalChecks?.[0] ?? null;
              const medicalSignal = normaliseMedicalResult(latestMedical?.result);
              const regulatoryReadiness = buildMaritimeRegulatoryReadiness({
                documents: application.crew.documents ?? [],
                passportExpiry: application.crew.passportExpiry,
                seamanBookExpiry: application.crew.seamanBookExpiry,
                medicalChecks: application.crew.medicalChecks ?? [],
              });
              const readinessState = regulatoryReadiness.overallStatus;

              return (
                <article key={application.id} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Candidate</p>
                        <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                          {application.crew.fullName || `Crew ${application.crew.id}`}
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">
                          {application.crew.rank || 'Rank not recorded'}
                          {application.crew.nationality ? ` • ${application.crew.nationality}` : ''}
                          {application.position ? ` • Applied as ${application.position}` : ''}
                        </p>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Workflow</div>
                          <div className="mt-2">
                            <StatusBadge status={application.hgiStage} label={workflow.label} />
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Document Readiness</div>
                          <div className="mt-2">
                            <StatusBadge
                              status={readinessState}
                              label={
                                readinessState === 'APPROVED'
                                  ? 'Key Papers Valid'
                                  : readinessState === 'WARNING'
                                    ? 'Expiring Soon'
                                    : readinessState === 'EXPIRED'
                                      ? 'Readiness Blocked'
                                    : 'Needs Review'
                              }
                            />
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Medical</div>
                          <div className="mt-2">
                            <StatusBadge
                              status={medicalSignal}
                              label={
                                medicalSignal === 'APPROVED'
                                  ? 'Fit for Duty'
                                  : medicalSignal === 'FAILED'
                                    ? 'Medical Blocker'
                                    : 'Medical Pending'
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Submitted Date</div>
                          <div className="mt-1 text-sm font-medium text-slate-900">{formatDate(application.applicationDate)}</div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Recent Sea Service</div>
                          <div className="mt-1 text-sm font-medium text-slate-900">
                            {latestService ? `${latestService.rank} • ${latestService.vesselName}` : 'No service history attached'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Verification</div>
                          <div className="mt-1 text-sm font-medium text-slate-900">
                            {latestService
                              ? latestService.verificationStatus === 'VERIFIED'
                                ? 'Sea service verified'
                                : 'Pending service verification'
                              : 'Awaiting supporting record'}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        {workflow.nextStep}
                        {latestService
                          ? ` Recent service window: ${formatDate(latestService.signOnDate)} - ${formatDate(latestService.signOffDate)}.`
                          : ''}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {regulatoryReadiness.buckets.map((bucket) => (
                          <StatusBadge key={`${application.id}-${bucket.code}`} status={bucket.status} label={bucket.code.replace(/_/g, ' ')} />
                        ))}
                      </div>
                    </div>

                    <div className="flex min-w-[240px] flex-col gap-3">
                      <Link
                        href={`/principal/applications/${application.id}`}
                        className="rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-700"
                      >
                        Open Review Dossier
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
