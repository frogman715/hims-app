"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { canAccessOfficePath } from "@/lib/office-access";
import { normalizeToUserRoles } from "@/lib/type-guards";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";

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
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-slate-900" />
          <p className="mt-4 text-sm font-medium text-slate-600">Loading assignments...</p>
        </div>
      </div>
    );
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
  const assignmentsMissingPrincipal = assignments.filter((assignment) => !assignment.principal?.name).length;
  const assignmentsWithoutEndDate = assignments.filter(
    (assignment) =>
      ["PLANNED", "ASSIGNED", "ACTIVE"].includes(assignment.status.toUpperCase()) && !assignment.endDate
  ).length;
  const now = new Date();
  const endingSoonAssignments = assignments.filter((assignment) => {
    if (!assignment.endDate) {
      return false;
    }
    const endDate = new Date(assignment.endDate);
    if (Number.isNaN(endDate.getTime())) {
      return false;
    }
    const diffDays = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 14;
  }).length;

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

  const getAssignmentAlert = (assignment: Assignment) => {
    if (!assignment.principal?.name) {
      return {
        tone: "border-rose-200 bg-rose-50 text-rose-800",
        label: "Principal missing",
      };
    }

    if (["PLANNED", "ASSIGNED", "ACTIVE"].includes(assignment.status.toUpperCase()) && !assignment.endDate) {
      return {
        tone: "border-amber-200 bg-amber-50 text-amber-800",
        label: "Sign-off plan missing",
      };
    }

    if (assignment.endDate) {
      const endDate = new Date(assignment.endDate);
      const diffDays = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (!Number.isNaN(endDate.getTime()) && diffDays >= 0 && diffDays <= 14) {
        return {
          tone: "border-sky-200 bg-sky-50 text-sky-800",
          label: "Ending within 14 days",
        };
      }
    }

    return null;
  };

  const getAssignmentDeskAction = (assignment: Assignment) => {
    if (!assignment.principal?.name) {
      return {
        label: "Fix principal owner",
        href: `/crewing/assignments/${assignment.id}`,
        tone: "border-rose-300 text-rose-700 hover:border-rose-500 hover:text-rose-900",
      };
    }

    if (["PLANNED", "ASSIGNED", "ACTIVE"].includes(assignment.status.toUpperCase()) && !assignment.endDate) {
      return {
        label: "Set sign-off plan",
        href: `/crewing/assignments/${assignment.id}`,
        tone: "border-amber-300 text-amber-700 hover:border-amber-500 hover:text-amber-900",
      };
    }

    if (assignment.status.toUpperCase() === "ONBOARD") {
      return {
        label: "Close movement",
        href: `/crewing/assignments/${assignment.id}`,
        tone: "border-emerald-300 text-emerald-700 hover:border-emerald-500 hover:text-emerald-900",
      };
    }

    return {
      label: "Open assignment",
      href: `/crewing/assignments/${assignment.id}`,
      tone: "border-indigo-300 text-indigo-700 hover:border-indigo-500 hover:text-indigo-900",
    };
  };

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Assignment Operations"
        title="Crew assignment board"
        subtitle="Track active deployment, vessel linkage, principal ownership, and movement timing from one operational workspace."
        helperLinks={[
          { href: "/crewing/prepare-joining", label: "Prepare joining" },
          { href: "/crewing/crew-list", label: "Crew onboard" },
          { href: "/dashboard", label: "Dashboard" },
        ]}
        highlights={[
          { label: "Total Records", value: assignments.length.toLocaleString("id-ID"), detail: "All assignment entries currently registered." },
          { label: "Active / Onboard", value: activeAssignments.toLocaleString("id-ID"), detail: "Assignments still live in movement or onboard status." },
          { label: "Principal Missing", value: assignmentsMissingPrincipal.toLocaleString("id-ID"), detail: "Records that still need ownership correction." },
          { label: "Ending ≤ 14 Days", value: endingSoonAssignments.toLocaleString("id-ID"), detail: "Movements requiring near-term sign-off follow-up." },
        ]}
        actions={(
          <>
            {canManageAssignments ? (
              <Link href="/crewing/assignments/new" className="inline-flex items-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
                New assignment
              </Link>
            ) : null}
            <Button type="button" variant="secondary" onClick={() => router.push("/crewing")}>
              Back to crewing
            </Button>
          </>
        )}
      />
      <section className="surface-card border-sky-200 bg-sky-50/70 p-5">
        <p className="text-sm font-semibold text-sky-900">How to use this page</p>
        <p className="mt-1 text-sm text-sky-800">
          {canManageAssignments
            ? "Use this board to keep assignment owner, vessel, and movement dates accurate. Contract approval and pre-departure preparation remain in their own operational desks."
            : "This role can review assignment status and movement timing. Assignment creation and updates remain with the responsible office owner."}
        </p>
      </section>

      <section className="surface-card p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Operational Readiness</p>
            <p className="mt-2 text-sm text-slate-700">
              Focus first on assignments with missing principal ownership, no sign-off plan, or movements ending soon.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-800">
              Principal missing: {assignmentsMissingPrincipal}
            </span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
              No sign-off plan: {assignmentsWithoutEndDate}
            </span>
            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
              Ending soon: {endingSoonAssignments}
            </span>
          </div>
        </div>
      </section>

      {error ? (
        <section className="surface-card border-rose-200 bg-rose-50 p-6">
          <h3 className="text-lg font-semibold text-rose-900">Error Loading Assignments</h3>
          <p className="mt-2 text-sm text-rose-700">{error}</p>
          <div className="mt-4">
            <Button type="button" variant="danger" size="sm" onClick={() => fetchAssignments()}>
              Try Again
            </Button>
          </div>
        </section>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="surface-card p-5">
              <p className="text-sm text-slate-500">Total assignment records</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{assignments.length}</p>
            </div>
            <div className="surface-card border-emerald-200 bg-emerald-50 p-5">
              <p className="text-sm text-emerald-700">Active / onboard logistics</p>
              <p className="mt-2 text-3xl font-bold text-emerald-900">{activeAssignments}</p>
            </div>
            <div className="surface-card p-5">
              <p className="text-sm text-slate-500">Completed movements</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{completedAssignments}</p>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="surface-card p-5">
              <p className="text-sm text-slate-500">Currently onboard</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{onboardingAssignments}</p>
            </div>
            <div className="surface-card p-5 md:col-span-2">
              <p className="text-sm font-semibold text-slate-700">Desk focus</p>
              <p className="mt-2 text-sm text-slate-600">
                Keep assignment timing accurate, confirm pickup and embarkation, then close completed movements so the logistics queue stays clean.
              </p>
            </div>
          </section>

          <section className="surface-card p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Assignment register</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Open a record to update timing, transport notes, and onboard status.
                </p>
              </div>
              {canManageAssignments ? (
                <Link href="/crewing/assignments/new" className="action-pill text-sm">
                  Create assignment
                </Link>
              ) : (
                <span className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600">
                  View Only
                </span>
              )}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr,220px]">
              <Input
                id="assignment-search"
                type="text"
                label="Search crew, vessel, principal, or rank"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Type at least one keyword"
                helperText="Search by crew name, vessel, principal, nationality, or assignment rank."
              />
              <Select
                id="status-filter"
                label="Filter by status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                options={[
                  { value: "ALL", label: "All assignment statuses" },
                  { value: "PLANNED", label: "Planned" },
                  { value: "ASSIGNED", label: "Assigned" },
                  { value: "ACTIVE", label: "Active" },
                  { value: "ONBOARD", label: "Onboard" },
                  { value: "COMPLETED", label: "Completed" },
                  { value: "CANCELLED", label: "Cancelled" },
                ]}
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <ul className="divide-y divide-gray-200">
                  {filteredAssignments.map((assignment) => (
                    <li key={assignment.id}>
                      <div className="px-4 py-4 sm:px-6">
                        {(() => {
                          const deskAction = getAssignmentDeskAction(assignment);
                          return (
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
                              <div className="text-sm font-medium text-slate-900">
                                {assignment.crew.fullName}
                              </div>
                              <div className="text-sm text-slate-500">
                                {[assignment.rank, assignment.vessel.name, assignment.crew.nationality].filter(Boolean).join(" • ")}
                              </div>
                              <div className="text-sm text-slate-500">
                                Principal: {assignment.principal?.name ?? "Not assigned"}
                              </div>
                              {getAssignmentAlert(assignment) ? (
                                <div className="mt-2">
                                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getAssignmentAlert(assignment)?.tone}`}>
                                    {getAssignmentAlert(assignment)?.label}
                                  </span>
                                </div>
                              ) : null}
                              <div className="mt-2 text-sm font-medium text-slate-700">
                                {getNextAction(assignment)}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-3 xl:items-end">
                            <div className="text-sm text-slate-500">
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
                                onClick={() => router.push(deskAction.href)}
                                className={`rounded-full border px-4 py-2 text-sm font-semibold ${deskAction.tone}`}
                              >
                                {deskAction.label}
                              </button>
                              <button
                                onClick={() => router.push(`/crewing/prepare-joining`)}
                                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-500 hover:text-slate-900"
                              >
                                Prepare joining desk
                              </button>
                            </div>
                          </div>
                        </div>
                          );
                        })()}
                      </div>
                    </li>
                  ))}
                  {filteredAssignments.length === 0 && (
                    <li>
                      <div className="px-4 py-10 text-center text-slate-500">
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
          </section>
        </>
      )}
    </div>
  );
}
