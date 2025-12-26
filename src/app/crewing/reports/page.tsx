"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface ApplicationStage {
  status: string;
  label: string;
  count: number;
  percentage: number;
}

interface PrepareJoiningStage {
  status: string;
  label: string;
  count: number;
}

interface DocumentComplianceSummary {
  total: number;
  compliant: number;
  expiringSoon: number;
  expired: number;
  complianceRate: number | null;
}

interface PrincipalDistributionItem {
  principalName: string;
  activeCrew: number;
}

interface UpcomingAssignmentItem {
  id: string;
  crewName: string;
  rank: string;
  vesselName: string;
  vesselType: string;
  principalName: string;
  startDate: string;
  status: string;
}

interface RecentActivityItem {
  id: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

interface CrewingReportSummary {
  stats: {
    totalApplications: number;
    interviewsScheduled: number;
    crewReady: number;
    documentsExpiringSoon: number;
    activeAssignments: number;
  };
  applicationFunnel: ApplicationStage[];
  prepareJoining: PrepareJoiningStage[];
  documentCompliance: DocumentComplianceSummary;
  principalDistribution: PrincipalDistributionItem[];
  upcomingAssignments: UpcomingAssignmentItem[];
  recentActivities: RecentActivityItem[];
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatDate(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "Date tidak diketahui";
  }
  return date.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(status: string) {
  const map: Record<string, string> = {
    PLANNED: "Planned",
    ASSIGNED: "Assigned",
    ACTIVE: "Active",
    ONBOARD: "Onboard",
    COMPLETED: "Completed",
  };
  return map[status] ?? status;
}

export default function CrewingReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [report, setReport] = useState<CrewingReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/crewing/reports/summary", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to load data laporan crewing");
        }
        const payload: CrewingReportSummary = await res.json();
        setReport(payload);
      } catch (err) {
        console.error("Error loading crewing report:", err);
        setError(err instanceof Error ? err.message : "Failed to load laporan");
        setReport(null);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [session, status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          <p className="text-sm font-semibold text-gray-700">Loading laporan crewing…</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.12'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 text-white/80 text-sm uppercase tracking-widest mb-3">
                <span className="inline-flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                Live Crewing Intelligence
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
                Crewing Performance Reports
              </h1>
              <p className="text-white/90 text-lg font-medium leading-relaxed">
                Comprehensive overview of recruitment pipeline, joining readiness, and document compliance to support operational decisions.
                untuk mendukung keputusan operasional.
              </p>
              {error ? (
                <div className="mt-5 inline-flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-400/60 px-6 py-3 text-sm font-semibold text-white">
                  ⚠️ {error}
                </div>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/crewing"
                className="group bg-white/95 hover:bg-white text-blue-900 px-5 py-4 rounded-2xl border border-white/40 shadow-lg hover:shadow-2xl transition transform hover:-translate-y-1"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-xl font-semibold">
                    ←
                  </div>
                  <div>
                    <p className="text-xs uppercase font-semibold text-blue-700">Navigasi</p>
                    <p className="text-sm font-semibold text-gray-900">Back to Crewing Module</p>
                  </div>
                </div>
              </Link>
              <Link
                href="/crewing/workflow"
                className="group bg-blue-900/40 hover:bg-blue-900/60 text-white px-5 py-4 rounded-2xl border border-white/30 shadow-lg hover:shadow-2xl transition transform hover:-translate-y-1"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 text-white flex items-center justify-center text-xl font-semibold">
                    ➝
                  </div>
                  <div>
                    <p className="text-xs uppercase font-semibold text-white/80">Pipeline</p>
                    <p className="text-sm font-semibold text-white">View manning flow</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {/* Summary Stats */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                label: "Total Applications",
                value: formatNumber(report?.stats.totalApplications),
                subtext: "All registered candidates",
              },
              {
                label: "Interviews Scheduled",
                value: formatNumber(report?.stats.interviewsScheduled),
                subtext: "Upcoming interviews",
              },
              {
                label: "Crew Ready",
                value: formatNumber(report?.stats.crewReady),
                subtext: "Ready to depart",
              },
              {
                label: "Docs Expiring ≤ 14mo",
                value: formatNumber(report?.stats.documentsExpiringSoon),
                subtext: "Need renewal",
              },
              {
                label: "Active Assignments",
                value: formatNumber(report?.stats.activeAssignments),
                subtext: "Active assignments",
              },
            ].map((card) => (
              <div
                key={card.label}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition p-5"
              >
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {card.label}
                </p>
                <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                <p className="text-sm text-gray-700 mt-3">{card.subtext}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Application Funnel & Prepare Joining */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Application Funnel</h3>
                <p className="text-sm text-gray-700">Distribusi status kandidat saat ini</p>
              </div>
              <div className="text-sm font-semibold text-blue-700">
                Total {formatNumber(report?.applicationFunnel?.reduce((acc, stage) => acc + stage.count, 0))}
              </div>
            </div>
            <div className="space-y-3">
              {report?.applicationFunnel?.map((stage) => (
                <div key={stage.status}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-900">{stage.label}</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {formatNumber(stage.count)} · {stage.percentage}%
                    </p>
                  </div>
                  <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-700"
                      style={{ width: `${Math.min(stage.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Prepare Joining Status</h3>
                <p className="text-sm text-gray-700">Checklist dokumen, medical, training, travel</p>
              </div>
              <Link href="/crewing/prepare-joining" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
                Open module →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {report?.prepareJoining?.map((stage) => (
                <div key={stage.status} className="rounded-xl border border-gray-200 p-4 bg-gradient-to-br from-gray-50 to-white">
                  <p className="text-xs font-semibold text-gray-500 uppercase">{stage.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{formatNumber(stage.count)}</p>
                  <p className="text-xs text-gray-600 mt-3">Crew in this stage</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Document Compliance & Principal Distribution */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Document Compliance</h3>
                <p className="text-sm text-gray-700">Crew document compliance performance</p>
              </div>
              <Link href="/crewing/documents" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
                Manage documents →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-200 p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase">Compliance Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {report?.documentCompliance.complianceRate !== null
                    ? `${report.documentCompliance.complianceRate}%`
                    : "—"}
                </p>
                <p className="text-xs text-gray-600 mt-3">Valid documents compared to total</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase">Total Documents</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatNumber(report?.documentCompliance.total)}
                </p>
                <div className="mt-4 space-y-2 text-sm text-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-green-700">Valid</span>
                    <span>{formatNumber(report?.documentCompliance.compliant)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-amber-700">Expiring ≤ 14mo</span>
                    <span>{formatNumber(report?.documentCompliance.expiringSoon)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-red-700">Expired</span>
                    <span>{formatNumber(report?.documentCompliance.expired)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Principal & Fleet Snapshot</h3>
                <p className="text-sm text-gray-700">Active crew per principal/fleet</p>
              </div>
              <Link href="/crewing/principals" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
                Principal details →
              </Link>
            </div>
            <div className="space-y-3">
              {report?.principalDistribution?.length
                ? report.principalDistribution.map((item) => (
                    <div key={item.principalName} className="flex items-center justify-between rounded-xl border border-gray-200 p-4 bg-gradient-to-r from-white to-blue-50/40">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.principalName}</p>
                        <p className="text-xs text-gray-600 mt-1">Crew onboard / assigned</p>
                      </div>
                      <div className="text-2xl font-bold text-blue-700">
                        {formatNumber(item.activeCrew)}
                      </div>
                    </div>
                  ))
                : (
                    <div className="text-sm text-gray-700">No active principals.</div>
                  )}
            </div>
          </div>
        </section>

        {/* Upcoming Assignments & Activity */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Upcoming Deployments</h3>
                <p className="text-sm text-gray-700">Scheduled assignments in pipeline</p>
              </div>
              <Link href="/crewing/assignments" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
                View assignments →
              </Link>
            </div>
            <div className="space-y-3">
              {report?.upcomingAssignments?.length ? (
                report.upcomingAssignments.map((assignment) => (
                  <div key={assignment.id} className="border border-gray-200 rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">
                        {assignment.crewName}
                        {assignment.rank ? ` • ${assignment.rank}` : ""}
                      </p>
                      <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                        {formatStatus(assignment.status)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-700">
                      <span>Vessel: <span className="font-semibold text-gray-900">{assignment.vesselName}</span></span>
                      {assignment.vesselType ? (
                        <span className="text-gray-600">({assignment.vesselType})</span>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-700">
                      <span>Principal: <span className="font-semibold text-gray-900">{assignment.principalName}</span></span>
                      <span>{formatDate(assignment.startDate)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-700">No upcoming assignments.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                <p className="text-sm text-gray-700">Important activity log in crewing module</p>
              </div>
              <Link href="/crewing" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
                Main module →
              </Link>
            </div>
            <div className="space-y-3">
              {report?.recentActivities?.length ? (
                report.recentActivities.map((activity) => (
                  <div key={activity.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">{activity.action}</p>
                      <span className="text-xs font-medium text-gray-600">
                        {formatDate(activity.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      {activity.userName} • {activity.entityType} #{activity.entityId}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-700">No recent activity.</p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
