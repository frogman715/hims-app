'use client';

import React, { useState, useEffect } from 'react';
import { InlineNotice } from '@/components/feedback/InlineNotice';
import { WorkspaceEmptyState } from '@/components/feedback/WorkspaceEmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
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
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

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
    setFeedback(null);

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

      if (!response.ok) throw new Error('Approval could not be completed.');

      // Remove from pending
      setPendingApprovalsData((prev) =>
        prev.filter((a) => a.id !== approval.id)
      );

      onApprovalAction?.(
        approval.documentId,
        approval.id,
        'approve'
      );
      setFeedback({ tone: 'success', message: `Document ${approval.document.code} approved successfully.` });
    } catch (err) {
      setFeedback({ tone: 'error', message: err instanceof Error ? err.message : 'Approval could not be completed.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (approval: ApprovalRecord) => {
    if (!rejectReason.trim()) {
      setFeedback({ tone: 'error', message: 'Provide a rejection reason before rejecting the document.' });
      return;
    }

    if (!approval.id) return;

    setProcessingId(approval.id);
    setFeedback(null);

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

      if (!response.ok) throw new Error('Rejection could not be completed.');

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
      setFeedback({ tone: 'success', message: `Document ${approval.document.code} rejected and returned to the queue.` });
    } catch (err) {
      setFeedback({ tone: 'error', message: err instanceof Error ? err.message : 'Rejection could not be completed.' });
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
      <InlineNotice tone="error" message={error} />
    );
  }

  return (
    <div className="space-y-6">
      {feedback ? <InlineNotice tone={feedback.tone} message={feedback.message} onDismiss={() => setFeedback(null)} /> : null}

      {/* Pending Approvals */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-500" />
          Pending Approvals ({pendingApprovalsData.length})
        </h2>

        {pendingApprovalsData.length === 0 ? (
          <WorkspaceEmptyState
            title="Approval queue is clear"
            message="No controlled documents are currently waiting for your review."
          />
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
                  <StatusBadge status="FOR_APPROVAL" label="Awaiting Your Approval" />
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
                        placeholder="Enter the return reason for this document"
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
                    className="inline-flex"
                  >
                    <StatusBadge status={approval.status} />
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
