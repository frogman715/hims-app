'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';

interface Audit {
  id: string;
  auditNumber: string;
  auditType: string;
  status: string;
  scope?: string;
  objectives?: string;
  auditCriteria?: string;
  auditDate: string;
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
    auditNumber: audit?.auditNumber || '',
    auditType: audit?.auditType || '',
    scope: audit?.scope || '',
    objectives: audit?.objectives || '',
    auditCriteria: audit?.auditCriteria || '',
    auditDate: audit?.auditDate ? new Date(audit.auditDate).toISOString().split('T')[0] : '',
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
          auditDate: formData.auditDate ? new Date(formData.auditDate) : undefined,
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
        {/* Audit Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Audit Number
          </label>
          <input
            type="text"
            name="auditNumber"
            value={formData.auditNumber}
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
          <input
            type="text"
            name="auditType"
            value={formData.auditType}
            onChange={handleChange}
            placeholder="e.g., ISO 9001, Internal Quality"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Audit Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Audit Date
          </label>
          <input
            type="date"
            name="auditDate"
            value={formData.auditDate}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Objectives */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Audit Objectives
        </label>
        <textarea
          name="objectives"
          value={formData.objectives}
          onChange={handleChange}
          placeholder="What are the objectives of this audit?"
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Audit Criteria */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Audit Criteria
        </label>
        <textarea
          name="auditCriteria"
          value={formData.auditCriteria}
          onChange={handleChange}
          placeholder="Standards, regulations, or internal procedures to be used as audit basis"
          rows={3}
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
