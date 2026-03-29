'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { WorkspaceHero } from '@/components/layout/WorkspaceHero';
import { pushAppNotice } from '@/lib/app-notice';

interface Crew {
  id: string;
  fullName: string;
  dateOfBirth: string | null;
  nationality: string | null;
  passportNumber: string | null;
  seamanBookNumber: string | null;
  rank: string;
  status: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  emergencyContact: string | null;
  bloodType: string | null;
}

interface EmploymentContract {
  id: string;
  contractNumber: string;
  contractKind: 'SEA' | 'OFFICE_PKL';
  seaType?: 'KOREA' | 'BAHAMAS_PANAMA' | 'TANKER_LUNDQVIST' | 'OTHER';
  contractStart: string;
  contractEnd: string;
  status: string;
  vessel?: {
    name: string;
  };
  principal?: {
    name: string;
  };
  wageScaleHeader?: {
    name: string;
  };
}

export default function CrewDetailPage() {
  const params = useParams();
  const { data: sessionData } = useSession();
  const session = sessionData;
  const crewId = params.id as string;

  const [crew, setCrew] = useState<Crew | null>(null);
  const [contracts, setContracts] = useState<EmploymentContract[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'contracts' | 'forms'>('overview');
  const [loading, setLoading] = useState(true);

  const fetchCrew = useCallback(async () => {
    if (!crewId) {
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/crew/${crewId}`);
      if (response.ok) {
        const data = await response.json();
        setCrew(data);
      }
    } catch (error) {
      console.error('Error fetching crew:', error);
    } finally {
      setLoading(false);
    }
  }, [crewId]);

  const fetchContracts = useCallback(async () => {
    if (!crewId) {
      return;
    }
    try {
      const response = await fetch(`/api/contracts?crewId=${crewId}`);
      if (response.ok) {
        const data = await response.json();
        setContracts(data);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  }, [crewId]);

  useEffect(() => {
    if (crewId) {
      fetchCrew();
      fetchContracts();
    }
  }, [crewId, fetchContracts, fetchCrew]);

  const notifyFormError = useCallback((message?: string) => {
    pushAppNotice({
      tone: 'error',
      title: 'Form generation failed',
      message: message || 'The selected form could not be generated.',
    });
  }, []);

  const getLatestSEAContract = () => {
    return contracts
      .filter(c => c.contractKind === 'SEA')
      .sort((a, b) => new Date(b.contractStart).getTime() - new Date(a.contractStart).getTime())[0];
  };

  const getLatestOfficePKL = () => {
    return contracts
      .filter(c => c.contractKind === 'OFFICE_PKL')
      .sort((a, b) => new Date(b.contractStart).getTime() - new Date(a.contractStart).getTime())[0];
  };

  const getContractExpiryWarning = () => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return contracts.find(c =>
      c.status === 'ACTIVE' &&
      new Date(c.contractEnd) <= thirtyDaysFromNow &&
      new Date(c.contractEnd) >= now
    );
  };

  const handleGenerateCR02 = async () => {
    try {
      const response = await fetch('/api/forms/cr-02', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ crewId }),
      });

      if (response.ok) {
        // Trigger download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `HGF-CR-02_${crew?.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        notifyFormError(error.error);
      }
    } catch (error) {
      console.error('Error generating form:', error);
      notifyFormError();
    }
  };

  const handleGenerateCR09 = async () => {
    try {
      const response = await fetch('/api/forms/cr-09', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ crewId }),
      });

      if (response.ok) {
        // Trigger download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `HGF-CR-09_${crew?.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        notifyFormError(error.error);
      }
    } catch (error) {
      console.error('Error generating form:', error);
      notifyFormError();
    }
  };

  const handleGenerateCR01 = async () => {
    try {
      const response = await fetch('/api/forms/cr-01', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ crewId }),
      });

      if (response.ok) {
        // Trigger download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `HGF-CR-01_${crew?.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        notifyFormError(error.error);
      }
    } catch (error) {
      console.error('Error generating form:', error);
      notifyFormError();
    }
  };

  const handleGenerateCR07 = async () => {
    try {
      const response = await fetch('/api/forms/cr-07', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ crewId }),
      });

      if (response.ok) {
        // Trigger download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `HGF-CR-07_${crew?.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        notifyFormError(error.error);
      }
    } catch (error) {
      console.error('Error generating form:', error);
      notifyFormError();
    }
  };

  const handleGenerateCR08 = async () => {
    try {
      const response = await fetch('/api/forms/cr-08', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ crewId }),
      });

      if (response.ok) {
        // Trigger download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `HGF-CR-08_${crew?.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        notifyFormError(error.error);
      }
    } catch (error) {
      console.error('Error generating form:', error);
      notifyFormError();
    }
  };

  const handleGenerateCR15 = async () => {
    try {
      const response = await fetch('/api/forms/cr-15', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ crewId }),
      });

      if (response.ok) {
        // Trigger download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `HGF-CR-15_${crew?.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        notifyFormError(error.error);
      }
    } catch (error) {
      console.error('Error generating form:', error);
      notifyFormError();
    }
  };

  const handleGenerateCR16 = async () => {
    try {
      const response = await fetch('/api/forms/cr-16', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ crewId }),
      });

      if (response.ok) {
        // Trigger download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `HGF-CR-16_${crew?.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        notifyFormError(error.error);
      }
    } catch (error) {
      console.error('Error generating form:', error);
      notifyFormError();
    }
  };

  if (loading) {
    return (
      <div className="section-stack">
        <section className="surface-card flex min-h-[320px] items-center justify-center p-8">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-cyan-700" />
        </section>
      </div>
    );
  }

  if (!crew) {
    return (
      <div className="section-stack">
        <section className="surface-card mx-auto max-w-3xl p-8 text-center">
          <h1 className="mb-4 text-2xl font-extrabold text-gray-900">Crew Member Not Found</h1>
          <Link href="/crewing/crew-list" className="text-blue-600 hover:text-blue-800">
            Back to Crew List
          </Link>
        </section>
      </div>
    );
  }

  const latestSEA = getLatestSEAContract();
  const latestPKL = getLatestOfficePKL();
  const expiryWarning = getContractExpiryWarning();

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Crew Workspace"
        title={crew.fullName}
        subtitle={`${crew.rank} • ${crew.status}`}
        highlights={[
          {
            label: 'Contracts',
            value: contracts.length,
            detail: 'Employment contracts linked to this crew profile.',
          },
          {
            label: 'Latest SEA',
            value: latestSEA?.status ?? 'None',
            detail: latestSEA?.contractNumber ?? 'No active sea contract linked.',
          },
          {
            label: 'Office PKL',
            value: latestPKL?.status ?? 'None',
            detail: latestPKL?.contractNumber ?? 'No office PKL contract linked.',
          },
          {
            label: 'Contract Alert',
            value: expiryWarning ? 'Expiring Soon' : 'Clear',
            detail: expiryWarning ? expiryWarning.contractNumber : 'No active contract near expiry.',
          },
        ]}
        helperLinks={[
          { href: '/crewing/seafarers', label: 'Seafarer Register' },
          { href: '/contracts', label: 'Contract Register' },
          { href: '/crewing/documents', label: 'Documents Desk' },
        ]}
        actions={(
          <>
            <Link
              href={`/crew/${crewId}/edit`}
              className="rounded-full bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800"
            >
              Edit Crew
            </Link>
            <Link
              href="/crewing/crew-list"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
            >
              Crew List
            </Link>
          </>
        )}
      />

        {/* Business Widgets */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Latest SEA Contract */}
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Latest SEA Contract</h3>
            {latestSEA ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-4.5 py-0.5 rounded-full text-xs font-medium ${
                    latestSEA.seaType === 'KOREA' ? 'bg-red-100 text-red-800' :
                    latestSEA.seaType === 'BAHAMAS_PANAMA' ? 'bg-yellow-100 text-yellow-800' :
                    latestSEA.seaType === 'TANKER_LUNDQVIST' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {latestSEA.seaType === 'KOREA' ? 'Korea' :
                     latestSEA.seaType === 'BAHAMAS_PANAMA' ? 'Bahamas/Panama' :
                     latestSEA.seaType === 'TANKER_LUNDQVIST' ? 'Tanker' :
                     latestSEA.seaType || 'SEA'}
                  </span>
                  <span className={`inline-flex items-center px-4.5 py-0.5 rounded-full text-xs font-medium ${
                    latestSEA.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    latestSEA.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {latestSEA.status}
                  </span>
                </div>
                <p className="text-sm text-gray-800">
                  <strong>Vessel:</strong> {latestSEA.vessel?.name || 'Not assigned'}
                </p>
                <p className="text-sm text-gray-800">
                  <strong>Principal:</strong> {latestSEA.principal?.name || 'Not assigned'}
                </p>
                <p className="text-sm text-gray-800">
                  <strong>Period:</strong> {new Date(latestSEA.contractStart).toLocaleDateString()} - {new Date(latestSEA.contractEnd).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No SEA contract found</p>
            )}
          </div>

          {/* Latest Office PKL */}
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Latest Office PKL</h3>
            {latestPKL ? (
              <div className="space-y-2">
                <span className={`inline-flex items-center px-4.5 py-0.5 rounded-full text-xs font-medium ${
                  latestPKL.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  latestPKL.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {latestPKL.status}
                </span>
                <p className="text-sm text-gray-800">
                  <strong>Period:</strong> {new Date(latestPKL.contractStart).toLocaleDateString()} - {new Date(latestPKL.contractEnd).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No Office PKL found</p>
            )}
          </div>

          {/* Contract Expiry Warning */}
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Contract Status</h3>
            {expiryWarning ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-4.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Expiring Soon
                  </span>
                </div>
                <p className="text-sm text-gray-800">
                  <strong>Contract:</strong> {expiryWarning.contractNumber}
                </p>
                <p className="text-sm text-gray-800">
                  <strong>Expires:</strong> {new Date(expiryWarning.contractEnd).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">All contracts valid</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-gray-300">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('contracts')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'contracts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Contracts ({contracts.length})
              </button>
              <button
                onClick={() => setActiveTab('forms')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'forms'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Forms & Documents
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900">Full Name</label>
                      <p className="mt-1 text-sm text-gray-900">{crew.fullName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900">Date of Birth</label>
                      <p className="mt-1 text-sm text-gray-900">{crew.dateOfBirth ? new Date(crew.dateOfBirth).toLocaleDateString() : 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900">Nationality</label>
                      <p className="mt-1 text-sm text-gray-900">{crew.nationality || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900">Blood Type</label>
                      <p className="mt-1 text-sm text-gray-900">{crew.bloodType || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900">Phone</label>
                      <p className="mt-1 text-sm text-gray-900">{crew.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{crew.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900">Emergency Contact</label>
                      <p className="mt-1 text-sm text-gray-900">{crew.emergencyContact || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900">Address</label>
                      <p className="mt-1 text-sm text-gray-900">{crew.address || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'contracts' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Employment Contracts</h3>
                  <Link
                    href={`/contracts/new?crewId=${crewId}`}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create New Contract
                  </Link>
                </div>

                {contracts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No contracts found for this crew member.</p>
                    <Link
                      href={`/contracts/new?crewId=${crewId}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Create First Contract
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract #</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SEA Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vessel</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Principal</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {contracts.map((contract) => (
                          <tr key={contract.id} className="hover:bg-gray-100">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900">{contract.contractNumber}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-medium ${
                                contract.contractKind === 'SEA'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {contract.contractKind === 'SEA' ? 'SEA' : 'Office PKL'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {contract.contractKind === 'SEA' ? (
                                <span className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-medium ${
                                  contract.seaType === 'KOREA' ? 'bg-red-100 text-red-800' :
                                  contract.seaType === 'BAHAMAS_PANAMA' ? 'bg-yellow-100 text-yellow-800' :
                                  contract.seaType === 'TANKER_LUNDQVIST' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {contract.seaType === 'KOREA' ? 'Korea' :
                                   contract.seaType === 'BAHAMAS_PANAMA' ? 'Bahamas/Panama' :
                                   contract.seaType === 'TANKER_LUNDQVIST' ? 'Tanker' :
                                   contract.seaType || '-'}
                                </span>
                              ) : (
                                <span className="text-gray-700">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-800">{contract.vessel?.name || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-800">{contract.principal?.name || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-700">
                                {new Date(contract.contractStart).toLocaleDateString()} - {new Date(contract.contractEnd).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-medium ${
                                contract.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                contract.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                                contract.status === 'TERMINATED' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {contract.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Link
                                href={`/contracts/${contract.id}`}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                View
                              </Link>
                              {(session?.user?.roles?.includes('DIRECTOR') || session?.user?.roles?.includes('CDMO')) && (
                                <Link
                                  href={`/contracts/${contract.id}/edit`}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  Edit
                                </Link>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'forms' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">HGQS Forms</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* CR-02 Form - Only for DIRECTOR, CDMO, ACCOUNTING */}
                  {(session?.user?.roles?.includes('DIRECTOR') ||
                    session?.user?.roles?.includes('CDMO') ||
                    session?.user?.roles?.includes('ACCOUNTING')) && (
                    <div className="bg-gray-100 rounded-lg p-4 border border-gray-300">
                      <h4 className="font-medium text-gray-900 mb-2">HGF-CR-02 Application for Employment</h4>
                      <p className="text-sm text-gray-800 mb-3">Generate the official employment application form with auto-filled crew data.</p>
                      <button
                        onClick={handleGenerateCR02}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium"
                      >
                        Generate Form
                      </button>
                    </div>
                  )}

                  {/* CR-09 Form - Only for DIRECTOR, CDMO, ACCOUNTING */}
                  {(session?.user?.roles?.includes('DIRECTOR') ||
                    session?.user?.roles?.includes('CDMO') ||
                    session?.user?.roles?.includes('ACCOUNTING')) && (
                    <div className="bg-gray-100 rounded-lg p-4 border border-gray-300">
                      <h4 className="font-medium text-gray-900 mb-2">HGF-CR-09 Interview List</h4>
                      <p className="text-sm text-gray-800 mb-3">Generate the crew interview checklist with personal and professional details.</p>
                      <button
                        onClick={handleGenerateCR09}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium"
                      >
                        Generate Form
                      </button>
                    </div>
                  )}

                  {/* CR-01 Form - Only for DIRECTOR, CDMO, ACCOUNTING */}
                  {(session?.user?.roles?.includes('DIRECTOR') ||
                    session?.user?.roles?.includes('CDMO') ||
                    session?.user?.roles?.includes('ACCOUNTING')) && (
                    <div className="bg-gray-100 rounded-lg p-4 border border-gray-300">
                      <h4 className="font-medium text-gray-900 mb-2">HGF-CR-01 Document Check List</h4>
                      <p className="text-sm text-gray-800 mb-3">Generate the document verification checklist for crew compliance.</p>
                      <button
                        onClick={handleGenerateCR01}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium"
                      >
                        Generate Form
                      </button>
                    </div>
                  )}

                  {/* CR-07 Form - Only for DIRECTOR, CDMO, ACCOUNTING */}
                  {(session?.user?.roles?.includes('DIRECTOR') ||
                    session?.user?.roles?.includes('CDMO') ||
                    session?.user?.roles?.includes('ACCOUNTING')) && (
                    <div className="bg-gray-100 rounded-lg p-4 border border-gray-300">
                      <h4 className="font-medium text-gray-900 mb-2">HGF-CR-07 Crew Vacation Plan</h4>
                      <p className="text-sm text-gray-800 mb-3">Generate the crew vacation planning document with contract details.</p>
                      <button
                        onClick={handleGenerateCR07}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium"
                      >
                        Generate Form
                      </button>
                    </div>
                  )}

                  {/* CR-08 Form - Only for DIRECTOR, CDMO, ACCOUNTING */}
                  {(session?.user?.roles?.includes('DIRECTOR') ||
                    session?.user?.roles?.includes('CDMO') ||
                    session?.user?.roles?.includes('ACCOUNTING')) && (
                    <div className="bg-gray-100 rounded-lg p-4 border border-gray-300">
                      <h4 className="font-medium text-gray-900 mb-2">HGF-CR-08 Crew Evaluation Report</h4>
                      <p className="text-sm text-gray-800 mb-3">Generate the crew performance evaluation report with attendance metrics.</p>
                      <button
                        onClick={handleGenerateCR08}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium"
                      >
                        Generate Form
                      </button>
                    </div>
                  )}

                  {/* CR-15 Form - Only for DIRECTOR, CDMO, ACCOUNTING */}
                  {(session?.user?.roles?.includes('DIRECTOR') ||
                    session?.user?.roles?.includes('CDMO') ||
                    session?.user?.roles?.includes('ACCOUNTING')) && (
                    <div className="bg-gray-100 rounded-lg p-4 border border-gray-300">
                      <h4 className="font-medium text-gray-900 mb-2">HGF-CR-15 Result of Medical Advice</h4>
                      <p className="text-sm text-gray-800 mb-3">Generate the medical examination result and advice document.</p>
                      <button
                        onClick={handleGenerateCR15}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium"
                      >
                        Generate Form
                      </button>
                    </div>
                  )}

                  {/* CR-16 Form - Only for DIRECTOR, CDMO, ACCOUNTING */}
                  {(session?.user?.roles?.includes('DIRECTOR') ||
                    session?.user?.roles?.includes('CDMO') ||
                    session?.user?.roles?.includes('ACCOUNTING')) && (
                    <div className="bg-gray-100 rounded-lg p-4 border border-gray-300">
                      <h4 className="font-medium text-gray-900 mb-2">HGF-CR-16 Medical Treatment Request</h4>
                      <p className="text-sm text-gray-800 mb-3">Generate the medical treatment request and assessment form.</p>
                      <button
                        onClick={handleGenerateCR16}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium"
                      >
                        Generate Form
                      </button>
                    </div>
                  )}

                  {/* Add more forms here as needed */}
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
