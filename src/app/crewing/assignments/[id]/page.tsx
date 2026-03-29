'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { WorkspaceHero } from '@/components/layout/WorkspaceHero';

interface AssignmentFormData {
  rank: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface Assignment {
  id: string;
  crewId: string;
  vesselId: string;
  principalId: string;
  rank: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  crew: { fullName: string };
  vessel: { name: string };
  principal: { name: string } | null;
}

function formatStatusLabel(status: string) {
  if (status === 'ACTIVE') return 'Active';
  if (status === 'ASSIGNED') return 'Assigned';
  if (status === 'PLANNED') return 'Planned';
  if (status === 'ONBOARD') return 'Onboard';
  if (status === 'COMPLETED') return 'Completed';
  if (status === 'CANCELLED') return 'Cancelled';
  return status;
}

const ASSIGNMENT_UPDATE_STEPS = [
  {
    title: '1. Confirm movement plan',
    detail: 'Align rank, principal ownership, and sign-on date with the confirmed vessel movement plan.',
  },
  {
    title: '2. Keep status factual',
    detail: 'Use `Onboard` only after physical embarkation. Use `Completed` or `Cancelled` only with a recorded end date.',
  },
  {
    title: '3. Close the timeline cleanly',
    detail: 'Maintain the planned sign-off date so logistics and downstream reporting stay accurate.',
  },
] as const;

export default function EditAssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState<AssignmentFormData>({
    rank: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE',
  });
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setErrorMessage(null);
        const response = await fetch(`/api/assignments/${id}`);
        if (response.ok) {
          const data: Assignment = await response.json();
          setAssignment(data);
          setFormData({
            rank: data.rank || '',
            startDate: data.startDate ? data.startDate.split('T')[0] : '',
            endDate: data.endDate ? data.endDate.split('T')[0] : '',
            status: data.status,
          });
        } else {
          setErrorMessage('Assignment record could not be loaded. Return to the assignment list and try again.');
          router.push('/crewing/assignments');
        }
      } catch (error) {
        console.error('Error:', error);
        setErrorMessage('Assignment record could not be loaded. Check the network connection and try again.');
      } finally {
        setFetchLoading(false);
      }
    };

    if (id) {
      fetchAssignment();
    }
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/assignments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rank: formData.rank,
          startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
          endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
          status: formData.status,
        }),
      });

      if (response.ok) {
        setSuccessMessage('Assignment plan updated. Returning to the assignment list...');
        window.setTimeout(() => {
          router.push('/crewing/assignments');
        }, 700);
      } else {
        const errorPayload = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
        setErrorMessage(errorPayload?.message ?? errorPayload?.error ?? 'Failed to update assignment. Review the planned dates and status.');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Assignment could not be updated. Check the network connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (fetchLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-sm font-medium text-slate-600">Loading assignment record...</div>
      </div>
    );
  }

  if (!assignment) {
    return null;
  }

  const clientValidationMessage =
    !formData.startDate
      ? 'Start date is required.'
      : formData.endDate && formData.endDate < formData.startDate
        ? 'Planned end date cannot be earlier than the start date.'
        : (formData.status === 'COMPLETED' || formData.status === 'CANCELLED') && !formData.endDate
          ? 'End date is required when completing or cancelling an assignment.'
          : null;

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Assignment Operations"
        title="Update crew assignment"
        subtitle="Keep vessel linkage, movement timing, and onboard status accurate for the active assignment record."
        helperLinks={[
          { href: '/crewing/assignments', label: 'Assignments' },
          { href: '/crewing/prepare-joining', label: 'Prepare joining' },
        ]}
        highlights={[
          { label: 'Crew', value: assignment.crew.fullName, detail: 'Current movement record owner.' },
          { label: 'Vessel', value: assignment.vessel.name, detail: 'Assigned vessel on this record.' },
          { label: 'Principal', value: assignment.principal?.name || 'Not assigned', detail: 'Principal ownership must stay accurate.' },
          { label: 'Current Status', value: formatStatusLabel(assignment.status), detail: 'Update only when the real movement status changes.' },
        ]}
        actions={(
          <Button type="button" variant="secondary" onClick={() => router.push('/crewing/assignments')}>
            Back to Assignment List
          </Button>
        )}
      />

      <section className="surface-card p-8">
        <div className="mb-6 grid gap-3 md:grid-cols-3">
          {ASSIGNMENT_UPDATE_STEPS.map((step) => (
            <div key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">{step.title}</p>
              <p className="mt-2 text-sm text-slate-600">{step.detail}</p>
            </div>
          ))}
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Assignment Planning</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Update dates and status only after the office desk confirms the movement plan or onboard change.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Update Gate</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {clientValidationMessage ?? 'Assignment update is complete enough to save.'}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            `ONBOARD` needs a confirmed sign-on date. `COMPLETED` and `CANCELLED` must keep a recorded end date.
          </p>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Crew</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{assignment.crew.fullName}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Vessel</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{assignment.vessel.name}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Principal</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{assignment.principal?.name || 'Not assigned'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Current Status</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{formatStatusLabel(assignment.status)}</p>
          </div>
        </div>

        {errorMessage ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {successMessage}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
              <Input
            type="text"
            id="rank"
            name="rank"
            label="Assignment Rank"
            value={formData.rank}
            onChange={handleChange}
            placeholder="e.g., Master, Chief Engineer"
            helperText="Keep this aligned with the confirmed vessel assignment, not just the crew master rank."
          />

          <Select
            id="status"
            name="status"
            label="Status"
            value={formData.status}
            onChange={handleChange}
            options={[
              { value: 'PLANNED', label: 'Planned' },
              { value: 'ASSIGNED', label: 'Assigned' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'ONBOARD', label: 'Onboard' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
            helperText="Use `Onboard` only when the crew member has physically joined the vessel."
          />

          <Input
            type="date"
            id="startDate"
            name="startDate"
            label="Sign-On Date"
            required
            value={formData.startDate}
            onChange={handleChange}
            helperText="Keep the sign-on date aligned with the confirmed pickup and embarkation plan."
          />

          <div>
            <Input
              type="date"
              id="endDate"
              name="endDate"
              label="Planned Sign-Off Date"
              value={formData.endDate}
              onChange={handleChange}
              min={formData.startDate || undefined}
            />
            <p className="mt-2 text-xs text-slate-500">Use the quick buttons below if you need to extend the current planned sign-off date.</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const currentDate = new Date(formData.endDate || new Date());
                  currentDate.setMonth(currentDate.getMonth() + 1);
                  setFormData((prev) => ({
                    ...prev,
                    endDate: currentDate.toISOString().split('T')[0],
                  }));
                }}
                className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
              >
                +1 Month
              </button>
              <button
                type="button"
                onClick={() => {
                  const currentDate = new Date(formData.endDate || new Date());
                  currentDate.setMonth(currentDate.getMonth() + 2);
                  setFormData((prev) => ({
                    ...prev,
                    endDate: currentDate.toISOString().split('T')[0],
                  }));
                }}
                className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
              >
                +2 Months
              </button>
              <button
                type="button"
                onClick={() => {
                  const currentDate = new Date(formData.endDate || new Date());
                  currentDate.setMonth(currentDate.getMonth() + 3);
                  setFormData((prev) => ({
                    ...prev,
                    endDate: currentDate.toISOString().split('T')[0],
                  }));
                }}
                className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
              >
                +3 Months
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                isLoading={loading}
                disabled={Boolean(clientValidationMessage)}
              >
              {loading ? 'Saving...' : 'Save assignment update'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push('/crewing/assignments')}>
              Close Without Saving
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
