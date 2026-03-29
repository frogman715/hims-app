'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { WorkspaceHero } from '@/components/layout/WorkspaceHero';
import { WorkspaceLoadingState, WorkspaceState } from '@/components/layout/WorkspaceState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

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

const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  'half-day': 'Half Day',
  leave: 'On Leave',
};

export default function EditAttendancePage() {
  const router = useRouter();
  const params = useParams();
  const attendanceId = params.id as string;

  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
      setErrorMessage(null);
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
    setErrorMessage(null);

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
        setErrorMessage(error.error || 'Attendance update failed.');
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      setErrorMessage('An error occurred while updating the attendance record.');
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
    return <WorkspaceLoadingState label="Loading attendance record..." />;
  }

  if (!attendance) {
    return (
      <WorkspaceState
        eyebrow="Attendance Detail"
        title="Attendance record not available"
        description="The requested attendance entry could not be found in the active HR register. Return to the attendance desk and reopen a valid record."
        tone="danger"
        action={(
          <Link href="/hr/attendance" className="inline-flex items-center rounded-xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800">
            Return to Attendance Desk
          </Link>
        )}
      />
    );
  }

  const attendanceGuidance =
    formData.status === 'present'
      ? 'Use Present when the employee was available for a normal working day.'
      : formData.status === 'late'
        ? 'Use Late when attendance is valid but arrival was after the approved reporting time.'
        : formData.status === 'half-day'
          ? 'Use Half Day when only part of the approved working day was completed.'
          : formData.status === 'leave'
            ? 'Use On Leave only when the absence is already supported by an approved leave record.'
            : 'Use Absent when the employee did not report for duty and no approved leave applies.';

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Attendance Detail"
        title="Edit attendance record"
        subtitle={`Update attendance information for ${attendance.employee.fullName} with one clear attendance status and accurate timing.`}
        helperLinks={[
          { href: '/hr/attendance', label: 'Attendance' },
          { href: '/hr/employees', label: 'Employee Register' },
        ]}
        highlights={[
          { label: 'Employee', value: attendance.employee.fullName, detail: `${attendance.employee.position} • ${attendance.employee.department}` },
          { label: 'Work Date', value: new Date(attendance.date).toLocaleDateString('en-GB'), detail: 'Attendance date on this record.' },
          { label: 'Current Status', value: ATTENDANCE_STATUS_LABELS[attendance.status] ?? attendance.status, detail: 'Update only when the real attendance condition changes.' },
        ]}
        actions={(
          <Link href="/hr/attendance" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-800">
            Back to Attendance
          </Link>
        )}
      />

      <section className="surface-card p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">1. Confirm employee</p>
              <p className="mt-2 text-sm text-slate-600">Make sure the record stays attached to the correct employee profile.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">2. Use one status</p>
              <p className="mt-2 text-sm text-slate-600">Choose the single attendance status that best reflects the actual workday result.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">3. Keep timing factual</p>
              <p className="mt-2 text-sm text-slate-600">Check-in and check-out should match the real attendance trail, not estimates.</p>
            </div>
          </div>

          {errorMessage ? (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</div>
          ) : null}

          <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            {attendanceGuidance}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Select
              id="employeeId"
              name="employeeId"
              label="Employee"
              required
              value={formData.employeeId}
              onChange={handleInputChange}
              options={employees.map((employee) => ({
                value: employee.id,
                label: `${employee.fullName} - ${employee.position} (${employee.department})`,
              }))}
            />
            <Input id="date" name="date" label="Date" type="date" required value={formData.date} onChange={handleInputChange} />
            <Input id="checkIn" name="checkIn" label="Check In Time" type="datetime-local" value={formData.checkIn} onChange={handleInputChange} />
            <Input id="checkOut" name="checkOut" label="Check Out Time" type="datetime-local" value={formData.checkOut} onChange={handleInputChange} />
            <Select
              id="status"
              name="status"
              label="Status"
              value={formData.status}
              onChange={handleInputChange}
              options={[
                { value: 'present', label: 'Present' },
                { value: 'absent', label: 'Absent' },
                { value: 'late', label: 'Late' },
                { value: 'half-day', label: 'Half Day' },
                { value: 'leave', label: 'On Leave' },
              ]}
              helperText="Choose the final daily attendance result used by HR reporting."
            />
            <Textarea id="notes" name="notes" label="Notes" rows={4} value={formData.notes} onChange={handleInputChange} placeholder="Any additional notes about this attendance record..." />

            <div className="flex justify-end space-x-4 border-t border-slate-200 pt-6">
              <Button type="button" variant="secondary" onClick={() => router.push('/hr/attendance')}>
                Close Without Saving
              </Button>
              <Button type="submit" isLoading={submitting} disabled={submitting}>
                {submitting ? 'Updating...' : 'Save attendance update'}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
