'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/lib/permissions';
import { normalizeToUserRoles } from '@/lib/type-guards';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { WorkspaceHero } from '@/components/layout/WorkspaceHero';

interface ApplicationFormData {
  crewId: string;
  position: string;
  vesselType: string;
  principalId: string;
  applicationDate: string;
}

interface Crew {
  id: string;
  fullName: string | null;
}

interface Principal {
  id: string;
  name: string;
}

const VESSEL_TYPES = [
  'General Cargo',
  'Container Ship',
  'Bulk Carrier',
  'Tanker',
  'RoRo',
  'Refrigerated Cargo',
  'Multi-Purpose',
  'Yacht',
  'Fishing Vessel',
  'Other',
];

const POSITIONS = [
  'Master/Captain',
  'Chief Officer',
  'Second Officer',
  'Third Officer',
  'Deck Cadet',
  'Chief Engineer',
  'Second Engineer',
  'Third Engineer',
  'Fourth Engineer',
  'Engine Cadet',
  'Chief Steward',
  'Bosun',
  'Carpenter',
  'Able Seaman',
  'Ordinary Seaman',
  'Galley Boy',
];

const APPLICATION_ENTRY_STEPS = [
  {
    title: '1. Confirm seafarer',
    detail: 'Use a live seafarer profile that already passed readiness review and is ready for nomination.',
  },
  {
    title: '2. Set nomination scope',
    detail: 'Record the target rank, principal, and optional vessel segment used for this nomination case.',
  },
  {
    title: '3. Release to workflow',
    detail: 'After saving, document control continues intake, CV readiness, and director handoff from the application desk.',
  },
] as const;

export default function NewApplicationPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const userRoles = normalizeToUserRoles(session?.user?.roles ?? session?.user?.role);
  const canManageApplications = userRoles.includes(UserRole.CDMO);
  const [formData, setFormData] = useState<ApplicationFormData>({
    crewId: '',
    position: '',
    vesselType: '',
    principalId: '',
    applicationDate: new Date().toISOString().split('T')[0],
  });
  const [crew, setCrew] = useState<Crew[]>([]);
  const [principals, setPrincipals] = useState<Principal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (!canManageApplications) {
      return;
    }

    const fetchData = async () => {
      try {
        const [crewRes, principalsRes] = await Promise.all([
          fetch('/api/crewing/seafarers'),
          fetch('/api/principals'),
        ]);

        if (crewRes.ok) {
          const crewData = await crewRes.json();
          setCrew(Array.isArray(crewData?.data) ? crewData.data : []);
        }

        if (principalsRes.ok) {
          const principalsData = await principalsRes.json();
          setPrincipals(principalsData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load form data');
      }
    };

    fetchData();
  }, [canManageApplications, router, session, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canManageApplications) {
      setError('Nomination intake is limited to Document Staff.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          crewId: formData.crewId,
          position: formData.position,
          vesselType: formData.vesselType || null,
          principalId: formData.principalId || null,
          applicationDate: formData.applicationDate,
        }),
      });

      if (response.ok) {
        const applicationData = await response.json();
        const applicationId = applicationData.id;

        // Auto-create checklists for relevant procedures
        try {
          const proceduresRes = await fetch('/api/crewing/procedures?phase=Pre-Deployment');
          if (proceduresRes.ok) {
            const proceduresData = await proceduresRes.json();
            
            // Create a checklist for each procedure
            for (const procedure of proceduresData.data || []) {
              await fetch('/api/crewing/checklists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  applicationId,
                  procedureId: procedure.id,
                  checklistCode: procedure.code,
                  itemsJson: procedure.steps.map((step: Record<string, unknown>) => ({
                    order: step.order,
                    title: step.title,
                    description: step.description,
                    checked: false,
                  })) || [],
                }),
              });
            }
          }
        } catch (checklistErr) {
          console.warn('Failed to create checklists:', checklistErr);
          // Don't fail the application creation if checklists fail
        }

        router.push('/crewing/applications');
      } else {
        const errorData = await response.json().catch(() => null);
        setError(errorData?.error || 'Failed to create application');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Error creating application');
    } finally {
      setLoading(false);
    }
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-sm font-medium text-slate-600">Loading application form...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!canManageApplications) {
    return (
      <div className="section-stack">
        <WorkspaceHero
          eyebrow="Nomination Workflow"
          title="Nomination intake"
          subtitle="Review only. Nomination intake remains with Document Staff."
          helperLinks={[
            { href: '/crewing/applications', label: 'Applications' },
            { href: '/crewing/workflow', label: 'Workflow' },
          ]}
          actions={(
            <Button type="button" variant="secondary" onClick={() => router.push('/crewing/applications')}>
              Back to applications
            </Button>
          )}
        />
      </div>
    );
  }

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Nomination Workflow"
        title="Create nomination application"
        subtitle="Use this form only after the crew member is active in the seafarer pool and readiness review is complete."
        helperLinks={[
          { href: '/crewing/applications', label: 'Applications' },
          { href: '/crewing/readiness', label: 'Readiness review' },
          { href: '/crewing/workflow', label: 'Workflow' },
        ]}
        highlights={[
          { label: 'Entry Owner', value: 'Document Control', detail: 'This intake stays with document control until director handoff.' },
          { label: 'Required Scope', value: 'Seafarer + Rank + Principal', detail: 'These three fields are the minimum nomination data set.' },
          { label: 'Downstream Handoff', value: 'Prepare Joining Later', detail: 'Vessel assignment and mobilization happen after principal decision.' },
        ]}
        actions={(
          <Button type="button" variant="secondary" onClick={() => router.push('/crewing/applications')}>
            Back to applications
          </Button>
        )}
      />

      <section className="surface-card p-8">
          <div className="mb-6 grid gap-3 md:grid-cols-3">
            {APPLICATION_ENTRY_STEPS.map((step) => (
              <div key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                <p className="mt-2 text-sm text-slate-600">{step.detail}</p>
              </div>
            ))}
          </div>
          <p className="mb-6 text-sm text-slate-600">
            Create a nomination application against a real seafarer, target rank, and principal. Vessel assignment stays in the downstream mobilization flow because this application record does not store vessel linkage yet.
          </p>
          <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            Required order: select seafarer, set target position, choose principal, then record the nomination date. Vessel assignment is handled later in mobilization.
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Select
              id="crewId"
              name="crewId"
              label="Seafarer"
              required
              value={formData.crewId}
              onChange={handleChange}
              placeholder="Select a seafarer"
              options={crew.map((member) => ({
                value: member.id,
                label: member.fullName?.trim() || `Crew ${member.id}`,
              }))}
              helperText="Pick the live seafarer profile that already passed readiness review."
            />

            <Select
              id="position"
              name="position"
              label="Applied Position/Rank"
              required
              value={formData.position}
              onChange={handleChange}
              placeholder="Select position"
              options={POSITIONS.map((position) => ({ value: position, label: position }))}
              helperText="Use the nomination rank being submitted to director and principal."
            />

            <Select
              id="principalId"
              name="principalId"
              label="Target Principal"
              required
              value={formData.principalId}
              onChange={handleChange}
              placeholder="Select company/principal"
              options={principals.map((principal) => ({ value: principal.id, label: principal.name }))}
              helperText="Principal selection is required before this case moves to principal review."
            />

            <Select
              id="vesselType"
              name="vesselType"
              label="Vessel Type"
              value={formData.vesselType}
              onChange={handleChange}
              placeholder="Select vessel type (optional)"
              options={VESSEL_TYPES.map((type) => ({ value: type, label: type }))}
              helperText="Optional. Use when the nomination is tied to a vessel segment or owner preference."
            />

            <Input
              type="date"
              id="applicationDate"
              name="applicationDate"
              label="Nomination Date"
              required
              value={formData.applicationDate}
              onChange={handleChange}
              helperText="Record the office submission date for this nomination case."
            />

            <div className="mt-6 flex gap-4 border-t border-slate-300 pt-6">
              <Button
                type="submit"
                isLoading={loading}
                className="flex-1"
              >
                {loading ? 'Creating...' : 'Create nomination'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                className="flex-1"
              >
                Close Form
              </Button>
            </div>
          </form>
      </section>
    </div>
  );
}
