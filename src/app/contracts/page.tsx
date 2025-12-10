'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

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
  crew?: {
    fullName: string;
  };
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

export default function ContractsPage() {
  const [contracts, setContracts] = useState<EmploymentContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContract, setEditingContract] = useState<EmploymentContract | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'SEA' | 'OFFICE_PKL'>('ALL');
  const [formData, setFormData] = useState({
    contractNumber: '',
    contractKind: 'SEA' as 'SEA' | 'OFFICE_PKL',
    seaType: '' as '' | 'KOREA' | 'BAHAMAS_PANAMA' | 'TANKER_LUNDQVIST' | 'OTHER',
    maritimeLaw: '',
    cbaReference: '',
    wageScaleHeaderId: '',
    guaranteedOTHours: '',
    overtimeRate: '',
    onboardAllowance: '',
    homeAllotment: '',
    specialAllowance: '',
    templateVersion: '',
    crewId: '',
    vesselId: '',
    principalId: '',
    rank: '',
    contractStart: '',
    contractEnd: '',
    status: 'ACTIVE',
    basicWage: '',
    currency: 'USD'
  });
  const router = useRouter();

  const fetchContracts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/contracts');
      if (response.ok) {
        const data = await response.json();
        setContracts(data);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingContract ? `/api/contracts/${editingContract.id}` : '/api/contracts';
      const method = editingContract ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractNumber: formData.contractNumber,
          contractKind: formData.contractKind,
          seaType: formData.seaType || null,
          maritimeLaw: formData.maritimeLaw || null,
          cbaReference: formData.cbaReference || null,
          wageScaleHeaderId: formData.wageScaleHeaderId || null,
          guaranteedOTHours: formData.guaranteedOTHours ? parseInt(formData.guaranteedOTHours) : null,
          overtimeRate: formData.overtimeRate || null,
          onboardAllowance: formData.onboardAllowance ? parseFloat(formData.onboardAllowance) : null,
          homeAllotment: formData.homeAllotment ? parseFloat(formData.homeAllotment) : null,
          specialAllowance: formData.specialAllowance ? parseFloat(formData.specialAllowance) : null,
          templateVersion: formData.templateVersion || null,
          crewId: formData.crewId,
          vesselId: formData.vesselId || null,
          principalId: formData.principalId || null,
          rank: formData.rank,
          contractStart: formData.contractStart,
          contractEnd: formData.contractEnd,
          status: formData.status,
          basicWage: parseFloat(formData.basicWage),
          currency: formData.currency
        }),
      });

      if (response.ok) {
        setFormData({
          contractNumber: '',
          contractKind: 'SEA',
          seaType: '',
          maritimeLaw: '',
          cbaReference: '',
          wageScaleHeaderId: '',
          guaranteedOTHours: '',
          overtimeRate: '',
          onboardAllowance: '',
          homeAllotment: '',
          specialAllowance: '',
          templateVersion: '',
          crewId: '',
          vesselId: '',
          principalId: '',
          rank: '',
          contractStart: '',
          contractEnd: '',
          status: 'ACTIVE',
          basicWage: '',
          currency: 'USD'
        });
        setShowForm(false);
        setEditingContract(null);
        fetchContracts();
      } else {
        alert(`Error ${editingContract ? 'updating' : 'creating'} contract`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Error ${editingContract ? 'updating' : 'creating'} contract`);
    }
  };

  const handleEdit = (contract: EmploymentContract) => {
    setEditingContract(contract);
    setFormData({
      contractNumber: contract.contractNumber,
      contractKind: contract.contractKind,
      seaType: contract.seaType || '',
      maritimeLaw: contract.maritimeLaw || '',
      cbaReference: contract.cbaReference || '',
      wageScaleHeaderId: contract.wageScaleHeaderId || '',
      guaranteedOTHours: contract.guaranteedOTHours?.toString() || '',
      overtimeRate: contract.overtimeRate || '',
      onboardAllowance: contract.onboardAllowance?.toString() || '',
      homeAllotment: contract.homeAllotment?.toString() || '',
      specialAllowance: contract.specialAllowance?.toString() || '',
      templateVersion: contract.templateVersion || '',
      crewId: contract.crewId,
      vesselId: contract.vesselId || '',
      principalId: contract.principalId || '',
      rank: contract.rank,
      contractStart: contract.contractStart.split('T')[0],
      contractEnd: contract.contractEnd.split('T')[0],
      status: contract.status,
      basicWage: contract.basicWage.toString(),
      currency: contract.currency
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingContract(null);
    setFormData({
      contractNumber: '',
      contractKind: 'SEA',
      seaType: '',
      maritimeLaw: '',
      cbaReference: '',
      wageScaleHeaderId: '',
      guaranteedOTHours: '',
      overtimeRate: '',
      onboardAllowance: '',
      homeAllotment: '',
      specialAllowance: '',
      templateVersion: '',
      crewId: '',
      vesselId: '',
      principalId: '',
      rank: '',
      contractStart: '',
      contractEnd: '',
      status: 'ACTIVE',
      basicWage: '',
      currency: 'USD'
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contract?')) return;

    try {
      const response = await fetch(`/api/contracts/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchContracts();
      } else {
        alert('Error deleting contract');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting contract');
    }
  };

  const handleGenerateDocument = async (contractId: string, type: string) => {
    try {
      const response = await fetch(`/api/documents/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, id: contractId }),
      });

      if (response.ok) {
        // Trigger download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_${contractId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        alert(`Error generating document: ${error.error}`);
      }
    } catch (error) {
      console.error('Error generating document:', error);
      alert('Error generating document');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/crewing')}
              className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Employment Contracts</h1>
              <p className="mt-2 text-gray-700">Manage seafarer employment contracts</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            {showForm ? 'Cancel' : '+ New Contract'}
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-gradient-to-r from-white to-blue-50 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-300 p-8 mb-8">
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">{editingContract ? 'Edit Employment Contract' : 'Add New Employment Contract'}</h2>
            <p className="text-gray-700">Create and manage seafarer employment agreements</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contract Number *
                </label>
                <input
                  type="text"
                  name="contractNumber"
                  value={formData.contractNumber}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="Contract number"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contract Type *
                </label>
                <select
                  name="contractKind"
                  value={formData.contractKind}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                >
                  <option value="SEA">SEA Contract (MLC Compliant)</option>
                  <option value="OFFICE_PKL">Office PKL Contract</option>
                </select>
              </div>
              {formData.contractKind === 'SEA' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      SEA Type
                    </label>
                    <select
                      name="seaType"
                      value={formData.seaType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                    >
                      <option value="">Select SEA Type</option>
                      <option value="KOREA">Korea</option>
                      <option value="BAHAMAS_PANAMA">Bahamas / Panama</option>
                      <option value="TANKER_LUNDQVIST">Tanker (Lundqvist)</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Maritime Law
                    </label>
                    <input
                      type="text"
                      name="maritimeLaw"
                      value={formData.maritimeLaw}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                      placeholder="e.g. Bahamas, Panama, Korea"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      CBA Reference
                    </label>
                    <input
                      type="text"
                      name="cbaReference"
                      value={formData.cbaReference}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                      placeholder="e.g. Lundqvist CBA 2024"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Wage Scale Header ID
                    </label>
                    <input
                      type="text"
                      name="wageScaleHeaderId"
                      value={formData.wageScaleHeaderId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                      placeholder="Wage scale header ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Guaranteed OT Hours
                    </label>
                    <input
                      type="number"
                      name="guaranteedOTHours"
                      value={formData.guaranteedOTHours}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                      placeholder="e.g. 103"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Overtime Rate
                    </label>
                    <input
                      type="text"
                      name="overtimeRate"
                      value={formData.overtimeRate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                      placeholder="e.g. 125%"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Onboard Allowance
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="onboardAllowance"
                      value={formData.onboardAllowance}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                      placeholder="Cash advance on board"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Home Allotment
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="homeAllotment"
                      value={formData.homeAllotment}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                      placeholder="Monthly remittance"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Special Allowance
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="specialAllowance"
                      value={formData.specialAllowance}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                      placeholder="SA for certain ships"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Template Version
                    </label>
                    <input
                      type="text"
                      name="templateVersion"
                      value={formData.templateVersion}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                      placeholder="SEA template revision"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Crew ID *
                </label>
                <input
                  type="text"
                  name="crewId"
                  value={formData.crewId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="Crew member ID"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vessel ID (Optional)
                </label>
                <input
                  type="text"
                  name="vesselId"
                  value={formData.vesselId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="Vessel ID"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Principal ID (Optional)
                </label>
                <input
                  type="text"
                  name="principalId"
                  value={formData.principalId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="Principal company ID"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Rank *
                </label>
                <select
                  name="rank"
                  value={formData.rank}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                >
                  <option value="">Select Rank</option>
                  <option value="MASTER">Master</option>
                  <option value="CHIEF_OFFICER">Chief Officer</option>
                  <option value="SECOND_OFFICER">Second Officer</option>
                  <option value="THIRD_OFFICER">Third Officer</option>
                  <option value="CHIEF_ENGINEER">Chief Engineer</option>
                  <option value="SECOND_ENGINEER">Second Engineer</option>
                  <option value="THIRD_ENGINEER">Third Engineer</option>
                  <option value="FOURTH_ENGINEER">Fourth Engineer</option>
                  <option value="ELECTRICAL_OFFICER">Electrical Officer</option>
                  <option value="BOATSWAIN">Boatswain</option>
                  <option value="ABLE_SEAMAN">Able Seaman</option>
                  <option value="ORDINARY_SEAMAN">Ordinary Seaman</option>
                  <option value="OILER">Oiler</option>
                  <option value="WIPER">Wiper</option>
                  <option value="MOTORMAN">Motorman</option>
                  <option value="CHIEF_COOK">Chief Cook</option>
                  <option value="COOK">Cook</option>
                  <option value="STEWARD">Steward</option>
                  <option value="CADET">Cadet</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="contractStart"
                  value={formData.contractStart}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  name="contractEnd"
                  value={formData.contractEnd}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="TERMINATED">Terminated</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Currency *
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="SEK">SEK</option>
                  <option value="NOK">NOK</option>
                  <option value="DKK">DKK</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Basic Wage *
                </label>
                <input
                  type="number"
                  name="basicWage"
                  value={formData.basicWage}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Special Allowance
                </label>
                <input
                  type="number"
                  name="specialAllowance"
                  value={formData.specialAllowance}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Onboard Allowance
                </label>
                <input
                  type="number"
                  name="onboardAllowance"
                  value={formData.onboardAllowance}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Home Allotment *
                </label>
                <input
                  type="number"
                  name="homeAllotment"
                  value={formData.homeAllotment}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-300">
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                {editingContract ? 'Update Contract' : 'Save Employment Contract'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Contracts List */}
      <div className="bg-gradient-to-r from-white to-gray-50 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-300 overflow-hidden">
        {/* Metrics Dashboard */}
        <div className="px-8 py-6 border-b border-gray-300 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-700">Total Contracts</p>
                  <p className="text-2xl font-extrabold text-gray-900">{contracts.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-700">Active Contracts</p>
                  <p className="text-2xl font-extrabold text-gray-900">{contracts.filter(c => c.status === 'ACTIVE').length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-700">Expiring Soon</p>
                  <p className="text-2xl font-extrabold text-gray-900">
                    {contracts.filter(c => {
                      const endDate = new Date(c.contractEnd);
                      const now = new Date();
                      const diffTime = endDate.getTime() - now.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      return diffDays <= 30 && diffDays >= 0 && c.status === 'ACTIVE';
                    }).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-700">Total Value</p>
                  <p className="text-2xl font-extrabold text-gray-900">
                    ${contracts.filter(c => c.status === 'ACTIVE').reduce((sum, c) => sum + c.basicWage, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 border-b border-gray-300">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-extrabold text-gray-900">All Contracts</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('ALL')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === 'ALL'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Contracts ({contracts.length})
              </button>
              <button
                onClick={() => setFilter('SEA')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === 'SEA'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                SEA Contracts ({contracts.filter(c => c.contractKind === 'SEA').length})
              </button>
              <button
                onClick={() => setFilter('OFFICE_PKL')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === 'OFFICE_PKL'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Office PKL Contracts
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-700">Loading contracts...</p>
          </div>
        ) : contracts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-700">No contracts found. Create your first contract above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Contract #</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">SEA Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Crew</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Vessel</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Principal</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Start Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">End Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Days Left</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Monthly Wage</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contracts
                  .filter(contract => filter === 'ALL' || contract.contractKind === filter)
                  .sort((a, b) => new Date(b.contractStart).getTime() - new Date(a.contractStart).getTime())
                  .map((contract) => {
                    const endDate = new Date(contract.contractEnd);
                    const now = new Date();
                    const diffTime = endDate.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const isExpiringSoon = diffDays <= 30 && diffDays >= 0 && contract.status === 'ACTIVE';
                    
                    return (
                      <tr key={contract.id} className={`hover:bg-gray-100 ${isExpiringSoon ? 'bg-yellow-50' : ''}`}>
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
                          <div className="text-sm font-medium text-gray-900">{contract.crew?.fullName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-800">{contract.rank}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-800">{contract.vessel?.name || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-800">{contract.principal?.name || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-800">{new Date(contract.contractStart).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-800">{new Date(contract.contractEnd).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${isExpiringSoon ? 'text-red-600' : 'text-gray-700'}`}>
                            {contract.status === 'ACTIVE' ? (diffDays > 0 ? `${diffDays} days` : 'Expired') : '-'}
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {contract.currency} {contract.basicWage.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => router.push(`/contracts/${contract.id}`)}
                              className="text-blue-600 hover:text-blue-900 font-semibold px-4 py-2 rounded hover:bg-blue-100"
                              title="View Details"
                            >
                              👁️
                            </button>
                            <button
                              onClick={() => handleEdit(contract)}
                              className="text-green-600 hover:text-green-900 font-semibold px-4 py-2 rounded hover:bg-green-50"
                              title="Edit Contract"
                            >
                              ✏️
                            </button>
                            {contract.contractKind === 'SEA' && (
                              <button
                                onClick={() => handleGenerateDocument(contract.id, 'sea_agreement')}
                                className="text-purple-600 hover:text-purple-900 font-semibold px-4 py-2 rounded hover:bg-purple-50"
                                title="Generate SEA"
                              >
                                📄
                              </button>
                            )}
                            {contract.contractKind === 'OFFICE_PKL' && (
                              <button
                                onClick={() => handleGenerateDocument(contract.id, 'pkl_contract')}
                                className="text-purple-600 hover:text-purple-900 font-semibold px-4 py-2 rounded hover:bg-purple-50"
                                title="Generate PKL"
                              >
                                📄
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(contract.id)}
                              className="text-red-600 hover:text-red-900 font-semibold px-4 py-2 rounded hover:bg-red-50"
                              title="Delete Contract"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}