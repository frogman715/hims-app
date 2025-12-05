"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Seafarer {
  id: number;
  fullName: string;
  nationality: string;
  dateOfBirth: string | null;
  assignments: Array<{
    id: number;
    rank: string | null;
    status: string;
    vessel: { name: string };
  }>;
}

export default function Seafarers() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [seafarers, setSeafarers] = useState<Seafarer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session) {
      fetchSeafarers();
    }
  }, [session]);

  const fetchSeafarers = async () => {
    try {
      const response = await fetch("/api/seafarers");
      if (response.ok) {
        const data = await response.json();
        setSeafarers(data);
      }
    } catch (error) {
      console.error("Error fetching seafarers:", error);
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
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Seafarers</h1>
            <button
              onClick={() => router.push("/crewing")}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
            >
              Back to Crewing
            </button>
          </div>
          <p className="text-sm text-gray-800">Manage seafarer profiles and information (CR-01)</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-extrabold text-gray-900">Seafarer List</h2>
            <button
              onClick={() => router.push("/crewing/seafarers/new")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Add New Seafarer
            </button>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {seafarers.map((seafarer) => (
                <li key={seafarer.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-semibold text-gray-900">
                              {seafarer.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            <button
                              onClick={() => router.push(`/crewing/seafarers/${seafarer.id}/biodata`)}
                              className="hover:text-indigo-600 transition-colors"
                            >
                              {seafarer.fullName}
                            </button>
                          </div>
                          <div className="text-sm text-gray-500">
                            {seafarer.nationality}
                            {seafarer.dateOfBirth && (
                              <span className="ml-2">
                                • Born: {new Date(seafarer.dateOfBirth).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {seafarer.assignments.length > 0 && (
                          <div className="text-sm text-gray-500">
                            <div>Current Assignment:</div>
                            <div className="font-medium">
                              {seafarer.assignments[0].rank} on {seafarer.assignments[0].vessel.name}
                            </div>
                            <div className={`inline-flex items-center px-4.5 py-0.5 rounded-full text-xs font-medium ${
                              seafarer.assignments[0].status === 'ONBOARD'
                                ? 'bg-green-100 text-green-800'
                                : seafarer.assignments[0].status === 'PLANNED'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {seafarer.assignments[0].status}
                            </div>
                          </div>
                        )}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => router.push(`/crewing/seafarers/${seafarer.id}`)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => router.push(`/crewing/seafarers/${seafarer.id}/documents`)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Documents
                          </button>
                          <button
                            onClick={() => router.push(`/crewing/seafarers/${seafarer.id}/trainings`)}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Trainings
                          </button>
                          <button
                            onClick={() => router.push(`/crewing/seafarers/${seafarer.id}/medical`)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Medical
                          </button>
                          <button
                            onClick={() => router.push(`/crewing/seafarers/${seafarer.id}/biodata`)}
                            className="text-gray-700 hover:text-gray-900"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
              {seafarers.length === 0 && (
                <li>
                  <div className="px-4 py-8 text-center text-gray-500">
                    No seafarers found. Add your first seafarer to get started.
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}