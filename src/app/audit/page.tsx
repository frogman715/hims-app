'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { WorkspaceHero } from '@/components/layout/WorkspaceHero';
import { Select } from '@/components/ui/Select';
import CreateAuditForm from '@/components/audit/CreateAuditForm';
import AuditTable from '@/components/audit/AuditTable';
import { canAccessOfficePath } from '@/lib/office-access';
import { normalizeToUserRoles } from '@/lib/type-guards';

interface Audit {
  id: string;
  auditNumber: string;
  auditType: string;
  status: string;
  scope?: string;
  objectives?: string;
  auditCriteria?: string;
  auditDate: string;
  leadAuditorId: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export default function AuditManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    auditType: '',
  });
  const userRoles = normalizeToUserRoles(session?.user?.roles ?? session?.user?.role);
  const isSystemAdmin = session?.user?.isSystemAdmin === true;
  const canManageAudits = canAccessOfficePath('/api/audit/list', userRoles, isSystemAdmin, 'POST');

  // Fetch audits
  const fetchAudits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.auditType) params.append('auditType', filters.auditType);

      const response = await fetch(`/api/audit/list?${params.toString()}`, {
        method: 'GET',
        credentials: 'include', // Include cookies for session
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.status === 401) {
        router.push('/auth/signin');
        return;
      }
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch audits');
      }

      const data = await response.json();
      setAudits(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.auditType, router]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchAudits();
    }
  }, [status, session, filters, fetchAudits]);

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    setSelectedAudit(null);
    fetchAudits();
  };

  const handleEdit = (audit: Audit) => {
    if (!canManageAudits) {
      return;
    }
    setSelectedAudit(audit);
    setShowCreateForm(true);
  };

  const handleView = (auditId: string) => {
    router.push(`/audit/${auditId}`);
  };

  if (status === 'loading') {
    return (
      <div className="section-stack">
        <div className="surface-card px-6 py-12 text-center text-sm text-slate-600">Loading audit workspace...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  const plannedCount = audits.filter((a) => a.status === 'PLANNED').length;
  const inProgressCount = audits.filter((a) => a.status === 'IN_PROGRESS').length;
  const completedCount = audits.filter((a) => a.status === 'COMPLETED' || a.status === 'CLOSED').length;

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Audit Workspace"
        title="Audit management"
        subtitle="Manage active audits, schedules, and follow-up actions in one controlled workspace."
        helperLinks={[
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/quality/qmr-dashboard', label: 'QMR Dashboard' },
        ]}
        highlights={[
          { label: 'Audit Register', value: audits.length, detail: 'All audit records currently visible in the live register.' },
          { label: 'Planned', value: plannedCount, detail: 'Audits waiting to start or still in scheduling control.' },
          { label: 'In Progress', value: inProgressCount, detail: 'Audits currently under execution or active review.' },
          { label: 'Completed / Closed', value: completedCount, detail: 'Audits already finished and retained for traceability.' },
        ]}
        actions={(
          <>
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-800">
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </Link>
            <Button
              onClick={() => {
                if (!canManageAudits) {
                  return;
                }
                setSelectedAudit(null);
                setShowCreateForm(true);
              }}
              disabled={!canManageAudits}
              size="sm"
              leftIcon={canManageAudits ? <Plus size={16} /> : undefined}
            >
              {canManageAudits ? 'New Audit' : 'View Only'}
            </Button>
          </>
        )}
      />

      <section className="surface-card space-y-6 p-6">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">1. Review the live queue</p>
            <p className="mt-2 text-sm text-slate-600">Start with active audits that still need scheduling, execution, or follow-up attention.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">2. Filter with purpose</p>
            <p className="mt-2 text-sm text-slate-600">Use status and audit type to isolate the exact audit population you need to manage.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">3. Create only controlled records</p>
            <p className="mt-2 text-sm text-slate-600">New audits should be created only when the audit scope, dates, and ownership are ready to be tracked.</p>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-900">
          Start from the active audit list. Open an existing audit to review findings and follow-up actions, or create a new audit when needed.
        </div>

        {/* Create/Edit Form Modal */}
        {showCreateForm && canManageAudits && (
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-slate-900">
                {selectedAudit ? 'Edit Audit' : 'Create New Audit'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setSelectedAudit(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <CreateAuditForm
              audit={selectedAudit}
              onSuccess={handleCreateSuccess}
            />
          </div>
        )}

        {/* Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
                id="audit-status"
                label="Status"
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                options={[
                  { value: '', label: 'All audit statuses' },
                  { value: 'PLANNED', label: 'Planned' },
                  { value: 'IN_PROGRESS', label: 'In Progress' },
                  { value: 'COMPLETED', label: 'Completed' },
                  { value: 'CLOSED', label: 'Closed' },
                ]}
              />
            <Select
                id="audit-type"
                label="Audit Type"
                value={filters.auditType}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, auditType: e.target.value }))
                }
                options={[
                  { value: '', label: 'All Types' },
                  { value: 'INTERNAL', label: 'Internal' },
                  { value: 'EXTERNAL', label: 'External' },
                  { value: 'COMPLIANCE', label: 'Compliance' },
                  { value: 'MANAGEMENT_REVIEW', label: 'Management Review' },
                ]}
              />
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setFilters({ status: '', auditType: '' });
                }}
                variant="secondary"
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-red-800">Error: {error}</p>
          </div>
        )}

        {/* Audits Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading audits...</div>
          ) : audits.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p>No audits found. Create one to get started!</p>
            </div>
          ) : (
            <AuditTable
              audits={audits}
              onEdit={canManageAudits ? handleEdit : undefined}
              onView={handleView}
            />
          )}
        </div>

        {/* Stats Summary */}
        {audits.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-3xl font-bold text-blue-600">
                {audits.length}
              </div>
              <p className="text-slate-600">Total Audits</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-3xl font-bold text-yellow-600">
                {audits.filter((a) => a.status === 'PLANNED').length}
              </div>
              <p className="text-slate-600">Planned</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-3xl font-bold text-purple-600">
                {audits.filter((a) => a.status === 'IN_PROGRESS').length}
              </div>
              <p className="text-slate-600">In Progress</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-3xl font-bold text-green-600">
                {audits.filter((a) => a.status === 'COMPLETED').length}
              </div>
              <p className="text-slate-600">Completed</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
