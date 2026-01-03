'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader,
  FileText,
} from 'lucide-react';

interface ApprovalRecord {
  id: string;
  documentId: string;
  approvalLevel: number;
  approvalRole: string;
  status: string;
  document: {
    code: string;
    title: string;
    documentType: string;
  };
  assignedTo?: {
    name: string;
    email: string;
  };
  approvedBy?: {
    name: string;
  };
  approvedAt?: string;
  approvalComments?: string;
  rejectionReason?: string;
}

interface ApprovalDashboardProps {
  onApprovalAction?: (
    documentId: string,
    approvalId: string,
    action: 'approve' | 'reject'
  ) => void;
}

export default function ApprovalDashboard({
  onApprovalAction,
}: ApprovalDashboardProps) {
  const [pendingApprovalsData, setPendingApprovalsData] = useState<
    ApprovalRecord[]
  >([]);
  const [completedApprovalsData, setCompletedApprovalsData] = useState<
    ApprovalRecord[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Fetch approvals
  useEffect(() => {
    const fetchApprovals = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch all documents to find pending approvals
        const response = await fetch('/api/documents/list?limit=100');
        if (!response.ok) throw new Error('Failed to fetch approvals');

        const data = await response.json();
        const pending: ApprovalRecord[] = [];
        const completed: ApprovalRecord[] = [];

        // Flatten approvals from all documents
        (data.data as Array<Record<string, unknown>>).forEach((doc) => {
          if (doc.approvals) {
            (doc.approvals as Array<Record<string, unknown>>).forEach((approval) => {
              const approval_record: ApprovalRecord = {
                ...(approval as unknown as ApprovalRecord),
                document: {
                  code: String(doc.code),
                  title: String(doc.title),
                  documentType: String(doc.documentType),
                },
              };

              if (approval.status === 'PENDING') {
                pending.push(approval_record);
              } else {
                completed.push(approval_record);
              }
            });
          }
        });

        setPendingApprovalsData(pending);
        setCompletedApprovalsData(completed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load approvals');
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchApprovals, 300);
    return () => clearTimeout(debounceTimer);
  }, []);

  const handleApprove = async (approval: ApprovalRecord) => {
    if (!approval.id) return;

    setProcessingId(approval.id);

    try {
      const response = await fetch(
        `/api/documents/${approval.documentId}/approvals/${approval.id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'approve',
            comments: '',
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to approve');

      // Remove from pending
      setPendingApprovalsData((prev) =>
        prev.filter((a) => a.id !== approval.id)
      );

      onApprovalAction?.(
        approval.documentId,
        approval.id,
        'approve'
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (approval: ApprovalRecord) => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    if (!approval.id) return;

    setProcessingId(approval.id);

    try {
      const response = await fetch(
        `/api/documents/${approval.documentId}/approvals/${approval.id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'reject',
            rejectionReason: rejectReason,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to reject');

      // Remove from pending
      setPendingApprovalsData((prev) =>
        prev.filter((a) => a.id !== approval.id)
      );

      setSelectedApproval(null);
      setRejectReason('');

      onApprovalAction?.(
        approval.documentId,
        approval.id,
        'reject'
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reject');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Approvals */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-500" />
          Pending Approvals ({pendingApprovalsData.length})
        </h2>

        {pendingApprovalsData.length === 0 ? (
          <div className="text-center py-8 bg-green-50 rounded-lg">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-green-700 font-medium">No pending approvals</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingApprovalsData.map((approval) => (
              <div
                key={approval.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-blue-500 flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-mono text-sm font-semibold text-blue-600">
                          {approval.document?.code}
                        </p>
                        <h3 className="font-semibold text-gray-900">
                          {approval.document?.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Type: {approval.document?.documentType} • Level:{' '}
                          {approval.approvalLevel} ({approval.approvalRole})
                        </p>
                      </div>
                    </div>
                  </div>
                  <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                    Awaiting Your Approval
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(approval)}
                    disabled={processingId === approval.id}
                    className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg font-medium text-sm disabled:opacity-50 transition-colors"
                  >
                    {processingId === approval.id ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Approve
                  </button>

                  {selectedApproval === approval.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Reason for rejection..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleReject(approval)}
                        disabled={processingId === approval.id}
                        className="px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg font-medium text-sm disabled:opacity-50 transition-colors"
                      >
                        {processingId === approval.id ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          'Submit'
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedApproval(null);
                          setRejectReason('');
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedApproval(approval.id || null)}
                      className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg font-medium text-sm transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Approvals */}
      {completedApprovalsData.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Completed ({completedApprovalsData.length})
          </h2>

          <div className="space-y-2">
            {completedApprovalsData.slice(0, 5).map((approval) => (
              <div
                key={approval.id}
                className="flex items-start justify-between p-3 bg-gray-50 rounded-lg text-sm"
              >
                <div className="flex-1">
                  <p className="font-mono text-xs font-semibold text-gray-600">
                    {approval.document?.code}
                  </p>
                  <p className="text-gray-900 font-medium">
                    {approval.document?.title}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      approval.status === 'APPROVED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {approval.status}
                  </span>
                  {approval.approvedBy && (
                    <p className="text-xs text-gray-600 mt-1">
                      by {approval.approvedBy.name}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {completedApprovalsData.length > 5 && (
              <p className="text-center text-sm text-gray-500 py-2">
                +{completedApprovalsData.length - 5} more...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
