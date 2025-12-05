"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface ReplacementPlan {
  id: number;
  seafarerName: string;
  currentVessel: string;
  replacementVessel: string;
  rank: string;
  plannedSignOff: string;
  plannedSignOn: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  reason: string;
  notes?: string;
}

export default function EditReplacementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<ReplacementPlan>>({
    seafarerName: '',
    currentVessel: '',
    replacementVessel: '',
    rank: '',
    plannedSignOff: '',
    plannedSignOn: '',
    status: 'PLANNED',
    reason: '',
    notes: ''
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  const fetchReplacement = useCallback(async () => {
    try {
      // For now, using mock data since we don't have the API yet
      const mockData: ReplacementPlan = {
        id: parseInt(params.id as string),
        seafarerName: "John Smith",
        currentVessel: "MV Ocean Pride",
        replacementVessel: "MV Pacific Star",
        rank: "Chief Engineer",
        plannedSignOff: "2025-12-15",
        plannedSignOn: "2025-12-20",
        status: "PLANNED",
        reason: "Scheduled rotation",
        notes: "Seafarer has completed 6 months onboard. Replacement has been identified and approved."
      };
      setFormData(mockData);
    } catch (error) {
      console.error("Error fetching replacement:", error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (session && params.id) {
      fetchReplacement();
    }
  }, [session, params.id, fetchReplacement]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // For now, just simulate saving
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push(`/crewing/replacements/${params.id}`);
    } catch (error) {
      console.error("Error saving replacement:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof ReplacementPlan, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (status === "loading" || loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href={`/crewing/replacements/${params.id}`}
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                ← Back to Details
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Replacement Plan</h1>
                <p className="text-gray-800">Update crew replacement planning details</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Seafarer Information */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Seafarer Information</h2>
            </div>

            <div>
              <label htmlFor="seafarerName" className="block text-sm font-medium text-gray-700 mb-2">
                Seafarer Name *
              </label>
              <input
                type="text"
                id="seafarerName"
                value={formData.seafarerName || ''}
                onChange={(e) => handleInputChange('seafarerName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                required
              />
            </div>

            <div>
              <label htmlFor="rank" className="block text-sm font-medium text-gray-700 mb-2">
                Rank/Position *
              </label>
              <select
                id="rank"
                value={formData.rank || ''}
                onChange={(e) => handleInputChange('rank', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                required
              >
                <option value="">Select Rank</option>
                <option value="Captain">Captain</option>
                <option value="Chief Officer">Chief Officer</option>
                <option value="Chief Engineer">Chief Engineer</option>
                <option value="Second Engineer">Second Engineer</option>
                <option value="Third Engineer">Third Engineer</option>
                <option value="Chief Mate">Chief Mate</option>
                <option value="Second Mate">Second Mate</option>
                <option value="Third Mate">Third Mate</option>
                <option value="Bosun">Bosun</option>
                <option value="Able Seaman">Able Seaman</option>
                <option value="Ordinary Seaman">Ordinary Seaman</option>
                <option value="Cook">Cook</option>
                <option value="Steward">Steward</option>
              </select>
            </div>

            {/* Vessel Information */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Vessel Information</h2>
            </div>

            <div>
              <label htmlFor="currentVessel" className="block text-sm font-medium text-gray-700 mb-2">
                Current Vessel *
              </label>
              <input
                type="text"
                id="currentVessel"
                value={formData.currentVessel || ''}
                onChange={(e) => handleInputChange('currentVessel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                required
              />
            </div>

            <div>
              <label htmlFor="replacementVessel" className="block text-sm font-medium text-gray-700 mb-2">
                Replacement Vessel *
              </label>
              <input
                type="text"
                id="replacementVessel"
                value={formData.replacementVessel || ''}
                onChange={(e) => handleInputChange('replacementVessel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                required
              />
            </div>

            {/* Schedule Information */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Schedule Information</h2>
            </div>

            <div>
              <label htmlFor="plannedSignOff" className="block text-sm font-medium text-gray-700 mb-2">
                Planned Sign-Off Date *
              </label>
              <input
                type="date"
                id="plannedSignOff"
                value={formData.plannedSignOff || ''}
                onChange={(e) => handleInputChange('plannedSignOff', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                required
              />
            </div>

            <div>
              <label htmlFor="plannedSignOn" className="block text-sm font-medium text-gray-700 mb-2">
                Planned Sign-On Date *
              </label>
              <input
                type="date"
                id="plannedSignOn"
                value={formData.plannedSignOn || ''}
                onChange={(e) => handleInputChange('plannedSignOn', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                required
              />
            </div>

            {/* Status and Reason */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Status & Details</h2>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                id="status"
                value={formData.status || 'PLANNED'}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                required
              >
                <option value="PLANNED">Planned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason *
              </label>
              <input
                type="text"
                id="reason"
                value={formData.reason || ''}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                placeholder="e.g., Scheduled rotation, Medical leave, etc."
                required
              />
            </div>

            <div className="lg:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                id="notes"
                rows={4}
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                placeholder="Any additional information or special requirements..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-end space-x-4">
            <Link
              href={`/crewing/replacements/${params.id}`}
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}