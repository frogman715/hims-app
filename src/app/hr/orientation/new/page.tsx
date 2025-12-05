'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Employee {
  id: string;
  fullName: string;
  position: string;
  department: string;
}

export default function NewOrientationPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    orientationDate: new Date().toISOString().split('T')[0],
    topics: '',
    trainer: '',
    completed: false,
    notes: '',
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      } else {
        console.error('Failed to fetch employees');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/orientations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          notes: formData.notes || null,
        }),
      });

      if (response.ok) {
        router.push('/hr/orientation');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating orientation:', error);
      alert('An error occurred while scheduling the orientation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule New Orientation</h1>
              <p className="text-gray-800">Schedule orientation program for new employee</p>
            </div>
            <Link
              href="/hr/orientation"
              className="inline-flex items-center px-4 py-2 border border-gray-400 rounded-lg text-sm font-semibold text-gray-900 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              ← Back to Orientation
            </Link>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employee Selection */}
            <div>
              <label htmlFor="employeeId" className="block text-sm font-medium text-gray-900 mb-2">
                Employee *
              </label>
              <select
                id="employeeId"
                name="employeeId"
                required
                value={formData.employeeId}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900"
                disabled={loading}
              >
                <option value="">Select an employee...</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullName} - {employee.position} ({employee.department})
                  </option>
                ))}
              </select>
              {loading && <p className="mt-2 text-sm text-gray-700">Loading employees...</p>}
            </div>

            {/* Orientation Date */}
            <div>
              <label htmlFor="orientationDate" className="block text-sm font-medium text-gray-900 mb-2">
                Orientation Date *
              </label>
              <input
                type="date"
                id="orientationDate"
                name="orientationDate"
                required
                value={formData.orientationDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900"
              />
            </div>

            {/* Topics */}
            <div>
              <label htmlFor="topics" className="block text-sm font-medium text-gray-900 mb-2">
                Topics Covered *
              </label>
              <textarea
                id="topics"
                name="topics"
                rows={3}
                required
                value={formData.topics}
                onChange={handleInputChange}
                placeholder="List the topics that will be covered in the orientation..."
                className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none text-gray-900"
              />
            </div>

            {/* Trainer */}
            <div>
              <label htmlFor="trainer" className="block text-sm font-medium text-gray-900 mb-2">
                Trainer/Instructor *
              </label>
              <input
                type="text"
                id="trainer"
                name="trainer"
                required
                value={formData.trainer}
                onChange={handleInputChange}
                placeholder="Name of the person conducting the orientation"
                className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900"
              />
            </div>

            {/* Completed Checkbox */}
            <div className="flex items-center">
              <input
                id="completed"
                name="completed"
                type="checkbox"
                checked={formData.completed}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-400 rounded"
              />
              <label htmlFor="completed" className="ml-2 block text-sm text-gray-900">
                Mark as completed (if orientation has already been conducted)
              </label>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-900 mb-2">
                Additional Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Any additional notes about this orientation session..."
                className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none text-gray-900"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6">
              <Link
                href="/hr/orientation"
                className="px-6 py-3 border border-gray-400 rounded-lg text-sm font-semibold text-gray-900 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Scheduling...' : 'Schedule Orientation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}