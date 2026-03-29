'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { WorkspaceHero } from '@/components/layout/WorkspaceHero';
import { WorkspaceLoadingState, WorkspaceState } from '@/components/layout/WorkspaceState';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';

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

const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  'half-day': 'Half Day',
  leave: 'On Leave',
};

export default function DeleteAttendancePage() {
  const router = useRouter();
  const params = useParams();
  const attendanceId = params.id as string;

  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchAttendance = useCallback(async () => {
    try {
      setErrorMessage(null);
      const response = await fetch(`/api/attendances/${attendanceId}`);
      if (response.ok) {
        const data = await response.json();
        setAttendance(data);
      } else {
        console.error('Failed to fetch attendance');
        setErrorMessage('Attendance record could not be loaded.');
        router.push('/hr/attendance');
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setErrorMessage('Attendance record could not be loaded.');
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
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/attendances/${attendanceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/hr/attendance');
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Attendance record could not be deleted.');
      }
    } catch (error) {
      console.error('Error deleting attendance:', error);
      setErrorMessage('An error occurred while deleting the attendance record.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <WorkspaceLoadingState label="Loading attendance record..." />;
  }

  if (!attendance) {
    return (
      <WorkspaceState
        eyebrow="Attendance Removal"
        title="Attendance record not available"
        description="The requested attendance entry could not be found in the HR register. Return to the attendance desk before attempting a removal review."
        tone="danger"
        action={(
          <Link href="/hr/attendance" className="inline-flex items-center rounded-xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800">
            Return to Attendance Desk
          </Link>
        )}
      />
    );
  }

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Attendance Removal"
        title="Delete attendance record"
        subtitle="Review the entry details carefully before removing this attendance record from the HR register."
        helperLinks={[
          { href: '/hr/attendance', label: 'Attendance' },
          { href: '/hr/employees', label: 'Employee Register' },
        ]}
        highlights={[
          { label: 'Employee', value: attendance.employee.fullName, detail: `${attendance.employee.position} • ${attendance.employee.department}` },
          { label: 'Work Date', value: new Date(attendance.date).toLocaleDateString('en-GB'), detail: 'Attendance date on this record.' },
          { label: 'Current Status', value: ATTENDANCE_STATUS_LABELS[attendance.status] ?? attendance.status, detail: 'Delete only if this record should not exist at all.' },
        ]}
        actions={(
          <Link href="/hr/attendance" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-800">
            Back to Attendance
          </Link>
        )}
      />

      <section className="surface-card p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {errorMessage ? (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</div>
          ) : null}

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
          <div className="mb-6 rounded-2xl bg-slate-50 p-6">
            <h4 className="mb-4 text-lg font-medium text-slate-900">Attendance Details</h4>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Employee</dt>
                <dd className="mt-1 text-sm text-slate-900">{attendance.employee.fullName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Position</dt>
                <dd className="mt-1 text-sm text-slate-900">{attendance.employee.position}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Department</dt>
                <dd className="mt-1 text-sm text-slate-900">{attendance.employee.department}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Date</dt>
                <dd className="mt-1 text-sm text-slate-900">{new Date(attendance.date).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Check In</dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {attendance.checkIn ? new Date(attendance.checkIn).toLocaleTimeString() : 'Not recorded'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Check Out</dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {attendance.checkOut ? new Date(attendance.checkOut).toLocaleTimeString() : 'Not recorded'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-slate-900">
                  <StatusBadge
                    status={attendance.status}
                    label={ATTENDANCE_STATUS_LABELS[attendance.status] ?? attendance.status}
                    className="px-4 py-2"
                  />
                </dd>
              </div>
              {attendance.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Notes</dt>
                  <dd className="mt-1 text-sm text-slate-900">{attendance.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Link href="/hr/attendance" className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
              Return Without Removing
            </Link>
            <Button type="button" variant="danger" onClick={handleDelete} disabled={deleting} isLoading={deleting}>
              {deleting ? 'Deleting...' : 'Delete attendance record'}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
