'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface EmploymentContract {
  id: string;
  contractNumber: string;
  contractKind: 'SEA' | 'OFFICE_PKL';
  seaType?: 'KOREA' | 'BAHAMAS_PANAMA' | 'TANKER_LUNDQVIST' | 'OTHER';
  maritimeLaw?: string;
  cbaReference?: string;
  wageScaleHeaderId?: string;
  guaranteedOTHours?: number;
  overtimeRate?: string;
  onboardAllowance?: number;
  homeAllotment?: number;
  specialAllowance?: number;
  templateVersion?: string;
  crewId: string;
  vesselId?: string;
  principalId?: string;
  rank: string;
  contractStart: string;
  contractEnd: string;
  status: string;
  basicWage: number;
  currency: string;
  crew: {
    id: string;
    firstName: string;
    lastName: string;
    nationality: string;
    dateOfBirth: string;
    passportNumber: string;
    address: string;
  };
  vessel?: {
    id: string;
    name: string;
    flag: string;
    imoNumber: string;
  };
  principal?: {
    id: string;
    name: string;
    address: string;
  };
  wageScaleHeader?: {
    name: string;
    principalId: string;
  };
}

export default function ContractDetailPage() {
  const params = useParams();
  const [contract, setContract] = useState<EmploymentContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContract = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/contracts/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setContract(data);
      } else if (response.status === 404) {
        setError('Contract not found');
      } else {
        setError('Failed to load contract');
      }
    } catch (error) {
      console.error('Failed to load contract:', error);
      setError('Failed to load contract');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <h1 className="text-2xl font-extrabold text-gray-900 mb-4">Error</h1>
              <p className="text-gray-700 mb-6">{error || 'Contract not found'}</p>
              <Link
                href="/contracts"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Back to Contracts
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contract Details</h1>
            <p className="text-gray-700 mt-1">Contract #{contract.contractNumber}</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handlePrint}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Contract
            </button>
            <Link
              href={`/contracts/${contract.id}/edit`}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Edit Contract
            </Link>
            <Link
              href="/contracts"
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Back to List
            </Link>
          </div>
        </div>

        {/* Contract Information */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-300">
            <h2 className="text-xl font-semibold text-gray-900">Contract Information</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900">Contract Number</label>
                <p className="mt-1 text-sm text-gray-900">{contract.contractNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900">Contract Type</label>
                <p className="mt-1 text-sm text-gray-900">
                  <span className={`inline-flex items-center px-4.5 py-0.5 rounded-full text-xs font-medium ${
                    contract.contractKind === 'SEA'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {contract.contractKind === 'SEA' ? 'SEA Contract (MLC Compliant)' : 'Office PKL Contract'}
                  </span>
                </p>
              </div>
              {contract.contractKind === 'SEA' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900">SEA Type</label>
                  <p className="mt-1 text-sm text-gray-900">
                    <span className={`inline-flex items-center px-4.5 py-0.5 rounded-full text-xs font-medium ${
                      contract.seaType === 'KOREA' ? 'bg-red-100 text-red-800' :
                      contract.seaType === 'BAHAMAS_PANAMA' ? 'bg-yellow-100 text-yellow-800' :
                      contract.seaType === 'TANKER_LUNDQVIST' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {contract.seaType === 'KOREA' ? 'Korea' :
                       contract.seaType === 'BAHAMAS_PANAMA' ? 'Bahamas / Panama' :
                       contract.seaType === 'TANKER_LUNDQVIST' ? 'Tanker (Lundqvist)' :
                       contract.seaType || 'Not specified'}
                    </span>
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-900">Rank</label>
                <p className="mt-1 text-sm text-gray-900">{contract.rank}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900">Status</label>
                <p className="mt-1 text-sm text-gray-900">
                  <span className={`inline-flex items-center px-4.5 py-0.5 rounded-full text-xs font-medium ${
                    contract.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    contract.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                    contract.status === 'TERMINATED' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {contract.status}
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900">Start Date</label>
                <p className="mt-1 text-sm text-gray-900">{new Date(contract.contractStart).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900">End Date</label>
                <p className="mt-1 text-sm text-gray-900">{new Date(contract.contractEnd).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Crew Information */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-300">
            <h2 className="text-xl font-semibold text-gray-900">Crew Member Information</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900">Full Name</label>
                <p className="mt-1 text-sm text-gray-900">{contract.crew.firstName} {contract.crew.lastName}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900">Nationality</label>
                <p className="mt-1 text-sm text-gray-900">{contract.crew.nationality}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900">Date of Birth</label>
                <p className="mt-1 text-sm text-gray-900">{new Date(contract.crew.dateOfBirth).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900">Passport Number</label>
                <p className="mt-1 text-sm text-gray-900">{contract.crew.passportNumber}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-900">Address</label>
                <p className="mt-1 text-sm text-gray-900">{contract.crew.address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Vessel Information */}
        {contract.vessel && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b border-gray-300">
              <h2 className="text-xl font-semibold text-gray-900">Vessel Information</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900">Vessel Name</label>
                  <p className="mt-1 text-sm text-gray-900">{contract.vessel.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900">Flag</label>
                  <p className="mt-1 text-sm text-gray-900">{contract.vessel.flag}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900">IMO Number</label>
                  <p className="mt-1 text-sm text-gray-900">{contract.vessel.imoNumber}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Principal Information */}
        {contract.principal && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b border-gray-300">
              <h2 className="text-xl font-semibold text-gray-900">Principal Information</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900">Company Name</label>
                  <p className="mt-1 text-sm text-gray-900">{contract.principal.name}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-900">Address</label>
                  <p className="mt-1 text-sm text-gray-900">{contract.principal.address}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CBA Information - SEA Contracts Only */}
        {contract.contractKind === 'SEA' && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b border-gray-300">
              <h2 className="text-xl font-semibold text-gray-900">Contract & CBA</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {contract.maritimeLaw && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900">Maritime Law</label>
                    <p className="mt-1 text-sm text-gray-900">{contract.maritimeLaw}</p>
                  </div>
                )}
                {contract.cbaReference && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900">CBA Reference</label>
                    <p className="mt-1 text-sm text-gray-900">{contract.cbaReference}</p>
                  </div>
                )}
                {contract.guaranteedOTHours && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900">Guaranteed OT Hours</label>
                    <p className="mt-1 text-sm text-gray-900">{contract.guaranteedOTHours}</p>
                  </div>
                )}
                {contract.overtimeRate && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900">Overtime Rate</label>
                    <p className="mt-1 text-sm text-gray-900">{contract.overtimeRate}</p>
                  </div>
                )}
                {contract.templateVersion && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900">Template Version</label>
                    <p className="mt-1 text-sm text-gray-900">{contract.templateVersion}</p>
                  </div>
                )}
                {contract.wageScaleHeader && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900">Wage Scale</label>
                    <p className="mt-1 text-sm text-gray-900">{contract.wageScaleHeader.name}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Wage & Allowances */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-300">
            <h2 className="text-xl font-semibold text-gray-900">Wage & Allowances</h2>
          </div>
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Wage Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount ({contract.currency})</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Basic Wage</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{contract.basicWage.toLocaleString()}</td>
                    </tr>
                    {/* Wage scale items would be displayed here when API includes them */}
                    <tr className="border-t-2 border-gray-400">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">Total Monthly Wage</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                        {contract.basicWage.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Allowances</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {contract.onboardAllowance && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900">Onboard Allowance</label>
                    <p className="mt-1 text-sm text-gray-900">{contract.currency} {contract.onboardAllowance.toLocaleString()}</p>
                  </div>
                )}
                {contract.homeAllotment && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900">Home Allotment</label>
                    <p className="mt-1 text-sm text-gray-900">{contract.currency} {contract.homeAllotment.toLocaleString()}</p>
                  </div>
                )}
                {contract.specialAllowance && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900">Special Allowance</label>
                    <p className="mt-1 text-sm text-gray-900">{contract.currency} {contract.specialAllowance.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Wage Scale Information */}
        {contract.wageScaleHeader && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b border-gray-300">
              <h2 className="text-xl font-semibold text-gray-900">Wage Scale</h2>
            </div>
            <div className="p-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900">Wage Scale Name</label>
                <p className="mt-1 text-sm text-gray-900">{contract.wageScaleHeader.name}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}