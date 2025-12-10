'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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
      } catch (error) {
        console.error('Error fetching data:', error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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
        alert('Failed to create assignment');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating assignment');
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

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg border border-gray-300 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Add New Assignment</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="seafarerId" className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
              Seafarer *
            </label>
            <select
              id="seafarerId"
              name="seafarerId"
              required
              value={formData.seafarerId}
              onChange={handleChange}
              className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a seafarer</option>
              {seafarers.map((seafarer) => (
                <option key={seafarer.id} value={seafarer.id}>
                  {seafarer.fullName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="principalId" className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
              Principal *
            </label>
            <select
              id="principalId"
              name="principalId"
              required
              value={formData.principalId}
              onChange={handleChange}
              className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a principal</option>
              {principals.map((principal) => (
                <option key={principal.id} value={principal.id}>
                  {principal.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="vesselId" className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
              Vessel *
            </label>
            <select
              id="vesselId"
              name="vesselId"
              required
              value={formData.vesselId}
              onChange={handleChange}
              className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a vessel</option>
              {vessels.map((vessel) => (
                <option key={vessel.id} value={vessel.id}>
                  {vessel.name}
                  {resolvePrincipalName(vessel) ? ` (${resolvePrincipalName(vessel)})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="rank" className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
              Rank
            </label>
            <input
              type="text"
              id="rank"
              name="rank"
              value={formData.rank}
              onChange={handleChange}
              placeholder="e.g., Captain, Chief Engineer, etc."
              className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
              Sign On Date
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
              Planned Sign Off Date
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Assignment'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-gray-600 text-white font-semibold px-8 py-3 rounded-lg shadow-md hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg border border-gray-300 p-8 text-center text-gray-700">
        Memuat formulir penugasan...
      </div>
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