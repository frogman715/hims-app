"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

interface Seafarer {
  id: number;
  fullName: string;
  rank: string;
  nationality: string;
  experience: number;
  status: string;
  lastVessel?: string;
  availableDate?: string;
}

interface ReplacementInfo {
  replaceSeafarerId: number;
  replaceSeafarerName: string;
  assignmentId: number;
  vesselName: string;
  contractExpiry: string;
}

function NewReplacementForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [replacementInfo, setReplacementInfo] = useState<ReplacementInfo | null>(null);
  const [availableSeafarers, setAvailableSeafarers] = useState<Seafarer[]>([]);
  const [filteredSeafarers, setFilteredSeafarers] = useState<Seafarer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRank, setSelectedRank] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  useEffect(() => {
    const replaceSeafarerId = searchParams.get('replaceSeafarerId');
    const assignmentId = searchParams.get('assignmentId');

    if (replaceSeafarerId && assignmentId) {
      fetchReplacementInfo(parseInt(replaceSeafarerId), parseInt(assignmentId));
    }

    fetchAvailableSeafarers();
  }, [searchParams]);

  useEffect(() => {
    // Filter seafarers based on search term and rank
    let filtered = availableSeafarers;

    if (searchTerm) {
      filtered = filtered.filter(seafarer =>
        seafarer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seafarer.rank.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seafarer.nationality.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedRank) {
      filtered = filtered.filter(seafarer => seafarer.rank === selectedRank);
    }

    setFilteredSeafarers(filtered);
  }, [availableSeafarers, searchTerm, selectedRank]);

  const fetchReplacementInfo = async (replaceSeafarerId: number, assignmentId: number) => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`);
      if (response.ok) {
        const assignment = await response.json();
        setReplacementInfo({
          replaceSeafarerId,
          replaceSeafarerName: assignment.seafarer?.fullName || 'Unknown Seafarer',
          assignmentId,
          vesselName: assignment.vessel?.name || 'Unknown Vessel',
          contractExpiry: assignment.signOffPlan
        });
      }
    } catch (error) {
      console.error("Error fetching replacement info:", error);
    }
  };

  const fetchAvailableSeafarers = async () => {
    try {
      // For now, using mock data since we don't have the API yet
      const mockData: Seafarer[] = [
        {
          id: 1,
          fullName: "Ahmad Rahman",
          rank: "Chief Engineer",
          nationality: "Indonesia",
          experience: 8,
          status: "AVAILABLE",
          lastVessel: "MV Pacific Star",
          availableDate: "2025-11-15"
        },
        {
          id: 2,
          fullName: "Carlos Mendoza",
          rank: "Chief Officer",
          nationality: "Philippines",
          experience: 6,
          status: "AVAILABLE",
          lastVessel: "MV Ocean Pride",
          availableDate: "2025-11-20"
        },
        {
          id: 3,
          fullName: "David Chen",
          rank: "Chief Engineer",
          nationality: "China",
          experience: 10,
          status: "AVAILABLE",
          lastVessel: "MV Sea Explorer",
          availableDate: "2025-11-25"
        },
        {
          id: 4,
          fullName: "Elena Petrova",
          rank: "Second Engineer",
          nationality: "Russia",
          experience: 5,
          status: "AVAILABLE",
          lastVessel: "MV Atlantic Wave",
          availableDate: "2025-12-01"
        }
      ];
      setAvailableSeafarers(mockData);
      setFilteredSeafarers(mockData);
    } catch (error) {
      console.error("Error fetching available seafarers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSeafarer = (seafarer: Seafarer) => {
    if (replacementInfo) {
      // Navigate to create replacement plan with selected seafarer
      router.push(`/crewing/replacements/create?replaceSeafarerId=${replacementInfo.replaceSeafarerId}&newSeafarerId=${seafarer.id}&assignmentId=${replacementInfo.assignmentId}`);
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
                href="/crewing/replacements"
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                ← Back to Replacements
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Replacement Crew</h1>
                <p className="text-gray-800">Search and select a suitable replacement seafarer</p>
              </div>
            </div>
          </div>
        </div>

        {/* Replacement Context */}
        {replacementInfo && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 p-6 rounded-xl shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-white text-xl font-bold">🔄</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Replacement Needed</h2>
                  <p className="text-gray-700">Finding replacement for {replacementInfo.replaceSeafarerName} on {replacementInfo.vesselName}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Replacing:</span>
                    <span className="ml-2 text-gray-900">{replacementInfo.replaceSeafarerName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Vessel:</span>
                    <span className="ml-2 text-gray-900">{replacementInfo.vesselName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Contract Expires:</span>
                    <span className="ml-2 text-gray-900">{new Date(replacementInfo.contractExpiry).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Available Seafarers</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Name, rank, or nationality..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rank</label>
                <select
                  value={selectedRank}
                  onChange={(e) => setSelectedRank(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Ranks</option>
                  <option value="Chief Engineer">Chief Engineer</option>
                  <option value="Chief Officer">Chief Officer</option>
                  <option value="Second Engineer">Second Engineer</option>
                  <option value="Second Officer">Second Officer</option>
                  <option value="Third Engineer">Third Engineer</option>
                  <option value="Third Officer">Third Officer</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedRank("");
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Available Seafarers List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Available Seafarers ({filteredSeafarers.length})
            </h2>
          </div>

          {filteredSeafarers.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No seafarers found</h3>
              <p className="mt-1 text-sm text-gray-600">Try adjusting your search criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Seafarer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Experience
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nationality
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Available Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSeafarers.map((seafarer) => (
                    <tr key={seafarer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white text-sm font-bold">
                              {seafarer.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {seafarer.fullName}
                            </div>
                            {seafarer.lastVessel && (
                              <div className="text-sm text-gray-500">
                                Last: {seafarer.lastVessel}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {seafarer.rank}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {seafarer.experience} years
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {seafarer.nationality}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {seafarer.availableDate ? new Date(seafarer.availableDate).toLocaleDateString() : 'Immediate'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleSelectSeafarer(seafarer)}
                          className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        >
                          Select for Replacement
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

export default function NewReplacementPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewReplacementForm />
    </Suspense>
  );
}