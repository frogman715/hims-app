'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: string;
  notes?: string;
  employee: {
    id: string;
    fullName: string;
    position: string;
    department: string;
  };
}

interface Employee {
  id: string;
  fullName: string;
  position: string;
  department: string;
}

export default function EditAttendancePage() {
  const router = useRouter();
  const params = useParams();
  const attendanceId = params.id as string;

  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    date: '',
    checkIn: '',
    checkOut: '',
    status: 'present',
    notes: '',
  });

  const fetchAttendance = useCallback(async () => {
    try {
      const response = await fetch(`/api/attendances/${attendanceId}`);
      if (response.ok) {
        const data = await response.json();
        setAttendance(data);
        setFormData({
          employeeId: data.employeeId,
          date: new Date(data.date).toISOString().split('T')[0],
          checkIn: data.checkIn ? new Date(data.checkIn).toISOString().slice(0, 16) : '',
          checkOut: data.checkOut ? new Date(data.checkOut).toISOString().slice(0, 16) : '',
          status: data.status,
          notes: data.notes || '',
        });
      } else {
        console.error('Failed to fetch attendance');
        router.push('/hr/attendance');
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      router.push('/hr/attendance');
    } finally {
      setLoading(false);
    }
  }, [attendanceId, router]);

  const fetchEmployees = async () => {
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
    }
  };

  useEffect(() => {
    fetchAttendance();
    fetchEmployees();
  }, [attendanceId, fetchAttendance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`/api/attendances/${attendanceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          checkIn: formData.checkIn || null,
          checkOut: formData.checkOut || null,
          notes: formData.notes || null,
        }),
      });

      if (response.ok) {
        router.push('/hr/attendance');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      alert('An error occurred while updating the attendance record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading attendance record...</p>
        </div>
      </div>
    );
  }

  if (!attendance) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl text-gray-700">Attendance record not found</div>
          <Link
            href="/hr/attendance"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Back to Attendance
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Attendance Record</h1>
              <p className="text-gray-800">Update attendance information for {attendance.employee.fullName}</p>
            </div>
            <Link
              href="/hr/attendance"
              className="inline-flex items-center px-4 py-2 border border-gray-400 rounded-lg text-sm font-semibold text-gray-900 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              ← Back to Attendance
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
              >
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullName} - {employee.position} ({employee.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-900 mb-2">
                Date *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                required
                value={formData.date}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900"
              />
            </div>

            {/* Check In Time */}
            <div>
              <label htmlFor="checkIn" className="block text-sm font-medium text-gray-900 mb-2">
                Check In Time
              </label>
              <input
                type="datetime-local"
                id="checkIn"
                name="checkIn"
                value={formData.checkIn}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900"
              />
            </div>

            {/* Check Out Time */}
            <div>
              <label htmlFor="checkOut" className="block text-sm font-medium text-gray-900 mb-2">
                Check Out Time
              </label>
              <input
                type="datetime-local"
                id="checkOut"
                name="checkOut"
                value={formData.checkOut}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900"
              />
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-900 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="half-day">Half Day</option>
                <option value="leave">On Leave</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-900 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Any additional notes about this attendance record..."
                className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none text-gray-900"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6">
              <Link
                href="/hr/attendance"
                className="px-6 py-3 border border-gray-400 rounded-lg text-sm font-semibold text-gray-900 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Updating...' : 'Update Attendance'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}