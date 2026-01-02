'use client';

import { useEffect, useState } from 'react';
import type { DashboardMetrics, Alert } from '@/lib/qms/advanced-analytics';

export function AdvancedQMSDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/qms/analytics/dashboard');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const result = await response.json();
      setMetrics(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Dashboard</h3>
        <p className="text-red-700">{error}</p>
        <button
          onClick={fetchMetrics}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">QMS Advanced Dashboard</h2>
        <button
          onClick={fetchMetrics}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICardComponent
          label="Compliance Score"
          value={metrics.kpis.complianceScore}
          unit="%"
          trend={metrics.kpis.trend}
          color="from-blue-500 to-blue-600"
        />
        <KPICardComponent
          label="Document Coverage"
          value={metrics.kpis.documentCoverage}
          unit="%"
          trend={metrics.kpis.trend}
          color="from-green-500 to-green-600"
        />
        <KPICardComponent
          label="Nonconformity Closure"
          value={metrics.kpis.nonconformityClosure}
          unit="%"
          trend={metrics.kpis.trend}
          color="from-orange-500 to-orange-600"
        />
        <KPICardComponent
          label="Audit Completion"
          value={metrics.kpis.auditCompletion}
          unit="%"
          trend={metrics.kpis.trend}
          color="from-purple-500 to-purple-600"
        />
      </div>

      {/* Main Metrics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Risk Distribution</h3>
          <div className="space-y-3">
            <RiskBar label="Critical" value={metrics.riskDistribution.critical} color="bg-red-600" max={metrics.riskDistribution.total} />
            <RiskBar label="High" value={metrics.riskDistribution.high} color="bg-orange-500" max={metrics.riskDistribution.total} />
            <RiskBar label="Medium" value={metrics.riskDistribution.medium} color="bg-yellow-500" max={metrics.riskDistribution.total} />
            <RiskBar label="Low" value={metrics.riskDistribution.low} color="bg-green-500" max={metrics.riskDistribution.total} />
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Issues:</span>
              <span className="font-semibold text-lg">{metrics.riskDistribution.total}</span>
            </div>
          </div>
        </div>

        {/* Document Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Document Status</h3>
          <div className="space-y-3">
            <DocStatusItem label="Active" value={metrics.documentStatus.active} color="text-blue-600" bg="bg-blue-50" />
            <DocStatusItem label="Expiring Soon" value={metrics.documentStatus.expiringSoon} color="text-orange-600" bg="bg-orange-50" />
            <DocStatusItem label="Expired" value={metrics.documentStatus.expired} color="text-red-600" bg="bg-red-50" />
            <DocStatusItem label="Archived" value={metrics.documentStatus.archived} color="text-gray-600" bg="bg-gray-50" />
          </div>
        </div>

        {/* Compliance Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Compliance Breakdown</h3>
          <div className="space-y-4">
            <MetricBar label="Coverage" value={metrics.kpis.documentCoverage} color="bg-blue-500" />
            <MetricBar label="Closure Rate" value={metrics.kpis.nonconformityClosure} color="bg-green-500" />
            <MetricBar label="Audits" value={metrics.kpis.auditCompletion} color="bg-purple-500" />
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-semibold">Overall Score</span>
                <span className={`text-3xl font-bold ${getScoreColor(metrics.kpis.complianceScore)}`}>
                  {metrics.kpis.complianceScore}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Alerts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Critical Alerts ({metrics.alerts.filter((a) => a.severity === 'CRITICAL').length})
          </h3>
          <div className="space-y-3">
            {metrics.alerts.filter((a) => a.severity === 'CRITICAL').length > 0 ? (
              metrics.alerts
                .filter((a) => a.severity === 'CRITICAL')
                .map((alert) => <AlertItem key={alert.id} alert={alert} />)
            ) : (
              <p className="text-gray-500 text-center py-8">✓ No critical alerts</p>
            )}
          </div>
        </div>

        {/* All Alerts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">All Alerts ({metrics.alerts.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {metrics.alerts.length > 0 ? (
              metrics.alerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded border-l-4" style={{ borderColor: getSeverityColorHex(alert.severity) }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{alert.description}</p>
                  </div>
                  {alert.actionRequired && (
                    <span className="ml-2 px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded whitespace-nowrap">
                      ACTION
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No alerts</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent QMS Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Event</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Time</th>
              </tr>
            </thead>
            <tbody>
              {metrics.recentActivity.length > 0 ? (
                metrics.recentActivity.map((activity) => (
                  <tr key={activity.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-600">{activity.type}</td>
                    <td className="py-3 px-4 text-gray-900 font-medium">{activity.title}</td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-8 px-4 text-center text-gray-500">
                    No recent activity
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function KPICardComponent({
  label,
  value,
  unit,
  trend,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  trend: 'UP' | 'DOWN' | 'STABLE';
  color: string;
}) {
  const trendIcon = trend === 'UP' ? '📈' : trend === 'DOWN' ? '📉' : '→';

  return (
    <div className={`bg-gradient-to-br ${color} rounded-lg shadow p-6 text-white`}>
      <p className="text-sm opacity-90 mb-2">{label}</p>
      <div className="flex items-baseline justify-between">
        <div className="text-3xl font-bold">
          {value}
          <span className="text-lg ml-1">{unit}</span>
        </div>
        <span className="text-2xl">{trendIcon}</span>
      </div>
    </div>
  );
}

function RiskBar({ label, value, color, max }: { label: string; value: number; color: string; max: number }) {
  const percent = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm text-gray-700">{label}</span>
        <span className="text-sm font-semibold text-gray-900">{value}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm text-gray-700">{label}</span>
        <span className="text-sm font-semibold text-gray-900">{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );
}

function DocStatusItem({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className={`${bg} p-3 rounded flex justify-between items-center`}>
      <span className="text-gray-700 font-medium">{label}</span>
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
    </div>
  );
}

function AlertItem({ alert }: { alert: Alert }) {
  return (
    <div className={`p-3 rounded border-l-4 bg-gray-50`} style={{ borderColor: getSeverityColorHex(alert.severity) }}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{alert.title}</p>
          <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
        </div>
        {alert.actionRequired && (
          <span className="ml-2 px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded whitespace-nowrap">
            ACTION
          </span>
        )}
      </div>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

function getSeverityColorHex(severity: string): string {
  if (severity === 'CRITICAL') return '#dc2626';
  if (severity === 'HIGH') return '#f97316';
  if (severity === 'MEDIUM') return '#eab308';
  return '#22c55e';
}

