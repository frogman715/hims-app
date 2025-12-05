'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DisciplinaryRecord {
  id: string;
  contractId: string;
  crewId: string;
  incidentDate: string;
  reportedBy: string;
  violation: string;
  description: string;
  action: string;
  penalty?: string;
  fineAmount?: number;
  suspensionDays?: number;
  warningLevel?: string;
  appealStatus?: string;
  appealNotes?: string;
  status: string;
  crew?: {
    fullName: string;
  };
  contract?: {
    contractNumber: string;
  };
}

export default function DisciplinaryPage() {
  const [records, setRecords] = useState<DisciplinaryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DisciplinaryRecord | null>(null);
  const [formData, setFormData] = useState({
    contractId: '',
    crewId: '',
    incidentDate: '',
    reportedBy: '',
    violation: '',
    description: '',
    action: 'WARNING',
    penalty: '',
    fineAmount: '',
    suspensionDays: '',
    warningLevel: 'FIRST',
    appealStatus: 'PENDING',
    appealNotes: '',
    status: 'ACTIVE'
  });
  const router = useRouter();

  const fetchRecords = async () => {
    try {
      const response = await fetch('/api/disciplinary');
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      }
    } catch (error) {
      console.error('Error fetching disciplinary records:', error);
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
      const url = editingRecord ? `/api/disciplinary/${editingRecord.id}` : '/api/disciplinary';
      const method = editingRecord ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          incidentDate: new Date(formData.incidentDate),
          fineAmount: formData.fineAmount ? parseFloat(formData.fineAmount) : null,
          suspensionDays: formData.suspensionDays ? parseInt(formData.suspensionDays) : null,
        }),
      });

      if (response.ok) {
        setFormData({
          contractId: '',
          crewId: '',
          incidentDate: '',
          reportedBy: '',
          violation: '',
          description: '',
          action: 'WARNING',
          penalty: '',
          fineAmount: '',
          suspensionDays: '',
          warningLevel: 'FIRST',
          appealStatus: 'PENDING',
          appealNotes: '',
          status: 'ACTIVE'
        });
        setShowForm(false);
        setEditingRecord(null);
        fetchRecords();
      } else {
        alert(`Error ${editingRecord ? 'updating' : 'creating'} disciplinary record`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Error ${editingRecord ? 'updating' : 'creating'} disciplinary record`);
    }
  };

  const handleEdit = (record: DisciplinaryRecord) => {
    setEditingRecord(record);
    setFormData({
      contractId: record.contractId,
      crewId: record.crewId,
      incidentDate: record.incidentDate.split('T')[0],
      reportedBy: record.reportedBy,
      violation: record.violation,
      description: record.description,
      action: record.action,
      penalty: record.penalty || '',
      fineAmount: record.fineAmount?.toString() || '',
      suspensionDays: record.suspensionDays?.toString() || '',
      warningLevel: record.warningLevel || 'FIRST',
      appealStatus: record.appealStatus || 'PENDING',
      appealNotes: record.appealNotes || '',
      status: record.status
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this disciplinary record?')) return;

    try {
      const response = await fetch(`/api/disciplinary/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchRecords();
      } else {
        alert('Error deleting disciplinary record');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting disciplinary record');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRecord(null);
    setFormData({
      contractId: '',
      crewId: '',
      incidentDate: '',
      reportedBy: '',
      violation: '',
      description: '',
      action: 'WARNING',
      penalty: '',
      fineAmount: '',
      suspensionDays: '',
      warningLevel: 'FIRST',
      appealStatus: 'PENDING',
      appealNotes: '',
      status: 'ACTIVE'
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
              <h1 className="text-3xl font-bold text-gray-900">Disciplinary Management</h1>
              <p className="mt-2 text-gray-600">Track and manage crew disciplinary actions and violations</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            {showForm ? 'Cancel' : '+ Add Disciplinary Record'}
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-gradient-to-r from-white/90 to-red-50/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 mb-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{editingRecord ? 'Edit Disciplinary Record' : 'Add New Disciplinary Record'}</h2>
            <p className="text-gray-600">Document crew violations and disciplinary actions</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="Employment contract ID"
                />
              </div>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="Crew member ID"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Incident Date *
                </label>
                <input
                  type="date"
                  name="incidentDate"
                  value={formData.incidentDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reported By *
                </label>
                <input
                  type="text"
                  name="reportedBy"
                  value={formData.reportedBy}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="Person reporting the incident"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Violation *
                </label>
                <select
                  name="violation"
                  value={formData.violation}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-gray-900"
                >
                  <option value="">Select Violation</option>
                  <option value="Smuggling">Smuggling</option>
                  <option value="Drug Addiction">Drug Addiction</option>
                  <option value="Sleeping on Duty">Sleeping on Duty</option>
                  <option value="Insubordination">Insubordination</option>
                  <option value="Drunkenness">Drunkenness</option>
                  <option value="Desertion">Desertion</option>
                  <option value="Gambling">Gambling</option>
                  <option value="Theft">Theft</option>
                  <option value="Fighting">Fighting</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Disciplinary Action *
                </label>
                <select
                  name="action"
                  value={formData.action}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-gray-900"
                >
                  <option value="WARNING">Warning</option>
                  <option value="REPRIMAND">Reprimand</option>
                  <option value="SUSPENSION">Suspension</option>
                  <option value="DISMISSAL">Dismissal</option>
                  <option value="FINE">Fine</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fine Amount (USD)
                </label>
                <input
                  type="number"
                  name="fineAmount"
                  value={formData.fineAmount}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Suspension Days
                </label>
                <input
                  type="number"
                  name="suspensionDays"
                  value={formData.suspensionDays}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Warning Level
                </label>
                <select
                  name="warningLevel"
                  value={formData.warningLevel}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-gray-900"
                >
                  <option value="FIRST">First Warning</option>
                  <option value="SECOND">Second Warning</option>
                  <option value="FINAL">Final Warning</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Appeal Status
                </label>
                <select
                  name="appealStatus"
                  value={formData.appealStatus}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-gray-900"
                >
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="NONE">No Appeal</option>
                </select>
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
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="Detailed description of the incident and circumstances"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Appeal Notes
                </label>
                <textarea
                  name="appealNotes"
                  value={formData.appealNotes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="Notes regarding appeal process and decision"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                {editingRecord ? 'Update Record' : 'Save Disciplinary Record'}
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

      {/* Disciplinary Records List */}
      <div className="bg-gradient-to-r from-white/90 to-gray-50/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Disciplinary Records</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading disciplinary records...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No disciplinary records found. Add your first record above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Crew</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Violation</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-8 py-4">
                      <div className="text-sm font-semibold text-gray-900">{record.crew?.fullName}</div>
                      <div className="text-xs text-gray-500">Contract: {record.contract?.contractNumber}</div>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.violation}</div>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        record.action === 'WARNING' ? 'bg-yellow-100 text-yellow-800' :
                        record.action === 'REPRIMAND' ? 'bg-orange-100 text-orange-800' :
                        record.action === 'SUSPENSION' ? 'bg-red-100 text-red-800' :
                        record.action === 'DISMISSAL' ? 'bg-red-200 text-red-900' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {record.action}
                      </span>
                      {record.fineAmount && (
                        <div className="text-xs text-red-600 mt-1">
                          Fine: ${record.fineAmount}
                        </div>
                      )}
                      {record.suspensionDays && (
                        <div className="text-xs text-red-600">
                          Suspension: {record.suspensionDays} days
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-500">
                        {new Date(record.incidentDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        record.status === 'ACTIVE' ? 'bg-red-100 text-red-800' :
                        record.status === 'APPEALED' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {record.status}
                      </span>
                      {record.appealStatus && record.appealStatus !== 'NONE' && (
                        <div className="text-xs text-gray-500 mt-1">
                          Appeal: {record.appealStatus}
                        </div>
                      )}
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