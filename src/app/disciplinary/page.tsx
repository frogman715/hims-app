'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WorkspaceHero } from '@/components/layout/WorkspaceHero';
import { Button } from '@/components/ui/Button';

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
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'danger'; message: string } | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
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
        setFeedback({
          tone: 'success',
          message: editingRecord ? 'Disciplinary record updated successfully.' : 'Disciplinary record registered successfully.',
        });
        fetchRecords();
      } else {
        setFeedback({ tone: 'danger', message: editingRecord ? 'Disciplinary record update failed.' : 'Disciplinary record registration failed.' });
      }
    } catch (error) {
      console.error('Error:', error);
      setFeedback({ tone: 'danger', message: editingRecord ? 'Disciplinary record update failed.' : 'Disciplinary record registration failed.' });
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
    try {
      const response = await fetch(`/api/disciplinary/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPendingDeleteId(null);
        setFeedback({ tone: 'success', message: 'Disciplinary record removed from the register.' });
        fetchRecords();
      } else {
        setFeedback({ tone: 'danger', message: 'Disciplinary record could not be removed.' });
      }
    } catch (error) {
      console.error('Error:', error);
      setFeedback({ tone: 'danger', message: 'Disciplinary record could not be removed.' });
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

  const activeCases = records.filter((record) => record.status === 'ACTIVE').length;
  const appealedCases = records.filter((record) => record.appealStatus && record.appealStatus !== 'NONE' && record.appealStatus !== 'PENDING').length;
  const fineExposure = records.reduce((sum, record) => sum + (record.fineAmount ?? 0), 0);
  const DISCIPLINARY_STATUS_LABELS: Record<string, string> = {
    ACTIVE: 'Open Case',
    APPEALED: 'Under Appeal',
    CLOSED: 'Closed',
  };

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Crew Governance"
        title="Disciplinary Management"
        subtitle="Track crew violations, actions, appeals, and penalties in one register so operational governance stays auditable and easy to review."
        highlights={[
          { label: 'Case Records', value: records.length, detail: 'Disciplinary records currently available in the register.' },
          { label: 'Active Cases', value: activeCases, detail: 'Open cases still under active disciplinary monitoring.' },
          { label: 'Appealed Cases', value: appealedCases, detail: 'Cases that already moved into a formal appeal outcome.' },
          { label: 'Fine Exposure', value: `USD ${fineExposure.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, detail: 'Total fine amount recorded across the register.' },
        ]}
        helperLinks={[
          { href: '/crewing/seafarers', label: 'Seafarers' },
          { href: '/contracts', label: 'Contract Register' },
          { href: '/hr', label: 'HR Workspace' },
        ]}
        actions={(
          <>
            <Button variant="secondary" size="sm" onClick={() => router.push('/dashboard')}>Dashboard</Button>
            <Button size="sm" onClick={() => setShowForm(!showForm)}>{showForm ? 'Close Form' : 'Add Record'}</Button>
          </>
        )}
      />

      {feedback ? (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${feedback.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
          {feedback.message}
        </div>
      ) : null}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="surface-card space-y-8 p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">{editingRecord ? 'Edit Disciplinary Record' : 'Add New Disciplinary Record'}</h2>
            <p className="text-gray-700">Document crew violations and disciplinary actions</p>
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
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-gray-900"
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
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-gray-900"
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
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-gray-900"
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
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-gray-900"
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
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-gray-900"
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
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-gray-900"
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
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-gray-900"
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
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-gray-900"
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
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-gray-900"
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
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-gray-900"
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
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-gray-900"
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
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="Notes regarding appeal process and decision"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-300">
              <button
                type="submit"
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                {editingRecord ? 'Update Record' : 'Save Disciplinary Record'}
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

      {/* Disciplinary Records List */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="px-8 py-6 border-b border-gray-300">
          <h2 className="text-xl font-extrabold text-gray-900">Disciplinary Records</h2>
        </div>

        {pendingDeleteId ? (
          <div className="border-b border-rose-200 bg-rose-50 px-8 py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-rose-900">Remove this disciplinary record?</p>
                <p className="mt-1 text-sm text-rose-800">Use removal only when the case was entered incorrectly and should not remain in the disciplinary history.</p>
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" size="sm" onClick={() => setPendingDeleteId(null)}>Keep Record</Button>
                <Button type="button" variant="danger" size="sm" onClick={() => handleDelete(pendingDeleteId)}>Confirm Removal</Button>
              </div>
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-700">Loading disciplinary records...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-700">No disciplinary records found. Add your first record above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Crew</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Violation</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
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
                      <div className="text-sm text-gray-900">{record.violation}</div>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-medium ${
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
                      <div className="text-sm text-gray-700">
                        {new Date(record.incidentDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-medium ${
                        record.status === 'ACTIVE' ? 'bg-red-100 text-red-800' :
                        record.status === 'APPEALED' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {DISCIPLINARY_STATUS_LABELS[record.status] ?? record.status}
                      </span>
                      {record.appealStatus && record.appealStatus !== 'NONE' && (
                        <div className="text-sm text-gray-700 mt-1">
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
                        onClick={() => setPendingDeleteId(record.id)}
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
