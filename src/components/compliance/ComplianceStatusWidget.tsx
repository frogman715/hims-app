'use client';

import { useState, useEffect, useCallback } from 'react';

const SYSTEM_TYPES = ['KOSMA_CERTIFICATE', 'DEPHUB_CERTIFICATE', 'SCHENGEN_VISA_NL'] as const;
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
      case 'KOSMA_CERTIFICATE':
        return 'KOSMA';
      case 'DEPHUB_CERTIFICATE':
        return 'Dephub';
      case 'SCHENGEN_VISA_NL':
        return 'Schengen NL';
      default:
        return type;
    }
  };

  const getComplianceRate = (systemStats: ComplianceStats) => {
    if (systemStats.total === 0) return 0;
    return Math.round((systemStats.verified / systemStats.total) * 100);
  };

  const getStatusColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
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
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        External Compliance Status
      </h3>

      <div className="space-y-4">
        {Object.entries(stats).map(([systemType, systemStats]) => {
          const rate = getComplianceRate(systemStats);
          return (
            <div key={systemType} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-900">
                  {getSystemTypeLabel(systemType as ExternalComplianceSystem)}
                </h4>
                <span className={`text-sm font-semibold ${getStatusColor(rate)}`}>
                  {rate}%
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${rate}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs text-gray-600">
                <div>Total: {systemStats.total}</div>
                <div className="text-green-600">✓ {systemStats.verified}</div>
                <div className="text-yellow-600">⏳ {systemStats.pending}</div>
                <div className="text-red-600">✗ {systemStats.failed + systemStats.expired}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="text-sm text-gray-600">
          <p className="mb-1">
            <span className="inline-block w-3 h-3 bg-green-500 rounded mr-2"></span>
            Verified certificates are valid and up-to-date
          </p>
          <p className="mb-1">
            <span className="inline-block w-3 h-3 bg-yellow-500 rounded mr-2"></span>
            Pending certificates require verification
          </p>
          <p>
            <span className="inline-block w-3 h-3 bg-red-500 rounded mr-2"></span>
            Failed/expired certificates need attention
          </p>
        </div>
      </div>
    </div>
  );
}