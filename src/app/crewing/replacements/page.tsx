"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

interface CrewReplacement {
  id: number;
  seafarerName: string;
  currentVessel: string;
  replacementDate: string;
  reason: string;
  status: string;
  notes?: string;
}

interface SeafarerInfo {
  seafarerId: number;
  seafarerName: string;
  assignmentId: number;
  vesselName: string;
  contractExpiry: string;
}

function CrewReplacementsForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [replacements, setReplacements] = useState<CrewReplacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [seafarerInfo, setSeafarerInfo] = useState<SeafarerInfo | null>(null);
  const [action, setAction] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  useEffect(() => {
    // Check for query parameters from dashboard alert
    const seafarerId = searchParams.get('seafarerId');
    const assignmentId = searchParams.get('assignmentId');
    const actionParam = searchParams.get('action');

    if (seafarerId && actionParam) {
      setAction(actionParam);
      if (actionParam === 'extend' && assignmentId) {
        // Fetch seafarer and assignment info for contract extension
        fetchSeafarerInfo(parseInt(seafarerId), parseInt(assignmentId));
      }
    }

    fetchReplacements();
  }, [session, searchParams]);

  const fetchSeafarerInfo = async (seafarerId: number, assignmentId: number) => {
    try {
      // Fetch assignment details
      const response = await fetch(`/api/assignments/${assignmentId}`);
      if (response.ok) {
        const assignment = await response.json();
        setSeafarerInfo({
          seafarerId,
          seafarerName: assignment.seafarer?.fullName || 'Unknown Seafarer',
          assignmentId,
          vesselName: assignment.vessel?.name || 'Unknown Vessel',
          contractExpiry: assignment.signOffPlan
        });
      }
    } catch (error) {
      console.error("Error fetching seafarer info:", error);
    }
  };

  const fetchReplacements = async () => {
    try {
      // For now, using mock data since we don't have the API yet
      const mockData: CrewReplacement[] = [
        {
          id: 1,
          seafarerName: "John Smith",
          currentVessel: "MV Ocean Pride",
          replacementDate: "2025-12-15",
          reason: "Contract expiry",
          status: "PLANNED",
          notes: "Replacement seafarer identified"
        },
        {
          id: 2,
          seafarerName: "Maria Garcia",
          currentVessel: "MV Sea Explorer",
          replacementDate: "2025-11-30",
          reason: "Medical leave",
          status: "URGENT",
          notes: "Temporary replacement needed"
        }
      ];
      setReplacements(mockData);
    } catch (error) {
      console.error("Error fetching replacements:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/crewing"
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-2xl"
              >
                ← Back to Crewing
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Crew Replacement Planning</h1>
                <p className="text-gray-800">Plan and manage crew replacement schedules</p>
              </div>
            </div>
            <Link
              href="/crewing/replacements/new"
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Plan Replacement
            </Link>
          </div>
        </div>

        {/* Contract Action Section - Show when coming from dashboard alert */}
        {seafarerInfo && action && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-orange-400 p-6 rounded-xl shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-white text-xl font-extrabold">⚠️</span>
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">Contract Expiry Action Required</h2>
                  <p className="text-gray-700">Choose how to handle the contract expiry for {seafarerInfo.seafarerName}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 mb-4 shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Seafarer:</span>
                    <span className="ml-2 text-gray-900">{seafarerInfo.seafarerName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Vessel:</span>
                    <span className="ml-2 text-gray-900">{seafarerInfo.vesselName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Contract Expires:</span>
                    <span className="ml-2 text-gray-900">{new Date(seafarerInfo.contractExpiry).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Extend Existing Contract */}
                <Link
                  href={`/crewing/assignments/${seafarerInfo.assignmentId}`}
                  className="group bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 p-6 flex items-center justify-center"
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2 group-hover:animate-bounce">🔄</div>
                    <div className="text-lg font-bold mb-1">Extend Contract</div>
                    <div className="text-sm opacity-90">Perpanjang kontrak crew yang sudah ada</div>
                  </div>
                </Link>

                {/* Add New Replacement */}
                <Link
                  href={`/crewing/replacements/new?replaceSeafarerId=${seafarerInfo.seafarerId}&assignmentId=${seafarerInfo.assignmentId}`}
                  className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 p-6 flex items-center justify-center"
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2 group-hover:animate-bounce">👤</div>
                    <div className="text-lg font-bold mb-1">Add New Replacement</div>
                    <div className="text-sm opacity-90">Cari dan tambahkan crew pengganti baru</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Replacements List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {replacements.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No replacement plans</h3>
              <p className="mt-1 text-sm text-gray-700">Get started by planning your first crew replacement.</p>
              <div className="mt-6">
                <Link
                  href="/crewing/replacements/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-md text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Plan First Replacement
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Seafarer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Vessel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Replacement Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {replacements.map((replacement) => (
                    <tr key={replacement.id} className="hover:bg-gray-100">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {replacement.seafarerName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {replacement.currentVessel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(replacement.replacementDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {replacement.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-4 py-2 text-xs font-semibold rounded-full ${
                          replacement.status === 'PLANNED'
                            ? 'bg-blue-100 text-blue-800'
                            : replacement.status === 'URGENT'
                            ? 'bg-red-100 text-red-800'
                            : replacement.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {replacement.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => router.push(`/crewing/replacements/${replacement.id}`)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => router.push(`/crewing/replacements/${replacement.id}/edit`)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CrewReplacementsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CrewReplacementsForm />
    </Suspense>
  );
}