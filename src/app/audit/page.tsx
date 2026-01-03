'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import CreateAuditForm from '@/components/audit/CreateAuditForm';
import AuditTable from '@/components/audit/AuditTable';

interface Audit {
  id: string;
  auditCode: string;
  title: string;
  auditType: string;
  status: string;
  leadAuditorId: string;
  plannedDate: string;
  startDate: string | null;
  completionDate: string | null;
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

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Fetch audits
  const fetchAudits = async () => {
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
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchAudits();
    }
  }, [status, session, filters]);

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    setSelectedAudit(null);
    fetchAudits();
  };

  const handleEdit = (audit: Audit) => {
    setSelectedAudit(audit);
    setShowCreateForm(true);
  };

  const handleView = (auditId: string) => {
    router.push(`/audit/${auditId}`);
  };

  if (status === 'loading') {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audit Management</h1>
            <p className="text-gray-600 mt-2">Create and manage audit activities</p>
          </div>
          <Button
            onClick={() => {
              setSelectedAudit(null);
              setShowCreateForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Plus size={20} />
            New Audit
          </Button>
        </div>

        {/* Create/Edit Form Modal */}
        {showCreateForm && (
          <div className="mb-8 bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
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
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="PLANNED">Planned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Audit Type
              </label>
              <select
                value={filters.auditType}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, auditType: e.target.value }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="INTERNAL">Internal</option>
                <option value="EXTERNAL">External</option>
                <option value="COMPLIANCE">Compliance</option>
                <option value="MANAGEMENT_REVIEW">Management Review</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setFilters({ status: '', auditType: '' });
                }}
                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-900"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">Error: {error}</p>
          </div>
        )}

        {/* Audits Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading audits...</div>
          ) : audits.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No audits found. Create one to get started!</p>
            </div>
          ) : (
            <AuditTable
              audits={audits}
              onEdit={handleEdit}
              onView={handleView}
            />
          )}
        </div>

        {/* Stats Summary */}
        {audits.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-3xl font-bold text-blue-600">
                {audits.length}
              </div>
              <p className="text-gray-600">Total Audits</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-3xl font-bold text-yellow-600">
                {audits.filter((a) => a.status === 'PLANNED').length}
              </div>
              <p className="text-gray-600">Planned</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-3xl font-bold text-purple-600">
                {audits.filter((a) => a.status === 'IN_PROGRESS').length}
              </div>
              <p className="text-gray-600">In Progress</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-3xl font-bold text-green-600">
                {audits.filter((a) => a.status === 'COMPLETED').length}
              </div>
              <p className="text-gray-600">Completed</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
