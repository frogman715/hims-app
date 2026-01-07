'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, AlertCircle, Filter, Search } from 'lucide-react';

interface Checklist {
  id: string;
  checklistCode: string;
  status: string;
  completionPercent: number;
  application?: {
    position: string;
    crew: { fullName: string };
    applicationDate: string;
  };
  crew?: { fullName: string; rank: string };
  remarks?: string;
}

const statusConfig = {
  NOT_STARTED: { color: 'bg-gray-100', textColor: 'text-gray-700', label: 'Not Started', icon: '○' },
  IN_PROGRESS: { color: 'bg-blue-100', textColor: 'text-blue-700', label: 'In Progress', icon: '◐' },
  COMPLETED: { color: 'bg-green-100', textColor: 'text-green-700', label: 'Completed', icon: '●' },
  PENDING_REVIEW: { color: 'bg-yellow-100', textColor: 'text-yellow-700', label: 'Pending Review', icon: '⚠' },
  APPROVED: { color: 'bg-emerald-100', textColor: 'text-emerald-700', label: 'Approved', icon: '✓' },
  REJECTED: { color: 'bg-red-100', textColor: 'text-red-700', label: 'Rejected', icon: '✗' },
};

export default function ChecklistsDashboard() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('PENDING_REVIEW');
  const [searchTerm, setSearchTerm] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvalRemark, setApprovalRemark] = useState('');

  // Fetch checklists
  useEffect(() => {
    const fetchChecklists = async () => {
      try {
        setError(null);
        const url = new URL('/api/crewing/checklists', window.location.origin);
        if (selectedStatus) url.searchParams.append('status', selectedStatus);
        if (searchTerm) url.searchParams.append('search', searchTerm);

        const response = await fetch(url.toString());
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setChecklists(data.data);
      } catch (error) {
        console.error('Error:', error);
        setError(error instanceof Error ? error.message : 'Failed to load checklists');
      } finally {
        setLoading(false);
      }
    };

    fetchChecklists();
  }, [selectedStatus, searchTerm]);

  const handleApprove = async (checklistId: string, action: 'approve' | 'reject') => {
    setApprovingId(checklistId);
    try {
      const response = await fetch(`/api/crewing/checklists/${checklistId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          remarks: approvalRemark,
        }),
      });

      if (!response.ok) throw new Error('Failed to process action');

      // Refresh list
      const newResponse = await fetch(`/api/crewing/checklists?status=${selectedStatus}`);
      const newData = await newResponse.json();
      setChecklists(newData.data);
      setApprovalRemark('');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setApprovingId(null);
    }
  };

  const statuses = Object.keys(statusConfig);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Checklists</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Checklists Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage procedure checklists and approvals</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-6 gap-4 mb-8">
          {statuses.map(status => {
            const count = checklists.filter(c => c.status === status).length;
            const config = statusConfig[status as keyof typeof statusConfig];
            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`rounded-lg p-4 text-center transition-all ${
                  selectedStatus === status
                    ? `${config.color} ring-2 ring-offset-2 ring-indigo-600`
                    : 'bg-white border border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`text-2xl font-bold ${config.textColor}`}>{count}</div>
                <div className="text-xs text-gray-600 mt-1">{config.label}</div>
              </button>
            );
          })}
        </div>

        {/* Controls */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by crew or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Checklists List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-600">Loading checklists...</div>
          ) : checklists.length === 0 ? (
            <div className="text-center py-12 text-gray-600">No checklists found</div>
          ) : (
            checklists.map(checklist => {
              const config = statusConfig[checklist.status as keyof typeof statusConfig];
              const crewName = checklist.application?.crew?.fullName || checklist.crew?.fullName;
              const position = checklist.application?.position || checklist.crew?.rank;

              return (
                <div key={checklist.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-6 space-y-4">
                    {/* Header Row */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{config.icon}</span>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">{checklist.checklistCode}</h3>
                            <p className="text-sm text-gray-600">{crewName} • {position}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${config.color} ${config.textColor}`}
                        >
                          {config.label}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-xs text-gray-600 font-medium">Progress</span>
                        <span className="text-sm font-bold text-indigo-600">{checklist.completionPercent}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-indigo-600 to-indigo-500 h-2 rounded-full transition-all"
                          style={{ width: `${checklist.completionPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Remarks */}
                    {checklist.remarks && (
                      <div className="bg-gray-50 rounded p-3 border border-gray-200">
                        <p className="text-xs text-gray-600 font-medium mb-1">Remarks</p>
                        <p className="text-sm text-gray-700">{checklist.remarks}</p>
                      </div>
                    )}

                    {/* Approval Section (only for PENDING_REVIEW) */}
                    {checklist.status === 'PENDING_REVIEW' && (
                      <div className="space-y-3 border-t pt-4">
                        <textarea
                          placeholder="Add approval remarks..."
                          value={approvingId === checklist.id ? approvalRemark : ''}
                          onChange={(e) => setApprovalRemark(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(checklist.id, 'approve')}
                            disabled={approvingId !== null}
                            className="flex-1 bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700 disabled:opacity-50"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleApprove(checklist.id, 'reject')}
                            disabled={approvingId !== null}
                            className="flex-1 bg-red-600 text-white py-2 rounded font-medium hover:bg-red-700 disabled:opacity-50"
                          >
                            ✗ Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
