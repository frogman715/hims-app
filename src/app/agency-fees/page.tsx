'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WorkspaceHero } from '@/components/layout/WorkspaceHero';
import { Button } from '@/components/ui/Button';

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
    name?: string | null;
  };
  contract?: {
    contractNumber?: string | null;
  };
}

export default function AgencyFeesPage() {
  const [fees, setFees] = useState<AgencyFee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFee, setEditingFee] = useState<AgencyFee | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'danger'; message: string } | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
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
        setFeedback({
          tone: 'success',
          message: editingFee ? 'Agency fee updated successfully.' : 'Agency fee registered successfully.',
        });
        fetchFees();
      } else {
        setFeedback({ tone: 'danger', message: editingFee ? 'Agency fee update failed.' : 'Agency fee registration failed.' });
      }
    } catch (error) {
      console.error('Error:', error);
      setFeedback({ tone: 'danger', message: editingFee ? 'Agency fee update failed.' : 'Agency fee registration failed.' });
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
    try {
      const response = await fetch(`/api/agency-fees/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPendingDeleteId(null);
        setFeedback({ tone: 'success', message: 'Agency fee removed from the register.' });
        fetchFees();
      } else {
        setFeedback({ tone: 'danger', message: 'Agency fee could not be removed.' });
      }
    } catch (error) {
      console.error('Error:', error);
      setFeedback({ tone: 'danger', message: 'Agency fee could not be removed.' });
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

  const pendingFees = fees.filter((fee) => fee.status === 'PENDING').length;
  const overdueFees = fees.filter((fee) => fee.status === 'OVERDUE').length;
  const totalExposure = fees.reduce((sum, fee) => sum + fee.amount, 0);
  const formTitle = editingFee ? 'Update Agency Fee' : 'Register Agency Fee';
  const formIntro = editingFee
    ? 'Adjust the fee only when the commercial basis, due date, or settlement status has changed.'
    : 'Create one controlled agency-fee record for the confirmed principal and contract case.';
  const formSteps = [
    {
      label: 'Step 1',
      title: 'Link principal and contract',
      detail: 'Attach the charge to the correct principal and employment contract before entering commercial values.',
    },
    {
      label: 'Step 2',
      title: 'Capture the fee basis',
      detail: 'Use the approved amount, optional percentage, and fee description from the commercial agreement.',
    },
    {
      label: 'Step 3',
      title: 'Track settlement status',
      detail: 'Maintain due date, paid date, and status so overdue exposure stays visible.',
    },
  ];
  const FEE_STATUS_LABELS: Record<string, string> = {
    PENDING: 'Pending Review',
    OVERDUE: 'Overdue',
    PAID: 'Paid',
    CANCELLED: 'Cancelled',
  };

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Commercial Workspace"
        title="Agency Fees Management"
        subtitle="Track principal commissions, service fees, and payment due dates so commercial follow-up stays traceable and finance exposure stays visible."
        highlights={[
          { label: 'Fee Records', value: fees.length, detail: 'Agency fee entries currently tracked in this register.' },
          { label: 'Pending Items', value: pendingFees, detail: 'Fees still waiting for payment or commercial closure.' },
          { label: 'Overdue Items', value: overdueFees, detail: 'Items already past due date and needing immediate follow-up.' },
          { label: 'Register Exposure', value: `USD ${totalExposure.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, detail: 'Total fee value currently captured in the register.' },
        ]}
        helperLinks={[
          { href: '/contracts', label: 'Contract Register' },
          { href: '/crewing/principals', label: 'Principals' },
          { href: '/accounting/billing', label: 'Billing Desk' },
        ]}
        actions={(
          <>
            <Button variant="secondary" size="sm" onClick={() => router.push('/dashboard')}>Dashboard</Button>
            <Button size="sm" onClick={() => setShowForm(!showForm)}>{showForm ? 'Close Intake Form' : 'Register Agency Fee'}</Button>
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
            <h2 className="mb-2 text-2xl font-extrabold text-gray-900">{formTitle}</h2>
            <p className="text-gray-700">{formIntro}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {formSteps.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-base font-semibold text-slate-950">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
              </div>
            ))}
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
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900"
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
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900"
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
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900"
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
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900"
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
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900"
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
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900"
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
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900"
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
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900"
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
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="Description of the fee and its purpose"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-300">
              <button
                type="submit"
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                {editingFee ? 'Save Fee Update' : 'Register Agency Fee'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                Close Without Saving
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Agency Fees List */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="px-8 py-6 border-b border-gray-300">
          <h2 className="text-xl font-extrabold text-gray-900">Agency Fees</h2>
        </div>

        {pendingDeleteId ? (
          <div className="border-b border-rose-200 bg-rose-50 px-8 py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-rose-900">Remove this agency fee?</p>
                <p className="mt-1 text-sm text-rose-800">Use removal only when the charge was logged by mistake and should not remain in the financial trail.</p>
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-700">Loading agency fees...</p>
          </div>
        ) : fees.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-700">No agency fees are registered yet. Start with one confirmed fee so commercial exposure and settlement follow-up can be controlled here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Principal</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Due Date</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {fees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-gray-100">
                    <td className="px-8 py-4">
                      <div className="text-sm font-semibold text-gray-900">{fee.principal?.name ?? "Unknown principal"}</div>
                      <div className="text-sm text-gray-700">Contract: {fee.contract?.contractNumber ?? "Not linked"}</div>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{fee.feeType}</div>
                      {fee.percentage && (
                        <div className="text-sm text-gray-700">{fee.percentage}%</div>
                      )}
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {fee.currency} {fee.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">
                        {new Date(fee.dueDate).toLocaleDateString()}
                      </div>
                      {fee.paidDate && (
                        <div className="text-xs text-green-600">
                          Paid: {new Date(fee.paidDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-medium ${
                        fee.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        fee.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                        fee.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {FEE_STATUS_LABELS[fee.status] ?? fee.status}
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
                        onClick={() => setPendingDeleteId(fee.id)}
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
