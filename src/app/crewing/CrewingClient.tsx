"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { canAccessOfficePath, getPrimaryOfficeRole } from "@/lib/office-access";
import { hasExplicitRoleAccess, hasModuleAccess } from "@/lib/authorization";
import { ModuleName, PermissionLevel } from "@/lib/permissions";
import StatCard from "@/components/ui/StatCard";

interface OverviewCard {
  label: string;
  value: string;
  description: string;
  icon: string;
  accent: string;
}

interface QuickAction {
  href: string;
  label: string;
  description: string;
  icon: string;
  accent: string;
  module?: ModuleName;
  requiredLevel?: PermissionLevel;
  allowedRoles?: string[];
}

interface ModuleLink {
  title: string;
  description: string;
  href: string;
  icon: string;
  color: string;
  stats: string;
  module?: ModuleName;
  requiredLevel?: PermissionLevel;
  allowedRoles?: string[];
}

interface ModuleCategory {
  category: string;
  description: string;
  modules: ModuleLink[];
}

interface CrewSearchResult {
  id: string;
  fullName: string | null;
  rank: string | null;
  status: string | null;
  nationality?: string | null;
  passportNumber?: string | null;
  passportExpiry?: string | null;
  seamanBookNumber?: string | null;
  seamanBookExpiry?: string | null;
  phone?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  age?: number | null;
  latestAssignment: {
    rank: string | null;
    vesselName: string | null;
    principalName: string | null;
    status: string | null;
    startDate: string;
    endDate: string | null;
  } | null;
  latestApplication: {
    status: string | null;
    appliedAt: string;
    principalName: string | null;
    vesselType: string | null;
  } | null;
  expiringDocuments: Array<{
    id: string;
    docType: string;
    docNumber: string | null;
    expiryDate: string | null;
  }>;
}

interface CrewingOverviewStats {
  activeSeafarers: number;
  principalCount: number;
  vesselCount: number;
  activeAssignments: number;
  plannedAssignments: number;
  pendingApplications: number;
  applicationInProgress: number;
  scheduledInterviews: number;
  prepareJoiningInProgress: number;
  crewReplacementPending: number;
  documentsExpiringSoon: number;
  complianceRate: number | null;
  documentReceiptsTotal: number;
  trainingInProgress: number;
  signOffThisMonth: number;
  externalComplianceActive: number;
}

interface CrewingOverviewResponse {
  stats: CrewingOverviewStats;
  recentActivities: Array<{
    id: string;
    userName: string;
    action: string;
    entityType: string;
    entityId: string;
    createdAt: string;
  }>;
}

const crewStatusAccent = (status: string) => {
  switch (status) {
    case "ONBOARD":
      return "bg-emerald-500/10 text-emerald-600";
    case "STANDBY":
      return "bg-sky-500/10 text-sky-600";
    case "OFF_SIGNED":
      return "bg-slate-500/10 text-slate-600";
    case "BLOCKED":
      return "bg-rose-500/10 text-rose-600";
    default:
      return "bg-slate-500/10 text-slate-600";
  }
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDocumentLabel = (code: string) => code.replace(/_/g, " ");

const getCrewDisplayName = (result: Pick<CrewSearchResult, "id" | "fullName">) => {
  const normalized = result.fullName?.trim();
  return normalized && normalized.length > 0 ? normalized : `Crew ${result.id}`;
};

export default function CrewingClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CrewSearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [overviewData, setOverviewData] = useState<CrewingOverviewResponse | null>(null);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [isOverviewLoading, setIsOverviewLoading] = useState(false);
  const userRoles = getPrimaryOfficeRole(session?.user?.roles, session?.user?.role);
  const isSystemAdmin = session?.user?.isSystemAdmin === true;

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!session) {
      router.push("/auth/signin");
    }
  }, [router, session, status]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    let isMounted = true;

    const loadOverview = async () => {
      setIsOverviewLoading(true);
      try {
        const response = await fetch("/api/crewing/overview", { cache: "no-store" });
        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload) {
          throw new Error(payload?.error ?? "Failed to load overview data");
        }

        if (!isMounted) {
          return;
        }

        setOverviewData(payload as CrewingOverviewResponse);
        setOverviewError(null);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error("Failed to load crewing overview:", error);
        setOverviewError(error instanceof Error ? error.message : "Failed to load overview data");
      } finally {
        if (isMounted) {
          setIsOverviewLoading(false);
        }
      }
    };

    loadOverview();

    return () => {
      isMounted = false;
    };
  }, [status]);

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery.length === 0) {
      setSearchResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    if (trimmedQuery.length < 2) {
      setSearchResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    setIsSearching(true);
    setSearchError(null);

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/seafarers/search?q=${encodeURIComponent(trimmedQuery)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error ?? "Failed to search crew");
        }

        const payload = await response.json();
        setSearchResults(payload.results ?? []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error searching crew:", error);
          setSearchError(error instanceof Error ? error.message : "Failed to search crew");
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [searchQuery]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const stats = overviewData?.stats;

  const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return isOverviewLoading ? "..." : "N/A";
    }

    return value.toLocaleString("id-ID");
  };

  const formatStat = (value: number | null | undefined, suffix: string, fallback = "N/A") => {
    if (value === null || value === undefined) {
      return isOverviewLoading ? "..." : fallback;
    }

    return `${value.toLocaleString("id-ID")} ${suffix}`;
  };

  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return isOverviewLoading ? "..." : "N/A";
    }

    return `${value.toLocaleString("id-ID")}%`;
  };

  const complianceBadge = stats
    ? stats.complianceRate === null
      ? formatStat(stats.documentsExpiringSoon, "Expiring")
      : formatPercentage(stats.complianceRate)
    : formatStat(undefined, "Expiring");

  const lastUpdated = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const overviewCards: OverviewCard[] = [
    {
      label: "Active Seafarers",
      value: formatNumber(stats?.activeSeafarers),
      description: "Crew currently on assignment",
      icon: "👥",
      accent: "bg-blue-500/10 text-blue-600",
    },
    {
      label: "Active Fleet",
      value: formatNumber(stats?.vesselCount),
      description: "Master vessels marked active",
      icon: "🚢",
      accent: "bg-cyan-500/10 text-cyan-700",
    },
    {
      label: "Pending Applications",
      value: formatNumber(stats?.pendingApplications),
      description: "Awaiting screening",
      icon: "📝",
      accent: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: "Assignments In Progress",
      value: formatNumber(stats?.activeAssignments),
      description: "Deployment statuses being tracked",
      icon: "📋",
      accent: "bg-indigo-500/10 text-indigo-600",
    },
    {
      label: "Expiring Documents",
      value: formatNumber(stats?.documentsExpiringSoon),
      description: "Documents expiring within 14 months",
      icon: "📄",
      accent: "bg-amber-500/10 text-amber-600",
    },
  ];

  const quickActions: QuickAction[] = [
    {
      href: "/crewing/seafarers/new",
      label: "Add Seafarer",
      description: "Register new crew member",
      icon: "➕",
      accent: "bg-blue-500/10 text-blue-600",
      module: ModuleName.crew,
      allowedRoles: ["DIRECTOR", "CDMO"],
    },
    {
      href: "/crewing/readiness",
      label: "Readiness Hub",
      description: "Deployment readiness dashboard",
      icon: "📍",
      accent: "bg-cyan-500/10 text-cyan-700",
      module: ModuleName.crewing,
      allowedRoles: ["DIRECTOR", "OPERATIONAL"],
    },
    {
      href: "/crewing/prepare-joining",
      label: "Prepare Joining",
      description: "Departure checklist & travel",
      icon: "✈️",
      accent: "bg-teal-500/10 text-teal-600",
      module: ModuleName.crewing,
      allowedRoles: ["DIRECTOR", "OPERATIONAL"],
    },
    {
      href: "/crewing/readiness-board",
      label: "Readiness Follow-Up",
      description: "Operational follow-up queue after readiness review",
      icon: "🧭",
      accent: "bg-emerald-500/10 text-emerald-700",
      module: ModuleName.crewing,
      allowedRoles: ["DIRECTOR", "OPERATIONAL"],
    },
    {
      href: "/crewing/crew-list",
      label: "Crew List Onboard",
      description: "Live crew board per vessel",
      icon: "🚢",
      accent: "bg-indigo-500/10 text-indigo-600",
      module: ModuleName.assignments,
      allowedRoles: ["DIRECTOR", "OPERATIONAL", "GA_DRIVER"],
    },
    {
      href: "/crewing/documents?filter=expiring",
      label: "Expiring Documents",
      description: "Renew passport, medical & visa",
      icon: "📄",
      accent: "bg-amber-500/10 text-amber-600",
      module: ModuleName.documents,
      allowedRoles: ["DIRECTOR", "CDMO"],
    },
  ];

  const reminders = [
    "Ensure medical check results are valid for ≤ 12 months.",
    "Upload scan of passport and seaman book with high resolution.",
    "Confirm Letter Guarantee before ticket issuance.",
    "Update emergency contact before crew sign-on.",
  ];

  const moduleCategories: ModuleCategory[] = [
    {
      category: "📋 Recruitment & Selection",
      description: "From application to interview",
      modules: [
        {
          title: "Seafarers Database",
          description: "Master database of seafarer profiles & documents",
          href: "/crewing/seafarers",
          icon: "👨‍⚓",
          color: "from-blue-600 to-blue-700",
          stats: formatStat(stats?.activeSeafarers, "Active"),
          module: ModuleName.crew,
          allowedRoles: ["DIRECTOR", "CDMO"],
        },
        {
          title: "Applications",
          description: "Review & process new employment applications",
          href: "/crewing/applications",
          icon: "📝",
          color: "from-green-600 to-green-700",
          stats: formatStat(stats?.pendingApplications, "Pending"),
          module: ModuleName.crewing,
          allowedRoles: ["DIRECTOR", "CDMO"],
        },
        {
          title: "Application Workflow",
          description: "Track application stages: Applicant → Screening → Selection → Hired",
          href: "/crewing/workflow",
          icon: "🔄",
          color: "from-cyan-600 to-cyan-700",
          stats: formatStat(stats?.applicationInProgress, "In Progress"),
          module: ModuleName.crewing,
          allowedRoles: ["DIRECTOR", "CDMO"],
        },
        {
          title: "Interviews",
          description: "Review interview queue and recorded results",
          href: "/crewing/interviews",
          icon: "💼",
          color: "from-indigo-600 to-indigo-700",
          stats: formatStat(stats?.scheduledInterviews, "Scheduled"),
          module: ModuleName.crewing,
          allowedRoles: ["DIRECTOR", "CDMO"],
        },
      ],
    },
    {
      category: "🚢 Deployment & Operations",
      description: "Assignment to vessel operations",
      modules: [
        {
          title: "Vessel Assignment Desk",
          description: "Manage pickup, vessel movement, and onboard assignment status",
          href: "/crewing/assignments",
          icon: "📋",
          color: "from-purple-600 to-purple-700",
          stats: formatStat(stats?.activeAssignments, "Active"),
          module: ModuleName.assignments,
          allowedRoles: ["DIRECTOR", "GA_DRIVER"],
        },
        {
          title: "Readiness Hub",
          description: "Operational review desk for active crew follow-up after compliance monitoring",
          href: "/crewing/readiness",
          icon: "📍",
          color: "from-cyan-600 to-sky-700",
          stats: formatStat(stats?.prepareJoiningInProgress, "Review"),
          module: ModuleName.crewing,
          allowedRoles: ["DIRECTOR", "OPERATIONAL"],
        },
        {
          title: "Readiness Follow-Up",
          description: "Operational follow-up queue only; queued items are not auto-sent",
          href: "/crewing/readiness-board",
          icon: "🧭",
          color: "from-emerald-600 to-green-700",
          stats: formatStat(stats?.prepareJoiningInProgress, "Queued"),
          module: ModuleName.crewing,
          allowedRoles: ["DIRECTOR", "OPERATIONAL"],
        },
        {
          title: "Prepare Joining",
          description: "Pre-joining checklist, travel & Letter Guarantee",
          href: "/crewing/prepare-joining",
          icon: "✈️",
          color: "from-emerald-600 to-teal-700",
          stats: formatStat(stats?.prepareJoiningInProgress, "Ongoing"),
          module: ModuleName.crewing,
          allowedRoles: ["DIRECTOR", "OPERATIONAL"],
        },
        {
          title: "Crew List (Onboard)",
          description: "Live onboard crew complement per operating vessel",
          href: "/crewing/crew-list",
          icon: "🚢",
          color: "from-blue-700 to-indigo-700",
          stats: formatStat(stats?.vesselCount, "Active Fleet"),
          module: ModuleName.assignments,
          allowedRoles: ["DIRECTOR", "OPERATIONAL", "GA_DRIVER"],
        },
        {
          title: "Crew Replacements",
          description: "Crew change follow-up is managed from the readiness board and checklist review",
          href: "/crewing/readiness-board",
          icon: "🔄",
          color: "from-orange-600 to-red-600",
          stats: formatStat(stats?.crewReplacementPending, "Queued"),
          module: ModuleName.crewing,
          allowedRoles: ["DIRECTOR", "OPERATIONAL"],
        },
        {
          title: "Sign-Off Records",
          description: "Crew sign-off tracking and archives",
          href: "/crewing/sign-off",
          icon: "📤",
          color: "from-red-600 to-rose-700",
          stats: formatStat(stats?.signOffThisMonth, "This Month"),
          module: ModuleName.crewing,
          allowedRoles: ["DIRECTOR", "OPERATIONAL", "ACCOUNTING"],
        },
      ],
    },
    {
      category: "📄 Compliance & Documentation",
      description: "Certificates, forms & regulatory compliance",
      modules: [
        {
          title: "Documents & Certificates",
          description: "Track STCW certificates, passport, medical, visas",
          href: "/crewing/documents",
          icon: "📜",
          color: "from-amber-600 to-orange-700",
          stats: complianceBadge,
          module: ModuleName.documents,
          allowedRoles: ["DIRECTOR", "CDMO"],
        },
        {
          title: "Form Management",
          description: "Principal forms & approval workflow (Medical, Training, etc)",
          href: "/crewing/forms",
          icon: "📋",
          color: "from-fuchsia-600 to-pink-700",
          stats: "Live Workflow",
          module: ModuleName.crewing,
          allowedRoles: ["DIRECTOR", "OPERATIONAL"],
        },
      ],
    },
  ];

  const subject = {
    roles: session?.user?.roles,
    role: session?.user?.role,
    isSystemAdmin,
    permissionOverrides: (session?.user as Record<string, unknown> | undefined)?.permissionOverrides as never,
  };
  const visibleQuickActions = quickActions.filter((action) => {
    if (!hasExplicitRoleAccess(subject, action.allowedRoles)) {
      return false;
    }
    if (action.module) {
      return hasModuleAccess(subject, action.module, action.requiredLevel ?? PermissionLevel.VIEW_ACCESS);
    }
    return canAccessOfficePath(action.href.split("?")[0] || action.href, userRoles, isSystemAdmin);
  });
  const visibleModuleCategories = moduleCategories
    .map((category) => ({
      ...category,
      modules: category.modules.filter((module) => {
        if (!hasExplicitRoleAccess(subject, module.allowedRoles)) {
          return false;
        }
        if (module.module) {
          return hasModuleAccess(subject, module.module, module.requiredLevel ?? PermissionLevel.VIEW_ACCESS);
        }
        return canAccessOfficePath(module.href.split("?")[0] || module.href, userRoles, isSystemAdmin);
      }),
    }))
    .filter((category) => category.modules.length > 0);
  const canOpenCrewingReports = canAccessOfficePath("/crewing/reports", userRoles, isSystemAdmin);

  const sanitizedQuery = searchQuery.trim();
  const hasMinimumSearch = sanitizedQuery.length >= 2;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="page-shell px-6 py-10 space-y-8">
        <div className="surface-card p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <span className="badge-soft bg-emerald-500/15 text-emerald-600 text-2xl">⚓</span>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Crewing Department</h1>
                <p className="mt-2 max-w-3xl text-base text-slate-600">
                  CV review, crew biodata, document control, joining preparation, and active-fleet deployment work in one execution desk.
                </p>
                <p className="mt-2 text-sm font-medium text-emerald-700">
                  Start here for input, update, and processing work. Compliance pages are used separately for monitoring, escalation, and oversight.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                  <span className="action-pill text-xs">System Online</span>
                  <span className="action-pill text-xs">Last update: {lastUpdated}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <Link href="/dashboard" className="action-pill text-sm">
                ← Back to Dashboard
              </Link>
              {canOpenCrewingReports ? (
                <Link href="/crewing/reports" className="action-pill text-sm">
                  Crew Reports →
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {overviewError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {overviewError}
          </div>
        )}

        <div className="surface-card space-y-4 border border-emerald-100/60 bg-gradient-to-br from-emerald-50/40 via-white to-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                <span className="badge-soft bg-emerald-500/20 text-emerald-600">🔎</span>
                <span>Global Crew Search</span>
              </div>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Find crew faster</h2>
              <p className="text-sm text-slate-600">
                Search crew across databases by name, document, vessel, or contact.
              </p>
              <p className="text-xs text-slate-500">Example: Ricky passport B123, Chief Officer Lundqvist, or 0812...</p>
            </div>
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-slate-400">🔎</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Type a crew keyword"
              className="w-full rounded-xl border border-emerald-200 bg-white py-3 pl-10 pr-12 text-sm font-medium text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-slate-400 transition hover:text-slate-600"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <div className="space-y-3">
            {searchError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {searchError}
              </div>
            )}
            {!searchError && sanitizedQuery.length > 0 && sanitizedQuery.length < 2 && (
              <p className="text-xs text-slate-500">Type at least 2 characters to start searching.</p>
            )}
            {isSearching && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                <span>Searching crew...</span>
              </div>
            )}
            {!isSearching && !searchError && hasMinimumSearch && (
              searchResults.length > 0 ? (
                <div className="divide-y divide-emerald-100 overflow-hidden rounded-lg border border-emerald-100">
                  {searchResults.map((result) => {
                    const contactParts = [result.phone, result.email].filter(Boolean);
                    const metaSegments = [
                      result.rank,
                      result.nationality,
                      typeof result.age === "number" ? `${result.age} y/o` : null,
                      result.latestAssignment?.vesselName,
                    ].filter(Boolean);

                    return (
                      <Link
                        key={result.id}
                        href={`/crewing/seafarers/${result.id}/biodata`}
                        className="block bg-white px-4 py-4 transition hover:bg-emerald-50/60"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{getCrewDisplayName(result)}</p>
                            <p className="text-xs text-slate-500">{metaSegments.join(" • ") || "Crew review"}</p>
                          </div>
                          <span className={`badge-soft text-xs font-semibold ${crewStatusAccent(result.status ?? "")}`}>
                            {result.status ?? "UNKNOWN"}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                          <div>
                            <span className="font-semibold text-slate-700">Passport:</span>{" "}
                            {result.passportNumber
                              ? `${result.passportNumber} (${formatDate(result.passportExpiry)})`
                              : "—"}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-700">Seaman Book:</span>{" "}
                            {result.seamanBookNumber
                              ? `${result.seamanBookNumber} (${formatDate(result.seamanBookExpiry)})`
                              : "—"}
                          </div>
                          {result.latestAssignment && (
                            <div className="sm:col-span-2">
                              <span className="font-semibold text-slate-700">Assignment:</span>{" "}
                              {[
                                result.latestAssignment.rank,
                                result.latestAssignment.vesselName,
                                result.latestAssignment.principalName,
                              ]
                                .filter(Boolean)
                                .join(" • ") || "—"}
                              {result.latestAssignment.status ? ` (${result.latestAssignment.status})` : ""}
                            </div>
                          )}
                          {result.latestApplication && (
                            <div className="sm:col-span-2">
                              <span className="font-semibold text-slate-700">Application:</span>{" "}
                              {[
                                result.latestApplication.status,
                                result.latestApplication.principalName,
                                result.latestApplication.vesselType,
                                formatDate(result.latestApplication.appliedAt),
                              ]
                                .filter(Boolean)
                                .join(" • ")}
                            </div>
                          )}
                          {result.expiringDocuments.length > 0 && (
                            <div className="sm:col-span-2">
                              <span className="font-semibold text-slate-700">Expiring Docs:</span>{" "}
                              {result.expiringDocuments
                                .map((doc) =>
                                  `${formatDocumentLabel(doc.docType)}${
                                    doc.expiryDate ? ` (${formatDate(doc.expiryDate)})` : ""
                                  }`
                                )
                                .join(", ")}
                            </div>
                          )}
                          {contactParts.length > 0 && (
                            <div className="sm:col-span-2">
                              <span className="font-semibold text-slate-700">Contact:</span>{" "}
                              {contactParts.join(" • ")}
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No crew matches your search.</p>
              )
            )}
          </div>
        </div>

        <section className="rounded-3xl border border-cyan-100 bg-cyan-50/60 p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">Fleet Definitions</p>
              <p className="mt-1 text-sm text-slate-700">Use the same vessel language across crewing, dashboard, and compliance pages.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">Active Fleet = master vessel status ACTIVE</span>
              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-cyan-800">Operational Fleet = active fleet in deployment flow</span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-800">Onboard Fleet = crew currently onboard</span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {overviewCards.map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              description={card.description}
              tone={
                card.label === "Active Fleet"
                  ? "cyan"
                  : card.label === "Expiring Documents"
                    ? "amber"
                    : card.label === "Pending Applications"
                      ? "emerald"
                      : "slate"
              }
              icon={<span className={`badge-soft text-xl ${card.accent}`}>{card.icon}</span>}
              className="surface-card border border-slate-200/70"
            />
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="surface-card p-6">
            <div className="surface-card__header">
              <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
              <p className="mt-1 text-sm text-slate-600">Operational actions for daily crewing processing and record updates.</p>
            </div>
            <div className="space-y-3">
              {visibleQuickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 rounded-lg border border-slate-200/60 px-4 py-3 transition hover:border-emerald-400 hover:bg-emerald-50/40"
                >
                  <span className={`badge-soft text-lg ${action.accent}`}>{action.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{action.label}</p>
                    <p className="text-sm text-slate-600">{action.description}</p>
                  </div>
                  <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          <div className="surface-card p-6">
            <div className="surface-card__header">
              <h2 className="text-lg font-semibold text-slate-900">Crew Ops Reminders</h2>
              <p className="mt-1 text-sm text-slate-600">Short checklist before crew departure.</p>
            </div>
            <ul className="space-y-3">
              {reminders.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                  <span className="badge-soft bg-emerald-500/10 text-emerald-600 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="space-y-8">
          {visibleModuleCategories.map((category) => (
            <div key={category.category} className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{category.category}</h2>
                  <p className="text-sm text-slate-600">{category.description}</p>
                </div>
                <span className="action-pill text-xs">{category.modules.length} modules</span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {category.modules.map((module) => (
                  <Link key={module.href} href={module.href} className="surface-card group p-5 transition hover:-translate-y-1">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${module.color} text-white shadow-sm transition group-hover:scale-105`}>
                        <span className="text-lg" aria-hidden="true">
                          {module.icon}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-slate-900 transition group-hover:text-emerald-600">
                          {module.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600 line-clamp-2">{module.description}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="badge-soft bg-slate-100 text-slate-700 text-xs font-semibold">{module.stats}</span>
                      <svg className="h-4 w-4 text-slate-400 transition group-hover:text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
