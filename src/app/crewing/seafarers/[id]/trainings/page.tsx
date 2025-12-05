'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Training {
  id: number;
  trainingType: string;
  provider: string | null;
  result: string | null;
  date: string | null;
  remarks: string | null;
}

interface Seafarer {
  id: number;
  fullName: string;
}

export default function SeafarerTrainingsPage() {
  const router = useRouter();
  const params = useParams();
  const seafarerId = params.id as string;

  const [seafarer, setSeafarer] = useState<Seafarer | null>(null);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSeafarer = useCallback(async () => {
    try {
      const response = await fetch(`/api/seafarers/${seafarerId}`);
      if (response.ok) {
        const data = await response.json();
        setSeafarer(data);
      }
    } catch (error) {
      console.error('Error fetching seafarer:', error);
    }
  }, [seafarerId]);

  const fetchTrainings = useCallback(async () => {
    try {
      const response = await fetch(`/api/seafarers/${seafarerId}/trainings`);
      if (response.ok) {
        const data = await response.json();
        setTrainings(data);
      }
    } catch (error) {
      console.error('Error fetching trainings:', error);
    } finally {
      setLoading(false);
    }
  }, [seafarerId]);

  useEffect(() => {
    if (seafarerId) {
      fetchSeafarer();
      fetchTrainings();
    }
  }, [seafarerId, fetchSeafarer, fetchTrainings]);

  const handleAddTraining = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch('/api/trainings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seafarerId: parseInt(seafarerId),
          trainingType: formData.get('trainingType'),
          provider: formData.get('provider'),
          result: formData.get('result'),
          date: formData.get('date') ? new Date(formData.get('date') as string).toISOString() : null,
          remarks: formData.get('remarks'),
        }),
      });

      if (response.ok) {
        fetchTrainings(); // Refresh the list
        e.currentTarget.reset(); // Clear the form
      } else {
        alert('Failed to add training');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error adding training');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!seafarer) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">Seafarer not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Seafarer
        </button>
        <h1 className="text-2xl font-bold">Training Records for {seafarer.fullName}</h1>
      </div>

      {/* Add Training Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add New Training</h2>
        <form onSubmit={handleAddTraining} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="trainingType" className="block text-sm font-medium text-gray-700 mb-1">
                Training Type *
              </label>
              <select
                id="trainingType"
                name="trainingType"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select training type</option>
                <option value="Basic Safety Training (BST)">Basic Safety Training (BST)</option>
                <option value="Proficiency in Survival Craft">Proficiency in Survival Craft</option>
                <option value="Advanced Fire Fighting">Advanced Fire Fighting</option>
                <option value="Medical First Aid">Medical First Aid</option>
                <option value="GMDSS">GMDSS</option>
                <option value="Radar Navigation">Radar Navigation</option>
                <option value="ARPA">ARPA</option>
                <option value="Bridge Resource Management">Bridge Resource Management</option>
                <option value="Engine Resource Management">Engine Resource Management</option>
                <option value="Security Awareness">Security Awareness</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-1">
                Training Provider
              </label>
              <input
                type="text"
                id="provider"
                name="provider"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Maritime Training Center"
              />
            </div>

            <div>
              <label htmlFor="result" className="block text-sm font-medium text-gray-700 mb-1">
                Result
              </label>
              <select
                id="result"
                name="result"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select result</option>
                <option value="Passed">Passed</option>
                <option value="Failed">Failed</option>
                <option value="In Progress">In Progress</option>
                <option value="Not Applicable">Not Applicable</option>
              </select>
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Training Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-1">
              Remarks
            </label>
            <textarea
              id="remarks"
              name="remarks"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Add Training'}
          </button>
        </form>
      </div>

      {/* Trainings List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Training History</h2>
        {trainings.length === 0 ? (
          <p className="text-gray-500">No training records found.</p>
        ) : (
          <div className="space-y-4">
            {trainings.map((training) => (
              <div key={training.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{training.trainingType}</h3>
                    {training.provider && (
                      <p className="text-sm text-gray-600">Provider: {training.provider}</p>
                    )}
                    <div className="flex gap-4 text-sm text-gray-500 mt-1">
                      {training.date && (
                        <span>Date: {new Date(training.date).toLocaleDateString()}</span>
                      )}
                      {training.result && (
                        <span className={`font-medium ${
                          training.result === 'Passed' ? 'text-green-600' :
                          training.result === 'Failed' ? 'text-red-600' :
                          'text-yellow-600'
                        }`}>
                          Result: {training.result}
                        </span>
                      )}
                    </div>
                    {training.remarks && (
                      <p className="text-sm text-gray-600 mt-1">{training.remarks}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      Edit
                    </button>
                    <button className="text-red-600 hover:text-red-800 text-sm">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}