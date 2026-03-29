'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { WorkspaceHero } from '@/components/layout/WorkspaceHero';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { PermissionLevel, hasPermission } from '@/lib/permissions';
import { normalizeToUserRoles } from '@/lib/type-guards';

interface RecruitmentFormData {
  candidateName: string;
  position: string;
  appliedDate: string;
  notes: string;
  phone: string;
  email: string;
  nationality: string;
}

const positionOptions = [
  { value: '', label: 'Select Position' },
  { value: 'Captain', label: 'Captain' },
  { value: 'Chief Officer', label: 'Chief Officer' },
  { value: 'Chief Engineer', label: 'Chief Engineer' },
  { value: 'Second Engineer', label: 'Second Engineer' },
  { value: 'Third Engineer', label: 'Third Engineer' },
  { value: 'Electrical Officer', label: 'Electrical Officer' },
  { value: 'Bosun', label: 'Bosun' },
  { value: 'Able Seaman', label: 'Able Seaman' },
  { value: 'Ordinary Seaman', label: 'Ordinary Seaman' },
  { value: 'Chief Cook', label: 'Chief Cook' },
  { value: 'Cook', label: 'Cook' },
  { value: 'Messman', label: 'Messman' },
  { value: 'HR Manager', label: 'HR Manager' },
  { value: 'HR Officer', label: 'HR Officer' },
  { value: 'Accountant', label: 'Accountant' },
  { value: 'Administration Officer', label: 'Administration Officer' },
  { value: 'IT Support', label: 'IT Support' },
  { value: 'Quality Manager', label: 'Quality Manager' },
  { value: 'Safety Officer', label: 'Safety Officer' },
  { value: 'Other', label: 'Other' },
];

const RECRUITMENT_ENTRY_STEPS = [
  {
    title: '1. Register candidate',
    detail: 'Capture the candidate identity and target position used for the active recruitment case.',
  },
  {
    title: '2. Record office contact data',
    detail: 'Keep nationality, phone, and email clear so follow-up and traceability stay complete.',
  },
  {
    title: '3. Release to review',
    detail: 'After intake, use the recruitment desk to move the candidate through approval, decline, or hire handoff.',
  },
] as const;

export default function NewRecruitmentPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const userRoles = normalizeToUserRoles(session?.user?.roles ?? session?.user?.role);
  const canManageRecruitment = hasPermission(userRoles, 'crewing', PermissionLevel.EDIT_ACCESS);

  const [formData, setFormData] = useState<RecruitmentFormData>({
    candidateName: '',
    position: '',
    appliedDate: '',
    notes: '',
    phone: '',
    email: '',
    nationality: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canManageRecruitment) {
      setError('Recruitment entry is limited to users with crewing edit access.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/recruitments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateName: formData.candidateName,
          position: formData.position,
          appliedDate: formData.appliedDate ? new Date(formData.appliedDate).toISOString() : new Date().toISOString(),
          notes: formData.notes,
          phone: formData.phone || null,
          email: formData.email || null,
          nationality: formData.nationality || null,
        }),
      });

      if (response.ok) {
        router.push('/hr/recruitment');
      } else {
        const responseError = await response.json();
        setError(responseError.error || 'Failed to create recruitment');
      }
    } catch (submitError) {
      console.error('Error:', submitError);
      setError(submitError instanceof Error ? submitError.message : 'Error creating recruitment');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (status === 'loading') {
    return (
      <div className="section-stack">
        <div className="surface-card px-6 py-12 text-center text-sm text-slate-600">Loading recruitment entry form...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!canManageRecruitment) {
    return (
      <div className="section-stack">
        <WorkspaceHero
          eyebrow="Recruitment Intake"
          title="Add new candidate"
          subtitle="Recruitment entry is limited to users with crewing edit access."
          helperLinks={[
            { href: '/hr/recruitment', label: 'Recruitment' },
            { href: '/dashboard', label: 'Dashboard' },
          ]}
          actions={(
            <Link href="/hr/recruitment" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-800">
              Back to Recruitment
            </Link>
          )}
        />
      </div>
    );
  }

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Recruitment Intake"
        title="Add new candidate"
        subtitle="Register a candidate in the controlled recruitment pipeline. Active seafarer records are only opened after hiring approval."
        helperLinks={[
          { href: '/hr/recruitment', label: 'Recruitment' },
          { href: '/crewing/workflow', label: 'Crew Workflow' },
          { href: '/dashboard', label: 'Dashboard' },
        ]}
        highlights={[
          { label: 'Entry Type', value: 'Candidate Intake', detail: 'Use this page only for new recruitment intake, not seafarer activation.' },
          { label: 'Workflow End', value: 'Hire or Decline', detail: 'Recruitment closes only after final hire approval or candidate decline.' },
          { label: 'Seafarer Handoff', value: 'After Hire', detail: 'Active crew records open only after recruitment is approved for hire.' },
        ]}
        actions={(
          <Link href="/hr/recruitment" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-800">
            Back to Recruitment
          </Link>
        )}
      />

      <section className="surface-card space-y-6 p-6">
        <div className="grid gap-3 md:grid-cols-3">
          {RECRUITMENT_ENTRY_STEPS.map((step) => (
            <div key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">{step.title}</p>
              <p className="mt-2 text-sm text-slate-600">{step.detail}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/80 px-4 py-4 text-sm text-slate-700">
          Use this form for candidate intake only. Employment handover to active crew records should happen after recruitment approval and office validation.
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
            ) : null}

            <div className="grid gap-5 md:grid-cols-2">
              <Input
                id="candidateName"
                name="candidateName"
                label="Candidate Name"
                required
                value={formData.candidateName}
                onChange={handleChange}
                placeholder="Enter candidate full name"
              />
              <Select
                id="position"
                name="position"
                label="Position Applied For"
                required
                value={formData.position}
                onChange={handleChange}
                options={positionOptions}
              />
              <Input
                id="appliedDate"
                name="appliedDate"
                label="Candidate Intake Date"
                type="date"
                value={formData.appliedDate}
                onChange={handleChange}
                helperText="Leave empty to use today's date."
              />
              <Input
                id="nationality"
                name="nationality"
                label="Nationality"
                value={formData.nationality}
                onChange={handleChange}
                placeholder="e.g. Indonesia"
              />
              <Input
                id="phone"
                name="phone"
                label="Phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+62..."
              />
              <Input
                id="email"
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="candidate@email.com"
              />
            </div>

            <Textarea
              id="notes"
              name="notes"
              label="Recruitment Notes"
              rows={5}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add sourcing notes, operational remarks, or desk comments."
            />

            <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-6">
              <Button type="submit" isLoading={loading}>
                {loading ? 'Saving Candidate' : 'Save candidate intake'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => router.push('/hr/recruitment')}>
                Close Form
              </Button>
            </div>
          </form>
        </section>
      </section>
    </div>
  );
}
