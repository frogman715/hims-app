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
  const [error, setError] = useState<string | null>(null);

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
      setError(null);
      // Fetch assignments with related data
      const assignmentsRes = await fetch('/api/assignments');
      if (!assignmentsRes.ok) {
        setError("Failed to fetch crew assignments");
        setLoading(false);
        return;
      }

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
             status: assignment.status === 'ONBOARD' || assignment.status === 'ACTIVE' ? 'ONBOARD' :
               assignment.status === 'COMPLETED' ? 'DEPARTED' :
               assignment.status === 'PLANNED' || assignment.status === 'ASSIGNED' ? 'PLANNED' : 'UNKNOWN',
          vesselName,
          vesselId,
          // Additional data from related models
          nationality: assignment.seafarer?.nationality || '',
          documents: assignment.seafarer?.documents || [],
          application: assignment.seafarer?.applications?.[0] || null
        };

        vesselData.crewMembers.push(crewMember);

        // Count active crew (currently onboard)
        if (assignment.status === 'ONBOARD' || assignment.status === 'ACTIVE') {
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
      setError("Failed to load crew list data. Please try again.");
      setVesselCrews([]);
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        <p className="text-sm font-semibold text-gray-700">Loading crew list…</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Crew List</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => fetchCrewList()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
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
                className="action-pill text-sm"
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
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Crew Member
              </Link>
            </div>
          </div>
          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : null}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="surface-card p-6">
            <div className="flex items-center">
              <div className="badge-soft bg-blue-500/10 text-blue-600 text-xl">
                🚢
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Total Vessels</p>
                <p className="text-2xl font-extrabold text-slate-900">{vesselCrews.length}</p>
              </div>
            </div>
          </div>

          <div className="surface-card p-6">
            <div className="flex items-center">
              <div className="badge-soft bg-emerald-500/10 text-emerald-600 text-xl">
                👥
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Active Crew</p>
                <p className="text-2xl font-extrabold text-slate-900">
                  {vesselCrews.reduce((sum, vessel) => sum + vessel.activeCrew, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="surface-card p-6">
            <div className="flex items-center">
              <div className="badge-soft bg-rose-500/10 text-rose-600 text-xl">
                📤
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Departed This Month</p>
                <p className="text-2xl font-extrabold text-slate-900">
                  {vesselCrews.reduce((sum, vessel) =>
                    sum + vessel.crewMembers.filter(member => member.status === 'DEPARTED').length, 0
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="surface-card p-6">
            <div className="flex items-center">
              <div className="badge-soft bg-amber-500/10 text-amber-600 text-xl">
                ⏰
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Avg. Contract</p>
                <p className="text-2xl font-extrabold text-slate-900">6.2m</p>
              </div>
            </div>
          </div>
        </div>

        {/* Vessel Crew Lists */}
        <div className="space-y-8">
          {vesselCrews.map((vessel) => (
            <div key={vessel.vesselId} className="surface-card overflow-hidden">
              {/* Vessel Header */}
              <div className="bg-gradient-to-r from-indigo-600/95 via-indigo-500/90 to-blue-600/90 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-white/90 rounded-lg flex items-center justify-center">
                      <span className="text-indigo-600 text-lg font-bold">🚢</span>
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
                      className="action-pill text-xs bg-white/90 border-white/60 text-indigo-700 hover:bg-white"
                    >
                      {selectedVessel === vessel.vesselId ? 'Hide Details' : 'Show Details'}
                    </button>
                    <Link
                      href={`/crewing/crew-list/vessel/${vessel.vesselId}`}
                      className="action-pill text-xs bg-white/90 border-white/60 text-indigo-700 hover:bg-white"
                    >
                      View Full List
                    </Link>
                  </div>
                </div>
              </div>

              {/* Crew Table */}
              {selectedVessel === vessel.vesselId && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Seafarer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Sign-On Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Sign-Off Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {vessel.crewMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center">
                                  <span className="text-sm font-medium text-white">
                                    {member.seafarerName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-slate-900">
                                  {member.seafarerName}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {member.rank}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {new Date(member.signOnDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
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
                              className="text-indigo-600 hover:text-indigo-700 mr-4"
                            >
                              View
                            </button>
                            <button
                              onClick={() => router.push(`/crewing/assignments/${member.id}`)}
                              className="text-emerald-600 hover:text-emerald-700"
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
                <div className="px-6 py-4 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-slate-700">
                        <span className="font-semibold text-slate-900">{vessel.activeCrew}</span> active crew members
                      </div>
                      <div className="text-sm text-slate-700">
                        <span className="font-semibold text-rose-600">
                          {vessel.crewMembers.filter(m => m.status === 'DEPARTED').length}
                        </span> departed this month
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedVessel(vessel.vesselId)}
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold"
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