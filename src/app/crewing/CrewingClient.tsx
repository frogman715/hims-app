"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CREWING_DOCUMENT_RECEIPTS_ROUTE } from "@/lib/routes";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

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
}

interface ModuleLink {
  title: string;
  description: string;
  href: string;
  icon: string;
  color: string;
  stats: string;
}

interface ModuleCategory {
  category: string;
  description: string;
  modules: ModuleLink[];
}

interface CrewSearchResult {
  id: string;
  fullName: string;
  rank: string;
  status: string;
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
    status: string;
    startDate: string;
    endDate: string | null;
  } | null;
  latestApplication: {
    status: string;
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
      label: "Pending Applications",
      value: formatNumber(stats?.pendingApplications),
      description: "Awaiting recruitment review",
      icon: "📝",
      accent: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: "Assignments In Progress",
      value: formatNumber(stats?.activeAssignments),
      description: "SEA & PKL contracts being tracked",
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
    },
    {
      href: "/crewing/prepare-joining",
      label: "Prepare Joining",
      description: "Departure checklist & travel",
      icon: "✈️",
      accent: "bg-teal-500/10 text-teal-600",
    },
    {
      href: "/crewing/crew-list",
      label: "Crew List Onboard",
      description: "Monitor crew per vessel",
      icon: "🚢",
      accent: "bg-indigo-500/10 text-indigo-600",
    },
    {
      href: CREWING_DOCUMENT_RECEIPTS_ROUTE,
      label: "Document Receipt",
      description: "Record document handover",
      icon: "📥",
      accent: "bg-emerald-500/10 text-emerald-600",
    },
    {
      href: "/crewing/documents?filter=expiring",
      label: "Expiring Documents",
      description: "Renew passport, medical & visa",
      icon: "📄",
      accent: "bg-amber-500/10 text-amber-600",
    },
  ];

  const reminders = [
    "Ensure medical check results are valid for ≤ 12 months.",
    "Upload scan of passport and seaman book with high resolution.",
    "Confirm Letter Guarantee before ticket issuance.",
    "Update emergency contact before crew sign-on.",,
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
        },
        {
          title: "Applications",
          description: "Review & process new employment applications",
          href: "/crewing/applications",
          icon: "📝",
          color: "from-green-600 to-green-700",
          stats: formatStat(stats?.pendingApplications, "Pending"),
        },
        {
          title: "Application Workflow",
          description: "Track application stages: Review → Interview → Approved",
          href: "/crewing/workflow",
          icon: "🔄",
          color: "from-cyan-600 to-cyan-700",
          stats: formatStat(stats?.applicationInProgress, "In Progress"),
        },
        {
          title: "Interviews",
          description: "Schedule & conduct crew interviews",
          href: "/crewing/interviews",
          icon: "💼",
          color: "from-indigo-600 to-indigo-700",
          stats: formatStat(stats?.scheduledInterviews, "Scheduled"),
        },
      ],
    },
    {
      category: "🚢 Deployment & Operations",
      description: "Assignment to vessel operations",
      modules: [
        {
          title: "Assignments & Contracts",
          description: "Manage crew-vessel assignments & contracts (SEA/PKL)",
          href: "/crewing/assignments",
          icon: "📋",
          color: "from-purple-600 to-purple-700",
          stats: formatStat(stats?.activeAssignments, "Active"),
        },
        {
          title: "Prepare Joining",
          description: "Pre-joining checklist, travel & Letter Guarantee",
          href: "/crewing/prepare-joining",
          icon: "✈️",
          color: "from-emerald-600 to-teal-700",
          stats: formatStat(stats?.prepareJoiningInProgress, "Ongoing"),
        },
        {
          title: "Crew List (Onboard)",
          description: "Current crew complement per vessel",
          href: "/crewing/crew-list",
          icon: "🚢",
          color: "from-blue-700 to-indigo-700",
          stats: formatStat(stats?.vesselCount, "Vessels"),
        },
        {
          title: "Crew Replacements",
          description: "Plan & manage crew changes (sign-on/sign-off)",
          href: "/crewing/replacements",
          icon: "🔄",
          color: "from-orange-600 to-red-600",
          stats: formatStat(stats?.crewReplacementPending, "Pending"),
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
        },
        {
          title: "Document Receipt",
          description: "Generate & archive crew document handover receipt",
          href: CREWING_DOCUMENT_RECEIPTS_ROUTE,
          icon: "📥",
          color: "from-emerald-600 to-teal-600",
          stats: formatStat(stats?.documentReceiptsTotal, "Records"),
        },
        {
          title: "Form Management",
          description: "Principal forms & approval workflow (Medical, Training, etc)",
          href: "/crewing/forms",
          icon: "📋",
          color: "from-fuchsia-600 to-pink-700",
          stats: "New!",
        },
        {
          title: "Training Records",
          description: "Training programs, orientations & certifications",
          href: "/crewing/training",
          icon: "🎓",
          color: "from-yellow-600 to-amber-700",
          stats: formatStat(stats?.trainingInProgress, "Active"),
        },
        {
          title: "Monthly Checklist",
          description: "ON/OFF signers report & compliance checklist",
          href: "/crewing/checklist",
          icon: "✅",
          color: "from-teal-600 to-cyan-700",
          stats: formatStat(stats?.signOffThisMonth, "This Month"),
        },
        {
          title: "External Compliance",
          description: "KOSMA, Dephub verification & Schengen visa",
          href: "/compliance/external",
          icon: "🌐",
          color: "from-indigo-600 to-purple-700",
          stats: formatStat(stats?.externalComplianceActive, "Active"),
        },
        {
          title: "SIUPPAK Reports",
          description: "Crew recruitment semester report for Transportation audit",
          href: "/compliance/siuppak",
          icon: "📊",
          color: "from-red-600 to-rose-700",
          stats: "Auto Generate",
        },
      ],
    },
  ];

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
                  Recruitment, assignment, and crew compliance operations in one calm and professional hub.
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
              <Link href="/crewing/reports" className="action-pill text-sm">
                Crew Reports →
              </Link>
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
              placeholder="Sign Inkan kata kunci kru"
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
              <p className="text-xs text-slate-500">Ketik minimal 2 karakter untuk mulai mencari.</p>
            )}
            {isSearching && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                <span>Mencari kru...</span>
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
                            <p className="text-sm font-semibold text-slate-900">{result.fullName}</p>
                            <p className="text-xs text-slate-500">{metaSegments.join(" • ")}</p>
                          </div>
                          <span className={`badge-soft text-xs font-semibold ${crewStatusAccent(result.status)}`}>
                            {result.status}
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
                <p className="text-sm text-slate-500">Tidak ada kru yang cocok dengan pencarian.</p>
              )
            )}
          </div>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {overviewCards.map((card) => (
            <div key={card.label} className="surface-card flex items-center justify-between gap-4 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">{card.value}</p>
                <p className="mt-1 text-sm text-slate-600">{card.description}</p>
              </div>
              <span className={`badge-soft text-xl ${card.accent}`} aria-hidden="true">
                {card.icon}
              </span>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="surface-card p-6">
            <div className="surface-card__header">
              <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
              <p className="mt-1 text-sm text-slate-600">Quick steps for daily crewing tasks.</p>
            </div>
            <div className="space-y-3">
              {quickActions.map((action) => (
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
          {moduleCategories.map((category) => (
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
