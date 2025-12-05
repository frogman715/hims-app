'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface InsuranceRecord {
  id: string;
  crewId: string;
  contractId: string;
  insuranceType: string;
  provider: string;
  policyNumber: string;
  coverageAmount: number;
  premiumAmount: number;
  currency: string;
  startDate: string;
  endDate: string;
  status: string;
  crew?: {
    fullName: string;
  };
  contract?: {
    contractNumber: string;
  };
}

export default function InsurancePage() {
  const [records, setRecords] = useState<InsuranceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<InsuranceRecord | null>(null);
  const [formData, setFormData] = useState({
    crewId: '',
    contractId: '',
    insuranceType: 'P&I',
    provider: '',
    policyNumber: '',
    coverageAmount: '',
    premiumAmount: '',
    currency: 'USD',
    startDate: '',
    endDate: '',
    status: 'ACTIVE'
  });
  const router = useRouter();

  const fetchRecords = async () => {
    try {
      const response = await fetch('/api/insurance');
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      }
    } catch (error) {
      console.error('Error fetching insurance records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingRecord ? `/api/insurance/${editingRecord.id}` : '/api/insurance';
      const method = editingRecord ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          coverageAmount: parseFloat(formData.coverageAmount),
          premiumAmount: parseFloat(formData.premiumAmount),
          startDate: new Date(formData.startDate),
          endDate: new Date(formData.endDate),
        }),
      });

      if (response.ok) {
        setFormData({
          crewId: '',
          contractId: '',
          insuranceType: 'P&I',
          provider: '',
          policyNumber: '',
          coverageAmount: '',
          premiumAmount: '',
          currency: 'USD',
          startDate: '',
          endDate: '',
          status: 'ACTIVE'
        });
        setShowForm(false);
        setEditingRecord(null);
        fetchRecords();
      } else {
        alert(`Error ${editingRecord ? 'updating' : 'creating'} insurance record`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Error ${editingRecord ? 'updating' : 'creating'} insurance record`);
    }
  };

  const handleEdit = (record: InsuranceRecord) => {
    setEditingRecord(record);
    setFormData({
      crewId: record.crewId,
      contractId: record.contractId,
      insuranceType: record.insuranceType,
      provider: record.provider,
      policyNumber: record.policyNumber,
      coverageAmount: record.coverageAmount.toString(),
      premiumAmount: record.premiumAmount.toString(),
      currency: record.currency,
      startDate: record.startDate.split('T')[0],
      endDate: record.endDate.split('T')[0],
      status: record.status
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this insurance record?')) return;

    try {
      const response = await fetch(`/api/insurance/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchRecords();
      } else {
        alert('Error deleting insurance record');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting insurance record');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRecord(null);
    setFormData({
      crewId: '',
      contractId: '',
      insuranceType: 'P&I',
      provider: '',
      policyNumber: '',
      coverageAmount: '',
      premiumAmount: '',
      currency: 'USD',
      startDate: '',
      endDate: '',
      status: 'ACTIVE'
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Insurance Management</h1>
              <p className="mt-2 text-gray-700">Manage P&I Club and crew insurance policies</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            {showForm ? 'Cancel' : '+ Add Insurance Record'}
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-gradient-to-r from-white to-blue-50 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-300 p-8 mb-8">
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">{editingRecord ? 'Edit Insurance Record' : 'Add New Insurance Record'}</h2>
            <p className="text-gray-700">Manage insurance policies for crew members</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  Contract ID *
                </label>
                <input
                  type="text"
                  name="contractId"
                  value={formData.contractId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="Employment contract ID"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Insurance Type *
                </label>
                <select
                  name="insuranceType"
                  value={formData.insuranceType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                >
                  <option value="P&I">Protection & Indemnity (P&I)</option>
                  <option value="CREW">Crew Insurance</option>
                  <option value="MEDICAL">Medical Insurance</option>
                  <option value="LIFE">Life Insurance</option>
                  <option value="ACCIDENT">Accident Insurance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Insurance Provider *
                </label>
                <input
                  type="text"
                  name="provider"
                  value={formData.provider}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="Insurance company name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Policy Number *
                </label>
                <input
                  type="text"
                  name="policyNumber"
                  value={formData.policyNumber}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="Insurance policy number"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Coverage Amount *
                </label>
                <input
                  type="number"
                  name="coverageAmount"
                  value={formData.coverageAmount}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Premium Amount *
                </label>
                <input
                  type="number"
                  name="premiumAmount"
                  value={formData.premiumAmount}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="0.00"
                />
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
                  Start Date *
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
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
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-300">
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                {editingRecord ? 'Update Record' : 'Save Insurance Record'}
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

      {/* Insurance Records List */}
      <div className="bg-gradient-to-r from-white to-gray-50 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-300 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-300">
          <h2 className="text-xl font-extrabold text-gray-900">Insurance Records</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-700">Loading insurance records...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-700">No insurance records found. Add your first record above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Crew</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Provider</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Coverage</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Premium</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Period</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-100">
                    <td className="px-8 py-4">
                      <div className="text-sm font-semibold text-gray-900">{record.crew?.fullName}</div>
                      <div className="text-sm text-gray-700">Contract: {record.contract?.contractNumber}</div>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.insuranceType}</div>
                      <div className="text-sm text-gray-700">{record.policyNumber}</div>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.provider}</div>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {record.currency} {record.coverageAmount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {record.currency} {record.premiumAmount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">
                        {new Date(record.startDate).toLocaleDateString()} - {new Date(record.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-medium ${
                        record.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        record.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(record)}
                        className="text-blue-600 hover:text-blue-900 mr-4 font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="text-red-600 hover:text-red-900 font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}