/**
 * Approval Dashboard Component
 * Managers can review and approve or reject submissions.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { HGFSubmission, HGFForm } from '@prisma/client';
import { pushAppNotice } from '@/lib/app-notice';
import { InlineNotice } from '@/components/feedback/InlineNotice';
import { WorkspaceEmptyState } from '@/components/feedback/WorkspaceEmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Search,
  Loader,
} from 'lucide-react';
import { formatStatusLabel } from '@/lib/formatters';

interface HGFSubmissionWithRelations extends HGFSubmission {
  form: HGFForm | null;
  crew: {
    id: string;
    fullName: string | null;
    email: string;
  };
  documents: {
    id: string;
    fileName: string;
    fileUrl: string;
  }[];
}

export function ApprovalDashboard() {
  const [submissions, setSubmissions] = useState<HGFSubmissionWithRelations[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<HGFSubmissionWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('SUBMITTED');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  // Fetch submissions awaiting approval
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({
          status: 'SUBMITTED',
          limit: '20',
        });

        const response = await fetch(
          `/api/hgf/submissions?${params.toString()}`
        );
        if (!response.ok) {
          throw new Error('Submission approval queue could not be loaded.');
        }

        const data = (await response.json()) as {
          data: HGFSubmissionWithRelations[];
        };
        setSubmissions(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Submission approval queue could not be loaded.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  // Filter submissions
  useEffect(() => {
    let filtered = [...submissions];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (sub) =>
          sub.form?.name?.toLowerCase().includes(query) ||
          sub.crew?.fullName?.toLowerCase().includes(query) ||
          sub.id?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((sub) => sub.status === statusFilter);
    }

    setFilteredSubmissions(filtered);
  }, [submissions, searchQuery, statusFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <InlineNotice tone="error" title="Approval Desk Unavailable" message={error} />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Submissions List */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Pending Approvals
          </h1>
          <p className="text-gray-600 mt-1">
            Review and approve crew submissions
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search crew name, form, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All review statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="UNDER_REVIEW">Under Review</option>
          </select>
        </div>

        {/* Submissions List */}
        {filteredSubmissions.length === 0 ? (
          <WorkspaceEmptyState
            title="No submissions require review"
            message="Approved workflow items will appear here when they enter the review queue."
          />
        ) : (
          <div className="space-y-3">
            {filteredSubmissions.map((submission) => (
              <ApprovalCard
                key={submission.id}
                submission={submission}
                isSelected={selectedSubmissionId === submission.id}
                onSelect={() => setSelectedSubmissionId(submission.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Details Panel */}
      <div className="lg:col-span-1">
        {selectedSubmissionId ? (
          <ApprovalPanel submissionId={selectedSubmissionId} />
        ) : (
          <div className="sticky top-4">
            <WorkspaceEmptyState
              title="No submission selected"
              message="Select a submission from the queue to open the review panel."
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Individual Approval Card
 */
interface ApprovalCardProps {
  submission: HGFSubmissionWithRelations;
  isSelected: boolean;
  onSelect: () => void;
}

function ApprovalCard({
  submission,
  isSelected,
  onSelect,
}: ApprovalCardProps) {
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('id-ID', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
        isSelected
          ? 'bg-blue-50 border-blue-500'
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-900">
              {submission.crew?.fullName || 'Unknown'}
            </h3>
            <p className="text-sm text-gray-600">
              {submission.form?.name || 'Unknown Form'}
            </p>
          </div>
          <StatusBadge status={submission.status} label={formatStatusLabel(submission.status)} />
        </div>

        {/* Timeline */}
        <div className="text-xs text-gray-600 flex items-center gap-2">
          <span>Submitted {formatDate(submission.submittedAt)}</span>
        </div>
      </div>
    </button>
  );
}

/**
 * Approval Review Panel
 */
interface ApprovalPanelProps {
  submissionId: string;
}

function ApprovalPanel({ submissionId }: ApprovalPanelProps) {
  const [submission, setSubmission] = useState<HGFSubmissionWithRelations | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/hgf/submissions/${submissionId}`
        );
        if (!response.ok) throw new Error('Submission details could not be loaded.');

        const data = (await response.json()) as {
          data: HGFSubmissionWithRelations;
        };
        setSubmission(data.data);
      } catch (error) {
        console.error('Error fetching submission:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmission();
  }, [submissionId]);

  const handleApprove = async () => {
    if (!submission) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(
        `/api/hgf/submissions/${submission.id}/approve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ remarks }),
        }
      );

      if (!response.ok) throw new Error('Approval could not be completed.');

      pushAppNotice({
        tone: 'success',
        title: 'Submission approved',
        message: 'The submission has been approved and moved forward in the workflow.',
      });
      setRemarks('');
      setAction(null);
    } catch (error) {
      pushAppNotice({
        tone: 'error',
        title: 'Approval failed',
        message: error instanceof Error ? error.message : 'The submission could not be approved.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!submission) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(
        `/api/hgf/submissions/${submission.id}/reject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rejectionReason }),
        }
      );

      if (!response.ok) throw new Error('Rejection could not be completed.');

      pushAppNotice({
        tone: 'success',
        title: 'Submission rejected',
        message: 'The submission has been declined and returned for follow-up.',
      });
      setRejectionReason('');
      setAction(null);
    } catch (error) {
      pushAppNotice({
        tone: 'error',
        title: 'Rejection failed',
        message: error instanceof Error ? error.message : 'The submission could not be rejected.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="sticky top-4 p-6 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center">
        <Loader className="w-5 h-5 text-gray-600 animate-spin" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="sticky top-4">
        <WorkspaceEmptyState
          title="Submission details unavailable"
          message="Reload the approval queue and select the submission again."
        />
      </div>
    );
  }

  return (
    <div className="sticky top-4 space-y-4 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Info */}
      <div className="space-y-2 pb-4 border-b">
        <h3 className="font-semibold text-gray-900">Submission Details</h3>
        <dl className="text-sm space-y-1 text-gray-600">
          <div className="flex justify-between">
            <dt>Form Code:</dt>
            <dd className="font-medium text-gray-900">
              {submission.form?.formCode}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>Crew:</dt>
            <dd className="font-medium text-gray-900">
              {submission.crew?.fullName}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>Status:</dt>
            <dd className="font-medium text-gray-900">
              <StatusBadge status={submission.status} label={formatStatusLabel(submission.status)} />
            </dd>
          </div>
        </dl>
      </div>

      {/* Action Selection */}
      {!action ? (
        <div className="space-y-2">
          <button
            onClick={() => setAction('approve')}
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            ✓ Approve
          </button>
          <button
            onClick={() => setAction('reject')}
            className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            ✗ Reject
          </button>
        </div>
      ) : action === 'approve' ? (
        <ApproveForm
          remarks={remarks}
          setRemarks={setRemarks}
          isSubmitting={isSubmitting}
          onSubmit={handleApprove}
          onCancel={() => {
            setAction(null);
            setRemarks('');
          }}
        />
      ) : (
        <RejectForm
          reason={rejectionReason}
          setReason={setRejectionReason}
          isSubmitting={isSubmitting}
          onSubmit={handleReject}
          onCancel={() => {
            setAction(null);
            setRejectionReason('');
          }}
        />
      )}
    </div>
  );
}

/**
 * Approve Form Component
 */
interface ApproveFormProps {
  remarks: string;
  setRemarks: (value: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

function ApproveForm({
  remarks,
  setRemarks,
  isSubmitting,
  onSubmit,
  onCancel,
}: ApproveFormProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-gray-700">
          Approval Remarks (Optional)
        </label>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Add any remarks or conditions..."
          className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          rows={3}
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          {isSubmitting ? 'Approving...' : 'Confirm Approval'}
        </button>
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/**
 * Reject Form Component
 */
interface RejectFormProps {
  reason: string;
  setReason: (value: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

function RejectForm({
  reason,
  setReason,
  isSubmitting,
  onSubmit,
  onCancel,
}: RejectFormProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-gray-700">
          Rejection Reason *
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why this submission is being rejected..."
          className="w-full mt-1 p-2 border border-red-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
          rows={3}
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={onSubmit}
          disabled={isSubmitting || !reason.trim()}
          className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
        </button>
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
