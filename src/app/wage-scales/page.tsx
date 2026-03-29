'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WorkspaceHero } from '@/components/layout/WorkspaceHero';
import { Button } from '@/components/ui/Button';

interface WageScale {
  id: string;
  vesselType: string;
  rank: string;
  basicWage: number;
  fixedOvertime: number;
  monthlyWage: number;
  specialAllowance?: number;
  leavePay: number;
  totalMonthly: number;
  currency: string;
  effectiveDate: string;
  expiryDate?: string;
  isActive: boolean;
}

export default function WageScalesPage() {
  const [wageScales, setWageScales] = useState<WageScale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingScale, setEditingScale] = useState<WageScale | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'danger'; message: string } | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    vesselType: '',
    rank: '',
    basicWage: '',
    fixedOvertime: '',
    monthlyWage: '',
    specialAllowance: '',
    leavePay: '',
    totalMonthly: '',
    currency: 'USD',
    effectiveDate: '',
    expiryDate: '',
    isActive: true
  });
  const router = useRouter();

  const fetchWageScales = async () => {
    try {
      const response = await fetch('/api/wage-scales');
      if (response.ok) {
        const data = await response.json();
        setWageScales(data);
      }
    } catch (error) {
      console.error('Error fetching wage scales:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWageScales();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingScale ? `/api/wage-scales/${editingScale.id}` : '/api/wage-scales';
      const method = editingScale ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          basicWage: parseFloat(formData.basicWage),
          fixedOvertime: parseFloat(formData.fixedOvertime),
          monthlyWage: parseFloat(formData.monthlyWage),
          specialAllowance: formData.specialAllowance ? parseFloat(formData.specialAllowance) : null,
          leavePay: parseFloat(formData.leavePay),
          totalMonthly: parseFloat(formData.totalMonthly),
          effectiveDate: new Date(formData.effectiveDate),
          expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : null,
        }),
      });

      if (response.ok) {
        setFormData({
          vesselType: '',
          rank: '',
          basicWage: '',
          fixedOvertime: '',
          monthlyWage: '',
          specialAllowance: '',
          leavePay: '',
          totalMonthly: '',
          currency: 'USD',
          effectiveDate: '',
          expiryDate: '',
          isActive: true
        });
        setShowForm(false);
        setEditingScale(null);
        setFeedback({
          tone: 'success',
          message: editingScale ? 'Wage scale updated successfully.' : 'Wage scale registered successfully.',
        });
        fetchWageScales();
      } else {
        setFeedback({ tone: 'danger', message: editingScale ? 'Wage scale update failed.' : 'Wage scale registration failed.' });
      }
    } catch (error) {
      console.error('Error:', error);
      setFeedback({ tone: 'danger', message: editingScale ? 'Wage scale update failed.' : 'Wage scale registration failed.' });
    }
  };

  const handleEdit = (scale: WageScale) => {
    setEditingScale(scale);
    setFormData({
      vesselType: scale.vesselType,
      rank: scale.rank,
      basicWage: scale.basicWage.toString(),
      fixedOvertime: scale.fixedOvertime.toString(),
      monthlyWage: scale.monthlyWage.toString(),
      specialAllowance: scale.specialAllowance?.toString() || '',
      leavePay: scale.leavePay.toString(),
      totalMonthly: scale.totalMonthly.toString(),
      currency: scale.currency,
      effectiveDate: scale.effectiveDate.split('T')[0],
      expiryDate: scale.expiryDate ? scale.expiryDate.split('T')[0] : '',
      isActive: scale.isActive
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/wage-scales/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPendingDeleteId(null);
        setFeedback({ tone: 'success', message: 'Wage scale removed from the register.' });
        fetchWageScales();
      } else {
        setFeedback({ tone: 'danger', message: 'Wage scale could not be removed.' });
      }
    } catch (error) {
      console.error('Error:', error);
      setFeedback({ tone: 'danger', message: 'Wage scale could not be removed.' });
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingScale(null);
    setFormData({
      vesselType: '',
      rank: '',
      basicWage: '',
      fixedOvertime: '',
      monthlyWage: '',
      specialAllowance: '',
      leavePay: '',
      totalMonthly: '',
      currency: 'USD',
      effectiveDate: '',
      expiryDate: '',
      isActive: true
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const activeScales = wageScales.filter((scale) => scale.isActive).length;
  const expiringScales = wageScales.filter((scale) => scale.expiryDate).length;
  const avgMonthly = wageScales.length > 0
    ? wageScales.reduce((sum, scale) => sum + scale.totalMonthly, 0) / wageScales.length
    : 0;
  const formTitle = editingScale ? 'Update Wage Scale' : 'Register Wage Scale';
  const formIntro = editingScale
    ? 'Revise this wage reference only when the approved compensation baseline has changed.'
    : 'Create one controlled wage scale that downstream contracts and payroll desks can reference.';
  const formSteps = [
    {
      label: 'Step 1',
      title: 'Match vessel and rank',
      detail: 'Use the vessel category and crew rank that the office will actually contract.',
    },
    {
      label: 'Step 2',
      title: 'Enter compensation components',
      detail: 'Capture approved wage, overtime, leave pay, and allowance values from the active wage basis.',
    },
    {
      label: 'Step 3',
      title: 'Control validity',
      detail: 'Set effective dates clearly so contract and payroll desks know which wage scale is current.',
    },
  ];

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Compensation Workspace"
        title="Wage Scales Management"
        subtitle="Manage standard wage structures by vessel type and rank so contracts, payroll, and commercial offers reference one consistent compensation baseline."
        highlights={[
          { label: 'Scale Records', value: wageScales.length, detail: 'Configured wage scale templates stored in the register.' },
          { label: 'Active Scales', value: activeScales, detail: 'Scale entries currently marked active for operational use.' },
          { label: 'With Expiry', value: expiringScales, detail: 'Records already carrying an expiry control date.' },
          { label: 'Avg Monthly', value: `USD ${avgMonthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, detail: 'Average total monthly wage across available scales.' },
        ]}
        helperLinks={[
          { href: '/contracts', label: 'Contract Register' },
          { href: '/accounting/wages', label: 'Wages Workspace' },
          { href: '/accounting/leave-pay', label: 'Leave Pay' },
        ]}
        actions={(
          <>
            <Button variant="secondary" size="sm" onClick={() => router.push('/dashboard')}>Dashboard</Button>
            <Button size="sm" onClick={() => setShowForm(!showForm)}>{showForm ? 'Close Intake Form' : 'Register Wage Scale'}</Button>
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
                  Vessel Type *
                </label>
                <select
                  name="vesselType"
                  value={formData.vesselType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                >
                  <option value="">Select Vessel Type</option>
                  <option value="OIL_TANKER">Oil Tanker</option>
                  <option value="GENERAL_CARGO">General Cargo</option>
                  <option value="BULK_CARRIER">Bulk Carrier</option>
                  <option value="CONTAINER_SHIP">Container Ship</option>
                  <option value="PASSENGER_SHIP">Passenger Ship</option>
                </select>
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
                  <option value="CAPTAIN">Captain</option>
                  <option value="CHIEF_OFFICER">Chief Officer</option>
                  <option value="SECOND_OFFICER">Second Officer</option>
                  <option value="THIRD_OFFICER">Third Officer</option>
                  <option value="CHIEF_ENGINEER">Chief Engineer</option>
                  <option value="SECOND_ENGINEER">Second Engineer</option>
                  <option value="THIRD_ENGINEER">Third Engineer</option>
                  <option value="ELECTRICAL_OFFICER">Electrical Officer</option>
                  <option value="BOSUN">Bosun</option>
                  <option value="ABLE_SEAMAN">Able Seaman</option>
                  <option value="ORDINARY_SEAMAN">Ordinary Seaman</option>
                  <option value="CHIEF_COOK">Chief Cook</option>
                  <option value="COOK">Cook</option>
                  <option value="MESSMAN">Messman</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Basic Wage (USD) *
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
                  Fixed Overtime (USD) *
                </label>
                <input
                  type="number"
                  name="fixedOvertime"
                  value={formData.fixedOvertime}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Monthly Wage (USD) *
                </label>
                <input
                  type="number"
                  name="monthlyWage"
                  value={formData.monthlyWage}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Special Allowance (USD)
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
                  Leave Pay (USD) *
                </label>
                <input
                  type="number"
                  name="leavePay"
                  value={formData.leavePay}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Total Monthly (USD) *
                </label>
                <input
                  type="number"
                  name="totalMonthly"
                  value={formData.totalMonthly}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Effective Date *
                </label>
                <input
                  type="date"
                  name="effectiveDate"
                  value={formData.effectiveDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Expiry Date
                </label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-300">
              <button
                type="submit"
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                {editingScale ? 'Save Wage Scale Update' : 'Register Wage Scale'}
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

      {/* Wage Scales List */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="px-8 py-6 border-b border-gray-300">
          <h2 className="text-xl font-extrabold text-gray-900">Standard Wage Scales</h2>
        </div>

        {pendingDeleteId ? (
          <div className="border-b border-rose-200 bg-rose-50 px-8 py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-rose-900">Remove this wage scale?</p>
                <p className="mt-1 text-sm text-rose-800">Use removal only when the scale was created by mistake or has no valid reference history.</p>
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-700">Loading wage scales...</p>
          </div>
        ) : wageScales.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-700">No wage scales are registered yet. Add one approved scale so contracts and payroll can reference a controlled compensation baseline.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Vessel Type</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Rank</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Basic Wage</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Monthly Total</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Effective</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {wageScales.map((scale) => (
                  <tr key={scale.id} className="hover:bg-gray-100">
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{scale.vesselType.replace('_', ' ')}</div>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-800">{scale.rank.replace('_', ' ')}</div>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {scale.currency} {scale.basicWage.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-600">
                        {scale.currency} {scale.totalMonthly.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">
                        {new Date(scale.effectiveDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-medium ${
                        scale.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {scale.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(scale)}
                        className="text-blue-600 hover:text-blue-900 mr-4 font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setPendingDeleteId(scale.id)}
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
