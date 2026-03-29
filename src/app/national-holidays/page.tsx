'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WorkspaceHero } from '@/components/layout/WorkspaceHero';
import { Button } from '@/components/ui/Button';

interface NationalHoliday {
  id: string;
  country: string;
  holidayName: string;
  holidayDate: string;
  isRecurring: boolean;
  description?: string;
  year?: number;
}

export default function NationalHolidaysPage() {
  const [holidays, setHolidays] = useState<NationalHoliday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<NationalHoliday | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'danger'; message: string } | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    country: '',
    holidayName: '',
    holidayDate: '',
    isRecurring: false,
    description: '',
    year: ''
  });
  const router = useRouter();

  const fetchHolidays = async () => {
    try {
      const response = await fetch('/api/national-holidays');
      if (response.ok) {
        const data = await response.json();
        setHolidays(data);
      }
    } catch (error) {
      console.error('Error fetching national holidays:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingHoliday ? `/api/national-holidays/${editingHoliday.id}` : '/api/national-holidays';
      const method = editingHoliday ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          holidayDate: new Date(formData.holidayDate),
          year: formData.year ? parseInt(formData.year) : null,
        }),
      });

      if (response.ok) {
        setFormData({
          country: '',
          holidayName: '',
          holidayDate: '',
          isRecurring: false,
          description: '',
          year: ''
        });
        setShowForm(false);
        setEditingHoliday(null);
        setFeedback({
          tone: 'success',
          message: editingHoliday ? 'Holiday reference updated successfully.' : 'Holiday reference registered successfully.',
        });
        fetchHolidays();
      } else {
        setFeedback({ tone: 'danger', message: editingHoliday ? 'Holiday reference update failed.' : 'Holiday reference registration failed.' });
      }
    } catch (error) {
      console.error('Error:', error);
      setFeedback({ tone: 'danger', message: editingHoliday ? 'Holiday reference update failed.' : 'Holiday reference registration failed.' });
    }
  };

  const handleEdit = (holiday: NationalHoliday) => {
    setEditingHoliday(holiday);
    setFormData({
      country: holiday.country,
      holidayName: holiday.holidayName,
      holidayDate: holiday.holidayDate.split('T')[0],
      isRecurring: holiday.isRecurring,
      description: holiday.description || '',
      year: holiday.year?.toString() || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/national-holidays/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPendingDeleteId(null);
        setFeedback({ tone: 'success', message: 'Holiday reference removed from the register.' });
        fetchHolidays();
      } else {
        setFeedback({ tone: 'danger', message: 'Holiday reference could not be removed.' });
      }
    } catch (error) {
      console.error('Error:', error);
      setFeedback({ tone: 'danger', message: 'Holiday reference could not be removed.' });
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingHoliday(null);
    setFormData({
      country: '',
      holidayName: '',
      holidayDate: '',
      isRecurring: false,
      description: '',
      year: ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const recurringCount = holidays.filter((holiday) => holiday.isRecurring).length;
  const oneTimeCount = holidays.length - recurringCount;
  const countriesCovered = new Set(holidays.map((holiday) => holiday.country)).size;
  const formTitle = editingHoliday ? 'Update Holiday Reference' : 'Register Holiday Reference';
  const formIntro = editingHoliday
    ? 'Adjust the holiday only when the official date or coverage rule has changed.'
    : 'Create one controlled holiday reference so payroll and planning teams can rely on the same office calendar.';
  const formSteps = [
    {
      label: 'Step 1',
      title: 'Select the country scope',
      detail: 'Choose the country calendar that the payroll or planning rule should follow.',
    },
    {
      label: 'Step 2',
      title: 'Record the official holiday',
      detail: 'Use the recognized holiday name and the exact calendar date from the official source.',
    },
    {
      label: 'Step 3',
      title: 'Mark recurrence correctly',
      detail: 'Use recurring only when the holiday repeats annually on the same date.',
    },
  ];

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Reference Workspace"
        title="National Holidays Management"
        subtitle="Maintain country holiday references for payroll, planning, scheduling, and contract administration without forcing teams to cross-check outside the system."
        highlights={[
          { label: 'Holiday Records', value: holidays.length, detail: 'Holiday references currently available in the register.' },
          { label: 'Recurring Rules', value: recurringCount, detail: 'Annual recurring holidays available for ongoing payroll logic.' },
          { label: 'One-Time Entries', value: oneTimeCount, detail: 'Single-year holiday exceptions requiring date-specific handling.' },
          { label: 'Countries Covered', value: countriesCovered, detail: 'Distinct country calendars currently represented.' },
        ]}
        helperLinks={[
          { href: '/accounting/salary', label: 'Salary Desk' },
          { href: '/hr', label: 'HR Workspace' },
          { href: '/contracts', label: 'Contract Register' },
        ]}
        actions={(
          <>
            <Button variant="secondary" size="sm" onClick={() => router.push('/dashboard')}>Dashboard</Button>
            <Button size="sm" onClick={() => setShowForm(!showForm)}>{showForm ? 'Close Intake Form' : 'Register Holiday Reference'}</Button>
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
                  Country *
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900"
                >
                  <option value="">Select Country</option>
                  <option value="SWEDEN">Sweden</option>
                  <option value="NORWAY">Norway</option>
                  <option value="DENMARK">Denmark</option>
                  <option value="FINLAND">Finland</option>
                  <option value="GERMANY">Germany</option>
                  <option value="NETHERLANDS">Netherlands</option>
                  <option value="BELGIUM">Belgium</option>
                  <option value="FRANCE">France</option>
                  <option value="UK">United Kingdom</option>
                  <option value="USA">United States</option>
                  <option value="CANADA">Canada</option>
                  <option value="AUSTRALIA">Australia</option>
                  <option value="SINGAPORE">Singapore</option>
                  <option value="MALAYSIA">Malaysia</option>
                  <option value="INDONESIA">Indonesia</option>
                  <option value="PHILIPPINES">Philippines</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Holiday Name *
                </label>
                <input
                  type="text"
                  name="holidayName"
                  value={formData.holidayName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="e.g., Christmas Day, New Year's Day"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Holiday Date *
                </label>
                <input
                  type="date"
                  name="holidayDate"
                  value={formData.holidayDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Year (Optional)
                </label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  min="2000"
                  max="2100"
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="2024"
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isRecurring"
                    checked={formData.isRecurring}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-400 rounded"
                  />
                  <span className="ml-2 text-sm font-semibold text-gray-700">Recurring Holiday (Annual)</span>
                </label>
                <p className="text-sm text-gray-700 mt-1">Check if this holiday occurs every year on the same date</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  placeholder="Additional information about the holiday"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-300">
              <button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                {editingHoliday ? 'Save Holiday Update' : 'Register Holiday'}
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

      {/* National Holidays List */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="px-8 py-6 border-b border-gray-300">
          <h2 className="text-xl font-extrabold text-gray-900">National Holidays</h2>
        </div>

        {pendingDeleteId ? (
          <div className="border-b border-rose-200 bg-rose-50 px-8 py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-rose-900">Remove this holiday reference?</p>
                <p className="mt-1 text-sm text-rose-800">Use removal only when the holiday was entered incorrectly and should not remain in the office calendar.</p>
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-700">Loading national holidays...</p>
          </div>
        ) : holidays.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-700">No holiday references are registered yet. Add one official holiday so payroll, scheduling, and contract desks can use the same calendar basis.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Country</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Holiday Name</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {holidays.map((holiday) => (
                  <tr key={holiday.id} className="hover:bg-gray-100">
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{holiday.country}</div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="text-sm font-semibold text-gray-900">{holiday.holidayName}</div>
                      {holiday.description && (
                        <div className="text-sm text-gray-700 mt-1">{holiday.description}</div>
                      )}
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(holiday.holidayDate).toLocaleDateString()}
                      </div>
                      {holiday.year && (
                        <div className="text-sm text-gray-700">Year: {holiday.year}</div>
                      )}
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-medium ${
                        holiday.isRecurring ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {holiday.isRecurring ? 'Recurring' : 'One-time'}
                      </span>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(holiday)}
                        className="text-blue-600 hover:text-blue-900 mr-4 font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setPendingDeleteId(holiday.id)}
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
