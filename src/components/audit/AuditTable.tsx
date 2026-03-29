'use client';

import { Eye, Edit2 } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface Audit {
  id: string;
  auditNumber: string;
  auditType: string;
  status: string;
  auditDate: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

interface AuditTableProps {
  audits: Audit[];
  onEdit?: (audit: Audit) => void;
  onView: (auditId: string) => void;
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function AuditTable({
  audits,
  onEdit,
  onView,
}: AuditTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
              Audit Number
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
              Type
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
              Status
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
              Audit Date
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {audits.map((audit) => (
            <tr key={audit.id} className="border-b hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                {audit.auditNumber}
              </td>
              <td className="px-6 py-4 text-sm">
                <StatusBadge status={audit.auditType} />
              </td>
              <td className="px-6 py-4 text-sm">
                <StatusBadge status={audit.status} />
              </td>
              <td className="px-6 py-4 text-sm text-gray-700">
                {formatDate(audit.auditDate)}
              </td>
              <td className="px-6 py-4 text-sm">
                <div className="flex gap-2">
                  <button
                    onClick={() => onView(audit.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="View"
                  >
                    <Eye size={16} />
                  </button>
                  {onEdit ? (
                    <button
                      onClick={() => onEdit(audit)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
