'use client';

import { useState, useEffect, useCallback } from 'react';
import { InlineNotice } from '@/components/feedback/InlineNotice';
import { WorkspaceEmptyState } from '@/components/feedback/WorkspaceEmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getRoleDisplayName } from '@/lib/role-display';

interface AuditLogValues {
  name?: string;
  email?: string;
  role?: string;
  isSystemAdmin?: boolean;
  [key: string]: unknown;
}

interface AuditLogMetadata {
  newStatus?: string;
  resetBy?: string;
  [key: string]: unknown;
}

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  oldValuesJson?: AuditLogValues;
  newValuesJson?: AuditLogValues;
  metadataJson?: AuditLogMetadata;
}

interface AuditLogTableProps {
  entityType?: string;
  refreshTrigger?: number;
}

export default function AuditLogTable({ entityType = 'User', refreshTrigger }: AuditLogTableProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/audit-logs?entityType=${entityType}&limit=50`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch audit logs');
      }

      setLogs(data.logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Audit log records could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [entityType]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs, refreshTrigger]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionStatus = (action: string) => {
    switch (action) {
      case 'USER_CREATED':
      case 'USER_ACTIVATED':
        return 'APPROVED';
      case 'USER_UPDATED':
      case 'ROLE_CHANGED':
        return 'IN_PROGRESS';
      case 'USER_DEACTIVATED':
        return 'REJECTED';
      case 'PASSWORD_RESET':
        return 'PENDING_REVIEW';
      default:
        return 'DRAFT';
    }
  };

  const formatAction = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  if (loading) {
    return (
      <div className="py-10 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-cyan-700"></div>
        <p className="mt-3 text-sm text-slate-600">Loading audit trail records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <InlineNotice tone="error" message={error} />
    );
  }

  if (logs.length === 0) {
    return (
      <WorkspaceEmptyState
        title="No audit events recorded"
        message="Administrative user actions will appear here after controlled changes are performed."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Timestamp
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Action
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Performed By
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Details
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-slate-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {formatDate(log.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={getActionStatus(log.action)} label={formatAction(log.action)} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-slate-900">{log.actor.name}</div>
                <div className="text-sm text-slate-500">{log.actor.email}</div>
              </td>
              <td className="px-6 py-4 text-sm leading-6 text-slate-600">
                {log.action === 'USER_CREATED' && log.newValuesJson && (
                  <div>
                    Created user: <strong>{log.newValuesJson.name}</strong> ({log.newValuesJson.email})
                    <br />
                    Role: <strong>{getRoleDisplayName(log.newValuesJson.role, log.newValuesJson.isSystemAdmin)}</strong>
                  </div>
                )}
                {log.action === 'USER_UPDATED' && log.oldValuesJson && log.newValuesJson && (
                  <div>
                    {log.oldValuesJson.name !== log.newValuesJson.name && (
                      <div>Name: {log.oldValuesJson.name} → {log.newValuesJson.name}</div>
                    )}
                    {log.oldValuesJson.role !== log.newValuesJson.role && (
                      <div>Role: {getRoleDisplayName(log.oldValuesJson.role, log.oldValuesJson.isSystemAdmin)} → {getRoleDisplayName(log.newValuesJson.role, log.newValuesJson.isSystemAdmin)}</div>
                    )}
                    {log.oldValuesJson.isSystemAdmin !== log.newValuesJson.isSystemAdmin && (
                      <div>
                        System Admin: {log.oldValuesJson.isSystemAdmin ? 'Yes' : 'No'} → {log.newValuesJson.isSystemAdmin ? 'Yes' : 'No'}
                      </div>
                    )}
                  </div>
                )}
                {(log.action === 'USER_ACTIVATED' || log.action === 'USER_DEACTIVATED') && log.metadataJson && (
                  <div>
                    Status changed to: <strong>{log.metadataJson.newStatus}</strong>
                  </div>
                )}
                {log.action === 'PASSWORD_RESET' && log.metadataJson && (
                  <div>
                    Password reset by: <strong>{log.metadataJson.resetBy}</strong>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
