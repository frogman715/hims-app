'use client';

import React, { useState } from 'react';
import { ExternalCompliance, ComplianceSystemType, ComplianceStatus } from '@prisma/client';

interface Crew {
  id: number;
  firstName: string;
  lastName: string;
  seamanCode: string;
}

interface ExternalComplianceWithCrew extends ExternalCompliance {
  crew: Crew;
}

interface ExternalComplianceManagerProps {
  crewId?: number;
}

export default function ExternalComplianceManager({ crewId }: ExternalComplianceManagerProps) {
  const [compliances, setCompliances] = useState<ExternalComplianceWithCrew[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCompliance, setEditingCompliance] = useState<ExternalComplianceWithCrew | null>(null);
  const [formData, setFormData] = useState({
    crewId: crewId || '',
    systemType: 'KOSMA_CERTIFICATE' as ComplianceSystemType,
    certificateNumber: '',
    issueDate: '',
    expiryDate: '',
    verificationUrl: '',
    status: 'PENDING' as ComplianceStatus,
    notes: '',
  });

  const fetchCompliances = React.useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (crewId) params.append('crewId', crewId.toString());

      const response = await fetch(`/api/external-compliance?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCompliances(data);
      }
    } catch (error) {
      console.error('Error fetching compliances:', error);
    } finally {
      setLoading(false);
    }
  }, [crewId]);

  React.useEffect(() => {
    fetchCompliances();
  }, [fetchCompliances]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingCompliance
        ? '/api/external-compliance'
        : '/api/external-compliance';

      const method = editingCompliance ? 'PUT' : 'POST';
      const body = editingCompliance
        ? { ...formData, id: editingCompliance.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await fetchCompliances();
        setShowForm(false);
        setEditingCompliance(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving compliance:', error);
    }
  };

  const handleEdit = (compliance: ExternalComplianceWithCrew) => {
    setEditingCompliance(compliance);
    setFormData({
      crewId: compliance.crewId.toString(),
      systemType: compliance.systemType,
      certificateNumber: compliance.certificateNumber || '',
      issueDate: compliance.issueDate ? compliance.issueDate.split('T')[0] : '',
      expiryDate: compliance.expiryDate ? compliance.expiryDate.split('T')[0] : '',
      verificationUrl: compliance.verificationUrl || '',
      status: compliance.status,
      notes: compliance.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this compliance record?')) return;

    try {
      const response = await fetch(`/api/external-compliance?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCompliances();
      }
    } catch (error) {
      console.error('Error deleting compliance:', error);
    }
  };

  const handleVerify = async (id: number) => {
    try {
      const response = await fetch(`/api/external-compliance/${id}/verify`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchCompliances();
      }
    } catch (error) {
      console.error('Error verifying compliance:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      crewId: crewId || '',
      systemType: 'KOSMA_CERTIFICATE',
      certificateNumber: '',
      issueDate: '',
      expiryDate: '',
      verificationUrl: '',
      status: 'PENDING',
      notes: '',
    });
  };

  const getSystemTypeLabel = (type: ComplianceSystemType) => {
    switch (type) {
      case 'KOSMA_CERTIFICATE':
        return 'KOSMA Certificate';
      case 'DEPHUB_CERTIFICATE':
        return 'Dephub Certificate';
      case 'SCHENGEN_VISA_NL':
        return 'Schengen Visa (NL)';
      default:
        return type;
    }
  };

  const getStatusColor = (status: ComplianceStatus) => {
    switch (status) {
      case 'VERIFIED':
        return 'text-green-600 bg-green-100';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100';
      case 'FAILED':
        return 'text-red-600 bg-red-100';
      case 'EXPIRED':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading compliance records...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          External Compliance Records
        </h3>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingCompliance(null);
            resetForm();
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add Compliance Record
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h4 className="text-md font-medium mb-4">
            {editingCompliance ? 'Edit' : 'Add'} Compliance Record
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!crewId && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Crew Member
                </label>
                <input
                  type="number"
                  value={formData.crewId}
                  onChange={(e) => setFormData({ ...formData, crewId: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                System Type
              </label>
              <select
                value={formData.systemType}
                onChange={(e) => setFormData({ ...formData, systemType: e.target.value as ComplianceSystemType })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="KOSMA_CERTIFICATE">KOSMA Certificate</option>
                <option value="DEPHUB_CERTIFICATE">Dephub Certificate</option>
                <option value="SCHENGEN_VISA_NL">Schengen Visa (NL)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Certificate Number
              </label>
              <input
                type="text"
                value={formData.certificateNumber}
                onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Verification URL
              </label>
              <input
                type="url"
                value={formData.verificationUrl}
                onChange={(e) => setFormData({ ...formData, verificationUrl: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ComplianceStatus })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="PENDING">Pending</option>
                <option value="VERIFIED">Verified</option>
                <option value="FAILED">Failed</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingCompliance(null);
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                {editingCompliance ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {compliances.map((compliance) => (
            <li key={compliance.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-900">
                      {getSystemTypeLabel(compliance.systemType)}
                    </p>
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(compliance.status)}`}>
                      {compliance.status}
                    </span>
                  </div>
                  {!crewId && (
                    <p className="text-sm text-gray-500">
                      {compliance.crew.firstName} {compliance.crew.lastName} ({compliance.crew.seamanCode})
                    </p>
                  )}
                  {compliance.certificateNumber && (
                    <p className="text-sm text-gray-500">
                      Certificate: {compliance.certificateNumber}
                    </p>
                  )}
                  {compliance.expiryDate && (
                    <p className="text-sm text-gray-500">
                      Expires: {new Date(compliance.expiryDate).toLocaleDateString()}
                    </p>
                  )}
                  {compliance.verificationUrl && (
                    <a
                      href={compliance.verificationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      View Verification
                    </a>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleVerify(compliance.id)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => handleEdit(compliance)}
                    className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(compliance.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {compliances.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No compliance records found.
          </div>
        )}
      </div>
    </div>
  );
}