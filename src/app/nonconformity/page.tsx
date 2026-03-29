'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { WorkspaceHero } from '@/components/layout/WorkspaceHero';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface NonConformity {
  id: string;
  auditId: string;
  findingId: string;
  description: string;
  status: string;
  severity: string;
  dueDate: string | null;
  createdAt: string;
}

export default function NonConformityPage() {
  const router = useRouter();
  const [nonconformities, setNonconformities] = useState<NonConformity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const fetchNonconformities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/nonconformity/list', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        router.push('/auth/signin');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch non-conformities');
      }

      const data = await response.json();
      setNonconformities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchNonconformities();
    }
  }, [status, fetchNonconformities]);

  const openCases = nonconformities.filter((nc) => nc.status?.toUpperCase() === 'OPEN').length;
  const criticalCases = nonconformities.filter((nc) => nc.severity?.toUpperCase() === 'CRITICAL').length;
  const dueCases = nonconformities.filter((nc) => Boolean(nc.dueDate)).length;

  if (status === 'loading' || loading) {
    return (
      <div className="section-stack">
        <section className="surface-card flex min-h-[320px] items-center justify-center p-8">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-cyan-700" />
            <p className="mt-4 text-sm text-slate-600">Loading non-conformity register...</p>
          </div>
        </section>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Quality Workspace"
        title="Non-Conformities"
        subtitle="Review audit findings, severity, status, and closure deadlines from the active register so CAPA ownership and follow-up stay visible."
        highlights={[
          { label: 'Registered Cases', value: nonconformities.length, detail: 'Non-conformity records currently available in the register.' },
          { label: 'Open Cases', value: openCases, detail: 'Items still open and requiring closure action.' },
          { label: 'Critical Severity', value: criticalCases, detail: 'Immediate-priority findings requiring management attention.' },
          { label: 'With Due Dates', value: dueCases, detail: 'Cases already assigned a tracked closure deadline.' },
        ]}
        helperLinks={[
          { href: '/quality/qmr-dashboard', label: 'QMR Dashboard' },
          { href: '/hgqs/audits', label: 'Audit Management' },
          { href: '/quality/risks', label: 'Risk Register' },
        ]}
        actions={(
          <>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/hgqs/audits"
              className="inline-flex items-center gap-2 rounded-full bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800"
            >
              <Plus className="h-4 w-4" />
              Audit Management
            </Link>
          </>
        )}
      />

      <div className="rounded-3xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm text-amber-900">
        Use this page to review findings that have already been recorded. If the list is empty, continue from Audit Management to create or open the related audit.
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
        </div>
      )}

      {nonconformities.length === 0 ? (
        <div className="surface-card p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Non-Conformities Found</h3>
            <p className="text-gray-600 mb-6">
              Non-conformities raised from audits and quality reviews will appear here.
            </p>
            <Link
              href="/audit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Open Audit Management
            </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Severity</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Due Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {nonconformities.map((nc) => (
                  <tr key={nc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{nc.description}</td>
                    <td className="px-6 py-4 text-sm">
                      <StatusBadge status={nc.severity} />
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <StatusBadge status={nc.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {nc.dueDate ? new Date(nc.dueDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(nc.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      )}
    </div>
  );
}
