"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

export default function CommunicationManagementPage() {
  const [communications, setCommunications] = useState<Array<{
    id: string;
    status: string;
    priority: string;
    subject: string;
    description: string;
    resolution?: string;
    createdAt: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  const communicationTypes = [
    { value: "MEDIA_INTERVIEW", label: "Media Interview", icon: "📰", color: "blue" },
    { value: "COMPLAINT", label: "Complaint (MLC 5.1.5)", icon: "⚠️", color: "red" },
    { value: "APPRAISAL_REPORT", label: "Appraisal Report", icon: "📊", color: "green" },
    { value: "CREW_DISPUTE", label: "Crew Dispute", icon: "⚖️", color: "orange" },
    { value: "CREW_SICK", label: "Crew Sick on Board", icon: "🏥", color: "purple" },
    { value: "CREW_DEATH", label: "Crew Death", icon: "💐", color: "gray" },
    { value: "EMERGENCY", label: "Emergency", icon: "🚨", color: "red" },
    { value: "GENERAL_INQUIRY", label: "General Inquiry", icon: "💬", color: "cyan" }
  ];

  const fetchCommunications = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === "ALL" 
        ? "/api/compliance/communication"
        : `/api/compliance/communication?type=${filter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCommunications(data.communications || []);
      }
    } catch (error) {
      console.error("Failed to fetch communications:", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchCommunications();
  }, [fetchCommunications]);

  const handleNewFormClick = useCallback(() => {
    console.info("New communication form modal not yet implemented");
  }, []);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      IN_PROGRESS: "bg-blue-100 text-blue-800",
      RESOLVED: "bg-green-100 text-green-800",
      ESCALATED: "bg-red-100 text-red-800",
      CLOSED: "bg-gray-100 text-gray-800",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      LOW: "bg-green-50 text-green-700 border-green-200",
      MEDIUM: "bg-yellow-50 text-yellow-700 border-yellow-200",
      HIGH: "bg-orange-50 text-orange-700 border-orange-200",
      CRITICAL: "bg-red-50 text-red-700 border-red-200",
    };
    return styles[priority] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link href="/dashboard" className="text-gray-700 hover:text-blue-700">Dashboard</Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <Link href="/compliance" className="ml-1 text-gray-700 hover:text-blue-700">Compliance</Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-1 text-gray-500">Communication Management</span>
                </div>
              </li>
            </ol>
          </nav>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Communication Management</h1>
              <p className="text-gray-700 mt-1">HGQS Annex C - MLC 2006 Reg 5.1.5 Compliant</p>
            </div>
            <button
              onClick={handleNewFormClick}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 font-medium shadow-lg"
            >
              + New Communication
            </button>
          </div>
        </div>

        {/* Communication Type Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {communicationTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setFilter(type.value)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                filter === type.value
                  ? `border-${type.color}-500 bg-${type.color}-50`
                  : "border-gray-300 bg-white hover:border-gray-400"
              }`}
            >
              <div className="text-2xl mb-2">{type.icon}</div>
              <div className="text-sm font-semibold text-gray-800">{type.label}</div>
            </button>
          ))}
        </div>

        {/* Emergency Contact List */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-xl shadow-lg p-6 mb-8 text-white">
          <h2 className="text-xl font-extrabold mb-4 flex items-center">
            <span className="mr-2">🚨</span>
            Emergency Contact List
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm opacity-90">Director</div>
              <div className="font-semibold">Mochammad Rinaldy</div>
              <div className="text-sm">+62-812-1270-3647</div>
            </div>
            <div>
              <div className="text-sm opacity-90">Operational Staff</div>
              <div className="font-semibold">Ade Suhendar</div>
              <div className="text-sm">+62-813-8225-5995</div>
            </div>
            <div>
              <div className="text-sm opacity-90">Operational Staff</div>
              <div className="font-semibold">Ahmad Imron</div>
              <div className="text-sm">+62-912-9025-2189</div>
            </div>
            <div>
              <div className="text-sm opacity-90">Accounting Staff</div>
              <div className="font-semibold">Afrian Al Hadino</div>
              <div className="text-sm">+62-813-1021-7369</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6 p-2 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
              filter === "ALL" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            All Communications
          </button>
          <button
            onClick={() => setFilter("PENDING")}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
              filter === "PENDING" ? "bg-yellow-600 text-white" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("CRITICAL")}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
              filter === "CRITICAL" ? "bg-red-600 text-white" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            Critical
          </button>
        </div>

        {/* Communications List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : communications.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Communications Found</h3>
            <p className="text-gray-700">Start by creating a new communication record.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {communications.map((comm) => (
              <div key={comm.id} className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-2 rounded-full text-xs font-semibold ${getStatusBadge(comm.status)}`}>
                        {comm.status}
                      </span>
                      <span className={`px-3 py-2 rounded-full text-xs font-semibold border ${getPriorityBadge(comm.priority)}`}>
                        {comm.priority} PRIORITY
                      </span>
                      <span className="text-sm text-gray-700">
                        {new Date(comm.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{comm.subject}</h3>
                    <p className="text-gray-700 mt-1">{comm.description}</p>
                  </div>
                  <button className="ml-4 px-4 py-2 text-blue-600 hover:bg-blue-100 rounded-lg font-medium">
                    View Details →
                  </button>
                </div>
                {comm.resolution && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-sm font-semibold text-green-800 mb-1">Resolution</div>
                    <div className="text-sm text-green-700">{comm.resolution}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>HGQS Procedures Manual - Annex C | MLC 2006 Regulation 5.1.5 - On-board Complaint Procedures</p>
        </div>
      </div>
    </div>
  );
}
