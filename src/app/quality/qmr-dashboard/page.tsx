"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { canAccessOfficePath } from "@/lib/office-access";
import { normalizeToUserRoles } from "@/lib/type-guards";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";

interface QMRStats {
  pendingAudits: number;
  openCAPAs: number;
  pendingApprovals: number;
  overdueItems: number;
}

interface QMRTaskItem {
  id: string;
  title: string;
  description: string;
  priority: string;
  dueDate: string;
  taskType: string;
}

const defaultStats: QMRStats = {
  pendingAudits: 0,
  openCAPAs: 0,
  pendingApprovals: 0,
  overdueItems: 0,
};

const STAT_CARD_STYLES: Record<string, { border: string; text: string; iconBg: string }> = {
  blue: { border: "border-sky-300", text: "text-sky-700", iconBg: "bg-sky-100" },
  orange: { border: "border-amber-300", text: "text-amber-700", iconBg: "bg-amber-100" },
  purple: { border: "border-violet-300", text: "text-violet-700", iconBg: "bg-violet-100" },
  red: { border: "border-rose-300", text: "text-rose-700", iconBg: "bg-rose-100" },
};

export default function QMRDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<QMRStats>(defaultStats);
  const [tasks, setTasks] = useState<QMRTaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const userRoles = normalizeToUserRoles(session?.user?.roles ?? session?.user?.role);
  const isSystemAdmin = session?.user?.isSystemAdmin === true;
  const canManageAudits = canAccessOfficePath("/api/quality/audits", userRoles, isSystemAdmin, "POST");
  const canManageCapa = canAccessOfficePath("/api/quality/corrective-actions", userRoles, isSystemAdmin, "POST");
  const canManageRisks = canAccessOfficePath("/api/quality/risks", userRoles, isSystemAdmin, "POST");
  const canManageReviews = canAccessOfficePath("/api/quality/reviews", userRoles, isSystemAdmin, "POST");

  useEffect(() => {
    fetchQMRData();
  }, []);

  const fetchQMRData = async () => {
    try {
      setLoadError(null);
      const [statsResult, tasksResult] = await Promise.allSettled([
        fetch("/api/quality/qmr/stats"),
        fetch("/api/quality/qmr/tasks")
      ]);

      let primaryLoaded = false;

      if (statsResult.status === "fulfilled" && statsResult.value.ok) {
        const rawStats = await statsResult.value.json();
        primaryLoaded = true;
        setStats({
          pendingAudits: Number(rawStats.pendingAudits) || 0,
          openCAPAs: Number(rawStats.openCAPAs) || 0,
          pendingApprovals: Number(rawStats.pendingApprovals) || 0,
          overdueItems: Number(rawStats.overdueItems) || 0,
        });
      } else {
        setStats(defaultStats);
      }

      if (tasksResult.status === "fulfilled" && tasksResult.value.ok) {
        const data = await tasksResult.value.json();
        const taskList = Array.isArray(data.tasks)
          ? (data.tasks as QMRTaskItem[])
          : [];
        setTasks(taskList);
      } else {
        setTasks([]);
      }

      if (!primaryLoaded) {
        setLoadError("Quality dashboard metrics are temporarily unavailable. Task queue remains available when its service responds.");
      }
    } catch (error) {
      console.error("Failed to fetch QMR data:", error);
      setLoadError("Failed to load QMR dashboard data.");
      setStats(defaultStats);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: "Pending Audits", value: stats.pendingAudits, icon: "📋", color: "blue", link: "/quality/audits" },
    { title: "Open CAPAs", value: stats.openCAPAs, icon: "🔧", color: "orange", link: "/quality/corrective-actions" },
    { title: "Pending Approvals", value: stats.pendingApprovals, icon: "✅", color: "purple", link: "/quality/documents" },
    { title: "Overdue Items", value: stats.overdueItems, icon: "⚠️", color: "red", link: "/quality/risks" }
  ];

  return (
    <div className="section-stack mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <WorkspaceHero
        eyebrow="Quality Leadership"
        title="QMR dashboard"
        subtitle={`Quality Management Representative workspace for audit planning, CAPA control, approvals, and overdue quality issues${session?.user?.name ? ` for ${session.user.name}` : ""}.`}
        helperLinks={[
          { href: "/quality/audits", label: "Audits" },
          { href: "/quality/corrective-actions", label: "Corrective actions" },
          { href: "/quality/risks", label: "Risks" },
          { href: "/quality/documents", label: "Documents" },
        ]}
        highlights={[
          { label: "Pending Audits", value: stats.pendingAudits.toLocaleString("id-ID"), detail: "Audit plans and active reviews awaiting action." },
          { label: "Open CAPAs", value: stats.openCAPAs.toLocaleString("id-ID"), detail: "Corrective actions still owned by the quality function." },
          { label: "Pending Approvals", value: stats.pendingApprovals.toLocaleString("id-ID"), detail: "Document or quality approvals still in queue." },
          { label: "Overdue Items", value: stats.overdueItems.toLocaleString("id-ID"), detail: "Quality items outside expected completion timing." },
        ]}
      />

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => {
            const styles = STAT_CARD_STYLES[card.color];
            return (
            <Link key={card.title} href={card.link}>
              <div className={`rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${styles.border} cursor-pointer`}>
                <div className="flex justify-between items-start mb-4">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${styles.iconBg}`}>{card.icon}</div>
                  <div className={`text-3xl font-bold ${styles.text}`}>{card.value}</div>
                </div>
                <h3 className="text-gray-700 font-semibold">{card.title}</h3>
              </div>
            </Link>
          )})}
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Pending Tasks */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center">
              <span className="mr-2">📌</span>
              My Tasks
            </h2>
            {loadError ? (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {loadError}
              </div>
            ) : null}
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">✅</div>
                <p className="text-gray-700">All caught up!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {tasks.map((task) => (
                  <div key={task.id} className="border rounded-lg p-4 hover:border-blue-400 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">{task.title}</h4>
                      <span className={`px-4 py-2 text-xs font-semibold rounded-full ${
                        task.priority === "CRITICAL" ? "bg-red-100 text-red-800" :
                        task.priority === "HIGH" ? "bg-orange-100 text-orange-800" :
                        "bg-blue-100 text-blue-800"
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 mb-2">{task.description}</p>
                    <div className="flex justify-between items-center text-sm text-gray-700">
                      <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      <span className="px-4 py-2 bg-gray-100 rounded">{task.taskType.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center">
              <span className="mr-2">⚡</span>
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/quality/audits">
                <div className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-100 transition-all cursor-pointer text-center">
                  <div className="text-3xl mb-2">📋</div>
                  <div className="text-sm font-semibold text-gray-800">{canManageAudits ? "Schedule Audit" : "Review Audits"}</div>
                </div>
              </Link>
              <Link href="/quality/corrective-actions">
                <div className="p-4 border-2 border-orange-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-all cursor-pointer text-center">
                  <div className="text-3xl mb-2">🔧</div>
                  <div className="text-sm font-semibold text-gray-800">{canManageCapa ? "Create CAPA" : "Review CAPA"}</div>
                </div>
              </Link>
              <Link href="/quality/risks">
                <div className="p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all cursor-pointer text-center">
                  <div className="text-3xl mb-2">⚠️</div>
                  <div className="text-sm font-semibold text-gray-800">{canManageRisks ? "Risk Assessment" : "Risk Review"}</div>
                </div>
              </Link>
              <Link href="/quality/reviews">
                <div className="p-4 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all cursor-pointer text-center">
                  <div className="text-3xl mb-2">📊</div>
                  <div className="text-sm font-semibold text-gray-800">{canManageReviews ? "Management Review" : "Review Meetings"}</div>
                </div>
              </Link>
              <Link href="/quality/forms/reference">
                <div className="p-4 border-2 border-cyan-200 rounded-lg hover:border-cyan-400 hover:bg-cyan-50 transition-all cursor-pointer text-center">
                  <div className="text-3xl mb-2">📄</div>
                  <div className="text-sm font-semibold text-gray-800">Forms Library</div>
                </div>
              </Link>
              <Link href="/quality/documents">
                <div className="p-4 border-2 border-pink-200 rounded-lg hover:border-pink-400 hover:bg-pink-50 transition-all cursor-pointer text-center">
                  <div className="text-3xl mb-2">📁</div>
                  <div className="text-sm font-semibold text-gray-800">Documents</div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* QMR Responsibilities */}
        <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 p-8 text-white shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-6">QMR Core Responsibilities</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-3 flex items-center">
                <span className="mr-2">🎯</span>
                Quality Planning
              </h3>
              <ul className="text-sm text-blue-100 space-y-1">
                <li>• Develop quality objectives</li>
                <li>• Plan internal audits</li>
                <li>• Risk & opportunity management</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 flex items-center">
                <span className="mr-2">🔍</span>
                Monitoring & Control
              </h3>
              <ul className="text-sm text-purple-100 space-y-1">
                <li>• Monitor CAPA effectiveness</li>
                <li>• Verify nonconformities</li>
                <li>• Document approval process</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 flex items-center">
                <span className="mr-2">📈</span>
                Continuous Improvement
              </h3>
              <ul className="text-sm text-blue-100 space-y-1">
                <li>• Conduct management reviews</li>
                <li>• Facilitate training programs</li>
                <li>• Drive quality culture</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Quality Management Representative Dashboard | ISO 9001:2015 Compliant</p>
        </div>
    </div>
  );
}
