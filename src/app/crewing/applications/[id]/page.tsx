'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface ApplicationFormData {
  appliedRank: string;
  status: string;
}

interface Application {
  id: number;
  seafarerId: number;
  appliedRank: string | null;
  status: string;
  seafarer: { fullName: string };
}

export default function EditApplicationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState<ApplicationFormData>({
    appliedRank: '',
    status: 'PENDING',
  });
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setError(null);
        const response = await fetch(`/api/applications/${id}`);
        if (response.ok) {
          const data: Application = await response.json();
          setApplication(data);
          setFormData({
            appliedRank: data.appliedRank || '',
            status: data.status,
          });
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          setError(`Failed to fetch application: ${errorData.error || response.statusText}`);
          setTimeout(() => router.push('/crewing/applications'), 2000);
        }
      } catch (error) {
        console.error('Error:', error);
        setError(`Error fetching application: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setFetchLoading(false);
      }
    };

    if (id) {
      fetchApplication();
    }
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/crewing/applications');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setError(`Failed to update: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setError(`Error updating application: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  if (fetchLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg border border-gray-300 p-8">
          <div className="text-center">Loading application...</div>
        </div>
      </div>
    );
  }

  if (error && !application) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-300 rounded-lg p-6">
          <h2 className="text-lg font-bold text-red-800 mb-2">Error</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <p className="text-sm text-red-600">Redirecting to applications list...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-6">
          <h2 className="text-lg font-bold text-yellow-800">Application not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg border border-gray-300 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Application</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <p className="text-gray-700 mb-4">
          Seafarer: <span className="font-medium">{application.seafarer.fullName}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="appliedRank" className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
              Applied Rank
            </label>
            <input
              type="text"
              id="appliedRank"
              name="appliedRank"
              value={formData.appliedRank}
              onChange={handleChange}
              placeholder="e.g., Captain, Chief Engineer, etc."
              className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Application'}
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