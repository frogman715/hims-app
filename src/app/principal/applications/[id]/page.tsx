'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { getApplicationWorkflowMeta } from '@/lib/application-workflow';
import { buildMaritimeRegulatoryReadiness } from '@/lib/maritime-regulatory-readiness';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface PrincipalDocumentSummary {
  id: string;
  docType: string;
  docNumber: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  remarks?: string | null;
}

interface PrincipalMedicalSummary {
  id: string;
  checkDate: string;
  expiryDate: string;
  clinicName: string;
  doctorName?: string | null;
  result: string;
  remarks?: string | null;
}

interface PrincipalSeaServiceSummary {
  id: string;
  vesselName: string;
  companyName?: string | null;
  vesselType?: string | null;
  flag?: string | null;
  grt?: number | null;
  engineOutput?: string | null;
  rank: string;
  signOnDate: string;
  signOffDate?: string | null;
  status: string;
  verificationStatus: string;
  remarks?: string | null;
}

interface PrincipalApplicationDetail {
  id: string;
  position: string | null;
  applicationDate: string | null;
  status: string;
  hgiStage: string;
  remarks: string | null;
  crew: {
    id: string;
    fullName: string | null;
    rank: string | null;
    nationality: string | null;
    dateOfBirth: string | null;
    passportNumber: string | null;
    passportExpiry: string | null;
    seamanBookNumber: string | null;
    seamanBookExpiry: string | null;
    phone: string | null;
    email: string | null;
    documents: PrincipalDocumentSummary[];
    medicalChecks: PrincipalMedicalSummary[];
    seaServiceHistories: PrincipalSeaServiceSummary[];
  };
  principal: {
    id: string;
    name: string;
  } | null;
  auditLogs: Array<{
    id: string;
    action: string;
    createdAt: string;
    metadataJson?: Record<string, unknown> | null;
    actor?: {
      name?: string | null;
      email?: string | null;
      role?: string | null;
    } | null;
  }>;
}

const REQUIRED_DOCUMENTS = [
  { key: 'passport', label: 'Passport', match: ['PASSPORT'] },
  { key: 'seaman-book', label: 'Seaman Book', match: ['SEAMAN_BOOK'] },
  { key: 'medical', label: 'Medical Certificate', match: ['MEDICAL', 'MEDICAL_RESULT'] },
  { key: 'stcw', label: 'STCW Basic Suite', match: ['STCW_BST', 'STCW_AFF', 'STCW_MEFA', 'STCW_SCRB'] },
  { key: 'visa', label: 'Visa / Travel Clearance', match: ['VISA', 'SCHENGEN_VISA_NL'] },
] as const;

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

function calculateAge(value?: string | null) {
  if (!value) {
    return null;
  }

  const dob = new Date(value);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthOffset = now.getMonth() - dob.getMonth();
  if (monthOffset < 0 || (monthOffset === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

function diffMonths(from: Date, to: Date) {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

function getExpiryStatus(expiryDate?: string | null) {
  if (!expiryDate) {
    return { status: 'PENDING', label: 'Missing expiry', detail: 'No validity date recorded.' };
  }

  const today = new Date();
  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) {
    return { status: 'PENDING', label: 'Invalid date', detail: 'Review the crew record.' };
  }
  if (expiry < today) {
    return { status: 'EXPIRED', label: 'Expired', detail: `Expired on ${formatDate(expiryDate)}.` };
  }
  if (diffMonths(today, expiry) <= 3) {
    return { status: 'WARNING', label: 'Expiring Soon', detail: `Valid until ${formatDate(expiryDate)}.` };
  }
  return { status: 'APPROVED', label: 'Valid', detail: `Valid until ${formatDate(expiryDate)}.` };
}

function normaliseMedicalResult(result?: string | null) {
  const normalized = result?.trim().toUpperCase() ?? 'PENDING';
  if (normalized === 'PASS' || normalized === 'FIT') {
    return { status: 'APPROVED', label: 'Fit for Duty' };
  }
  if (normalized === 'FAIL' || normalized === 'UNFIT') {
    return { status: 'FAILED', label: 'Not Fit' };
  }
  return { status: 'PENDING', label: 'Medical Review Pending' };
}

function formatDocLabel(docType: string) {
  return docType
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function PrincipalApplicationDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [application, setApplication] = useState<PrincipalApplicationDetail | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadDetail = async (signal?: AbortSignal) => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/principal/applications/${id}`, {
          cache: 'no-store',
          signal,
        });
        const payload = (await response.json().catch(() => null)) as PrincipalApplicationDetail | { error?: string } | null;

        if (!response.ok || !payload || !('id' in payload)) {
          throw new Error((payload as { error?: string } | null)?.error || 'Failed to load submission');
        }

        setApplication(payload);
      } catch (loadError) {
        if ((loadError as Error).name === 'AbortError') {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : 'Failed to load submission');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      void loadDetail(controller.signal);
    }

    return () => controller.abort();
  }, [id]);

  const dossier = useMemo(() => {
    if (!application) {
      return null;
    }

    const documents = application.crew.documents ?? [];
    const medicalChecks = application.crew.medicalChecks ?? [];
    const seaServices = application.crew.seaServiceHistories ?? [];
    const latestMedical = medicalChecks[0] ?? null;
    const age = calculateAge(application.crew.dateOfBirth);
    const validDocuments = documents.filter((document) => getExpiryStatus(document.expiryDate).status === 'APPROVED').length;
    const expiringDocuments = documents.filter((document) => getExpiryStatus(document.expiryDate).status === 'WARNING').length;
    const expiredDocuments = documents.filter((document) => getExpiryStatus(document.expiryDate).status === 'EXPIRED').length;

    const keyDocuments = REQUIRED_DOCUMENTS.map((requirement) => {
      let matchedDocument = documents.find((document) => requirement.match.some((token) => document.docType.includes(token)));
      if (!matchedDocument && requirement.key === 'passport' && application.crew.passportNumber) {
        matchedDocument = {
          id: 'passport-master',
          docType: 'PASSPORT',
          docNumber: application.crew.passportNumber,
          issueDate: null,
          expiryDate: application.crew.passportExpiry,
          remarks: null,
        };
      }
      if (!matchedDocument && requirement.key === 'seaman-book' && application.crew.seamanBookNumber) {
        matchedDocument = {
          id: 'seaman-book-master',
          docType: 'SEAMAN_BOOK',
          docNumber: application.crew.seamanBookNumber,
          issueDate: null,
          expiryDate: application.crew.seamanBookExpiry,
          remarks: null,
        };
      }

      return {
        ...requirement,
        document: matchedDocument,
        readiness: getExpiryStatus(matchedDocument?.expiryDate),
      };
    });

    return {
      age,
      documents,
      seaServices,
      latestMedical,
      validDocuments,
      expiringDocuments,
      expiredDocuments,
      keyDocuments,
    };
  }, [application]);

  const regulatoryReadiness = useMemo(
    () =>
      buildMaritimeRegulatoryReadiness({
        documents: dossier?.documents ?? [],
        passportExpiry: application?.crew.passportExpiry,
        seamanBookExpiry: application?.crew.seamanBookExpiry,
        medicalChecks: application?.crew.medicalChecks ?? [],
      }),
    [application?.crew.medicalChecks, application?.crew.passportExpiry, application?.crew.seamanBookExpiry, dossier?.documents]
  );

  const decisionHistory = useMemo(() => {
    if (!application) {
      return [];
    }

    return (application.auditLogs ?? []).map((entry) => {
      const metadata = (entry.metadataJson ?? {}) as Record<string, unknown>;

      if (entry.action === 'OWNER_APPROVED_APPLICATION' || entry.action === 'OWNER_REJECTED_APPLICATION') {
        return {
          id: entry.id,
          title: entry.action === 'OWNER_APPROVED_APPLICATION' ? 'Principal decision recorded' : 'Principal rejection recorded',
          actor: entry.actor?.name || entry.actor?.email || 'Principal reviewer',
          role: entry.actor?.role || 'PRINCIPAL',
          timestamp: entry.createdAt,
          note: typeof metadata.note === 'string' ? metadata.note : 'No decision note provided.',
          outcome: entry.action === 'OWNER_APPROVED_APPLICATION' ? 'APPROVED' : 'REJECTED',
        };
      }

      if (entry.action === 'APPLICATION_CV_READY') {
        return {
          id: entry.id,
          title: 'CV readiness confirmed',
          actor: entry.actor?.name || entry.actor?.email || 'Document control',
          role: entry.actor?.role || 'CDMO',
          timestamp: entry.createdAt,
          note: 'Document control confirmed the package is complete for internal approval handoff.',
          outcome: 'READY',
        };
      }

      return {
        id: entry.id,
        title: 'Office workflow transition',
        actor: entry.actor?.name || entry.actor?.email || 'Office reviewer',
        role: entry.actor?.role || 'OFFICE',
        timestamp: entry.createdAt,
        note:
          typeof metadata.remarks === 'string' && metadata.remarks.trim().length > 0
            ? metadata.remarks
            : typeof metadata.nextStatus === 'string'
              ? `Workflow moved to ${metadata.nextStatus}.`
              : 'Workflow progressed under controlled office review.',
        outcome: typeof metadata.owner === 'string' ? metadata.owner : 'OFFICE',
      };
    });
  }, [application]);

  const submitDecision = async (decision: 'APPROVE' | 'REJECT') => {
    if (!decisionNote.trim() || decisionNote.trim().length < 3) {
      setError('Please enter a clear approval or rejection note.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const response = await fetch(`/api/principal/applications/${id}/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision,
          note: decisionNote.trim(),
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { data?: PrincipalApplicationDetail; message?: string; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to save decision');
      }

      setSuccess(payload?.message || 'Decision recorded');
      setDecisionNote('');
      const refreshResponse = await fetch(`/api/principal/applications/${id}`, { cache: 'no-store' });
      const refreshedPayload = (await refreshResponse.json().catch(() => null)) as PrincipalApplicationDetail | { error?: string } | null;
      if (!refreshResponse.ok || !refreshedPayload || !('id' in refreshedPayload)) {
        throw new Error((refreshedPayload as { error?: string } | null)?.error || 'Decision saved, but failed to refresh dossier');
      }
      setApplication(refreshedPayload);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save decision');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-slate-800" />
      </div>
    );
  }

  if (!application || !dossier) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-rose-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Submission not available</h1>
          <p className="mt-3 text-sm text-rose-700">{error || 'The requested submission could not be loaded.'}</p>
          <Link
            href="/principal"
            className="mt-6 inline-flex rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Back to Principal Portal
          </Link>
        </div>
      </div>
    );
  }

  const workflow = getApplicationWorkflowMeta(application.hgiStage);
  const isWaitingForDecision = application.hgiStage === 'SENT_TO_OWNER';
  const medicalState = normaliseMedicalResult(dossier.latestMedical?.result);
  const displayName = application.crew.fullName || `Crew ${application.crew.id}`;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe_0%,#f8fafc_42%,#eef2ff_100%)] p-6 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white/95 p-6 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.35)] backdrop-blur sm:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl">
              <Link href="/principal" className="text-sm font-semibold text-slate-500 transition hover:text-slate-800">
                ← Back to Principal Portal
              </Link>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Principal Review Dossier</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{displayName}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Review candidate suitability, sea service exposure, and readiness of controlled papers before recording the principal decision.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Stage</div>
              <div className="mt-3">
                <StatusBadge status={application.hgiStage} label={workflow.label} className="px-3 py-2" />
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Applied Position</p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">{application.position || 'Not specified'}</p>
            <p className="mt-2 text-sm text-slate-600">{application.principal?.name || 'Principal record not linked'}</p>
          </section>
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sea Service Record</p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">{dossier.seaServices.length}</p>
            <p className="mt-2 text-sm text-slate-600">
              {dossier.seaServices[0] ? `Recent rank: ${dossier.seaServices[0].rank}` : 'No sea service history attached'}
            </p>
          </section>
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Document Readiness</p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">{dossier.validDocuments}</p>
            <p className="mt-2 text-sm text-slate-600">
              {dossier.expiredDocuments > 0
                ? `${dossier.expiredDocuments} expired, ${dossier.expiringDocuments} expiring soon`
                : dossier.expiringDocuments > 0
                  ? `${dossier.expiringDocuments} items need renewal planning`
                  : 'Key documents currently valid'}
            </p>
          </section>
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Medical Fitness</p>
            <div className="mt-3">
              <StatusBadge status={medicalState.status} label={medicalState.label} />
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {dossier.latestMedical ? `Valid until ${formatDate(dossier.latestMedical.expiryDate)}` : 'No medical summary attached'}
            </p>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.7fr,1fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Candidate Snapshot</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div>
                  <div className="text-sm text-slate-500">Current Rank</div>
                  <div className="mt-1 font-semibold text-slate-900">{application.crew.rank || '—'}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Nationality</div>
                  <div className="mt-1 font-semibold text-slate-900">{application.crew.nationality || '—'}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Age / Date of Birth</div>
                  <div className="mt-1 font-semibold text-slate-900">
                    {dossier.age ? `${dossier.age} years • ` : ''}{formatDate(application.crew.dateOfBirth)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Submission Date</div>
                  <div className="mt-1 font-semibold text-slate-900">{formatDate(application.applicationDate)}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Passport Number</div>
                  <div className="mt-1 font-semibold text-slate-900">{application.crew.passportNumber || '—'}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Seaman Book Number</div>
                  <div className="mt-1 font-semibold text-slate-900">{application.crew.seamanBookNumber || '—'}</div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sea Service Track Record</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-950">Recent onboard experience</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Focus on rank exposure, vessel type familiarity, company history, and whether the record has already been verified.
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-4">
                {dossier.seaServices.length === 0 ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    No sea service history is attached to this submission yet.
                  </div>
                ) : (
                  dossier.seaServices.map((service) => (
                    <article key={service.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="text-base font-semibold text-slate-900">{service.vesselName}</h3>
                          <p className="mt-1 text-sm text-slate-600">
                            {service.rank}
                            {service.vesselType ? ` • ${service.vesselType}` : ''}
                            {service.companyName ? ` • ${service.companyName}` : ''}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge status={service.status} label={service.status === 'ONGOING' ? 'Onboard' : 'Completed'} />
                          <StatusBadge
                            status={service.verificationStatus === 'VERIFIED' ? 'APPROVED' : 'PENDING'}
                            label={service.verificationStatus === 'VERIFIED' ? 'Verified' : 'Pending Verification'}
                          />
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-4">
                        <div>
                          <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Service Window</span>
                          {formatDate(service.signOnDate)} - {formatDate(service.signOffDate)}
                        </div>
                        <div>
                          <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Flag</span>
                          {service.flag || '—'}
                        </div>
                        <div>
                          <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">GRT</span>
                          {service.grt ? service.grt.toLocaleString('en-US') : '—'}
                        </div>
                        <div>
                          <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Engine Output</span>
                          {service.engineOutput || '—'}
                        </div>
                      </div>
                      {service.remarks ? <p className="mt-3 text-sm text-slate-600">{service.remarks}</p> : null}
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Document Readiness</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">Key operational papers</h2>
              <p className="mt-1 text-sm text-slate-600">
                Only the readiness signal required for principal decision is shown here. Original files remain under office control.
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {dossier.keyDocuments.map((item) => (
                  <article key={item.key} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{item.label}</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.document ? formatDocLabel(item.document.docType) : 'No linked record'}
                        </p>
                      </div>
                      <StatusBadge status={item.readiness.status} label={item.readiness.label} />
                    </div>
                    <div className="mt-3 text-sm text-slate-600">
                      <p>{item.document?.docNumber ? `No. ${item.document.docNumber}` : 'Number not available'}</p>
                      <p className="mt-1">{item.readiness.detail}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Regulatory Readiness</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-950">MLC / STCW / travel review</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    This principal view summarizes the candidate against the core compliance controls typically checked before release to mobilization.
                  </p>
                </div>
                <StatusBadge
                  status={regulatoryReadiness.overallStatus}
                  label={
                    regulatoryReadiness.overallStatus === 'APPROVED'
                      ? 'Regulatory Ready'
                      : regulatoryReadiness.overallStatus === 'WARNING'
                        ? 'Follow-Up Required'
                        : regulatoryReadiness.overallStatus === 'EXPIRED'
                          ? 'Regulatory Blocker'
                          : 'Review Pending'
                  }
                />
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {regulatoryReadiness.buckets.map((bucket) => (
                  <article key={bucket.code} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{bucket.label}</h3>
                        <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{bucket.code.replace(/_/g, ' ')}</p>
                      </div>
                      <StatusBadge status={bucket.status} />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{bucket.detail}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Decision Guidance</p>
              <div className="mt-4 space-y-4 text-sm text-slate-700">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-slate-900">Next controlled step</p>
                  <p className="mt-1">{workflow.nextStep}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-slate-900">Principal review focus</p>
                  <p className="mt-1">
                    Confirm rank suitability, recent vessel exposure, and validity of key papers before approving the nomination for mobilization.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-slate-900">Decision audit rule</p>
                  <p className="mt-1">
                    Every approval or rejection note becomes part of the permanent nomination trail and may be referenced during operational follow-up.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Principal Decision</p>
              {isWaitingForDecision ? (
                <div className="mt-4 space-y-4">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Decision Note</span>
                    <textarea
                      value={decisionNote}
                      onChange={(event) => setDecisionNote(event.target.value)}
                      rows={5}
                      className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                      placeholder="State suitability, availability, commercial fit, or the specific reason for rejection."
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => submitDecision('APPROVE')}
                      className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Approve Nomination'}
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => submitDecision('REJECT')}
                      className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Reject Nomination'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  This submission is no longer waiting for principal decision. Review the recorded note in the nomination history if needed.
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Office Remarks</p>
              {application.remarks ? (
                <div className="mt-4 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700">
                  {application.remarks}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  No office remarks are attached to this submission yet.
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Decision History</p>
              <p className="mt-2 text-sm text-slate-600">
                This review trail shows major internal and principal decisions without exposing raw office notes or unrelated internal records.
              </p>
              <div className="mt-4 space-y-4">
                {decisionHistory.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    No decision history has been recorded for this submission yet.
                  </div>
                ) : (
                  decisionHistory.map((entry) => (
                    <article key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">{entry.title}</h3>
                          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                            {entry.actor} • {entry.role}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge
                            status={entry.outcome}
                            label={
                              entry.outcome === 'APPROVED'
                                ? 'Approved'
                                : entry.outcome === 'REJECTED'
                                  ? 'Rejected'
                                  : entry.outcome === 'READY'
                                    ? 'Ready'
                                    : 'Office Review'
                            }
                          />
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-700">{entry.note}</p>
                      <p className="mt-3 text-xs font-medium text-slate-500">{formatDate(entry.timestamp)}</p>
                    </article>
                  ))
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
