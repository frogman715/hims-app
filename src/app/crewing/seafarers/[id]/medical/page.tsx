'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { WorkspaceHero } from '@/components/layout/WorkspaceHero';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface MedicalRecord {
  id: string;
  type: string;
  date: string | null;
  result: string | null;
  remarks: string | null;
  approvedBy: string | null;
}

interface Seafarer {
  id: string;
  fullName: string | null;
  medicalChecks?: Array<{
    id: string;
    checkDate: string;
    clinicName: string;
    doctorName: string | null;
    result: string;
    remarks: string | null;
  }>;
}

function getCrewDisplayName(seafarer: Pick<Seafarer, 'id' | 'fullName'>) {
  const normalized = seafarer.fullName?.trim();
  return normalized && normalized.length > 0 ? normalized : `Crew ${seafarer.id}`;
}

export default function SeafarerMedicalPage() {
  const router = useRouter();
  const params = useParams();
  const seafarerId = params.id as string;

  const [seafarer, setSeafarer] = useState<Seafarer | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const fetchSeafarer = useCallback(async () => {
    try {
      setError(null);
      setErrorCode(null);
      const response = await fetch(`/api/crewing/seafarers/${seafarerId}`, { cache: 'no-store' });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload) {
        const message =
          payload?.error ||
          (response.status === 404
            ? 'Seafarer record was not found in the active crew database.'
            : response.status === 403
              ? 'You do not have permission to open this medical review.'
              : response.status === 401
                ? 'Your session expired. Please sign in again.'
                : 'Medical review data could not be loaded.');
        setSeafarer(null);
        setMedicalRecords([]);
        setError(message);
        setErrorCode(payload?.code || String(response.status));
        return;
      }

      setSeafarer(payload);
      setMedicalRecords(
        Array.isArray(payload.medicalChecks)
          ? payload.medicalChecks.map((record: Seafarer['medicalChecks'][number]) => ({
              id: record.id,
              type: record.clinicName || 'Medical Check',
              date: record.checkDate ?? null,
              result: record.result ?? null,
              remarks: record.remarks ?? null,
              approvedBy: record.doctorName ?? null,
            }))
          : []
      );
    } catch (fetchError) {
      console.error('Error fetching medical review data:', fetchError);
      setSeafarer(null);
      setMedicalRecords([]);
      setError(fetchError instanceof Error ? fetchError.message : 'Medical review data could not be loaded.');
      setErrorCode('FETCH_FAILED');
    } finally {
      setLoading(false);
    }
  }, [seafarerId]);

  useEffect(() => {
    if (seafarerId) {
      fetchSeafarer();
    }
  }, [seafarerId, fetchSeafarer]);

  if (loading) {
    return (
      <div className="section-stack">
        <div className="surface-card px-6 py-12 text-center text-sm text-slate-600">Loading medical review...</div>
      </div>
    );
  }

  if (!seafarer) {
    return (
      <div className="section-stack">
        <section className="surface-card space-y-4 px-6 py-8 text-center">
          <h1 className="text-xl font-semibold text-slate-950">Unable To Open Medical Review</h1>
          <p className="mx-auto max-w-2xl text-sm text-slate-600">{error || 'Seafarer record is unavailable.'}</p>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-rose-600">
            Crew ID {seafarerId}
            {errorCode ? ` • ${errorCode}` : ''}
          </p>
          <div className="flex justify-center gap-3">
            <Button type="button" variant="secondary" size="sm" onClick={() => router.push('/crewing/seafarers')}>
              Back to Register
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Medical Review"
        title={`Medical review: ${getCrewDisplayName(seafarer)}`}
        subtitle="Review clinic outcomes, doctor references, and office remarks before clearance or reassignment decisions are made."
        helperLinks={[
          { href: `/crewing/seafarers/${seafarerId}/biodata`, label: 'Biodata' },
          { href: `/crewing/seafarers/${seafarerId}/documents`, label: 'Documents' },
          { href: '/crewing/prepare-joining', label: 'Prepare joining' },
        ]}
        highlights={[
          { label: 'Medical Entries', value: medicalRecords.length, detail: 'Medical review entries loaded for this crew record.' },
          { label: 'Use Mode', value: 'Review Only', detail: 'Use this page to assess fitness evidence, not to drive deployment status directly.' },
        ]}
        actions={(
          <>
            <Button type="button" variant="secondary" size="sm" onClick={() => router.push(`/crewing/seafarers/${seafarerId}/biodata`)}>
              Open Biodata
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => router.back()}>
              Back
            </Button>
          </>
        )}
      />

      <section className="surface-card space-y-6 p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/80 px-4 py-4 text-sm text-slate-700">
            This page is review-only. Use it to confirm fitness status and supporting notes before deployment, sign-off clearance, or document routing.
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Records Loaded</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{medicalRecords.length}</p>
            <p className="mt-1 text-sm text-slate-600">Medical review entries in the active crew profile.</p>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-950">Medical History</h2>
            <p className="mt-1 text-sm text-slate-600">Each entry below reflects the latest office-facing clinic record stored for this crew member.</p>
          </div>

          {medicalRecords.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
              No medical records are available in the current review dataset.
            </div>
          ) : (
            <div className="space-y-4">
              {medicalRecords.map((record) => (
                <article key={record.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-base font-semibold text-slate-950">{record.type}</h3>
                        <StatusBadge
                          status={record.result || 'PENDING_REVIEW'}
                          label={record.result || 'Pending Review'}
                        />
                      </div>
                      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                        <span>Date: {record.date ? new Date(record.date).toLocaleDateString() : '-'}</span>
                        <span>Doctor: {record.approvedBy || '-'}</span>
                      </div>
                      {record.remarks ? <p className="text-sm leading-6 text-slate-700">{record.remarks}</p> : null}
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Review Only</div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
