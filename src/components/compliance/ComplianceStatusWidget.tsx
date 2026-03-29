'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { WorkspaceEmptyState } from '@/components/feedback/WorkspaceEmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';

const SYSTEM_TYPES = ['DEPHUB_CERTIFICATE', 'SCHENGEN_VISA_NL'] as const;
type ExternalComplianceSystem = typeof SYSTEM_TYPES[number];
type ExternalComplianceStatus = 'PENDING' | 'VERIFIED' | 'EXPIRED' | 'REJECTED';

interface ComplianceStats {
  total: number;
  verified: number;
  pending: number;
  failed: number;
  expired: number;
}

interface ComplianceStatusWidgetProps {
  crewId?: string;
}

const EMPTY_STATS: ComplianceStats = { total: 0, verified: 0, pending: 0, failed: 0, expired: 0 };

const createEmptyStatsMap = () =>
  SYSTEM_TYPES.reduce<Record<ExternalComplianceSystem, ComplianceStats>>((accumulator, system) => {
    accumulator[system] = { ...EMPTY_STATS };
    return accumulator;
  }, {} as Record<ExternalComplianceSystem, ComplianceStats>);

export default function ComplianceStatusWidget({ crewId }: ComplianceStatusWidgetProps) {
  const [stats, setStats] = useState<Record<ExternalComplianceSystem, ComplianceStats>>(() => createEmptyStatsMap());
  const [loading, setLoading] = useState(true);

  const fetchComplianceStats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (crewId) params.append('crewId', crewId.toString());

      const response = await fetch(`/api/external-compliance?${params}`);
      if (response.ok) {
        const result: { data: Array<{ systemType: ExternalComplianceSystem; status: ExternalComplianceStatus }> } = await response.json();
        const compliances = result.data ?? [];

        const newStats = createEmptyStatsMap();

        compliances.forEach((compliance: { systemType: ExternalComplianceSystem; status: ExternalComplianceStatus }) => {
          const systemType = compliance.systemType;
          if (newStats[systemType]) {
            newStats[systemType].total += 1;
            switch (compliance.status) {
              case 'VERIFIED':
                newStats[systemType].verified += 1;
                break;
              case 'PENDING':
                newStats[systemType].pending += 1;
                break;
              case 'REJECTED':
                newStats[systemType].failed += 1;
                break;
              case 'EXPIRED':
                newStats[systemType].expired += 1;
                break;
            }
          }
        });

        setStats(newStats);
      }
    } catch (error) {
      console.error('Error fetching compliance stats:', error);
    } finally {
      setLoading(false);
    }
  }, [crewId]);

  useEffect(() => {
    fetchComplianceStats();
  }, [fetchComplianceStats]);

  const getSystemTypeLabel = (type: ExternalComplianceSystem) => {
    switch (type) {
      case 'DEPHUB_CERTIFICATE':
        return 'Dephub Verification';
      case 'SCHENGEN_VISA_NL':
        return 'Schengen Visa NL';
      default:
        return type;
    }
  };

  const recordsNeedingAction = Object.values(stats).reduce(
    (total, systemStats) => total + systemStats.pending + systemStats.failed + systemStats.expired,
    0
  );

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700">Verification Snapshot</p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">
          Records needing review
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Simple action view for Dephub and visa records that still need follow-up.
        </p>
      </div>

      {recordsNeedingAction === 0 ? (
        <WorkspaceEmptyState
          title="Verification queue is clear"
          message="No external records currently require follow-up or revalidation."
        />
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-5">
            <p className="text-sm font-semibold text-amber-900">Records needing action</p>
            <p className="mt-2 text-3xl font-semibold text-amber-900">{recordsNeedingAction}</p>
            <p className="mt-2 text-sm text-amber-800">
              Review pending, failed, or expired records and update the related document follow-up.
            </p>
          </div>

          <div className="space-y-3">
            {Object.entries(stats)
              .filter(([, systemStats]) => systemStats.pending + systemStats.failed + systemStats.expired > 0)
              .map(([systemType, systemStats]) => {
                const actionCount = systemStats.pending + systemStats.failed + systemStats.expired;
                return (
                  <div key={systemType} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-sm font-medium text-slate-900">
                        {getSystemTypeLabel(systemType as ExternalComplianceSystem)}
                      </h4>
                      <StatusBadge
                        status="PENDING_REVIEW"
                        label={`${actionCount} record${actionCount === 1 ? '' : 's'}`}
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-600">
                      Pending review: {systemStats.pending} · Declined or expired: {systemStats.failed + systemStats.expired}
                    </p>
                  </div>
                );
              })}
          </div>

          <Link
            href="/compliance/external"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Open Verification Desk
          </Link>
        </div>
      )}
    </div>
  );
}
