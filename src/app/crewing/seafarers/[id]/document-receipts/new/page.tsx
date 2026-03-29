'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WorkspaceHero } from '@/components/layout/WorkspaceHero';

interface CrewSummary {
  id: string;
  fullName: string | null;
  rank: string | null;
  phone: string | null;
  email: string | null;
  assignments?: Array<{
    vessel?: {
      name: string;
    } | null;
    status: string;
  }>;
  coverallSize?: string | null;
  shoeSize?: string | null;
  waistSize?: string | null;
}

function getCrewDisplayName(crew: Pick<CrewSummary, 'id' | 'fullName'>) {
  const normalized = crew.fullName?.trim();
  return normalized && normalized.length > 0 ? normalized : `Crew ${crew.id}`;
}

export default function NewDocumentReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const seafarerId = params.id as string;

  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [crew, setCrew] = useState<CrewSummary | null>(null);

  useEffect(() => {
    const fetchCrew = async () => {
      try {
        const response = await fetch(`/api/crewing/seafarers/${seafarerId}`);
        if (!response.ok) {
          throw new Error('Failed to load seafarer data');
        }
        const data: CrewSummary = await response.json();
        setCrew(data);
      } catch (err) {
        console.error(err);
        setError('Unable to retrieve crew data. Please return to previous page.');
      } finally {
        setInitializing(false);
      }
    };

    if (seafarerId) {
      fetchCrew();
    }
  }, [seafarerId]);

  if (initializing) {
    return (
      <div className="section-stack">
        <section className="surface-card flex min-h-[320px] items-center justify-center p-8">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-cyan-700" />
            <p className="mt-4 text-sm text-slate-600">Preparing document receipt view...</p>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section-stack">
        <div className="surface-card mx-auto max-w-3xl p-8 text-center">
          <h1 className="text-xl font-semibold text-red-600 mb-4">Something went wrong</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (!crew) {
    return null;
  }

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Crewing Workspace"
        title="Document Receipt"
        subtitle={getCrewDisplayName(crew)}
        highlights={[
          { label: 'Rank', value: crew.rank ?? '-', detail: 'Current rank on the seafarer profile.' },
          { label: 'Active Vessel', value: deriveActiveVessel(crew) ?? '-', detail: 'Most relevant onboard or planned vessel assignment.' },
          { label: 'Phone', value: crew.phone ?? '-', detail: 'Crew contact reference currently stored.' },
          { label: 'Email', value: crew.email ?? '-', detail: 'Crew email reference currently stored.' },
        ]}
        helperLinks={[
          { href: `/crewing/seafarers/${seafarerId}/documents`, label: 'Crew Documents' },
          { href: '/crewing/documents', label: 'Document Register' },
          { href: '/crewing/seafarers', label: 'Seafarer Register' },
        ]}
        actions={(
          <button
            type="button"
            onClick={() => router.push(`/crewing/seafarers/${seafarerId}/documents`)}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
          >
            Back to Documents
          </button>
        )}
      />

      <div className="surface-card mx-auto max-w-4xl space-y-6 p-8">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            New document receipt entry is temporarily hidden from the active office flow until the receipt API is aligned with the crewing module.
          </div>
          <div className="grid grid-cols-1 gap-4 text-sm text-gray-700 md:grid-cols-2">
            <div>
              <div className="font-semibold text-gray-900">Crew</div>
              <div>{getCrewDisplayName(crew)}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-900">Rank</div>
              <div>{crew.rank ?? '-'}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-900">Phone</div>
              <div>{crew.phone ?? '-'}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-900">Email</div>
              <div>{crew.email ?? '-'}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-900">Active Vessel</div>
              <div>{deriveActiveVessel(crew) ?? '-'}</div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.push(`/crewing/seafarers/${seafarerId}/documents`)}
              className="px-6 py-3 rounded-lg border border-gray-400 text-gray-700 hover:bg-gray-100"
            >
              Back to Documents
            </button>
          </div>
      </div>
    </div>
  );
}

function deriveActiveVessel(crew: CrewSummary): string | null {
  if (!crew.assignments || crew.assignments.length === 0) {
    return null;
  }
  const current = crew.assignments.find((assignment) => assignment.status === 'ONBOARD' || assignment.status === 'PLANNED');
  if (current?.vessel?.name) {
    return current.vessel.name;
  }
  return crew.assignments[0]?.vessel?.name ?? null;
}
