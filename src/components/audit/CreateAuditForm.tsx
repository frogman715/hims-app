'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';

interface Audit {
  id: string;
  auditCode: string;
  title: string;
  auditType: string;
  status: string;
  description?: string;
  scope?: string;
  plannedDate: string;
  leadAuditorId: string;
}

interface CreateAuditFormProps {
  audit?: Audit | null;
  onSuccess: () => void;
}

export default function CreateAuditForm({ audit, onSuccess }: CreateAuditFormProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    auditCode: audit?.auditCode || '',
    title: audit?.title || '',
    auditType: audit?.auditType || 'INTERNAL',
    description: audit?.description || '',
    scope: audit?.scope || '',
    plannedDate: audit?.plannedDate ? new Date(audit.plannedDate).toISOString().split('T')[0] : '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/audit/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          plannedDate: new Date(formData.plannedDate),
          teamMembers: [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create audit');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Audit Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Audit Code
          </label>
          <input
            type="text"
            name="auditCode"
            value={formData.auditCode}
            onChange={handleChange}
            placeholder="e.g., AUD-2024-001"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Audit Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Audit Type
          </label>
          <select
            name="auditType"
            value={formData.auditType}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="INTERNAL">Internal</option>
            <option value="EXTERNAL">External</option>
            <option value="COMPLIANCE">Compliance</option>
            <option value="MANAGEMENT_REVIEW">Management Review</option>
            <option value="RISK_ASSESSMENT">Risk Assessment</option>
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Audit title"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Planned Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Planned Date
          </label>
          <input
            type="date"
            name="plannedDate"
            value={formData.plannedDate}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Audit description and context"
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Scope */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Scope
        </label>
        <textarea
          name="scope"
          value={formData.scope}
          onChange={handleChange}
          placeholder="Audit scope - what areas/processes will be audited"
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Submit Button */}
      <div className="flex gap-4 justify-end">
        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
        >
          {loading ? 'Creating...' : 'Create Audit'}
        </Button>
      </div>
    </form>
  );
}
