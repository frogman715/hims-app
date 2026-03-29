/**
 * Submission Dashboard Component
 * Crew can review all submissions and their statuses.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { HGFSubmission, HGFForm } from '@prisma/client';
import {
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Search,
  Loader,
} from 'lucide-react';
import Link from 'next/link';
import { InlineNotice } from '@/components/feedback/InlineNotice';
import { WorkspaceEmptyState } from '@/components/feedback/WorkspaceEmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatStatusLabel } from '@/lib/formatters';

interface HGFSubmissionWithForm extends HGFSubmission {
  form: HGFForm | null;
}

interface SubmissionDashboardProps {
  crewId?: string;
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  DRAFT: <Clock className="w-5 h-5" />,
  SUBMITTED: <Clock className="w-5 h-5" />,
  PENDING_REVIEW: <Clock className="w-5 h-5" />,
  UNDER_REVIEW: <Clock className="w-5 h-5" />,
  APPROVED: <CheckCircle className="w-5 h-5" />,
  REJECTED: <XCircle className="w-5 h-5" />,
  REVISIONS_NEEDED: <Clock className="w-5 h-5" />,
};

export function SubmissionDashboard({ crewId }: SubmissionDashboardProps) {
  const [submissions, setSubmissions] = useState<HGFSubmissionWithForm[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<HGFSubmissionWithForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);

  // Fetch submissions
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({
          limit: '10',
          offset: String(page * 10),
        });

        if (crewId) {
          params.append('crewId', crewId);
        }

        const response = await fetch(`/api/hgf/submissions?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Submission register could not be loaded.');
        }

        const data = (await response.json()) as { data: HGFSubmissionWithForm[] };
        setSubmissions(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Submission register could not be loaded.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissions();
  }, [page, crewId]);

  // Filter submissions
  useEffect(() => {
    let filtered = [...submissions];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (sub) =>
          sub.form?.name?.toLowerCase().includes(query) ||
          sub.form?.formCode?.toLowerCase().includes(query) ||
          sub.id?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((sub) => sub.status === statusFilter);
    }

    setFilteredSubmissions(filtered);
  }, [submissions, searchQuery, statusFilter]);

  const getStatusIcon = (status: string) => STATUS_ICONS[status] ?? <Clock className="w-5 h-5" />;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <InlineNotice tone="error" title="Submission Desk Unavailable" message={error} />
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Submissions</h1>
          <p className="text-gray-600 mt-1">
            Track your HGF form submissions and approvals
          </p>
        </div>
        <Link
          href="/hgf/forms"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          Register Submission
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search form name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All submission statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="PENDING_REVIEW">Pending Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="REVISIONS_NEEDED">Revisions Needed</option>
        </select>
      </div>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <WorkspaceEmptyState
          title={submissions.length === 0 ? 'No submissions recorded' : 'No submissions match this filter'}
          message={
            submissions.length === 0
              ? 'Start a new HGF submission to open your workflow history.'
              : 'Adjust the search or status filter to review other submissions.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredSubmissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              statusIcon={getStatusIcon(submission.status)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {Math.ceil(submissions.length / 10) > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-gray-600">
            Page {page + 1}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={filteredSubmissions.length < 10}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Individual Submission Card Component
 */
interface SubmissionCardProps {
  submission: HGFSubmissionWithForm;
  statusIcon: React.ReactNode;
}

function SubmissionCard({ submission, statusIcon }: SubmissionCardProps) {
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Link
      href={`/hgf/submissions/${submission.id}`}
      className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {submission.form?.name || 'Unknown Form'}
            </h3>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
              {submission.form?.formCode || 'N/A'}
            </span>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 mb-3">
            <div className="inline-flex items-center gap-1.5">
              {statusIcon}
              <StatusBadge status={submission.status} label={formatStatusLabel(submission.status)} />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-gray-600">
            {submission.createdAt && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Created</p>
                <p className="text-gray-900">{formatDate(submission.createdAt)}</p>
              </div>
            )}
            {submission.submittedAt && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Submitted</p>
                <p className="text-gray-900">{formatDate(submission.submittedAt)}</p>
              </div>
            )}
            {submission.approvedAt && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Approved</p>
                <p className="text-gray-900">{formatDate(submission.approvedAt)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right - Arrow */}
        <div className="flex-shrink-0 text-gray-400">
          <ChevronRight className="w-6 h-6" />
        </div>
      </div>
    </Link>
  );
}
