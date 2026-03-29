"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { UserRole } from "@/lib/permissions";
import { normalizeToUserRoles } from "@/lib/type-guards";
import { canAccessOfficePath } from "@/lib/office-access";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";
import { Button } from "@/components/ui/Button";

interface WorkflowStats {
  draft: number;
  documentCheck: number;
  cvReady: number;
  submittedToDirector: number;
  directorApproved: number;
  sentToOwner: number;
  ownerApproved: number;
  ownerRejected: number;
  preJoining: number;
  readyToOnboard: number;
  onboarded: number;
}

export default function CrewManningWorkflow() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userRoles = normalizeToUserRoles(session?.user?.roles ?? session?.user?.role);
  const canManageApplications = userRoles.includes(UserRole.CDMO);
  const isSystemAdmin = session?.user?.isSystemAdmin === true;
  const canOpenPrepareJoining = canAccessOfficePath("/crewing/prepare-joining", userRoles, isSystemAdmin);
  const [stats, setStats] = useState<WorkflowStats>({
    draft: 0,
    documentCheck: 0,
    cvReady: 0,
    submittedToDirector: 0,
    directorApproved: 0,
    sentToOwner: 0,
    ownerApproved: 0,
    ownerRejected: 0,
    preJoining: 0,
    readyToOnboard: 0,
    onboarded: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    fetchStats();
  }, [session, status, router]);

  const fetchStats = async () => {
    try {
      setError(null);
      const res = await fetch("/api/crewing/workflow/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        setError("Failed to fetch workflow statistics");
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch workflow statistics");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="section-stack">
        <div className="surface-card px-6 py-12 text-center text-sm text-slate-600">Loading workflow control tower...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <div className="section-stack">
          <div className="surface-card rounded-2xl border border-rose-200 bg-rose-50 p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Workflow</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={() => fetchStats()} variant="danger" size="sm">
              Try Again
            </Button>
          </div>
      </div>
    );
  }

  const workflowSteps = [
    {
      id: 1,
      title: "Draft",
      description: "Application is opened and waiting for document processing",
      icon: "📝",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-100",
      borderColor: "border-blue-200",
      count: stats.draft,
      link: "/crewing/applications?stage=DRAFT",
      status: "DRAFT"
    },
    {
      id: 2,
      title: "Document Check",
      description: "Document role verifies certificates, expiry dates, and data completeness",
      icon: "🔍",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      count: stats.documentCheck,
      link: "/crewing/applications?stage=DOCUMENT_CHECK",
      status: "DOCUMENT_CHECK"
    },
    {
      id: 3,
      title: "CV Ready",
      description: "CV pack is complete and ready for director submission",
      icon: "🗂️",
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      count: stats.cvReady,
      link: "/crewing/applications?stage=CV_READY",
      status: "CV_READY"
    },
    {
      id: 4,
      title: "Submitted to Director",
      description: "Completed candidate package is waiting for director review",
      icon: "✅",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      count: stats.submittedToDirector,
      link: "/crewing/applications?stage=SUBMITTED_TO_DIRECTOR",
      status: "SUBMITTED_TO_DIRECTOR"
    },
    {
      id: 5,
      title: "Director Approved",
      description: "Director has approved the package and it is ready to release to the principal",
      icon: "📋",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      count: stats.directorApproved,
      link: "/crewing/applications?stage=DIRECTOR_APPROVED",
      status: "DIRECTOR_APPROVED"
    },
    {
      id: 6,
      title: "Sent to Principal",
      description: "Principal review is pending in the principal portal",
      icon: "💼",
      color: "from-cyan-500 to-cyan-600",
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-200",
      count: stats.sentToOwner,
      link: "/crewing/applications?stage=SENT_TO_OWNER",
      status: "SENT_TO_OWNER"
    },
    {
      id: 7,
      title: "Principal Approved",
      description: "Principal accepted the nomination and the case is ready to hand over to Operations",
      icon: "🤝",
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      count: stats.ownerApproved,
      link: "/crewing/applications?stage=OWNER_APPROVED",
      status: "OWNER_APPROVED"
    },
    {
      id: 8,
      title: "Pre-Joining",
      description: "Principal-approved cases are active in the operational mobilization board",
      icon: "🚢",
      color: "from-teal-500 to-teal-600",
      bgColor: "bg-teal-50",
      borderColor: "border-teal-200",
      count: stats.preJoining,
      link: "/crewing/prepare-joining?status=PENDING",
      status: "PRE_JOINING"
    },
    {
      id: 9,
      title: "Ready to Onboard",
      description: "Operational checklist is complete and crew is cleared for release",
      icon: "🟢",
      color: "from-cyan-500 to-cyan-600",
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-200",
      count: stats.readyToOnboard,
      link: "/crewing/prepare-joining?status=READY",
      status: "READY_TO_ONBOARD"
    },
    {
      id: 10,
      title: "Onboarded",
      description: "Crew movement is completed and the operational handoff is finished",
      icon: "🚢",
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      count: stats.onboarded,
      link: "/crewing/prepare-joining?status=DISPATCHED",
      status: "ONBOARDED"
    },
    {
      id: 11,
      title: "Principal Rejected",
      description: "Rejected by principal and kept for traceability",
      icon: "❌",
      color: "from-rose-500 to-rose-600",
      bgColor: "bg-rose-50",
      borderColor: "border-rose-200",
      count: stats.ownerRejected,
      link: "/crewing/applications?stage=OWNER_REJECTED",
      status: "OWNER_REJECTED"
    }
  ];

  const totalCases = workflowSteps.reduce((sum, step) => sum + step.count, 0);
  const pipelineOpen = stats.draft + stats.documentCheck + stats.cvReady + stats.submittedToDirector + stats.directorApproved + stats.sentToOwner;

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Crew Workflow"
        title="Crew pipeline workflow"
        subtitle="Track nomination flow from document intake to principal decision, operational mobilization, and onboard release from one linear control tower."
        helperLinks={[
          { href: "/crewing/applications", label: "Applications" },
          { href: "/crewing/prepare-joining", label: "Prepare joining" },
          { href: "/dashboard", label: "Dashboard" },
        ]}
        highlights={[
          { label: "Total Cases", value: totalCases.toLocaleString("id-ID"), detail: "All visible records across the live workflow." },
          { label: "Office Pipeline", value: pipelineOpen.toLocaleString("id-ID"), detail: "Cases still inside document, director, or principal review." },
          { label: "Operational Handoff", value: stats.preJoining.toLocaleString("id-ID"), detail: "Principal-approved cases already in mobilization." },
          { label: "Ready / Onboarded", value: (stats.readyToOnboard + stats.onboarded).toLocaleString("id-ID"), detail: "Cases nearing release or already completed." },
        ]}
        actions={(
          <Link href="/crewing" className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700">
            Back to crewing
          </Link>
        )}
      />

      <section className="surface-card space-y-8 p-6">
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5">
          <p className="text-sm font-semibold text-cyan-900">How to use this page</p>
          <p className="mt-1 text-sm text-cyan-800">
            Use this as the control tower for nomination flow. Principal-approved cases must stay visible in Principal Approved until Operations creates and advances the Prepare Joining process.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
          {workflowSteps
            .filter((step) =>
              ["PRE_JOINING", "READY_TO_ONBOARD", "ONBOARDED"].includes(step.status)
                ? canOpenPrepareJoining
                : true
            )
            .map((step) => (
            <Link
              key={step.id}
              href={step.link}
              className={`${step.bgColor} ${step.borderColor} group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
            >
              {/* Badge Number */}
              <div className="absolute top-4 right-4">
                <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} text-xl font-extrabold text-white shadow-lg`}>
                  {step.count}
                </span>
              </div>

              {/* Icon */}
              <div className="text-6xl mb-4">{step.icon}</div>

              {/* Step Number */}
              <div className={`mb-3 inline-block rounded-lg bg-gradient-to-br ${step.color} px-3 py-2 text-sm font-semibold text-white`}>
                Step {step.id}
              </div>

              {/* Title */}
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-gray-900 text-sm leading-relaxed">
                {step.description}
              </p>

              {/* Hover Arrow */}
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                  View Details
                  <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Flow Diagram */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-2xl font-semibold text-slate-900">
            Manning Process Flow
          </h2>
          
          <div className="flex items-center justify-between overflow-x-auto pb-4">
            {workflowSteps
              .filter((step) =>
                ["PRE_JOINING", "READY_TO_ONBOARD", "ONBOARDED"].includes(step.status)
                  ? canOpenPrepareJoining
                  : true
              )
              .map((step, index, filteredSteps) => (
              <div key={step.id} className="flex items-center">
                {/* Step Card */}
                <div className="flex flex-col items-center min-w-[140px]">
                  <div className={`mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} text-3xl shadow-lg`}>
                    {step.icon}
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-semibold text-gray-600 mb-1">
                      Step {step.id}
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      {step.title}
                    </div>
                    <div className={`mt-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${step.color} text-sm font-bold text-white`}>
                      {step.count}
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                {index < filteredSteps.length - 1 && (
                  <div className="mx-4 text-3xl text-gray-700">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {canManageApplications ? (
            <Link href="/crewing/applications/new" className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="text-4xl mb-3">➕</div>
              <h3 className="text-xl font-extrabold mb-2">New Application</h3>
              <p className="text-white text-sm opacity-95">
                Register a new application against an active seafarer and principal
              </p>
            </Link>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-700">
              <div className="text-4xl mb-3">📝</div>
              <h3 className="text-xl font-extrabold mb-2 text-slate-900">Application Entry</h3>
              <p className="text-sm">
                Review only. Nomination intake remains with Document Staff.
              </p>
            </div>
          )}

          <Link href="/crewing/applications" className="rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="text-4xl mb-3">🗂️</div>
            <h3 className="text-xl font-extrabold mb-2">Application Queue</h3>
            <p className="text-white text-sm opacity-95">
              Review live candidate flow, director approval, and owner decision status
            </p>
          </Link>

          <Link href="/crewing/reports" className="rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-xl font-extrabold mb-2">Reports</h3>
            <p className="text-white text-sm opacity-95">
              Open recruitment and manning reports
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
