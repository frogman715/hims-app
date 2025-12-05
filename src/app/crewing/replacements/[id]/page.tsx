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
  createdAt: string;
  updatedAt: string;
}

export default function ReplacementDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [replacement, setReplacement] = useState<ReplacementPlan | null>(null);
  const [loading, setLoading] = useState(true);

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
        notes: "Seafarer has completed 6 months onboard. Replacement has been identified and approved.",
        createdAt: "2025-11-20T10:00:00Z",
        updatedAt: "2025-11-25T14:30:00Z"
      };
      setReplacement(mockData);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (status === "loading" || loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  if (!replacement) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-.88-5.875-2.29m6.875-6.71l-3 3m0 0l3 3m-3-3h7.5" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Replacement not found</h3>
            <p className="mt-1 text-sm text-gray-600">The replacement plan you&apos;re looking for doesn&apos;t exist.</p>
            <div className="mt-6">
              <Link
                href="/crewing/replacements"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Back to Replacements
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/crewing/replacements"
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                ← Back to Replacements
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Replacement Plan Details</h1>
                <p className="text-gray-800">Crew replacement planning and tracking</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href={`/crewing/replacements/${replacement.id}/edit`}
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Plan
              </Link>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(replacement.status)}`}>
                  {replacement.status.replace('_', ' ')}
                </span>
                <span className="text-sm text-gray-600">
                  Created: {new Date(replacement.createdAt).toLocaleDateString()}
                </span>
                <span className="text-sm text-gray-600">
                  Updated: {new Date(replacement.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Replacement Details */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Replacement Details</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Seafarer</label>
                <div className="text-lg font-medium text-gray-900">{replacement.seafarerName}</div>
                <div className="text-sm text-gray-600">{replacement.rank}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Vessel</label>
                  <div className="text-sm text-gray-900">{replacement.currentVessel}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Replacement Vessel</label>
                  <div className="text-sm text-gray-900">{replacement.replacementVessel}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Planned Sign-Off</label>
                  <div className="text-sm text-gray-900">
                    {new Date(replacement.plannedSignOff).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Planned Sign-On</label>
                  <div className="text-sm text-gray-900">
                    {new Date(replacement.plannedSignOn).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                <div className="text-sm text-gray-900">{replacement.reason}</div>
              </div>

              {replacement.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {replacement.notes}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Timeline</h2>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">1</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Plan Created</p>
                  <p className="text-sm text-gray-600">
                    {new Date(replacement.createdAt).toLocaleDateString()} at {new Date(replacement.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-yellow-600">2</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Sign-Off Date</p>
                  <p className="text-sm text-gray-600">
                    {new Date(replacement.plannedSignOff).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-green-600">3</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Sign-On Date</p>
                  <p className="text-sm text-gray-600">
                    {new Date(replacement.plannedSignOn).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {replacement.status === 'COMPLETED' && (
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Completed</p>
                    <p className="text-sm text-gray-600">
                      Replacement successfully completed
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end space-x-4">
          <button
            onClick={() => router.push(`/crewing/replacements/${replacement.id}/edit`)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Edit Plan
          </button>
          <button
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Mark as Complete
          </button>
        </div>
      </div>
    </div>
  );
}