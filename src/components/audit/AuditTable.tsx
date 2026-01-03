'use client';

import { Eye, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Audit {
  id: string;
  auditCode: string;
  title: string;
  auditType: string;
  status: string;
  plannedDate: string;
  startDate: string | null;
  completionDate: string | null;
  createdAt: string;
}

interface AuditTableProps {
  audits: Audit[];
  onEdit: (audit: Audit) => void;
  onView: (auditId: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PLANNED':
      return 'bg-blue-100 text-blue-800';
    case 'IN_PROGRESS':
      return 'bg-yellow-100 text-yellow-800';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    case 'CLOSED':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'INTERNAL':
      return 'bg-purple-100 text-purple-800';
    case 'EXTERNAL':
      return 'bg-orange-100 text-orange-800';
    case 'COMPLIANCE':
      return 'bg-red-100 text-red-800';
    case 'MANAGEMENT_REVIEW':
      return 'bg-indigo-100 text-indigo-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

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
              Code
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
              Title
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
              Type
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
              Status
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
              Planned Date
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
                {audit.auditCode}
              </td>
              <td className="px-6 py-4 text-sm text-gray-700">
                {audit.title}
              </td>
              <td className="px-6 py-4 text-sm">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(audit.auditType)}`}>
                  {audit.auditType}
                </span>
              </td>
              <td className="px-6 py-4 text-sm">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(audit.status)}`}>
                  {audit.status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-700">
                {formatDate(audit.plannedDate)}
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
                  <button
                    onClick={() => onEdit(audit)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
