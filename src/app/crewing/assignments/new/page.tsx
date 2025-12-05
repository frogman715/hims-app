'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AssignmentFormData {
  seafarerId: string;
  vesselId: string;
  principalId: string;
  rank: string;
  signOnDate: string;
  signOffPlan: string;
}

interface Seafarer {
  id: number;
  fullName: string;
}

interface Vessel {
  id: number;
  name: string;
  principal: { name: string };
}

interface Principal {
  id: number;
  name: string;
}

export default function NewAssignmentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<AssignmentFormData>({
    seafarerId: '',
    vesselId: '',
    principalId: '',
    rank: '',
    signOnDate: '',
    signOffPlan: '',
  });
  const [seafarers, setSeafarers] = useState<Seafarer[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [principals, setPrincipals] = useState<Principal[]>([]);
  const [loading, setLoading] = useState(false);

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
          setSeafarers(seafarersData);
        }

        if (vesselsRes.ok) {
          const vesselsData = await vesselsRes.json();
          setVessels(vesselsData);
        }

        if (principalsRes.ok) {
          const principalsData = await principalsRes.json();
          setPrincipals(principalsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

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
          seafarerId: parseInt(formData.seafarerId),
          vesselId: parseInt(formData.vesselId),
          principalId: parseInt(formData.principalId),
          rank: formData.rank,
          signOnDate: formData.signOnDate ? new Date(formData.signOnDate).toISOString() : null,
          signOffPlan: formData.signOffPlan ? new Date(formData.signOffPlan).toISOString() : null,
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
              {seafarers.map(seafarer => (
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
              {principals.map(principal => (
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
              {vessels.map(vessel => (
                <option key={vessel.id} value={vessel.id}>
                  {vessel.name} ({vessel.principal.name})
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
            <label htmlFor="signOnDate" className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
              Sign On Date
            </label>
            <input
              type="date"
              id="signOnDate"
              name="signOnDate"
              value={formData.signOnDate}
              onChange={handleChange}
              className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="signOffPlan" className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
              Planned Sign Off Date
            </label>
            <input
              type="date"
              id="signOffPlan"
              name="signOffPlan"
              value={formData.signOffPlan}
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