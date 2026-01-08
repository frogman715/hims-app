"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

interface Assignment {
  id: number;
  rank: string | null;
  signOnDate: string | null;
  signOffPlan: string | null;
  signOffDate: string | null;
  status: string;
  seafarer: {
    fullName: string;
  };
  vessel: {
    name: string;
  };
  principal: {
    name: string;
  };
}

export default function Assignments() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/assignments");
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      } else if (response.status === 401) {
        router.push("/auth/signin");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch assignments");
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch assignments");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session) {
      fetchAssignments();
    }
  }, [session, fetchAssignments]);

  if (status === "loading" || loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Assignments</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => fetchAssignments()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
            <button
              onClick={() => router.push("/crewing")}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
            >
              Back to Crewing
            </button>
          </div>
          <p className="text-sm text-gray-800">Manage crew assignments and contracts</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-extrabold text-gray-900">Assignment List</h2>
            <button
              onClick={() => router.push("/crewing/assignments/new")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Add New Assignment
            </button>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {assignments.map((assignment) => (
                <li key={assignment.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-green-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-green-700">
                              {assignment.seafarer.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {assignment.seafarer.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {assignment.rank} • {assignment.vessel.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Principal: {assignment.principal.name}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-500">
                          <div className={`inline-flex items-center px-4.5 py-0.5 rounded-full text-xs font-medium ${
                            assignment.status === 'ONBOARD'
                              ? 'bg-green-100 text-green-800'
                              : assignment.status === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {assignment.status}
                          </div>
                          {assignment.signOnDate && (
                            <div className="mt-1">
                              Sign-on: {new Date(assignment.signOnDate).toLocaleDateString()}
                            </div>
                          )}
                          {assignment.signOffPlan && (
                            <div className="mt-1">
                              Sign-off plan: {new Date(assignment.signOffPlan).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => router.push(`/crewing/assignments/${assignment.id}`)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          <button className="text-gray-700 hover:text-gray-900">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
              {assignments.length === 0 && (
                <li>
                  <div className="px-4 py-8 text-center text-gray-500">
                    No assignments found. Create your first assignment to get started.
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