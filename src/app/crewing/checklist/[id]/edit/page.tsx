"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface ChecklistItem {
  id: number;
  month: string;
  year: number;
  seafarerName: string;
  vessel: string;
  signOnDate?: string;
  signOffDate?: string;
  status: 'ON' | 'OFF';
  documentsComplete: boolean;
  medicalCheck: boolean;
  trainingComplete: boolean;
  notes?: string;
}

export default function EditChecklistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<ChecklistItem>>({
    seafarerName: '',
    vessel: '',
    signOnDate: '',
    signOffDate: '',
    status: 'ON',
    documentsComplete: false,
    medicalCheck: false,
    trainingComplete: false,
    notes: ''
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  const fetchChecklistItem = useCallback(async () => {
    try {
      // For now, using mock data since we don't have the API yet
      const mockData: ChecklistItem = {
        id: parseInt(params.id as string),
        month: "November",
        year: 2025,
        seafarerName: "John Smith",
        vessel: "MV Ocean Pride",
        signOnDate: "2025-11-01",
        status: "ON",
        documentsComplete: true,
        medicalCheck: true,
        trainingComplete: false,
        notes: "Training scheduled for next week"
      };
      setFormData(mockData);
    } catch (error) {
      console.error("Error fetching checklist item:", error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (session && params.id) {
      fetchChecklistItem();
    }
  }, [session, params.id, fetchChecklistItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // For now, just simulate saving
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push(`/crewing/checklist/${params.id}`);
    } catch (error) {
      console.error("Error saving checklist item:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof ChecklistItem, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

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
                href={`/crewing/checklist/${params.id}`}
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                ← Back to Details
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Checklist Entry</h1>
                <p className="text-gray-800">Update ON/OFF signers compliance information</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Period Information */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Period Information</h2>
            </div>

            <div>
              <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-2">
                Month *
              </label>
              <select
                id="month"
                value={formData.month || ''}
                onChange={(e) => handleInputChange('month', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                required
              >
                <option value="">Select Month</option>
                {months.map((month, index) => (
                  <option key={index + 1} value={month}>{month}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                Year *
              </label>
              <select
                id="year"
                value={formData.year || ''}
                onChange={(e) => handleInputChange('year', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                required
              >
                <option value="">Select Year</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

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
              <label htmlFor="vessel" className="block text-sm font-medium text-gray-700 mb-2">
                Vessel *
              </label>
              <input
                type="text"
                id="vessel"
                value={formData.vessel || ''}
                onChange={(e) => handleInputChange('vessel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                required
              />
            </div>

            {/* Sign-On/Off Information */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Sign-On/Off Information</h2>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                id="status"
                value={formData.status || 'ON'}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                required
              >
                <option value="ON">Sign-On</option>
                <option value="OFF">Sign-Off</option>
              </select>
            </div>

            <div></div> {/* Empty space for alignment */}

            <div>
              <label htmlFor="signOnDate" className="block text-sm font-medium text-gray-700 mb-2">
                Sign-On Date
              </label>
              <input
                type="date"
                id="signOnDate"
                value={formData.signOnDate || ''}
                onChange={(e) => handleInputChange('signOnDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="signOffDate" className="block text-sm font-medium text-gray-700 mb-2">
                Sign-Off Date
              </label>
              <input
                type="date"
                id="signOffDate"
                value={formData.signOffDate || ''}
                onChange={(e) => handleInputChange('signOffDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              />
            </div>

            {/* Compliance Checks */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Compliance Checks</h2>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center">
                <input
                  id="documentsComplete"
                  type="checkbox"
                  checked={formData.documentsComplete || false}
                  onChange={(e) => handleInputChange('documentsComplete', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="documentsComplete" className="ml-2 block text-sm text-gray-900">
                  Documents Complete
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="medicalCheck"
                  type="checkbox"
                  checked={formData.medicalCheck || false}
                  onChange={(e) => handleInputChange('medicalCheck', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="medicalCheck" className="ml-2 block text-sm text-gray-900">
                  Medical Check Passed
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="trainingComplete"
                  type="checkbox"
                  checked={formData.trainingComplete || false}
                  onChange={(e) => handleInputChange('trainingComplete', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="trainingComplete" className="ml-2 block text-sm text-gray-900">
                  Training Complete
                </label>
              </div>
            </div>

            {/* Notes */}
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
              href={`/crewing/checklist/${params.id}`}
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