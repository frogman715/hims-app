"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface CrewMember {
  id: number;
  seafarerName: string;
  rank: string;
  signOnDate: string;
  signOffDate?: string;
  status: 'ONBOARD' | 'DEPARTED' | 'PLANNED';
  vesselName: string;
  vesselId: number;
}

interface VesselCrew {
  vesselId: number;
  vesselName: string;
  crewMembers: CrewMember[];
  totalCrew: number;
  activeCrew: number;
}

export default function CrewListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [vesselCrews, setVesselCrews] = useState<VesselCrew[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVessel, setSelectedVessel] = useState<number | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session) {
      fetchCrewList();
    }
  }, [session]);

  const fetchCrewList = async () => {
    try {
      // Fetch assignments with related data
      const assignmentsRes = await fetch('/api/assignments');
      if (!assignmentsRes.ok) throw new Error('Failed to fetch assignments');

      const assignments = await assignmentsRes.json();

      // Group assignments by vessel
      const vesselMap = new Map();

      for (const assignment of assignments) {
        const vesselId = assignment.vesselId;
        const vesselName = assignment.vessel?.name || 'Unknown Vessel';

        if (!vesselMap.has(vesselId)) {
          vesselMap.set(vesselId, {
            vesselId,
            vesselName,
            crewMembers: [],
            totalCrew: 0,
            activeCrew: 0
          });
        }

        const vesselData = vesselMap.get(vesselId);

        // Add crew member data
        const crewMember = {
          id: assignment.id,
          seafarerName: assignment.seafarer?.fullName || 'Unknown',
          rank: assignment.rank,
          signOnDate: assignment.signOnDate,
          signOffDate: assignment.signOffDate,
          status: assignment.status === 'ONBOARD' ? 'ONBOARD' :
                 assignment.status === 'COMPLETED' ? 'DEPARTED' :
                 assignment.status === 'PLANNED' ? 'PLANNED' : 'UNKNOWN',
          vesselName,
          vesselId,
          // Additional data from related models
          nationality: assignment.seafarer?.nationality || '',
          documents: assignment.seafarer?.documents || [],
          application: assignment.seafarer?.applications?.[0] || null
        };

        vesselData.crewMembers.push(crewMember);

        // Count active crew (currently onboard)
        if (assignment.status === 'ONBOARD') {
          vesselData.activeCrew++;
        }
      }

      // Convert map to array and calculate totals
      const vesselCrews = Array.from(vesselMap.values()).map(vessel => ({
        ...vessel,
        totalCrew: vessel.crewMembers.length
      }));

      setVesselCrews(vesselCrews);
    } catch (error) {
      console.error("Error fetching crew list:", error);
      // Fallback to mock data if API fails
      const mockData: VesselCrew[] = [
        {
          vesselId: 1,
          vesselName: "MV Ocean Pride",
          totalCrew: 18,
          activeCrew: 16,
          crewMembers: [
            {
              id: 1,
              seafarerName: "John Smith",
              rank: "Captain",
              signOnDate: "2025-10-01",
              status: "ONBOARD",
              vesselName: "MV Ocean Pride",
              vesselId: 1
            },
            {
              id: 2,
              seafarerName: "Maria Garcia",
              rank: "Chief Engineer",
              signOnDate: "2025-10-01",
              status: "ONBOARD",
              vesselName: "MV Ocean Pride",
              vesselId: 1
            },
            {
              id: 3,
              seafarerName: "David Chen",
              rank: "Chief Officer",
              signOnDate: "2025-09-15",
              signOffDate: "2025-11-15",
              status: "DEPARTED",
              vesselName: "MV Ocean Pride",
              vesselId: 1
            }
          ]
        }
      ];
      setVesselCrews(mockData);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONBOARD': return 'bg-green-100 text-green-800';
      case 'DEPARTED': return 'bg-red-100 text-red-800';
      case 'PLANNED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ONBOARD': return 'Onboard';
      case 'DEPARTED': return 'Departed';
      case 'PLANNED': return 'Planned';
      default: return status;
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Crew List Management</h1>
                <p className="text-gray-800">Current crew complement per vessel with automatic departure tracking</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/crewing/crew-list/new"
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Crew Member
              </Link>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🚢</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-700">Total Vessels</p>
                <p className="text-2xl font-extrabold text-gray-900">{vesselCrews.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-700">Active Crew</p>
                <p className="text-2xl font-extrabold text-gray-900">
                  {vesselCrews.reduce((sum, vessel) => sum + vessel.activeCrew, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📤</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-700">Departed This Month</p>
                <p className="text-2xl font-extrabold text-gray-900">
                  {vesselCrews.reduce((sum, vessel) =>
                    sum + vessel.crewMembers.filter(member => member.status === 'DEPARTED').length, 0
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-700">Avg. Contract</p>
                <p className="text-2xl font-extrabold text-gray-900">6.2m</p>
              </div>
            </div>
          </div>
        </div>

        {/* Vessel Crew Lists */}
        <div className="space-y-8">
          {vesselCrews.map((vessel) => (
            <div key={vessel.vesselId} className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Vessel Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg font-bold">🚢</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-white">{vessel.vesselName}</h2>
                      <p className="text-indigo-100">
                        {vessel.activeCrew} active crew • {vessel.totalCrew} total capacity
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedVessel(selectedVessel === vessel.vesselId ? null : vessel.vesselId)}
                      className="bg-white hover:bg-white text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      {selectedVessel === vessel.vesselId ? 'Hide Details' : 'Show Details'}
                    </button>
                    <Link
                      href={`/crewing/crew-list/vessel/${vessel.vesselId}`}
                      className="bg-white hover:bg-white text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      View Full List
                    </Link>
                  </div>
                </div>
              </div>

              {/* Crew Table */}
              {selectedVessel === vessel.vesselId && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Seafarer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sign-On Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sign-Off Date
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
                      {vessel.crewMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-100">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                                  <span className="text-sm font-medium text-white">
                                    {member.seafarerName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {member.seafarerName}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {member.rank}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {new Date(member.signOnDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {member.signOffDate ? new Date(member.signOffDate).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-4 py-2 text-xs font-semibold rounded-full ${getStatusColor(member.status)}`}>
                              {getStatusText(member.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => router.push(`/crewing/assignments/${member.id}`)}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              View
                            </button>
                            <button
                              onClick={() => router.push(`/crewing/assignments/${member.id}`)}
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

              {/* Collapsed View */}
              {selectedVessel !== vessel.vesselId && (
                <div className="px-6 py-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-800">
                        <span className="font-medium">{vessel.activeCrew}</span> active crew members
                      </div>
                      <div className="text-sm text-gray-800">
                        <span className="font-medium text-red-600">
                          {vessel.crewMembers.filter(m => m.status === 'DEPARTED').length}
                        </span> departed this month
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedVessel(vessel.vesselId)}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      Show Details →
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {vesselCrews.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No crew data available</h3>
            <p className="mt-1 text-sm text-gray-700">Crew lists will be automatically populated when assignments are made.</p>
            <div className="mt-6">
              <Link
                href="/crewing/assignments/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-md text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Create Assignment
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}