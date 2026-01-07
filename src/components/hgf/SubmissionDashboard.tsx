/**
 * Submission Dashboard Component
 * Crew dapat lihat semua submissions mereka dan status
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

interface HGFSubmissionWithForm extends HGFSubmission {
  form: HGFForm | null;
}

interface SubmissionDashboardProps {
  crewId?: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  DRAFT: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    icon: <Clock className="w-5 h-5" />,
  },
  SUBMITTED: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    icon: <Clock className="w-5 h-5" />,
  },
  PENDING_REVIEW: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    icon: <Clock className="w-5 h-5" />,
  },
  UNDER_REVIEW: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    icon: <Clock className="w-5 h-5" />,
  },
  APPROVED: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    icon: <CheckCircle className="w-5 h-5" />,
  },
  REJECTED: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    icon: <XCircle className="w-5 h-5" />,
  },
  REVISIONS_NEEDED: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    icon: <Clock className="w-5 h-5" />,
  },
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
          throw new Error('Failed to fetch submissions');
        }

        const data = (await response.json()) as { data: HGFSubmissionWithForm[] };
        setSubmissions(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
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

  const getStatusDisplay = (status: string) => {
    const config = STATUS_COLORS[status] || STATUS_COLORS.DRAFT;
    return config;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Error: {error}</p>
      </div>
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
          New Submission
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
          <option value="ALL">All Status</option>
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
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-lg">No submissions found</p>
          <p className="text-gray-500 text-sm mt-1">
            {submissions.length === 0
              ? 'Start by creating a new submission'
              : 'Try adjusting your filters'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSubmissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              statusConfig={getStatusDisplay(submission.status)}
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
  statusConfig: { bg: string; text: string; icon: React.ReactNode };
}

function SubmissionCard({ submission, statusConfig }: SubmissionCardProps) {
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
            <div className={`${statusConfig.bg} ${statusConfig.text} inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium`}>
              {statusConfig.icon}
              {submission.status.replace(/_/g, ' ')}
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
