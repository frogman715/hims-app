'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function NewContractForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const crewIdFromUrl = searchParams.get('crewId');

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
    crewId: crewIdFromUrl || '',
    vesselId: '',
    principalId: '',
    rank: '',
    contractStart: '',
    contractEnd: '',
    status: 'DRAFT',
    basicWage: '',
    currency: 'USD'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.contractKind === 'SEA') {
      if (!formData.vesselId) {
        alert('Vessel is required for SEA contracts');
        return;
      }
      if (!formData.principalId) {
        alert('Principal is required for SEA contracts');
        return;
      }
      if (formData.seaType === 'TANKER_LUNDQVIST' && !formData.vesselId.includes('TANKER')) {
        alert('Tanker Lundqvist contracts must be linked to a tanker vessel');
        return;
      }
    }

    if (new Date(formData.contractEnd) <= new Date(formData.contractStart)) {
      alert('Contract end date must be after start date');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contracts', {
        method: 'POST',
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
        router.push('/contracts');
      } else {
        const error = await response.json();
        alert(`Error creating contract: ${error.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating contract');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Contract</h1>
            <p className="text-gray-700 mt-1">Add a new employment contract</p>
          </div>
          <Link
            href="/contracts"
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Back to Contracts
          </Link>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-300">
            <h2 className="text-xl font-semibold text-gray-900">Contract Details</h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                  placeholder="Enter contract number"
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
                <input
                  type="text"
                  name="rank"
                  value={formData.rank}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="Job rank/position"
                />
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
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="TERMINATED">Terminated</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="IDR">IDR</option>
                </select>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Wage Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Link
                href="/contracts"
                className="bg-gray-500 text-white px-6 py-3 rounded-xl hover:bg-gray-600 transition-all duration-200"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:cursor-not-allowed transition-all duration-200"
              >
                {isSubmitting ? 'Creating...' : 'Create Contract'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function NewContractPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewContractForm />
    </Suspense>
  );
}