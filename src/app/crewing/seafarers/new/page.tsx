'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface SeafarerFormData {
  fullName: string;
  rank: string;
  nationality: string;
  dateOfBirth: string;
  placeOfBirth: string;
  crewStatus: string;
  phone: string;
  email: string;
  address: string;
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
  heightCm: string;
  weightKg: string;
  coverallSize: string;
  shoeSize: string;
  waistSize: string;
}

export default function NewSeafarerPage() {
  const router = useRouter();
  const formSteps = [
    {
      step: "Step 1",
      title: "Create Core Identity",
      detail: "Capture the master biodata only after recruitment is complete and hiring is approved.",
    },
    {
      step: "Step 2",
      title: "Add Contact Coverage",
      detail: "Record direct contact and emergency details before the profile enters readiness review.",
    },
    {
      step: "Step 3",
      title: "Save Operational Sizing",
      detail: "Keep measurement fields clean so PPE, logistics, and joining support do not need rework.",
    },
  ];
  const [formData, setFormData] = useState<SeafarerFormData>({
    fullName: '',
    rank: '',
    nationality: '',
    dateOfBirth: '',
    placeOfBirth: '',
    crewStatus: 'AVAILABLE',
    phone: '',
    email: '',
    address: '',
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactPhone: '',
    heightCm: '',
    weightKg: '',
    coverallSize: '',
    shoeSize: '',
    waistSize: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        rank: formData.rank.trim(),
        nationality: formData.nationality.trim(),
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
        placeOfBirth: formData.placeOfBirth || null,
        crewStatus: formData.crewStatus,
        phone: formData.phone || null,
        email: formData.email || null,
        address: formData.address || null,
        emergencyContactName: formData.emergencyContactName || null,
        emergencyContactRelation: formData.emergencyContactRelation || null,
        emergencyContactPhone: formData.emergencyContactPhone || null,
        heightCm: formData.heightCm ? Number(formData.heightCm) : null,
        weightKg: formData.weightKg ? Number(formData.weightKg) : null,
        coverallSize: formData.coverallSize || null,
        shoeSize: formData.shoeSize || null,
        waistSize: formData.waistSize || null,
      };

      const response = await fetch('/api/crewing/seafarers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || 'Failed to create seafarer');
      }

      router.push('/crewing/seafarers');
    } catch (submitError) {
      console.error('Error creating seafarer:', submitError);
      setError(submitError instanceof Error ? submitError.message : 'Error creating seafarer');
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

  return (
    <div className="section-stack">
      <section className="surface-card p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Create Crew Record</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Register hired seafarer</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use this form only after recruitment is completed and the candidate has officially entered the active crew pool.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={() => router.push('/crewing/seafarers')}>
            Back to seafarers
          </Button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {formSteps.map((item) => (
            <div key={item.step} className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{item.step}</p>
              <p className="mt-2 text-base font-semibold text-slate-950">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="surface-card p-8">
        <div className="mb-8 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
          <p className="text-sm font-semibold text-blue-900">Active crew boundary</p>
          <p className="mt-1 text-sm text-blue-800">
            Candidate records remain in Recruitment until hired. This form creates or maintains the active seafarer master only.
          </p>
        </div>

        <div className="mb-8 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
          Complete biodata, contact, and measurement fields here. Document upload, assignment planning, and joining workflow are handled in separate modules after this record is created.
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Biodata</h2>
              <p className="text-sm text-gray-600">Core identity details for the active seafarer master.</p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Input
                  name="fullName"
                  id="fullName"
                  label="Full Name"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  placeholder="Enter seafarer full name"
                />
              </div>
              <div>
                <Input
                  name="rank"
                  id="rank"
                  label="Rank"
                  value={formData.rank}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Chief Officer"
                />
              </div>
              <div>
                <Input
                  name="nationality"
                  id="nationality"
                  label="Nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Indonesia"
                />
              </div>
              <div>
                <Input
                  name="dateOfBirth"
                  id="dateOfBirth"
                  label="Date of Birth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Input
                  name="placeOfBirth"
                  id="placeOfBirth"
                  label="Place of Birth"
                  value={formData.placeOfBirth}
                  onChange={handleChange}
                  placeholder="City / Province"
                />
              </div>
              <div>
                <Select
                  id="crewStatus"
                  name="crewStatus"
                  label="Operational Status"
                  value={formData.crewStatus}
                  onChange={handleChange}
                  options={[
                    { value: 'AVAILABLE', label: 'AVAILABLE' },
                    { value: 'ON_BOARD', label: 'ON_BOARD' },
                    { value: 'STANDBY', label: 'STANDBY' },
                    { value: 'MEDICAL', label: 'MEDICAL' },
                    { value: 'DOCUMENT_ISSUE', label: 'DOCUMENT_ISSUE' },
                  ]}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Contact & Emergency</h2>
              <p className="text-sm text-gray-600">Primary contact details and next-of-kin information.</p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <Input
                  name="phone"
                  id="phone"
                  label="Phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Primary mobile number"
                />
              </div>
              <div>
                <Input
                  name="email"
                  id="email"
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email address"
                />
              </div>
              <div className="lg:col-span-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <Input
                  name="emergencyContactName"
                  id="emergencyContactName"
                  label="Emergency Contact Name"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  placeholder="Next-of-kin name"
                />
              </div>
              <div>
                <Input
                  name="emergencyContactRelation"
                  id="emergencyContactRelation"
                  label="Relationship"
                  value={formData.emergencyContactRelation}
                  onChange={handleChange}
                  placeholder="e.g. Spouse"
                />
              </div>
              <div>
                <Input
                  name="emergencyContactPhone"
                  id="emergencyContactPhone"
                  label="Emergency Phone"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                  placeholder="Emergency contact phone"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Measurements</h2>
              <p className="text-sm text-gray-600">Operational sizing data for PPE and deployment preparation.</p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <Input
                  name="heightCm"
                  id="heightCm"
                  label="Height (cm)"
                  type="number"
                  min="0"
                  value={formData.heightCm}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Input
                  name="weightKg"
                  id="weightKg"
                  label="Weight (kg)"
                  type="number"
                  min="0"
                  value={formData.weightKg}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Input
                  name="coverallSize"
                  id="coverallSize"
                  label="Coverall Size"
                  value={formData.coverallSize}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Input
                  name="shoeSize"
                  id="shoeSize"
                  label="Safety Shoe Size"
                  value={formData.shoeSize}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Input
                  name="waistSize"
                  id="waistSize"
                  label="Waist Size"
                  value={formData.waistSize}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          <div className="flex flex-wrap gap-4 border-t border-slate-200 pt-6">
            <Button type="submit" isLoading={loading}>
              Create seafarer
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push('/crewing/seafarers')}>
              Cancel creation
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
