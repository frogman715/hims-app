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
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg border border-gray-300 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Add New Application</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="seafarerId" className="block text-sm font-semibold text-gray-900 mb-2">
              Seafarer *
            </label>
            <select
              id="seafarerId"
              name="seafarerId"
              required
              value={formData.seafarerId}
              onChange={handleChange}
              className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-blue-500"
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
            <label htmlFor="appliedRank" className="block text-sm font-semibold text-gray-900 mb-2">
              Applied Rank
            </label>
            <input
              type="text"
              id="appliedRank"
              name="appliedRank"
              value={formData.appliedRank}
              onChange={handleChange}
              placeholder="e.g., Captain, Chief Engineer, etc."
              className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-4 pt-6 border-t border-gray-300 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
            >
              {loading ? 'Creating...' : 'Create Application'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors shadow-md hover:shadow-lg"
            >
              Cancel
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}