"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
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

export default function VesselCrewListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const vesselId = parseInt(params.id as string);
  const [vessel, setVessel] = useState<VesselCrew | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  const fetchVesselCrew = useCallback(async () => {
    try {
      setError(null);
      // Fetch assignments for this specific vessel
      const assignmentsRes = await fetch(`/api/assignments?vesselId=${vesselId}`);
      if (!assignmentsRes.ok) throw new Error('Failed to fetch assignments');

      const assignments = await assignmentsRes.json();

      // Transform assignments to vessel crew format
      const crewMembers = assignments.map((assignment: {
        id: number;
        seafarer?: { fullName: string };
        rank: string;
        signOnDate: string;
        signOffDate?: string;
        status: string;
        vessel?: { name: string };
        vesselId: number;
      }) => ({
        id: assignment.id,
        seafarerName: assignment.seafarer?.fullName || 'Unknown',
        rank: assignment.rank,
        signOnDate: assignment.signOnDate,
        signOffDate: assignment.signOffDate,
         status: assignment.status === 'ONBOARD' || assignment.status === 'ACTIVE' ? 'ONBOARD' :
           assignment.status === 'COMPLETED' ? 'DEPARTED' :
           assignment.status === 'PLANNED' || assignment.status === 'ASSIGNED' ? 'PLANNED' : 'UNKNOWN',
        vesselName: assignment.vessel?.name || 'Unknown Vessel',
        vesselId: assignment.vesselId
      }));

      const vesselData = {
        vesselId: vesselId,
        vesselName: assignments[0]?.vessel?.name || 'Unknown Vessel',
        crewMembers: crewMembers,
        totalCrew: crewMembers.length,
        activeCrew: crewMembers.filter((m: { status: string }) => m.status === 'ONBOARD').length
      };

      setVessel(vesselData);
    } catch (error) {
      console.error("Error fetching vessel crew:", error);
      setError("Failed to load crew data for this vessel.");
      setVessel(null);
    } finally {
      setLoading(false);
    }
  }, [vesselId]);

  useEffect(() => {
    if (session && vesselId) {
      fetchVesselCrew();
    }
  }, [session, vesselId, fetchVesselCrew]);

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
        <p className="text-sm font-semibold text-gray-700">Loading crew vessel…</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!vessel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <Link
              href="/crewing/crew-list"
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-2xl"
            >
              ← Back to Crew List
            </Link>
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
                {error}
              </div>
            ) : null}
          </div>
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-.98-5.5-2.5M12 4.5C7.305 4.5 3.5 8.305 3.5 13S7.305 21.5 12 21.5 20.5 17.695 20.5 13 16.695 4.5 12 4.5z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Data vessel tidak ditemukan</h3>
            <p className="mt-1 text-sm text-gray-700">Pastikan vessel memiliki crew assignment aktif.</p>
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
                href="/crewing/crew-list"
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-2xl"
              >
                ← Back to Crew List
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{vessel.vesselName} - Crew List</h1>
                <p className="text-gray-800">Current crew complement with automatic departure tracking</p>
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
                <p className="text-sm font-medium text-gray-700">Vessel</p>
                <p className="text-2xl font-extrabold text-gray-900">{vessel.vesselName}</p>
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
                <p className="text-2xl font-extrabold text-gray-900">{vessel.activeCrew}</p>
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
                  {vessel.crewMembers.filter(member => member.status === 'DEPARTED').length}
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
                <p className="text-sm font-medium text-gray-700">Total Capacity</p>
                <p className="text-2xl font-extrabold text-gray-900">{vessel.totalCrew}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Crew Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
            <h2 className="text-xl font-extrabold text-white">Crew Members</h2>
          </div>
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
                        onClick={() => router.push(`/crewing/crew-list/${member.id}`)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        View
                      </button>
                      <button
                        onClick={() => router.push(`/crewing/crew-list/${member.id}/edit`)}
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
        </div>

        {/* Empty State */}
        {vessel.crewMembers.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No crew members assigned</h3>
            <p className="mt-1 text-sm text-gray-700">This vessel currently has no crew members assigned.</p>
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