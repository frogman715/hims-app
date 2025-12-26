"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface WorkflowStats {
  received: number;
  reviewing: number;
  interview: number;
  passed: number;
  preparing: number;
  ready: number;
}

export default function CrewManningWorkflow() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<WorkflowStats>({
    received: 0,
    reviewing: 0,
    interview: 0,
    passed: 0,
    preparing: 0,
    ready: 0,
  });
  const [loading, setLoading] = useState(true);

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
      const res = await fetch("/api/crewing/workflow/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const workflowSteps = [
    {
      id: 1,
      title: "Application Received",
      description: "Seafarer submits application",
      icon: "📝",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-100",
      borderColor: "border-blue-200",
      count: stats.received,
      link: "/crewing/applications?status=RECEIVED",
      status: "RECEIVED"
    },
    {
      id: 2,
      title: "HR Review",
      description: "Review documents & qualifications",
      icon: "🔍",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      count: stats.reviewing,
      link: "/crewing/applications?status=REVIEWING",
      status: "REVIEWING"
    },
    {
      id: 3,
      title: "Interview",
      description: "Schedule & conduct interview",
      icon: "🎤",
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      count: stats.interview,
      link: "/crewing/interviews?status=SCHEDULED",
      status: "INTERVIEW"
    },
    {
      id: 4,
      title: "Passed/Offered",
      description: "Offer position to candidate",
      icon: "✅",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      count: stats.passed,
      link: "/crewing/applications?status=PASSED",
      status: "PASSED"
    },
    {
      id: 5,
      title: "Prepare Joining",
      description: "Documents, medical, training, travel",
      icon: "📋",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      count: stats.preparing,
      link: "/crewing/prepare-joining?status=PENDING",
      status: "PREPARING"
    },
    {
      id: 6,
      title: "Ready to Join",
      description: "All set, ready to dispatch",
      icon: "🚢",
      color: "from-cyan-500 to-cyan-600",
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-200",
      count: stats.ready,
      link: "/crewing/prepare-joining?status=READY",
      status: "READY"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Crew Manning Workflow
              </h1>
              <p className="text-gray-800 font-medium">
                Alur lengkap dari aplikasi sampai seafarer siap berangkat ke kapal
              </p>
            </div>
            <Link
              href="/crewing"
              className="px-6 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:border-blue-500 hover:text-blue-700 transition-all duration-200 shadow-md hover:shadow-md"
            >
              ← Back to Crewing
            </Link>
          </div>
        </div>

        {/* Workflow Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {workflowSteps.map((step) => (
            <Link
              key={step.id}
              href={step.link}
              className={`${step.bgColor} border-2 ${step.borderColor} rounded-2xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group`}
            >
              {/* Badge Number */}
              <div className="absolute top-4 right-4">
                <span className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br ${step.color} text-white text-xl font-extrabold shadow-lg`}>
                  {step.count}
                </span>
              </div>

              {/* Icon */}
              <div className="text-6xl mb-4">{step.icon}</div>

              {/* Step Number */}
              <div className={`inline-block px-3 py-2 rounded-full bg-gradient-to-br ${step.color} text-white text-sm font-semibold mb-3`}>
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
        <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-gray-100">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">
            Alur Proses Manning
          </h2>
          
          <div className="flex items-center justify-between overflow-x-auto pb-4">
            {workflowSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                {/* Step Card */}
                <div className="flex flex-col items-center min-w-[140px]">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-3xl shadow-lg mb-2`}>
                    {step.icon}
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-semibold text-gray-600 mb-1">
                      Step {step.id}
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      {step.title}
                    </div>
                    <div className={`mt-2 inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br ${step.color} text-white text-sm font-bold`}>
                      {step.count}
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                {index < workflowSteps.length - 1 && (
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
          <Link
            href="/crewing/applications/new"
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="text-4xl mb-3">➕</div>
            <h3 className="text-xl font-extrabold mb-2">New Application</h3>
            <p className="text-white text-sm opacity-95">
              Input aplikasi baru dari seafarer
            </p>
          </Link>

          <Link
            href="/crewing/interviews/schedule"
            className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="text-4xl mb-3">📅</div>
            <h3 className="text-xl font-extrabold mb-2">Schedule Interview</h3>
            <p className="text-white text-sm opacity-95">
              Jadwalkan interview untuk kandidat
            </p>
          </Link>

          <Link
            href="/crewing/reports"
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-xl font-extrabold mb-2">Reports</h3>
            <p className="text-white text-sm opacity-95">
              Lihat laporan recruitment & manning
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
