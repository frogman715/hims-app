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

export default function DeleteAttendancePage() {
  const router = useRouter();
  const params = useParams();
  const attendanceId = params.id as string;

  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const fetchAttendance = useCallback(async () => {
    try {
      const response = await fetch(`/api/attendances/${attendanceId}`);
      if (response.ok) {
        const data = await response.json();
        setAttendance(data);
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

  useEffect(() => {
    fetchAttendance();
  }, [attendanceId, fetchAttendance]);

  const handleDelete = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/attendances/${attendanceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/hr/attendance');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting attendance:', error);
      alert('An error occurred while deleting the attendance record.');
    } finally {
      setDeleting(false);
    }
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
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Delete Attendance Record</h1>
              <p className="text-gray-800">Are you sure you want to delete this attendance record?</p>
            </div>
            <Link
              href="/hr/attendance"
              className="inline-flex items-center px-4 py-2 border border-gray-400 rounded-lg text-sm font-semibold text-gray-900 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              ← Back to Attendance
            </Link>
          </div>
        </div>

        {/* Confirmation Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Warning: This action cannot be undone
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>Deleting this attendance record will permanently remove it from the system.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Details */}
          <div className="bg-gray-100 rounded-lg p-6 mb-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Attendance Details</h4>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Employee</dt>
                <dd className="mt-1 text-sm text-gray-900">{attendance.employee.fullName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Position</dt>
                <dd className="mt-1 text-sm text-gray-900">{attendance.employee.position}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Department</dt>
                <dd className="mt-1 text-sm text-gray-900">{attendance.employee.department}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Date</dt>
                <dd className="mt-1 text-sm text-gray-900">{new Date(attendance.date).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Check In</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {attendance.checkIn ? new Date(attendance.checkIn).toLocaleTimeString() : 'Not recorded'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Check Out</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {attendance.checkOut ? new Date(attendance.checkOut).toLocaleTimeString() : 'Not recorded'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span className={`inline-flex px-4 py-2 text-xs font-semibold rounded-full ${
                    attendance.status === 'present'
                      ? 'bg-green-100 text-green-800'
                      : attendance.status === 'absent'
                      ? 'bg-red-100 text-red-800'
                      : attendance.status === 'late'
                      ? 'bg-yellow-100 text-yellow-800'
                      : attendance.status === 'half-day'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1)}
                  </span>
                </dd>
              </div>
              {attendance.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900">{attendance.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/hr/attendance"
              className="px-6 py-3 border border-gray-400 rounded-lg text-sm font-semibold text-gray-900 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-6 py-3 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:cursor-not-allowed transition-colors"
            >
              {deleting ? 'Deleting...' : 'Delete Attendance'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}