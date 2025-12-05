'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
        fetchHolidays();
      } else {
        alert(`Error ${editingHoliday ? 'updating' : 'creating'} national holiday`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Error ${editingHoliday ? 'updating' : 'creating'} national holiday`);
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
    if (!confirm('Are you sure you want to delete this national holiday?')) return;

    try {
      const response = await fetch(`/api/national-holidays/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchHolidays();
      } else {
        alert('Error deleting national holiday');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting national holiday');
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
              <h1 className="text-3xl font-bold text-gray-900">National Holidays Management</h1>
              <p className="mt-2 text-gray-700">Manage national holidays for payroll and scheduling</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            {showForm ? 'Cancel' : '+ Add National Holiday'}
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-gradient-to-r from-white to-purple-50 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-300 p-8 mb-8">
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">{editingHoliday ? 'Edit National Holiday' : 'Add New National Holiday'}</h2>
            <p className="text-gray-700">Add holidays for payroll calculations and crew scheduling</p>
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
                {editingHoliday ? 'Update Holiday' : 'Save National Holiday'}
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

      {/* National Holidays List */}
      <div className="bg-gradient-to-r from-white to-gray-50 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-300 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-300">
          <h2 className="text-xl font-extrabold text-gray-900">National Holidays</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-700">Loading national holidays...</p>
          </div>
        ) : holidays.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-700">No national holidays found. Add your first holiday above.</p>
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
                        onClick={() => handleDelete(holiday.id)}
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