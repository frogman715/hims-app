'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface Training {
  id: string;
  trainingType: string;
  provider: string | null;
  result: string | null;
  date: string | null;
  remarks: string | null;
}

interface Seafarer {
  id: string;
  fullName: string | null;
  orientations?: Array<{
    id: string;
    startDate: string;
    endDate: string | null;
    status: string;
    remarks: string | null;
  }>;
}

function getCrewDisplayName(seafarer: Pick<Seafarer, 'id' | 'fullName'>) {
  const normalized = seafarer.fullName?.trim();
  return normalized && normalized.length > 0 ? normalized : `Crew ${seafarer.id}`;
}

export default function SeafarerTrainingsPage() {
  const router = useRouter();
  const params = useParams();
  const seafarerId = params.id as string;

  const [seafarer, setSeafarer] = useState<Seafarer | null>(null);
  const [trainings, setTrainings] = useState<Training[]>([]);
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
              ? 'You do not have permission to open this training review.'
              : response.status === 401
                ? 'Your session expired. Please sign in again.'
                : 'Training review data could not be loaded.');
        setSeafarer(null);
        setTrainings([]);
        setError(message);
        setErrorCode(payload?.code || String(response.status));
        return;
      }

      setSeafarer(payload);
      setTrainings(
        Array.isArray(payload.orientations)
          ? payload.orientations.map((orientation: Seafarer['orientations'][number]) => ({
              id: orientation.id,
              trainingType: 'Orientation',
              provider: null,
              result: orientation.status ?? null,
              date: orientation.startDate ?? null,
              remarks: orientation.remarks ?? null,
            }))
          : []
      );
    } catch (error) {
      console.error('Error fetching training review data:', error);
      setSeafarer(null);
      setTrainings([]);
      setError(error instanceof Error ? error.message : 'Training review data could not be loaded.');
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
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-sm font-medium text-slate-600">Loading training review...</div>
      </div>
    );
  }

  if (!seafarer) {
    return (
      <section className="surface-card border-rose-200 bg-rose-50 px-4 py-6 text-center text-rose-700">
          <div className="font-semibold">Unable to open training records</div>
          <div className="mt-2 text-sm">{error || 'Seafarer record is unavailable.'}</div>
          <div className="mt-2 text-xs text-red-600">
            Crew ID: {seafarerId}
            {errorCode ? ` • Code: ${errorCode}` : ''}
          </div>
      </section>
    );
  }

  return (
    <div className="section-stack">
      <section className="surface-card p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700">Training Review</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Training records for {getCrewDisplayName(seafarer)}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Office review view for orientation and training evidence recorded against the seafarer profile.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Back to seafarer
          </Button>
        </div>
      </section>

      <section className="surface-card p-6">
        <h2 className="text-xl font-semibold mb-4 text-slate-900">Training review</h2>
        {error ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
      </section>

      <section className="surface-card p-8">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">Training history</h2>
        {trainings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <p className="text-slate-500">No training or orientation records found in the current office review dataset.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {trainings.map((training) => (
              <div key={training.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-slate-900">{training.trainingType}</h3>
                    {training.provider && (
                      <p className="text-sm text-slate-700">Provider: {training.provider}</p>
                    )}
                    <div className="mt-1 flex gap-4 text-sm text-slate-500">
                      {training.date && (
                        <span>Date: {new Date(training.date).toLocaleDateString()}</span>
                      )}
                      {training.result && (
                        <span
                          className={`font-medium ${
                            training.result === 'COMPLETED' || training.result === 'PASSED'
                              ? 'text-green-600'
                              : training.result === 'FAILED' || training.result === 'CANCELLED'
                                ? 'text-red-600'
                                : 'text-yellow-600'
                          }`}
                        >
                          Result: {training.result}
                        </span>
                      )}
                    </div>
                    {training.remarks && (
                      <p className="mt-1 text-sm text-slate-700">{training.remarks}</p>
                    )}
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Review only
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
