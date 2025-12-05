'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AgencyFee {
  id: string;
  principalId: string;
  contractId: string;
  feeType: string;
  amount: number;
  currency: string;
  percentage?: number;
  description: string;
  dueDate: string;
  paidDate?: string;
  status: string;
  principal?: {
    companyName: string;
  };
  contract?: {
    contractNumber: string;
  };
}

export default function AgencyFeesPage() {
  const [fees, setFees] = useState<AgencyFee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFee, setEditingFee] = useState<AgencyFee | null>(null);
  const [formData, setFormData] = useState({
    principalId: '',
    contractId: '',
    feeType: 'COMMISSION',
    amount: '',
    currency: 'USD',
    percentage: '',
    description: '',
    dueDate: '',
    paidDate: '',
    status: 'PENDING'
  });
  const router = useRouter();

  const fetchFees = async () => {
    try {
      const response = await fetch('/api/agency-fees');
      if (response.ok) {
        const data = await response.json();
        setFees(data);
      }
    } catch (error) {
      console.error('Error fetching agency fees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingFee ? `/api/agency-fees/${editingFee.id}` : '/api/agency-fees';
      const method = editingFee ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          percentage: formData.percentage ? parseFloat(formData.percentage) : null,
          dueDate: new Date(formData.dueDate),
          paidDate: formData.paidDate ? new Date(formData.paidDate) : null,
        }),
      });

      if (response.ok) {
        setFormData({
          principalId: '',
          contractId: '',
          feeType: 'COMMISSION',
          amount: '',
          currency: 'USD',
          percentage: '',
          description: '',
          dueDate: '',
          paidDate: '',
          status: 'PENDING'
        });
        setShowForm(false);
        setEditingFee(null);
        fetchFees();
      } else {
        alert(`Error ${editingFee ? 'updating' : 'creating'} agency fee`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Error ${editingFee ? 'updating' : 'creating'} agency fee`);
    }
  };

  const handleEdit = (fee: AgencyFee) => {
    setEditingFee(fee);
    setFormData({
      principalId: fee.principalId,
      contractId: fee.contractId,
      feeType: fee.feeType,
      amount: fee.amount.toString(),
      currency: fee.currency,
      percentage: fee.percentage?.toString() || '',
      description: fee.description,
      dueDate: fee.dueDate.split('T')[0],
      paidDate: fee.paidDate ? fee.paidDate.split('T')[0] : '',
      status: fee.status
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this agency fee record?')) return;

    try {
      const response = await fetch(`/api/agency-fees/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchFees();
      } else {
        alert('Error deleting agency fee record');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting agency fee record');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingFee(null);
    setFormData({
      principalId: '',
      contractId: '',
      feeType: 'COMMISSION',
      amount: '',
      currency: 'USD',
      percentage: '',
      description: '',
      dueDate: '',
      paidDate: '',
      status: 'PENDING'
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
              className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Agency Fees Management</h1>
              <p className="mt-2 text-gray-600">Track and manage agency commissions and fees</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            {showForm ? 'Cancel' : '+ Add Agency Fee'}
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-gradient-to-r from-white/90 to-green-50/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 mb-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{editingFee ? 'Edit Agency Fee' : 'Add New Agency Fee'}</h2>
            <p className="text-gray-600">Record agency commissions and service fees</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Principal ID *
                </label>
                <input
                  type="text"
                  name="principalId"
                  value={formData.principalId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="Principal company ID"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="Employment contract ID"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fee Type *
                </label>
                <select
                  name="feeType"
                  value={formData.feeType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900"
                >
                  <option value="COMMISSION">Commission</option>
                  <option value="SERVICE_FEE">Service Fee</option>
                  <option value="ADMIN_FEE">Administration Fee</option>
                  <option value="PROCESSING_FEE">Processing Fee</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900"
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
                  Percentage (Optional)
                </label>
                <input
                  type="number"
                  name="percentage"
                  value={formData.percentage}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Paid Date (Optional)
                </label>
                <input
                  type="date"
                  name="paidDate"
                  value={formData.paidDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="Description of the fee and its purpose"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                {editingFee ? 'Update Fee' : 'Save Agency Fee'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Agency Fees List */}
      <div className="bg-gradient-to-r from-white/90 to-gray-50/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Agency Fees</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading agency fees...</p>
          </div>
        ) : fees.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No agency fees found. Add your first fee record above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Principal</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Due Date</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {fees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-gray-50">
                    <td className="px-8 py-4">
                      <div className="text-sm font-semibold text-gray-900">{fee.principal?.companyName}</div>
                      <div className="text-xs text-gray-500">Contract: {fee.contract?.contractNumber}</div>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{fee.feeType}</div>
                      {fee.percentage && (
                        <div className="text-xs text-gray-500">{fee.percentage}%</div>
                      )}
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {fee.currency} {fee.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-500">
                        {new Date(fee.dueDate).toLocaleDateString()}
                      </div>
                      {fee.paidDate && (
                        <div className="text-xs text-green-600">
                          Paid: {new Date(fee.paidDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        fee.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        fee.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                        fee.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {fee.status}
                      </span>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(fee)}
                        className="text-blue-600 hover:text-blue-900 mr-4 font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(fee.id)}
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