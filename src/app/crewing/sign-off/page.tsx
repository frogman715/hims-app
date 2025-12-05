"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CrewSignOffPage() {
  const [signOffs, setSignOffs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetchSignOffs();
  }, [filter]);

  const fetchSignOffs = async () => {
    try {
      const url = filter === "ALL" 
        ? "/api/crewing/sign-off"
        : `/api/crewing/sign-off?status=${filter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSignOffs(data.signOffs || []);
      }
    } catch (error) {
      console.error("Failed to fetch sign-offs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      PENDING: "bg-yellow-100 text-yellow-800",
      DOCUMENTS_RECEIVED: "bg-blue-100 text-blue-800",
      DEBRIEFING_DONE: "bg-purple-100 text-purple-800",
      WAGES_CALCULATED: "bg-cyan-100 text-cyan-800",
      WAGES_PAID: "bg-green-100 text-green-800",
      COMPLETED: "bg-gray-100 text-gray-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const signOffSteps = [
    { step: 1, title: "Report to Crewing", icon: "📋", status: "PENDING" },
    { step: 2, title: "Submit Documents", icon: "📄", status: "DOCUMENTS_RECEIVED" },
    { step: 3, title: "De-briefing", icon: "💬", status: "DEBRIEFING_DONE" },
    { step: 4, title: "Wage Calculation", icon: "🧮", status: "WAGES_CALCULATED" },
    { step: 5, title: "Payment", icon: "💰", status: "WAGES_PAID" },
    { step: 6, title: "Document Withdrawal", icon: "✅", status: "COMPLETED" }
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li><Link href="/dashboard" className="text-gray-700 hover:text-blue-700">Dashboard</Link></li>
            <li><Link href="/crewing" className="text-gray-700 hover:text-blue-700 ml-1">Crewing</Link></li>
            <li><span className="ml-1 text-gray-500">Sign-Off Management</span></li>
          </ol>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Crew Sign-Off Management</h1>
          <p className="text-gray-700 mt-1">HGQS Annex D - Sign-off Procedures & Wage Settlement</p>
        </div>

        {/* Sign-Off Process Flowchart */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-extrabold text-gray-900 mb-6">Sign-Off Process Flowchart</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {signOffSteps.map((step, index) => (
              <div key={step.step} className="relative">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center text-2xl mb-2">
                    {step.icon}
                  </div>
                  <div className="text-xs font-semibold text-gray-700">{step.title}</div>
                  <div className="text-sm text-gray-700 mt-1">Step {step.step}</div>
                </div>
                {index < signOffSteps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gray-300 -translate-x-1/2"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6 p-2 flex gap-2 overflow-x-auto">
          {["ALL", "PENDING", "DOCUMENTS_RECEIVED", "WAGES_CALCULATED", "COMPLETED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                filter === status ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {status.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {/* Sign-Offs List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : signOffs.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <div className="text-6xl mb-4">🚢</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Sign-Off Records</h3>
            <p className="text-gray-700">Create sign-off records for crew members returning from vessels.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {signOffs.map((signOff) => (
              <div key={signOff.id} className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{signOff.crew?.fullName}</h3>
                    <p className="text-gray-700">{signOff.crew?.rank}</p>
                    <p className="text-sm text-gray-500">Sign-Off: {new Date(signOff.signOffDate).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-2 rounded-full text-xs font-semibold ${getStatusColor(signOff.status)}`}>
                    {signOff.status.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="grid md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Passport:</span>
                    <span className={`ml-2 font-medium ${signOff.passportReceived ? "text-green-600" : "text-red-600"}`}>
                      {signOff.passportReceived ? "✓ Received" : "✗ Pending"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Seaman Book:</span>
                    <span className={`ml-2 font-medium ${signOff.seamanBookReceived ? "text-green-600" : "text-red-600"}`}>
                      {signOff.seamanBookReceived ? "✓ Received" : "✗ Pending"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">De-briefing:</span>
                    <span className={`ml-2 font-medium ${signOff.debriefingCompleted ? "text-green-600" : "text-red-600"}`}>
                      {signOff.debriefingCompleted ? "✓ Done" : "✗ Pending"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Final Wage:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {signOff.finalWageAmount ? `$${signOff.finalWageAmount.toLocaleString()}` : "Not calculated"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                    Update Status
                  </button>
                  <button className="px-4 py-2 bg-white text-gray-700 border border-gray-400 rounded-lg hover:bg-gray-100 text-sm font-medium">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>HGQS Procedures Manual - Annex D | Sign-Off Seafarer Management</p>
        </div>
      </div>
    </div>
  );
}
