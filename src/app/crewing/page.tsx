"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function Crewing() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Organized by Maritime Workflow - Professional & Clean
  const moduleCategories = [
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
          stats: "245 Active"
        },
        {
          title: "Applications",
          description: "Review & process new employment applications",
          href: "/crewing/applications",
          icon: "📝",
          color: "from-green-600 to-green-700",
          stats: "12 Pending"
        },
        {
          title: "Application Workflow",
          description: "Track application stages: Review → Interview → Approved",
          href: "/crewing/workflow",
          icon: "🔄",
          color: "from-cyan-600 to-cyan-700",
          stats: "15 In Progress"
        },
        {
          title: "Interviews",
          description: "Schedule & conduct crew interviews",
          href: "/crewing/interviews",
          icon: "💼",
          color: "from-indigo-600 to-indigo-700",
          stats: "5 Scheduled"
        }
      ]
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
          stats: "156 Active"
        },
        {
          title: "Prepare Joining",
          description: "Pre-joining checklist, travel & Letter Guarantee",
          href: "/crewing/prepare-joining",
          icon: "✈️",
          color: "from-emerald-600 to-teal-700",
          stats: "8 Ready"
        },
        {
          title: "Crew List (Onboard)",
          description: "Current crew complement per vessel",
          href: "/crewing/crew-list",
          icon: "🚢",
          color: "from-blue-700 to-indigo-700",
          stats: "18 Vessels"
        },
        {
          title: "Crew Replacements",
          description: "Plan & manage crew changes (sign-on/sign-off)",
          href: "/crewing/replacements",
          icon: "🔄",
          color: "from-orange-600 to-red-600",
          stats: "5 Scheduled"
        }
      ]
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
          stats: "8 Expiring"
        },
        {
          title: "Form Management",
          description: "Principal forms & approval workflow (Medical, Training, etc)",
          href: "/crewing/forms",
          icon: "📋",
          color: "from-fuchsia-600 to-pink-700",
          stats: "New!"
        },
        {
          title: "Training Records",
          description: "Training programs, orientations & certifications",
          href: "/crewing/training",
          icon: "🎓",
          color: "from-yellow-600 to-amber-700",
          stats: "34 Active"
        },
        {
          title: "Monthly Checklist",
          description: "ON/OFF signers report & compliance checklist",
          href: "/crewing/checklist",
          icon: "✅",
          color: "from-teal-600 to-cyan-700",
          stats: "23 This Month"
        },
        {
          title: "External Compliance",
          description: "KOSMA, Dephub verification & Schengen visa",
          href: "/compliance/external",
          icon: "🌐",
          color: "from-indigo-600 to-purple-700",
          stats: "3 Systems"
        },
        {
          title: "SIUPPAK Reports",
          description: "Laporan semester perekrutan untuk audit Perhubungan",
          href: "/compliance/siuppak",
          icon: "📊",
          color: "from-red-600 to-rose-700",
          stats: "Auto Generate"
        }
      ]
    }
  ];

  return (
    <>
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-700 shadow-2xl">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center backdrop-blur-md shadow-2xl animate-pulse">
                  <span className="text-4xl">⚓</span>
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-4 border-white animate-bounce"></div>
              </div>
              <div>
                <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">Crewing Department</h1>
                <p className="text-blue-100 text-xl font-medium">Professional maritime crew operations & compliance</p>
                <div className="mt-4 flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-blue-100">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">System Online</span>
                  </div>
                  <div className="flex items-center space-x-2 text-blue-100">
                    <span className="text-sm">Last updated: Today</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <button
                onClick={() => router.push("/dashboard")}
                className="group bg-white hover:bg-white text-white px-8 py-4 rounded-2xl backdrop-blur-md border border-white/20 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-2xl"
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="font-semibold">Back to Dashboard</span>
                </div>
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="group bg-white backdrop-blur-md rounded-2xl p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <div className="text-3xl font-bold text-gray-900">245</div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
              </div>
              <div className="text-gray-700 text-sm font-semibold">Active Seafarers</div>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full w-3/4"></div>
              </div>
            </div>
            <div className="group bg-white backdrop-blur-md rounded-2xl p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <div className="text-3xl font-bold text-gray-900">6</div>
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🏢</span>
                </div>
              </div>
              <div className="text-gray-700 text-sm font-semibold">Principals (18 Vessels)</div>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full w-5/6"></div>
              </div>
            </div>
            <div className="group bg-white backdrop-blur-md rounded-2xl p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <div className="text-3xl font-bold text-gray-900">156</div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📋</span>
                </div>
              </div>
              <div className="text-gray-700 text-sm font-semibold">Active Assignments</div>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full w-4/5"></div>
              </div>
            </div>
            <div className="group bg-white backdrop-blur-md rounded-2xl p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <div className="text-3xl font-bold text-gray-900">98%</div>
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
              <div className="text-gray-700 text-sm font-semibold">Compliance Rate</div>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-emerald-600 h-2 rounded-full w-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Effect */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-16">
            <path fill="#ffffff" fillOpacity="0.1" d="M0,32L48,37.3C96,43,192,53,288,58.7C384,64,480,64,576,58.7C672,53,768,43,864,48C960,53,1056,75,1152,80C1248,85,1344,75,1392,69.3L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Quick Actions & Recent Activity - MODERN MINIMALIST */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions - Ultra Clean */}
          <div className="bg-white rounded-xl border border-gray-300 hover:border-gray-400 transition-all duration-300 overflow-hidden group">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                <h3 className="text-base font-semibold text-gray-900">Quick Actions</h3>
              </div>
            </div>
            <div className="p-5 space-y-2">
              <Link
                href="/crewing/seafarers/new"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-100 transition-colors group/item"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover/item:bg-blue-600 transition-colors">
                  <span className="text-blue-600 group-hover/item:text-white transition-colors text-lg">+</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">Add New Seafarer</div>
                  <div className="text-sm text-gray-700">Register crew member</div>
                </div>
              </Link>
              <Link
                href="/crewing/principals"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors group/item"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover/item:bg-green-600 transition-colors">
                  <span className="text-green-600 group-hover/item:text-white transition-colors text-base">🚢</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">Fleet Management</div>
                  <div className="text-sm text-gray-700">Principals & vessels</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Activity - Minimalist Design */}
          <div className="bg-white rounded-xl border border-gray-300 hover:border-gray-400 transition-all duration-300 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-purple-600 rounded-full"></div>
                <h3 className="text-base font-semibold text-gray-900">Recent Activity</h3>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">New seafarer onboard</p>
                  <p className="text-sm text-gray-700 mt-0.5">John Smith • 2h ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">Document renewed</p>
                  <p className="text-sm text-gray-700 mt-0.5">STCW for 15 crew • 4h ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">Certificates expiring</p>
                  <p className="text-sm text-gray-700 mt-0.5">8 documents • 6h ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Workflow-Based Layout */}
        <div className="space-y-8">
          {moduleCategories.map((category, catIndex) => (
            <div key={catIndex} className="relative">
              {/* Category Header - Minimalist */}
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900">{category.category}</h2>
                    <p className="text-gray-500 text-xs mt-0.5">{category.description}</p>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-100 px-3 py-2.5 rounded-full border border-gray-300">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                  {category.modules.length} Modules
                </div>
              </div>

              {/* Module Grid - Ultra Minimalist */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {category.modules.map((module, index) => (
                  <Link
                    key={module.href}
                    href={module.href}
                    className="group relative bg-white rounded-lg border border-gray-300 hover:border-blue-400 hover:shadow-md transition-all duration-200 overflow-hidden"
                    style={{
                      animationDelay: `${(catIndex * 4 + index) * 50}ms`,
                      animationFillMode: 'both',
                      animation: 'fadeInUp 0.4s ease-out forwards',
                      opacity: 0
                    }}
                  >
                    {/* Modern Card Layout */}
                    <div className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${module.color} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-md`}>
                          <span className="text-xl">{module.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors leading-tight">
                            {module.title}
                          </h3>
                          <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">{module.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 bg-gray-100 px-4 py-2 rounded">
                          {module.stats}
                        </span>
                        <svg className="w-4 h-4 text-gray-700 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>

                    {/* Accent bar on hover */}
                    <div className={`absolute left-0 top-0 w-1 h-full bg-gradient-to-b ${module.color} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
    </>
  );
}