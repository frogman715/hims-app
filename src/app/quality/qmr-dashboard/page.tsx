"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

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

export default function QMRDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<QMRStats>(defaultStats);
  const [tasks, setTasks] = useState<QMRTaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQMRData();
  }, []);

  const fetchQMRData = async () => {
    try {
      const [statsRes, tasksRes] = await Promise.all([
        fetch("/api/quality/qmr/stats"),
        fetch("/api/quality/qmr/tasks")
      ]);

      if (statsRes.ok) {
        const rawStats = await statsRes.json();
        setStats({
          pendingAudits: Number(rawStats.pendingAudits) || 0,
          openCAPAs: Number(rawStats.openCAPAs) || 0,
          pendingApprovals: Number(rawStats.pendingApprovals) || 0,
          overdueItems: Number(rawStats.overdueItems) || 0,
        });
      }
      if (tasksRes.ok) {
        const data = await tasksRes.json();
        const taskList = Array.isArray(data.tasks)
          ? (data.tasks as QMRTaskItem[])
          : [];
        setTasks(taskList);
      }
    } catch (error) {
      console.error("Failed to fetch QMR data:", error);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">QMR Dashboard</h1>
              <p className="text-gray-700">Quality Management Representative - {session?.user?.name}</p>
              <p className="text-sm text-gray-500 mt-1">ISO 9001:2015 & MLC 2006 Quality Management System</p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-3xl">
                👔
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => (
            <Link key={card.title} href={card.link}>
              <div className={`bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow p-6 border-l-4 border-${card.color}-500 cursor-pointer`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="text-4xl">{card.icon}</div>
                  <div className={`text-3xl font-bold text-${card.color}-600`}>{card.value}</div>
                </div>
                <h3 className="text-gray-700 font-semibold">{card.title}</h3>
              </div>
            </Link>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Pending Tasks */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center">
              <span className="mr-2">📌</span>
              My Tasks
            </h2>
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
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center">
              <span className="mr-2">⚡</span>
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/quality/audits/new">
                <div className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-100 transition-all cursor-pointer text-center">
                  <div className="text-3xl mb-2">📋</div>
                  <div className="text-sm font-semibold text-gray-800">Schedule Audit</div>
                </div>
              </Link>
              <Link href="/quality/corrective-actions/new">
                <div className="p-4 border-2 border-orange-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-all cursor-pointer text-center">
                  <div className="text-3xl mb-2">🔧</div>
                  <div className="text-sm font-semibold text-gray-800">Create CAPA</div>
                </div>
              </Link>
              <Link href="/quality/risks">
                <div className="p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all cursor-pointer text-center">
                  <div className="text-3xl mb-2">⚠️</div>
                  <div className="text-sm font-semibold text-gray-800">Risk Assessment</div>
                </div>
              </Link>
              <Link href="/quality/reviews/new">
                <div className="p-4 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all cursor-pointer text-center">
                  <div className="text-3xl mb-2">📊</div>
                  <div className="text-sm font-semibold text-gray-800">Management Review</div>
                </div>
              </Link>
              <Link href="/quality/forms">
                <div className="p-4 border-2 border-cyan-200 rounded-lg hover:border-cyan-400 hover:bg-cyan-50 transition-all cursor-pointer text-center">
                  <div className="text-3xl mb-2">📄</div>
                  <div className="text-sm font-semibold text-gray-800">HGQS Forms</div>
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
        <div className="bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 rounded-xl shadow-2xl p-8 text-white">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">QMR Core Responsibilities</h2>
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
    </div>
  );
}
