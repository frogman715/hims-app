'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface AssignmentFormData {
  seafarerId: string;
  vesselId: string;
  principalId: string;
  rank: string;
  startDate: string;
  endDate: string;
}

interface Seafarer {
  id: string;
  fullName: string;
}

interface Vessel {
  id: string;
  name: string;
  principal?: {
    id: string;
    name: string;
  } | null;
  principalId?: string | null;
}

interface Principal {
  id: string;
  name: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function mapSeafarersResponse(data: unknown): Seafarer[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.reduce<Seafarer[]>((accumulator, item) => {
    if (!isRecord(item)) {
      return accumulator;
    }

    const { id, fullName } = item;
    if (typeof id === 'string' && typeof fullName === 'string') {
      accumulator.push({ id, fullName });
    }

    return accumulator;
  }, []);
}

function mapVesselsResponse(data: unknown): Vessel[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.reduce<Vessel[]>((accumulator, item) => {
    if (!isRecord(item)) {
      return accumulator;
    }

    const { id, name, principalId, principal } = item;
    if (typeof id !== 'string' || typeof name !== 'string') {
      return accumulator;
    }

    let normalizedPrincipal: Vessel['principal'] = null;
    if (isRecord(principal) && typeof principal.id === 'string' && typeof principal.name === 'string') {
      normalizedPrincipal = { id: principal.id, name: principal.name };
    }

    const normalizedPrincipalId =
      typeof principalId === 'string' ? principalId : normalizedPrincipal?.id ?? null;

    accumulator.push({
      id,
      name,
      principalId: normalizedPrincipalId,
      principal: normalizedPrincipal,
    });

    return accumulator;
  }, []);
}

function mapPrincipalsResponse(data: unknown): Principal[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.reduce<Principal[]>((accumulator, item) => {
    if (!isRecord(item)) {
      return accumulator;
    }

    const { id, name } = item;
    if (typeof id === 'string' && typeof name === 'string') {
      accumulator.push({ id, name });
    }

    return accumulator;
  }, []);
}

function AssignmentFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<AssignmentFormData>({
    seafarerId: '',
    vesselId: '',
    principalId: '',
    rank: '',
    startDate: '',
    endDate: '',
  });
  const [seafarers, setSeafarers] = useState<Seafarer[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [principals, setPrincipals] = useState<Principal[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resolvePrincipalName = (vessel: Vessel) => {
    if (vessel.principal?.name) {
      return vessel.principal.name;
    }
    const fallback = principals.find((principal) => principal.id === vessel.principalId);
    return fallback?.name;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadError(null);
        const [seafarersRes, vesselsRes, principalsRes] = await Promise.all([
          fetch('/api/seafarers'),
          fetch('/api/vessels'),
          fetch('/api/principals'),
        ]);

        if (seafarersRes.ok) {
          const seafarersData = await seafarersRes.json();
          setSeafarers(mapSeafarersResponse(seafarersData));
        }

        if (vesselsRes.ok) {
          const vesselsData = await vesselsRes.json();
          setVessels(mapVesselsResponse(vesselsData));
        }

        if (principalsRes.ok) {
          const principalsData = await principalsRes.json();
          setPrincipals(mapPrincipalsResponse(principalsData));
        }

        if (!seafarersRes.ok || !vesselsRes.ok || !principalsRes.ok) {
          setLoadError('Some reference data could not be loaded. Refresh the page before creating a new assignment.');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoadError('Assignment reference data could not be loaded. Please refresh the page and try again.');
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const preselectedSeafarer = searchParams.get('seafarerId');
    if (!preselectedSeafarer) {
      return;
    }

    setFormData((previous) => {
      if (previous.seafarerId) {
        return previous;
      }
      return {
        ...previous,
        seafarerId: preselectedSeafarer,
      };
    });
  }, [searchParams]);

  useEffect(() => {
    if (!formData.vesselId || formData.principalId) {
      return;
    }

    const selectedVessel = vessels.find((vessel) => vessel.id === formData.vesselId);
    if (selectedVessel?.principalId) {
      setFormData((previous) => ({
        ...previous,
        principalId: selectedVessel.principalId ?? '',
      }));
    }
  }, [formData.vesselId, formData.principalId, vessels]);

  const selectedSeafarer = seafarers.find((seafarer) => seafarer.id === formData.seafarerId);
  const selectedVessel = vessels.find((vessel) => vessel.id === formData.vesselId);
  const selectedPrincipal = principals.find((principal) => principal.id === formData.principalId);
  const filteredVessels = formData.principalId
    ? vessels.filter((vessel) => !vessel.principalId || vessel.principalId === formData.principalId)
    : vessels;
  const clientValidationMessage =
    !formData.seafarerId
      ? 'Select the crew member first.'
      : !formData.principalId
        ? 'Select the principal before saving the assignment.'
        : !formData.vesselId
          ? 'Select the vessel for this assignment.'
          : !formData.startDate
            ? 'Set the sign-on date before saving.'
            : formData.endDate && formData.endDate < formData.startDate
              ? 'Planned sign-off date cannot be earlier than the sign-on date.'
              : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clientValidationMessage) {
      setSubmitError(clientValidationMessage);
      return;
    }
    setLoading(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          crewId: formData.seafarerId,
          vesselId: formData.vesselId,
          principalId: formData.principalId,
          rank: formData.rank,
          startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
          endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        }),
      });

      if (response.ok) {
        router.push('/crewing/assignments');
      } else {
        const errorPayload = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
        setSubmitError(errorPayload?.message ?? errorPayload?.error ?? 'Failed to create assignment. Check the required fields and try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      setSubmitError('Assignment could not be created. Check the network connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      if (name === 'principalId') {
        return {
          ...prev,
          principalId: value,
          vesselId:
            prev.vesselId && vessels.some((vessel) => vessel.id === prev.vesselId && (!vessel.principalId || vessel.principalId === value))
              ? prev.vesselId
              : '',
        };
      }

      if (name === 'vesselId') {
        const nextVessel = vessels.find((vessel) => vessel.id === value);
        return {
          ...prev,
          vesselId: value,
          principalId: nextVessel?.principalId ?? prev.principalId,
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });
  };

  return (
    <div className="section-stack">
      <section className="surface-card p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Assignment Operations</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Create crew assignment</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Open a clean assignment record for crew deployment, vessel linkage, principal ownership, and movement timing.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={() => router.push('/crewing/assignments')}>
            Back to assignment list
          </Button>
        </div>
      </section>

      <section className="surface-card p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            Choose the crew member first, then principal and vessel. This desk is for assignment planning and movement timing, not contract approval or prepare-joining release.
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Save Gate</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {clientValidationMessage ?? 'Assignment input is complete enough to save.'}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Save only after crew, principal, vessel, and sign-on date are confirmed by the office desk.
          </p>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Selected Crew</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{selectedSeafarer?.fullName ?? 'Not selected yet'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Selected Principal</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{selectedPrincipal?.name ?? 'Not selected yet'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Selected Vessel</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{selectedVessel?.name ?? 'Not selected yet'}</p>
          </div>
        </div>

        {loadError ? (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {loadError}
          </div>
        ) : null}

        {submitError ? (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {submitError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Select
            id="seafarerId"
            name="seafarerId"
            label="Seafarer"
            required
            value={formData.seafarerId}
            onChange={handleChange}
            placeholder="Select a seafarer"
            options={seafarers.map((seafarer) => ({ value: seafarer.id, label: seafarer.fullName }))}
            helperText="Use the assigned crew member already approved for movement planning."
          />

          <Select
            id="principalId"
            name="principalId"
            label="Principal"
            required
            value={formData.principalId}
            onChange={handleChange}
            placeholder="Select a principal"
            options={principals.map((principal) => ({ value: principal.id, label: principal.name }))}
            helperText="Select the principal first if you want the vessel list to narrow to the correct owner desk."
          />

          <Select
            id="vesselId"
            name="vesselId"
            label="Vessel"
            required
            value={formData.vesselId}
            onChange={handleChange}
            placeholder="Select a vessel"
            options={filteredVessels.map((vessel) => ({
              value: vessel.id,
              label: `${vessel.name}${resolvePrincipalName(vessel) ? ` (${resolvePrincipalName(vessel)})` : ''}`,
            }))}
            helperText="The principal will auto-link when the selected vessel already has an owner in vessel master data."
          />

          <Input
            type="text"
            id="rank"
            name="rank"
            label="Rank"
            value={formData.rank}
            onChange={handleChange}
            placeholder="e.g., Captain, Chief Engineer, etc."
          />

          <Input
            type="date"
            id="startDate"
            name="startDate"
            label="Sign On Date"
            required
            value={formData.startDate}
            onChange={handleChange}
            helperText="Required. Use the planned sign-on date confirmed by the operations desk."
          />

          <Input
            type="date"
            id="endDate"
            name="endDate"
            label="Planned Sign Off Date"
            value={formData.endDate}
            onChange={handleChange}
            min={formData.startDate || undefined}
            helperText="Optional. Record the planned sign-off date when the movement window is already known."
          />

          <div className="flex gap-4 pt-4">
            <Button type="submit" isLoading={loading} disabled={Boolean(clientValidationMessage)}>
              Save assignment record
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Back without saving
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex min-h-[30vh] items-center justify-center">
      <div className="text-center text-gray-700">Loading assignment form...</div>
    </div>
  );
}

export default function NewAssignmentPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AssignmentFormContent />
    </Suspense>
  );
}
