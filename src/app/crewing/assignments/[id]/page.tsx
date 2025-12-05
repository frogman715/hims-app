'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface AssignmentFormData {
  rank: string;
  signOnDate: string;
  signOffPlan: string;
  signOffDate: string;
  status: string;
}

interface Assignment {
  id: number;
  seafarerId: number;
  vesselId: number;
  principalId: number;
  rank: string | null;
  signOnDate: string | null;
  signOffPlan: string | null;
  signOffDate: string | null;
  status: string;
  seafarer: { fullName: string };
  vessel: { name: string };
  principal: { name: string };
}

export default function EditAssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState<AssignmentFormData>({
    rank: '',
    signOnDate: '',
    signOffPlan: '',
    signOffDate: '',
    status: 'PLANNED',
  });
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const response = await fetch(`/api/assignments/${id}`);
        if (response.ok) {
          const data: Assignment = await response.json();
          setAssignment(data);
          setFormData({
            rank: data.rank || '',
            signOnDate: data.signOnDate ? data.signOnDate.split('T')[0] : '',
            signOffPlan: data.signOffPlan ? data.signOffPlan.split('T')[0] : '',
            signOffDate: data.signOffDate ? data.signOffDate.split('T')[0] : '',
            status: data.status,
          });
        } else {
          alert('Failed to fetch assignment');
          router.push('/crewing/assignments');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error fetching assignment');
      } finally {
        setFetchLoading(false);
      }
    };

    if (id) {
      fetchAssignment();
    }
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/assignments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          signOnDate: formData.signOnDate ? new Date(formData.signOnDate).toISOString() : null,
          signOffPlan: formData.signOffPlan ? new Date(formData.signOffPlan).toISOString() : null,
          signOffDate: formData.signOffDate ? new Date(formData.signOffDate).toISOString() : null,
        }),
      });

      if (response.ok) {
        router.push('/crewing/assignments');
      } else {
        alert('Failed to update assignment');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating assignment');
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
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Edit Assignment</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Contract Extension
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>To extend this crew member&apos;s contract, update the &quot;Planned Sign Off Date&quot; below.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="text-gray-600 mb-4">
          <p><strong>Seafarer:</strong> {assignment.seafarer.fullName}</p>
          <p><strong>Vessel:</strong> {assignment.vessel.name}</p>
          <p><strong>Principal:</strong> {assignment.principal.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="rank" className="block text-sm font-medium text-gray-700 mb-1">
              Rank
            </label>
            <input
              type="text"
              id="rank"
              name="rank"
              value={formData.rank}
              onChange={handleChange}
              placeholder="e.g., Captain, Chief Engineer, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PLANNED">Planned</option>
              <option value="ONBOARD">Onboard</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div>
            <label htmlFor="signOnDate" className="block text-sm font-medium text-gray-700 mb-1">
              Sign On Date
            </label>
            <input
              type="date"
              id="signOnDate"
              name="signOnDate"
              value={formData.signOnDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="signOffPlan" className="block text-sm font-medium text-gray-700 mb-1">
              Planned Sign Off Date
            </label>
            <input
              type="date"
              id="signOffPlan"
              name="signOffPlan"
              value={formData.signOffPlan}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const currentDate = new Date(formData.signOffPlan || new Date());
                  currentDate.setMonth(currentDate.getMonth() + 1);
                  setFormData(prev => ({
                    ...prev,
                    signOffPlan: currentDate.toISOString().split('T')[0]
                  }));
                }}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded"
              >
                +1 Month
              </button>
              <button
                type="button"
                onClick={() => {
                  const currentDate = new Date(formData.signOffPlan || new Date());
                  currentDate.setMonth(currentDate.getMonth() + 2);
                  setFormData(prev => ({
                    ...prev,
                    signOffPlan: currentDate.toISOString().split('T')[0]
                  }));
                }}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded"
              >
                +2 Months
              </button>
              <button
                type="button"
                onClick={() => {
                  const currentDate = new Date(formData.signOffPlan || new Date());
                  currentDate.setMonth(currentDate.getMonth() + 3);
                  setFormData(prev => ({
                    ...prev,
                    signOffPlan: currentDate.toISOString().split('T')[0]
                  }));
                }}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded"
              >
                +3 Months
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="signOffDate" className="block text-sm font-medium text-gray-700 mb-1">
              Actual Sign Off Date
            </label>
            <input
              type="date"
              id="signOffDate"
              name="signOffDate"
              value={formData.signOffDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Assignment'}
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