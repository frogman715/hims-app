'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingDown,
  TrendingUp,
  Users,
  FileText,
  Activity,
  Loader,
} from 'lucide-react';

interface DashboardStats {
  documentCompliance: { rate: number; active: number; total: number };
  nonconformityRate: { rate: number; closed: number; open: number };
  avgResolutionTime: number;
  riskDistribution: Record<string, number>;
  severityDistribution: Record<string, number>;
  expiringDocuments: Array<{id: string; crew?: {fullName: string}; document?: {docType: string}; expiresAt?: string}>;
  criticalNonconformities: Array<{id: string; crew?: {fullName: string}; type: string}>;
  overdueNonconformities: unknown[];
  highRiskCrews: Array<{id: string; fullName: string; riskDocumentCount?: number}>;
  problematicCrews: unknown[];
  auditSummary: {totalEvents?: number; criticalEvents?: number; byCategory?: Record<string, number>};
}

export function QMSDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        const responses = await Promise.all([
          fetch('/api/qms/dashboard/compliance-rate'),
          fetch('/api/qms/dashboard/closure-rate'),
          fetch('/api/qms/dashboard/resolution-time'),
          fetch('/api/qms/dashboard/risk-distribution'),
          fetch('/api/qms/dashboard/expiring-documents'),
          fetch('/api/qms/dashboard/critical-nonconformities'),
          fetch('/api/qms/documents?status=EXPIRING_SOON&limit=10'),
          fetch('/api/qms/nonconformities?severity=CRITICAL&limit=10'),
          fetch('/api/qms/audit-trail?days=30&limit=20'),
        ]);

        if (!responses.every((r) => r.ok)) {
          throw new Error('Failed to fetch dashboard data');
        }

        const data = await Promise.all(responses.map((r) => r.json()));

        setStats({
          documentCompliance: data[0].data,
          nonconformityRate: data[1].data,
          avgResolutionTime: data[2].data,
          riskDistribution: data[3].data,
          severityDistribution: data[4].data,
          expiringDocuments: data[5].data.slice(0, 5),
          criticalNonconformities: data[6].data.slice(0, 5),
          overdueNonconformities: [],
          highRiskCrews: data[7].data.slice(0, 5),
          problematicCrews: [],
          auditSummary: data[8].data,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-900">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">QMS Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Quality Management System compliance metrics and insights
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Document Compliance */}
        <KPICard
          title="Document Compliance"
          value={`${stats.documentCompliance.rate}%`}
          subtitle={`${stats.documentCompliance.active} of ${stats.documentCompliance.total}`}
          trend={stats.documentCompliance.rate >= 95 ? 'up' : 'down'}
          target="95%"
          icon={FileText}
          status={
            stats.documentCompliance.rate >= 95 ? 'success' : 'warning'
          }
        />

        {/* Non-conformity Closure */}
        <KPICard
          title="Closure Rate"
          value={`${stats.nonconformityRate.rate}%`}
          subtitle={`${stats.nonconformityRate.closed} closed`}
          trend={stats.nonconformityRate.rate >= 80 ? 'up' : 'down'}
          target="80%"
          icon={CheckCircle}
          status={
            stats.nonconformityRate.rate >= 80 ? 'success' : 'warning'
          }
        />

        {/* Avg Resolution Time */}
        <KPICard
          title="Avg Resolution"
          value={`${stats.avgResolutionTime} days`}
          subtitle={`${stats.nonconformityRate.open} open`}
          trend={stats.avgResolutionTime < 30 ? 'up' : 'down'}
          target="< 30 days"
          icon={Clock}
          status={stats.avgResolutionTime < 30 ? 'success' : 'warning'}
        />

        {/* Critical Issues */}
        <KPICard
          title="Critical Issues"
          value={stats.criticalNonconformities.length}
          subtitle="Require immediate action"
          trend={stats.criticalNonconformities.length === 0 ? 'up' : 'down'}
          target="0"
          icon={AlertTriangle}
          status={
            stats.criticalNonconformities.length === 0 ? 'success' : 'critical'
          }
        />
      </div>

      {/* Risk & Severity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DistributionCard
          title="Risk Distribution"
          data={stats.riskDistribution}
          colors={{
            LOW: 'bg-green-100 text-green-800',
            MEDIUM: 'bg-yellow-100 text-yellow-800',
            HIGH: 'bg-orange-100 text-orange-800',
            CRITICAL: 'bg-red-100 text-red-800',
          }}
        />

        <DistributionCard
          title="Severity Distribution"
          data={stats.severityDistribution}
          colors={{
            LOW: 'bg-green-100 text-green-800',
            MEDIUM: 'bg-yellow-100 text-yellow-800',
            HIGH: 'bg-orange-100 text-orange-800',
            CRITICAL: 'bg-red-100 text-red-800',
          }}
        />
      </div>

      {/* Alerts & Critical Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring Documents */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            Expiring Soon (30 days)
          </h3>
          {stats.expiringDocuments.length === 0 ? (
            <p className="text-gray-600 text-sm">No documents expiring soon</p>
          ) : (
            <div className="space-y-2">
              {stats.expiringDocuments.map((doc, i) => (
                <div key={i} className="text-sm p-2 bg-orange-50 rounded border border-orange-200">
                  <p className="font-medium text-gray-900">
                    {doc.crew?.fullName}
                  </p>
                  <p className="text-gray-600">
                    {doc.document?.docType} ·{' '}
                    {doc.expiresAt &&
                      new Date(doc.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Critical Non-conformities */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Critical Issues
          </h3>
          {stats.criticalNonconformities.length === 0 ? (
            <p className="text-gray-600 text-sm">No critical issues</p>
          ) : (
            <div className="space-y-2">
              {stats.criticalNonconformities.map((nc, i) => (
                <div key={i} className="text-sm p-2 bg-red-50 rounded border border-red-200">
                  <p className="font-medium text-gray-900">
                    {nc.crew?.fullName || 'Unassigned'}
                  </p>
                  <p className="text-gray-600">{nc.type}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* High Risk Crews */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-red-600" />
          High Risk Crews
        </h3>
        {stats.highRiskCrews && stats.highRiskCrews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.highRiskCrews.map((crew, i) => (
              <div key={i} className="p-3 bg-red-50 rounded border border-red-200">
                <p className="font-medium text-gray-900">
                  {crew.fullName}
                </p>
                <p className="text-sm text-red-700">
                  {crew.riskDocumentCount || 0} high-risk documents
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-sm">No high-risk crews identified</p>
        )}
      </div>

      {/* Audit Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          Audit Summary (Last 30 Days)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox
            label="Total Events"
            value={stats.auditSummary?.totalEvents || 0}
            color="blue"
          />
          <StatBox
            label="Critical Events"
            value={stats.auditSummary?.criticalEvents || 0}
            color="red"
          />
          <StatBox
            label="Categories"
            value={
              Object.keys(
                stats.auditSummary?.byCategory || {}
              ).length
            }
            color="purple"
          />
          <StatBox
            label="Document Verifications"
            value={
              stats.auditSummary?.byCategory?.DOCUMENT_VERIFICATION || 0
            }
            color="green"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * KPI Card Component
 */
function KPICard({
  title,
  value,
  subtitle,
  trend,
  target,
  icon: Icon,
  status,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  trend: 'up' | 'down';
  target: string;
  icon: React.ComponentType<{className?: string}>;
  status: 'success' | 'warning' | 'critical';
}) {
  const statusColors = {
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    critical: 'bg-red-50 border-red-200',
  };

  const iconColors = {
    success: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600',
  };

  return (
    <div className={`${statusColors[status]} border rounded-lg p-4`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          <p className="text-xs text-gray-600 mt-1">{subtitle}</p>
          <p className="text-xs text-gray-500 mt-1">Target: {target}</p>
        </div>
        <Icon className={`w-6 h-6 ${iconColors[status]}`} />
      </div>
      {trend === 'up' ? (
        <TrendingUp className="w-4 h-4 text-green-600 mt-2" />
      ) : (
        <TrendingDown className="w-4 h-4 text-red-600 mt-2" />
      )}
    </div>
  );
}

/**
 * Distribution Card Component
 */
function DistributionCard({
  title,
  data,
  colors,
}: {
  title: string;
  data: Record<string, number>;
  colors: Record<string, string>;
}) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {Object.entries(data).map(([level, count]) => (
          <div key={level}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">
                {level}
              </span>
              <span className="text-sm text-gray-600">{count}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${colors[level]?.split(' ')[0]}`}
                style={{
                  width: `${total === 0 ? 0 : (count / total) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Stat Box Component
 */
function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    red: 'bg-red-50 text-red-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
  };

  return (
    <div className={`${colors[color]} rounded-lg p-3 text-center`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-gray-600 mt-1">{label}</p>
    </div>
  );
}
