'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ApplicationFormData {
  seafarerId: string;
  appliedRank: string;
}

interface Seafarer {
  id: number;
  fullName: string;
}

export default function NewApplicationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ApplicationFormData>({
    seafarerId: '',
    appliedRank: '',
  });
  const [seafarers, setSeafarers] = useState<Seafarer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSeafarers = async () => {
      try {
        const response = await fetch('/api/seafarers');
        if (response.ok) {
          const data = await response.json();
          setSeafarers(data);
        }
      } catch (error) {
        console.error('Error fetching seafarers:', error);
      }
    };

    fetchSeafarers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seafarerId: parseInt(formData.seafarerId),
          appliedRank: formData.appliedRank,
        }),
      });

      if (response.ok) {
        router.push('/crewing/applications');
      } else {
        alert('Failed to create application');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating application');
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
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Add New Application</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="seafarerId" className="block text-sm font-medium text-gray-700 mb-1">
              Seafarer *
            </label>
            <select
              id="seafarerId"
              name="seafarerId"
              required
              value={formData.seafarerId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label htmlFor="appliedRank" className="block text-sm font-medium text-gray-700 mb-1">
              Applied Rank
            </label>
            <input
              type="text"
              id="appliedRank"
              name="appliedRank"
              value={formData.appliedRank}
              onChange={handleChange}
              placeholder="e.g., Captain, Chief Engineer, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Application'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}