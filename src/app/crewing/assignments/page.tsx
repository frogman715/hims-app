"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import { canAccessOfficePath } from "@/lib/office-access";
import { normalizeToUserRoles } from "@/lib/type-guards";

interface Assignment {
  id: string;
  rank: string | null;
  startDate: string;
  endDate: string | null;
  status: string;
  crew: {
    fullName: string;
    nationality: string | null;
  };
  vessel: {
    name: string;
  };
  principal: {
    name: string;
  } | null;
}

export default function AssignmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const userRoles = normalizeToUserRoles(session?.user?.roles ?? session?.user?.role);
  const isSystemAdmin = session?.user?.isSystemAdmin === true;
  const canManageAssignments = canAccessOfficePath("/api/assignments", userRoles, isSystemAdmin, "POST");
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredAssignments = useMemo(
    () =>
      assignments.filter((assignment) => {
        const matchesStatus =
          statusFilter === "ALL" ? true : assignment.status.toUpperCase() === statusFilter;
        if (!matchesStatus) {
          return false;
        }

        if (normalizedQuery.length === 0) {
          return true;
        }

        const searchable = [
          assignment.crew.fullName,
          assignment.rank ?? "",
          assignment.vessel.name,
          assignment.principal?.name ?? "",
          assignment.crew.nationality ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(normalizedQuery);
      }),
    [assignments, normalizedQuery, statusFilter]
  );

  const fetchAssignments = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/assignments");

      if (response.ok) {
        const data = await response.json();
        setAssignments(Array.isArray(data) ? data : []);
      } else if (response.status === 401) {
        router.push("/auth/signin");
      } else {
        const errorData = await response.json().catch(() => null);
        setError(errorData?.error || "Failed to fetch assignments");
      }
    } catch (fetchError) {
      console.error("Error fetching assignments:", fetchError);
      setError(fetchError instanceof Error ? fetchError.message : "Failed to fetch assignments");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [router, session, status]);

  useEffect(() => {
    if (session) {
      fetchAssignments();
    }
  }, [fetchAssignments, session]);

  if (status === "loading" || loading) {
    return <div className="p-6">Loading assignments...</div>;
  }

  if (!session) {
    return null;
  }

  const activeAssignments = assignments.filter((assignment) =>
    ["ACTIVE", "ONBOARD", "PLANNED", "ASSIGNED"].includes(assignment.status.toUpperCase())
  ).length;
  const completedAssignments = assignments.filter(
    (assignment) => assignment.status.toUpperCase() === "COMPLETED"
  ).length;
  const onboardingAssignments = assignments.filter(
    (assignment) => assignment.status.toUpperCase() === "ONBOARD"
  ).length;

  const formatStatusLabel = (status: string) => {
    if (status === "ONBOARD") return "Onboard";
    if (status === "COMPLETED") return "Completed";
    if (status === "ACTIVE") return "Active";
    if (status === "ASSIGNED") return "Assigned";
    if (status === "PLANNED") return "Planned";
    if (status === "CANCELLED") return "Cancelled";
    return status;
  };

  const getStatusClassName = (status: string) => {
    if (status === "ONBOARD") return "bg-emerald-100 text-emerald-800";
    if (status === "COMPLETED") return "bg-sky-100 text-sky-800";
    if (status === "CANCELLED") return "bg-rose-100 text-rose-800";
    if (status === "ACTIVE" || status === "ASSIGNED") return "bg-amber-100 text-amber-800";
    return "bg-slate-100 text-slate-700";
  };

  const getNextAction = (assignment: Assignment) => {
    const status = assignment.status.toUpperCase();
    if (status === "ONBOARD") return "Confirm handover and close the movement once deployment is complete.";
    if (status === "COMPLETED") return "Record is complete. Re-open only if the movement plan changes.";
    if (status === "CANCELLED") return "Movement cancelled. Keep this record only for history and audit trail.";
    if (assignment.endDate) return "Monitor the planned sign-off date and update the status after movement.";
    return "Complete the movement timeline and onboard status after pickup is confirmed.";
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">GA / Driver Desk</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">Transport Assignment</h1>
              <p className="mt-2 text-sm text-slate-700">
                Track crew pickup, vessel assignment, and movement status for dispatch logistics.
              </p>
            </div>
            <button
              onClick={() => router.push("/crewing")}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 p-5">
            <p className="text-sm font-semibold text-sky-900">How to use this page</p>
            <p className="mt-1 text-sm text-sky-800">
              {canManageAssignments
                ? "Use this page only for transport and deployment logistics. Contract approval and pre-departure preparation remain with Operations."
                : "This role can review transport and deployment logistics. Assignment creation and updates remain with GA / Driver."}
            </p>
          </div>

          {error ? (
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
          ) : (
            <>
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Total assignment records</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{assignments.length}</p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                  <p className="text-sm text-emerald-700">Active / onboard logistics</p>
                  <p className="mt-2 text-3xl font-bold text-emerald-900">{activeAssignments}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Completed movements</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{completedAssignments}</p>
                </div>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Currently onboard</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{onboardingAssignments}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
                  <p className="text-sm font-semibold text-slate-700">Desk focus</p>
                  <p className="mt-2 text-sm text-slate-600">
                    Keep assignment timing accurate, confirm pickup and embarkation, then close completed movements so the logistics queue stays clean.
                  </p>
                </div>
              </div>

              <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">Assignment List</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Open a record to update timing, transport notes, and onboard status.
                  </p>
                </div>
                {canManageAssignments ? (
                  <button
                    onClick={() => router.push("/crewing/assignments/new")}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Create Assignment
                  </button>
                ) : (
                  <span className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600">
                    View Only
                  </span>
                )}
              </div>

              <div className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr,220px]">
                <div>
                  <label htmlFor="assignment-search" className="block text-sm font-semibold text-slate-900">
                    Search crew, vessel, principal, or rank
                  </label>
                  <input
                    id="assignment-search"
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Type at least one keyword"
                    className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="status-filter" className="block text-sm font-semibold text-slate-900">
                    Filter by status
                  </label>
                  <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">All statuses</option>
                    <option value="PLANNED">Planned</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ONBOARD">Onboard</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <ul className="divide-y divide-gray-200">
                  {filteredAssignments.map((assignment) => (
                    <li key={assignment.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-green-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-green-700">
                                  {assignment.crew.fullName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {assignment.crew.fullName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {[assignment.rank, assignment.vessel.name, assignment.crew.nationality].filter(Boolean).join(" • ")}
                              </div>
                              <div className="text-sm text-gray-500">
                                Principal: {assignment.principal?.name ?? "Not assigned"}
                              </div>
                              <div className="mt-2 text-sm font-medium text-slate-700">
                                {getNextAction(assignment)}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-3 xl:items-end">
                            <div className="text-sm text-gray-500">
                              <div className={`inline-flex items-center rounded-full px-4 py-1 text-xs font-medium ${getStatusClassName(assignment.status.toUpperCase())}`}>
                                {formatStatusLabel(assignment.status.toUpperCase())}
                              </div>
                              <div className="mt-1">
                                Sign on: {new Date(assignment.startDate).toLocaleDateString("en-GB")}
                              </div>
                              {assignment.endDate ? (
                                <div className="mt-1">
                                  Planned sign off: {new Date(assignment.endDate).toLocaleDateString("en-GB")}
                                </div>
                              ) : null}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => router.push(`/crewing/assignments/${assignment.id}`)}
                                className="rounded-full border border-indigo-300 px-4 py-2 text-sm font-semibold text-indigo-700 hover:border-indigo-500 hover:text-indigo-900"
                              >
                                Open Assignment
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                  {filteredAssignments.length === 0 && (
                    <li>
                      <div className="px-4 py-10 text-center text-gray-500">
                        <p className="font-semibold text-slate-700">
                          {assignments.length === 0 ? "No vessel assignments yet." : "No assignment matches the current filter."}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {assignments.length === 0
                            ? "Create the first transport or vessel movement record to start tracking crew deployment."
                            : "Adjust the keyword or status filter to see more assignment records."}
                        </p>
                      </div>
                    </li>
                  )}
                </ul>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
