'use client';

import { useState, useEffect } from 'react';

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
  oldValuesJson?: any;
  newValuesJson?: any;
  metadataJson?: any;
}

interface AuditLogTableProps {
  entityType?: string;
  refreshTrigger?: number;
}

export default function AuditLogTable({ entityType = 'User', refreshTrigger }: AuditLogTableProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [entityType, refreshTrigger]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/audit-logs?entityType=${entityType}&limit=50`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch audit logs');
      }

      setLogs(data.logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

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

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'USER_CREATED':
        return 'bg-green-100 text-green-800';
      case 'USER_UPDATED':
      case 'ROLE_CHANGED':
        return 'bg-blue-100 text-blue-800';
      case 'USER_DEACTIVATED':
        return 'bg-red-100 text-red-800';
      case 'USER_ACTIVATED':
        return 'bg-green-100 text-green-800';
      case 'PASSWORD_RESET':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-2 text-gray-600">Loading audit logs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No audit logs found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Timestamp
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Action
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Performed By
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Details
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(log.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionBadgeColor(log.action)}`}>
                  {formatAction(log.action)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{log.actor.name}</div>
                <div className="text-sm text-gray-500">{log.actor.email}</div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {log.action === 'USER_CREATED' && log.newValuesJson && (
                  <div>
                    Created user: <strong>{log.newValuesJson.name}</strong> ({log.newValuesJson.email})
                    <br />
                    Role: <strong>{log.newValuesJson.role}</strong>
                  </div>
                )}
                {log.action === 'USER_UPDATED' && log.oldValuesJson && log.newValuesJson && (
                  <div>
                    {log.oldValuesJson.name !== log.newValuesJson.name && (
                      <div>Name: {log.oldValuesJson.name} → {log.newValuesJson.name}</div>
                    )}
                    {log.oldValuesJson.role !== log.newValuesJson.role && (
                      <div>Role: {log.oldValuesJson.role} → {log.newValuesJson.role}</div>
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
