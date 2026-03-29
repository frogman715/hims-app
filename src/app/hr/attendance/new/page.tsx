'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { WorkspaceHero } from '@/components/layout/WorkspaceHero';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

interface Employee {
  id: string;
  fullName: string;
  position: string;
  department: string;
}

const ATTENDANCE_ENTRY_STEPS = [
  {
    title: '1. Select employee',
    detail: 'Attach the attendance record to the correct employee profile before anything else.',
  },
  {
    title: '2. Set daily result',
    detail: 'Use one final attendance status that reflects the actual workday outcome.',
  },
  {
    title: '3. Record evidence',
    detail: 'Check-in, check-out, and notes should match the real attendance trail or approved leave support.',
  },
] as const;

export default function NewAttendancePage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '',
    checkOut: '',
    status: 'present',
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
    setErrorMessage(null);

    try {
      const response = await fetch('/api/attendances', {
        method: 'POST',
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
        setErrorMessage(error.error || 'Attendance record could not be created.');
      }
    } catch (error) {
      console.error('Error submitting attendance:', error);
      setErrorMessage('An error occurred while submitting the attendance record.');
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

  const attendanceGuidance =
    formData.status === 'present'
      ? 'Use Present when the employee completed a normal working day.'
      : formData.status === 'late'
        ? 'Use Late when attendance is valid but reporting time was delayed.'
        : formData.status === 'half-day'
          ? 'Use Half Day when only part of the approved workday was completed.'
          : formData.status === 'leave'
            ? 'Use On Leave only when HR already has approved leave support.'
            : 'Use Absent when there was no attendance and no approved leave applies.';

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Attendance Entry"
        title="Record new attendance"
        subtitle="Create a new attendance entry for office staff and keep attendance history aligned with the HR register."
        helperLinks={[
          { href: '/hr/attendance', label: 'Attendance' },
          { href: '/hr/employees', label: 'Employee Register' },
          { href: '/dashboard', label: 'Dashboard' },
        ]}
        highlights={[
          { label: 'Record Type', value: 'Daily Attendance', detail: 'One record should represent one employee on one workday.' },
          { label: 'Status Rule', value: 'One Final Result', detail: 'Choose one final daily attendance outcome only.' },
          { label: 'HR Evidence', value: 'Timing + Notes', detail: 'Time data and notes should support the selected status.' },
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
            {ATTENDANCE_ENTRY_STEPS.map((step) => (
              <div key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                <p className="mt-2 text-sm text-slate-600">{step.detail}</p>
              </div>
            ))}
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
              disabled={loading}
              helperText={loading ? 'Loading employees...' : undefined}
              options={[
                { value: '', label: 'Select an employee...' },
                ...employees.map((employee) => ({
                  value: employee.id,
                  label: `${employee.fullName} - ${employee.position} (${employee.department})`,
                })),
              ]}
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
              helperText="Choose the final daily attendance result used in HR reporting."
            />
            <Textarea
              id="notes"
              name="notes"
              label="Notes"
              rows={4}
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Any additional notes about this attendance record..."
            />

            <div className="flex justify-end space-x-4 border-t border-slate-200 pt-6">
              <Button type="button" variant="secondary" onClick={() => router.push('/hr/attendance')}>
                Close Form
              </Button>
              <Button type="submit" isLoading={submitting} disabled={submitting}>
                {submitting ? 'Recording...' : 'Record attendance'}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
