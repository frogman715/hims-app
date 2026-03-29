'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WorkspaceHero } from '@/components/layout/WorkspaceHero';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

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
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'danger'; message: string } | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
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
    status: 'ACTIVE',
  });
  const router = useRouter();
  const formSteps = [
    {
      label: 'Step 1',
      title: 'Confirm Linked Case',
      detail: 'Attach the policy to the correct crew member and contract reference before entering commercial values.',
    },
    {
      label: 'Step 2',
      title: 'Capture Policy Terms',
      detail: 'Use the exact provider, policy number, coverage, premium, and active period from the insurance source.',
    },
    {
      label: 'Step 3',
      title: 'Set Control Status',
      detail: 'Mark the policy lifecycle clearly so review, expiry, and renewal follow-up stay traceable.',
    },
  ];
  const formTitle = editingRecord ? 'Update Insurance Policy' : 'Register Insurance Policy';
  const formIntro = editingRecord
    ? 'Revise the policy terms only when the linked contract or insurance source has changed.'
    : 'Create one controlled insurance entry for the confirmed crew and contract reference.';

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

  const resetForm = () => {
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
      status: 'ACTIVE',
    });
    setEditingRecord(null);
    setShowForm(false);
  };

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
        resetForm();
        setFeedback({
          tone: 'success',
          message: editingRecord ? 'Insurance policy updated successfully.' : 'Insurance policy registered successfully.',
        });
        fetchRecords();
      } else {
        setFeedback({
          tone: 'danger',
          message: editingRecord ? 'Insurance policy update failed.' : 'Insurance policy registration failed.',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setFeedback({
        tone: 'danger',
        message: editingRecord ? 'Insurance policy update failed.' : 'Insurance policy registration failed.',
      });
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
      status: record.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/insurance/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPendingDeleteId(null);
        setFeedback({ tone: 'success', message: 'Insurance policy removed from the register.' });
        fetchRecords();
      } else {
        setFeedback({ tone: 'danger', message: 'Insurance policy could not be removed.' });
      }
    } catch (error) {
      console.error('Error:', error);
      setFeedback({ tone: 'danger', message: 'Insurance policy could not be removed.' });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (isLoading) {
    return (
      <div className="section-stack">
        <div className="surface-card px-6 py-12 text-center text-sm text-slate-600">Loading insurance register...</div>
      </div>
    );
  }

  const activePolicies = records.filter((record) => record.status === 'ACTIVE').length;
  const pendingPolicies = records.filter((record) => record.status === 'PENDING').length;
  const premiumExposure = records.reduce((sum, record) => sum + record.premiumAmount, 0);

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Insurance Workspace"
        title="Insurance Management"
        subtitle="Manage P&I, crew, medical, and contract-linked insurance policies in one controlled register with clear coverage, premium, and policy lifecycle visibility."
        highlights={[
          { label: 'Policy Records', value: records.length, detail: 'Insurance entries currently stored in the office register.' },
          { label: 'Active Policies', value: activePolicies, detail: 'Policies currently marked active for operational use.' },
          { label: 'Pending Review', value: pendingPolicies, detail: 'Policies still waiting for confirmation or activation.' },
          { label: 'Premium Exposure', value: `USD ${premiumExposure.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, detail: 'Recorded premium value across the current register.' },
        ]}
        helperLinks={[
          { href: '/contracts', label: 'Contract Register' },
          { href: '/crewing/seafarers', label: 'Seafarer Records' },
          { href: '/accounting', label: 'Accounting Workspace' },
        ]}
        actions={(
          <>
            <Button type="button" variant="secondary" size="sm" onClick={() => router.push('/dashboard')}>
              Dashboard
            </Button>
            <Button type="button" size="sm" onClick={() => setShowForm((current) => !current)}>
              {showForm ? 'Close Intake Form' : 'Register Insurance Policy'}
            </Button>
          </>
        )}
      />

      <section className="surface-card space-y-6 p-6">
        {feedback ? (
          <div className={`rounded-2xl border px-4 py-3 text-sm ${feedback.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
            {feedback.message}
          </div>
        ) : null}
        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/80 px-4 py-4 text-sm text-slate-700">
          Use this desk for contract-linked insurance administration only. Keep policy periods, provider references, and premium records aligned with the active crew contract trail.
        </div>

        {showForm ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900">{formTitle}</h2>
              <p className="mt-1 text-sm text-slate-600">{formIntro}</p>
            </div>
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              {formSteps.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                  <p className="mt-2 text-base font-semibold text-slate-950">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <Input id="crewId" name="crewId" label="Crew ID" required value={formData.crewId} onChange={handleInputChange} placeholder="Crew member ID" />
                <Input id="contractId" name="contractId" label="Contract ID" required value={formData.contractId} onChange={handleInputChange} placeholder="Employment contract ID" />
                <Select
                  id="insuranceType"
                  name="insuranceType"
                  label="Insurance Type"
                  value={formData.insuranceType}
                  onChange={handleInputChange}
                  options={[
                    { value: 'P&I', label: 'Protection & Indemnity (P&I)' },
                    { value: 'CREW', label: 'Crew Insurance' },
                    { value: 'MEDICAL', label: 'Medical Insurance' },
                    { value: 'LIFE', label: 'Life Insurance' },
                    { value: 'ACCIDENT', label: 'Accident Insurance' },
                  ]}
                />
                <Input id="provider" name="provider" label="Insurance Provider" required value={formData.provider} onChange={handleInputChange} placeholder="Insurance company name" />
                <Input id="policyNumber" name="policyNumber" label="Policy Number" required value={formData.policyNumber} onChange={handleInputChange} placeholder="Insurance policy number" />
                <Input id="coverageAmount" name="coverageAmount" label="Coverage Amount" type="number" required step="0.01" value={formData.coverageAmount} onChange={handleInputChange} placeholder="0.00" />
                <Input id="premiumAmount" name="premiumAmount" label="Premium Amount" type="number" required step="0.01" value={formData.premiumAmount} onChange={handleInputChange} placeholder="0.00" />
                <Select
                  id="currency"
                  name="currency"
                  label="Currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  options={[
                    { value: 'USD', label: 'USD' },
                    { value: 'EUR', label: 'EUR' },
                    { value: 'GBP', label: 'GBP' },
                    { value: 'SEK', label: 'SEK' },
                    { value: 'NOK', label: 'NOK' },
                    { value: 'DKK', label: 'DKK' },
                  ]}
                />
                <Input id="startDate" name="startDate" label="Start Date" type="date" required value={formData.startDate} onChange={handleInputChange} />
                <Input id="endDate" name="endDate" label="End Date" type="date" required value={formData.endDate} onChange={handleInputChange} />
                <Select
                  id="status"
                  name="status"
                  label="Status"
                  value={formData.status}
                  onChange={handleInputChange}
                  options={[
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'PENDING', label: 'Pending' },
                    { value: 'EXPIRED', label: 'Expired' },
                  ]}
                />
              </div>

              <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-6">
                <Button type="submit">{editingRecord ? 'Save Policy Update' : 'Register Policy'}</Button>
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Close Without Saving
                </Button>
              </div>
            </form>
          </section>
        ) : null}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-slate-900">Insurance Records</h2>
          </div>

          {pendingDeleteId ? (
            <div className="border-b border-rose-200 bg-rose-50 px-6 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-rose-900">Remove this insurance policy?</p>
                  <p className="mt-1 text-sm text-rose-800">Use removal only when the record was created by mistake or should not exist in the register.</p>
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setPendingDeleteId(null)}>
                    Keep Record
                  </Button>
                  <Button type="button" variant="danger" size="sm" onClick={() => handleDelete(pendingDeleteId)}>
                    Confirm Removal
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {records.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              No insurance policies are registered yet. Start with one confirmed policy so contract-linked coverage can be tracked from this desk.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Crew</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Provider</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Coverage</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Premium</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Period</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-slate-900">{record.crew?.fullName || '-'}</div>
                        <div className="text-sm text-slate-600">Contract: {record.contract?.contractNumber || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{record.insuranceType}</div>
                        <div className="text-sm text-slate-600">{record.policyNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{record.provider}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                        {record.currency} {record.coverageAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {record.currency} {record.premiumAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {new Date(record.startDate).toLocaleDateString()} - {new Date(record.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-lg px-3 py-2 text-xs font-medium ${
                            record.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : record.status === 'EXPIRED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {record.status === 'ACTIVE' ? 'Active' : record.status === 'EXPIRED' ? 'Expired' : 'Pending Review'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="ghost" size="sm" className="!px-3 !py-2 !text-xs" onClick={() => handleEdit(record)}>
                            Edit
                          </Button>
                          <Button type="button" variant="danger" size="sm" className="!px-3 !py-2 !text-xs" onClick={() => setPendingDeleteId(record.id)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
