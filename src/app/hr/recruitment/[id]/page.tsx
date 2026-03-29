'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  getRecruitmentActionLabel,
  getRecruitmentBadgeTone,
  getRecruitmentStatusLabel,
  type RecruitmentAction,
  type RecruitmentStatus,
} from '@/lib/recruitment-flow';
import { PermissionLevel, hasPermission } from '@/lib/permissions';
import { normalizeToUserRoles } from '@/lib/type-guards';
import { WorkspaceHero } from '@/components/layout/WorkspaceHero';
import { WorkspaceLoadingState, WorkspaceState } from '@/components/layout/WorkspaceState';
import { Button } from '@/components/ui/Button';

interface RecruitmentDetail {
  id: string;
  crewId: string;
  candidateName: string | null;
  position: string | null;
  appliedDate: string;
  recruiterId: string;
  phone: string | null;
  email: string | null;
  nationality: string | null;
  notes: string | null;
  status: RecruitmentStatus;
  statusLabel: string;
  nextActionLabel: string | null;
  allowedActions: RecruitmentAction[];
  isCrewReady: boolean;
}

export default function RecruitmentDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const recruitmentId = params.id as string;
  const userRoles = normalizeToUserRoles(session?.user?.roles ?? session?.user?.role);
  const canManageRecruitment = hasPermission(userRoles, 'crewing', PermissionLevel.EDIT_ACCESS);

  const [recruitment, setRecruitment] = useState<RecruitmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
    }
  }, [router, session, status]);

  const fetchRecruitment = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/recruitments/${recruitmentId}`, { cache: 'no-store' });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to load recruitment detail');
      }

      setRecruitment(payload);
      setError(null);
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load recruitment detail');
    } finally {
      setLoading(false);
    }
  }, [recruitmentId]);

  useEffect(() => {
    if (session && recruitmentId) {
      fetchRecruitment();
    }
  }, [fetchRecruitment, recruitmentId, session]);

  const handleTransition = async (action: RecruitmentAction) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/recruitments/${recruitmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Recruitment action failed');
      }

      setRecruitment(payload);
      setError(null);
    } catch (actionError) {
      console.error(actionError);
      setError(actionError instanceof Error ? actionError.message : 'Recruitment action failed');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return <WorkspaceLoadingState label="Loading recruitment detail..." />;
  }

  if (!session) {
    return null;
  }

  if (!recruitment) {
    return (
      <WorkspaceState
        eyebrow="Recruitment Detail"
        title="Recruitment record not available"
        description="The requested candidate file could not be found in the recruitment pipeline. Return to the recruitment desk and reopen a valid case."
        tone="danger"
        action={(
          <Link href="/hr/recruitment" className="inline-flex items-center rounded-xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800">
            Return to Recruitment Desk
          </Link>
        )}
      />
    );
  }

  const nextActionLabel = getRecruitmentActionLabel(recruitment.status);

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Recruitment Detail"
        title={recruitment.candidateName || `Candidate ${recruitment.crewId}`}
        subtitle="Recruitment pipeline detail, decision readiness, and final hiring action."
        helperLinks={[
          { href: '/hr/recruitment', label: 'Recruitment' },
          { href: '/dashboard', label: 'Dashboard' },
        ]}
        highlights={[
          { label: 'Current Status', value: getRecruitmentStatusLabel(recruitment.status), detail: 'Current stage in the controlled recruitment flow.' },
          { label: 'Next Office Action', value: nextActionLabel || 'No further action', detail: 'Use only the next supported workflow action.' },
          { label: 'Seafarer Readiness', value: recruitment.isCrewReady ? 'Available' : 'Not Yet Opened', detail: 'Active seafarer record becomes available after hiring handoff.' },
        ]}
        actions={(
          <Link href="/hr/recruitment" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-800">
            Back to Recruitment
          </Link>
        )}
      />

      <section className="surface-card mx-auto max-w-5xl space-y-6 p-6">
        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="rounded-2xl border border-white bg-white p-8 shadow-lg">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className={`inline-flex items-center rounded-full px-3 py-2 text-xs font-semibold ${getRecruitmentBadgeTone(recruitment.status)}`}>
                {getRecruitmentStatusLabel(recruitment.status)}
              </div>
              <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                <p><span className="font-semibold text-slate-900">Position:</span> {recruitment.position || 'Not assigned'}</p>
                <p><span className="font-semibold text-slate-900">Applied:</span> {new Date(recruitment.appliedDate).toLocaleDateString()}</p>
                <p><span className="font-semibold text-slate-900">Phone:</span> {recruitment.phone || '—'}</p>
                <p><span className="font-semibold text-slate-900">Email:</span> {recruitment.email || '—'}</p>
                <p><span className="font-semibold text-slate-900">Nationality:</span> {recruitment.nationality || '—'}</p>
                <p><span className="font-semibold text-slate-900">Crew record:</span> {recruitment.isCrewReady ? 'Ready in seafarers' : 'Not yet active in seafarers'}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Notes</p>
                <p className="mt-1 whitespace-pre-wrap">{recruitment.notes?.trim() || 'No notes recorded.'}</p>
              </div>
            </div>

            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Actions</p>
              <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                Keep decisions linear: approve to move forward, reject to close, and hire only when the candidate is fully cleared for seafarer handoff.
              </div>
              <div className="mt-6 flex flex-col gap-3">
                {canManageRecruitment && recruitment.allowedActions.includes('approve') ? (
                  <Button type="button" disabled={saving} onClick={() => handleTransition('approve')}>
                    {saving ? 'Saving...' : nextActionLabel}
                  </Button>
                ) : null}
                {canManageRecruitment && recruitment.allowedActions.includes('hire') ? (
                  <Button type="button" disabled={saving} onClick={() => handleTransition('hire')}>
                    {saving ? 'Saving...' : 'Approve Hire and Open Seafarer Record'}
                  </Button>
                ) : null}
                {canManageRecruitment && recruitment.allowedActions.includes('reject') ? (
                  <Button type="button" variant="danger" disabled={saving} onClick={() => handleTransition('reject')}>
                    Decline Candidate
                  </Button>
                ) : null}
                {recruitment.status === 'HIRED' ? (
                  <>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                      Recruitment is locked after hire approval and seafarer handoff.
                    </div>
                    <Link
                      href={`/crewing/seafarers/${recruitment.crewId}/biodata`}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
                    >
                      Open Seafarer Record
                    </Link>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}
