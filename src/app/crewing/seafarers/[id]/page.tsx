'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { WorkspaceHero } from '@/components/layout/WorkspaceHero';

interface SeafarerFormData {
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  placeOfBirth: string;
  rank: string;
  crewStatus: string;
  phone: string;
  email: string;
  heightCm: string;
  weightKg: string;
  coverallSize: string;
  shoeSize: string;
  waistSize: string;
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
}

interface Seafarer {
  id: string;
  fullName: string;
  dateOfBirth: string | null;
  nationality: string | null;
  placeOfBirth: string | null;
  rank: string | null;
  crewStatus: string | null;
  phone: string | null;
  email: string | null;
  heightCm: number | null;
  weightKg: number | null;
  coverallSize: string | null;
  shoeSize: string | null;
  waistSize: string | null;
  emergencyContactName: string | null;
  emergencyContactRelation: string | null;
  emergencyContactPhone: string | null;
}

const crewStatusOptions = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'ON_BOARD', label: 'On Board' },
  { value: 'STANDBY', label: 'Standby' },
  { value: 'MEDICAL', label: 'Medical Hold' },
  { value: 'DOCUMENT_ISSUE', label: 'Document Issue' },
];

const SEAFARER_PROFILE_STEPS = [
  {
    title: '1. Maintain identity data',
    detail: 'Use this page for legal name, nationality, date of birth, and base profile information only.',
  },
  {
    title: '2. Keep status realistic',
    detail: 'Crew status should match the real operational condition, not a future plan or assumption.',
  },
  {
    title: '3. Leave workflow outside',
    detail: 'Documents, medical readiness, joining, and assignments stay in their own operational desks.',
  },
] as const;

export default function EditSeafarerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState<SeafarerFormData>({
    fullName: '',
    dateOfBirth: '',
    nationality: '',
    placeOfBirth: '',
    rank: '',
    crewStatus: 'AVAILABLE',
    phone: '',
    email: '',
    heightCm: '',
    weightKg: '',
    coverallSize: '',
    shoeSize: '',
    waistSize: '',
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactPhone: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSeafarer = async () => {
      try {
        const response = await fetch(`/api/crewing/seafarers/${id}`);
        if (response.ok) {
          const seafarer: Seafarer = await response.json();
          setFormData({
            fullName: seafarer.fullName,
            dateOfBirth: seafarer.dateOfBirth ? seafarer.dateOfBirth.split('T')[0] : '',
            nationality: seafarer.nationality || '',
            placeOfBirth: seafarer.placeOfBirth || '',
            rank: seafarer.rank || '',
            crewStatus: seafarer.crewStatus || 'AVAILABLE',
            phone: seafarer.phone || '',
            email: seafarer.email || '',
            heightCm:
              seafarer.heightCm !== null && seafarer.heightCm !== undefined ? String(seafarer.heightCm) : '',
            weightKg:
              seafarer.weightKg !== null && seafarer.weightKg !== undefined ? String(seafarer.weightKg) : '',
            coverallSize: seafarer.coverallSize || '',
            shoeSize: seafarer.shoeSize || '',
            waistSize: seafarer.waistSize || '',
            emergencyContactName: seafarer.emergencyContactName || '',
            emergencyContactRelation: seafarer.emergencyContactRelation || '',
            emergencyContactPhone: seafarer.emergencyContactPhone || '',
          });
        } else {
          const payload = await response.json().catch(() => null);
          setError(payload?.error || 'Failed to fetch seafarer');
          router.push('/crewing/seafarers');
        }
      } catch (fetchError) {
        console.error('Error:', fetchError);
        setError(fetchError instanceof Error ? fetchError.message : 'Error fetching seafarer');
      } finally {
        setFetchLoading(false);
      }
    };

    if (id) {
      fetchSeafarer();
    }
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        fullName: formData.fullName,
        nationality: formData.nationality || null,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
        placeOfBirth: formData.placeOfBirth || null,
        rank: formData.rank || null,
        crewStatus: formData.crewStatus,
        phone: formData.phone || null,
        email: formData.email || null,
        heightCm: formData.heightCm ? Number(formData.heightCm) : null,
        weightKg: formData.weightKg ? Number(formData.weightKg) : null,
        coverallSize: formData.coverallSize || null,
        shoeSize: formData.shoeSize || null,
        waistSize: formData.waistSize || null,
        emergencyContactName: formData.emergencyContactName || null,
        emergencyContactRelation: formData.emergencyContactRelation || null,
        emergencyContactPhone: formData.emergencyContactPhone || null,
      };

      const response = await fetch(`/api/crewing/seafarers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push('/crewing/seafarers');
      } else {
        const responsePayload = await response.json().catch(() => null);
        setError(responsePayload?.error || 'Failed to update seafarer');
      }
    } catch (submitError) {
      console.error('Error:', submitError);
      setError(submitError instanceof Error ? submitError.message : 'Error updating seafarer');
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
      <div className="section-stack">
        <div className="surface-card px-6 py-12 text-center text-sm text-slate-600">Loading seafarer record...</div>
      </div>
    );
  }

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Seafarer Profile"
        title="Edit seafarer record"
        subtitle="Maintain core biodata, contact information, and standard issue measurements without changing downstream workflow records."
        helperLinks={[
          { href: '/crewing/seafarers', label: 'Seafarer Register' },
          { href: `/crewing/seafarers/${id}/biodata`, label: 'Biodata' },
          { href: `/crewing/seafarers/${id}/documents`, label: 'Documents' },
        ]}
        highlights={[
          { label: 'Record Type', value: 'Master Profile', detail: 'This page controls the base seafarer profile used by all downstream desks.' },
          { label: 'Workflow Rule', value: 'Profile Only', detail: 'Operational workflow decisions remain outside this page.' },
        ]}
        actions={(
          <>
            <Button type="button" variant="secondary" size="sm" onClick={() => router.push('/crewing/seafarers')}>
              Back to Register
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => router.push(`/crewing/seafarers/${id}/biodata`)}>
              Open Biodata
            </Button>
          </>
        )}
      />

      <section className="surface-card space-y-6 p-6">
        <div className="grid gap-3 md:grid-cols-3">
          {SEAFARER_PROFILE_STEPS.map((step) => (
            <div key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">{step.title}</p>
              <p className="mt-2 text-sm text-slate-600">{step.detail}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/80 px-4 py-4 text-sm text-slate-700">
            Keep this page for profile maintenance only. Joining preparation, document validity, and assignment decisions remain in their operational boards.
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            Mandatory field:
            <span className="ml-1 font-semibold text-slate-900">Full legal name</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          ) : null}

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Personal Identity</h2>
              <p className="mt-1 text-sm text-slate-600">Maintain the official name, birthplace, nationality, and present desk status.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <Input
                id="fullName"
                name="fullName"
                label="Full Name"
                required
                value={formData.fullName}
                onChange={handleChange}
                wrapperClassName="md:col-span-2"
              />
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
              <Input
                id="placeOfBirth"
                name="placeOfBirth"
                label="Place of Birth"
                placeholder="City, Country"
                value={formData.placeOfBirth}
                onChange={handleChange}
              />
              <Input
                id="nationality"
                name="nationality"
                label="Nationality"
                value={formData.nationality}
                onChange={handleChange}
              />
              <Input
                id="rank"
                name="rank"
                label="Rank / Position"
                placeholder="Chief Engineer"
                value={formData.rank}
                onChange={handleChange}
              />
              <Select
                id="crewStatus"
                name="crewStatus"
                label="Crew Status"
                value={formData.crewStatus}
                onChange={handleChange}
                options={crewStatusOptions}
              />
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Contact Details</h2>
              <p className="mt-1 text-sm text-slate-600">Keep the direct phone number and primary email usable for operational notices.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <Input
                id="phone"
                name="phone"
                label="Mobile Phone"
                type="tel"
                placeholder="+62 812 3456 7890"
                value={formData.phone}
                onChange={handleChange}
              />
              <Input
                id="email"
                name="email"
                label="Email Address"
                type="email"
                placeholder="crew.email@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Uniform And Safety Measurements</h2>
              <p className="mt-1 text-sm text-slate-600">Use these values for coverall issue, PPE planning, and vessel onboarding preparation.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              <Input
                id="heightCm"
                name="heightCm"
                label="Height (cm)"
                type="number"
                min="0"
                value={formData.heightCm}
                onChange={handleChange}
              />
              <Input
                id="weightKg"
                name="weightKg"
                label="Weight (kg)"
                type="number"
                min="0"
                value={formData.weightKg}
                onChange={handleChange}
              />
              <Input
                id="coverallSize"
                name="coverallSize"
                label="Coverall Size"
                placeholder="L, XL, 52"
                value={formData.coverallSize}
                onChange={handleChange}
              />
              <Input
                id="shoeSize"
                name="shoeSize"
                label="Safety Shoe Size"
                placeholder="42"
                value={formData.shoeSize}
                onChange={handleChange}
              />
              <Input
                id="waistSize"
                name="waistSize"
                label="Waist Size"
                placeholder="32"
                value={formData.waistSize}
                onChange={handleChange}
              />
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Emergency Contact</h2>
              <p className="mt-1 text-sm text-slate-600">Maintain the next-of-kin reference used by office staff during urgent communications.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              <Input
                id="emergencyContactName"
                name="emergencyContactName"
                label="Contact Name"
                placeholder="Closest family member"
                value={formData.emergencyContactName}
                onChange={handleChange}
                wrapperClassName="md:col-span-2"
              />
              <Input
                id="emergencyContactRelation"
                name="emergencyContactRelation"
                label="Relationship"
                placeholder="Spouse, Father"
                value={formData.emergencyContactRelation}
                onChange={handleChange}
              />
              <Input
                id="emergencyContactPhone"
                name="emergencyContactPhone"
                label="Contact Phone Number"
                type="tel"
                placeholder="+62 811 1234 5678"
                value={formData.emergencyContactPhone}
                onChange={handleChange}
                wrapperClassName="md:col-span-2"
              />
            </div>
          </section>

          <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-6">
            <Button type="submit" isLoading={loading}>
              {loading ? 'Updating Record' : 'Save Seafarer Changes'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
