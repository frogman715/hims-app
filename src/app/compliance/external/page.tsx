'use client';

import { useEffect, useState, useCallback } from 'react';
import ExternalComplianceWidget from '@/components/compliance/ExternalComplianceWidget';

interface ComplianceRecord {
  id: string;
  crew: {
    id: string;
    fullName: string;
    rank: string;
  };
  systemType: string;
  certificateId: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  status: string;
  verificationUrl: string | null;
  notes: string | null;
}

export default function ExternalCompliancePage() {
  const [compliances, setCompliances] = useState<ComplianceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'KOSMA' | 'DEPHUB' | 'SCHENGEN'>('ALL');

  const fetchCompliances = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/external-compliance';
      if (filter !== 'ALL') {
        const systemTypeMap = {
          KOSMA: 'KOSMA_CERTIFICATE',
          DEPHUB: 'DEPHUB_CERTIFICATE',
          SCHENGEN: 'SCHENGEN_VISA_NL',
        };
        url += `?systemType=${systemTypeMap[filter]}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        setCompliances(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching compliances:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchCompliances();
  }, [fetchCompliances]);

  const getSystemTypeLabel = (type: string) => {
    switch (type) {
      case 'KOSMA_CERTIFICATE':
        return { label: 'KOSMA Korea', color: 'bg-blue-100 text-blue-800' };
      case 'DEPHUB_CERTIFICATE':
        return { label: 'Dephub Indonesia', color: 'bg-green-100 text-green-800' };
      case 'SCHENGEN_VISA_NL':
        return { label: 'Schengen Visa NL', color: 'bg-purple-100 text-purple-800' };
      default:
        return { label: type, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      case 'REJECTED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">External Compliance Systems</h1>
          <p className="text-gray-700 mt-2">
            Manage KOSMA, Dephub, and Schengen Visa compliance records
          </p>
        </div>

        {/* Widget Overview */}
        <div className="mb-6">
          <ExternalComplianceWidget />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-900">Filter by System:</span>
            <div className="flex gap-2">
              {(['ALL', 'KOSMA', 'DEPHUB', 'SCHENGEN'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {f === 'ALL' ? 'All Systems' : f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Records Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Crew Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    System
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Certificate ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiry Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : compliances.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No compliance records found
                    </td>
                  </tr>
                ) : (
                  compliances.map((compliance) => {
                    const systemType = getSystemTypeLabel(compliance.systemType);
                    return (
                      <tr key={compliance.id} className="hover:bg-gray-100">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {compliance.crew.fullName}
                            </div>
                            <div className="text-sm text-gray-500">{compliance.crew.rank}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-4 py-2 text-xs font-medium rounded-full ${systemType.color}`}
                          >
                            {systemType.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {compliance.certificateId || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {compliance.expiryDate
                            ? new Date(compliance.expiryDate).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-4 py-2 text-xs font-medium rounded-full ${getStatusBadge(
                              compliance.status
                            )}`}
                          >
                            {compliance.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {compliance.verificationUrl && (
                            <a
                              href={compliance.verificationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline mr-3"
                            >
                              Verify →
                            </a>
                          )}
                          <button className="text-gray-700 hover:text-gray-900">
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
