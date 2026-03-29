"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";
import { StatusBadge } from "@/components/ui/StatusBadge";

const COMMUNICATION_TYPE_STYLES: Record<string, string> = {
  MEDIA_INTERVIEW: "border-sky-300 bg-sky-50",
  COMPLAINT: "border-rose-300 bg-rose-50",
  APPRAISAL_REPORT: "border-emerald-300 bg-emerald-50",
  CREW_DISPUTE: "border-amber-300 bg-amber-50",
  CREW_SICK: "border-violet-300 bg-violet-50",
  CREW_DEATH: "border-slate-300 bg-slate-100",
  EMERGENCY: "border-red-300 bg-red-50",
  GENERAL_INQUIRY: "border-cyan-300 bg-cyan-50",
};

export default function CommunicationManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
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
  const [error, setError] = useState<string | null>(null);

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
      setError(null);
      const params = new URLSearchParams();

      if (filter !== "ALL") {
        if (["PENDING", "IN_PROGRESS", "RESOLVED", "ESCALATED", "CLOSED"].includes(filter)) {
          params.set("status", filter);
        } else if (["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(filter)) {
          params.set("priority", filter);
        } else {
          params.set("type", filter);
        }
      }

      const query = params.toString();
      const url = query
        ? `/api/compliance/communication?${query}`
        : "/api/compliance/communication";
      const res = await fetch(url);
      if (res.status === 401) {
        router.push("/auth/signin");
        return;
      }

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || "Failed to fetch communications");
      }

      const data = await res.json();
      setCommunications(data.communications || []);
    } catch (error) {
      console.error("Failed to fetch communications:", error);
      setCommunications([]);
      setError(error instanceof Error ? error.message : "Failed to fetch communications");
    } finally {
      setLoading(false);
    }
  }, [filter, router]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [router, status]);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchCommunications();
    }
  }, [fetchCommunications, session, status]);

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      LOW: "bg-green-50 text-green-700 border-green-200",
      MEDIUM: "bg-yellow-50 text-yellow-700 border-yellow-200",
      HIGH: "bg-orange-50 text-orange-700 border-orange-200",
      CRITICAL: "bg-red-50 text-red-700 border-red-200",
    };
    return styles[priority] || "bg-gray-100 text-gray-700";
  };

  const criticalItems = communications.filter((item) => item.priority === "CRITICAL").length;
  const openItems = communications.filter((item) => item.status !== "CLOSED" && item.status !== "RESOLVED").length;

  return (
    <div className="section-stack mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <WorkspaceHero
        eyebrow="Compliance Communication"
        title="Communication management"
        subtitle="Track complaints, emergency communications, appraisal reports, and escalation-sensitive correspondence in one monitoring board."
        helperLinks={[
          { href: '/compliance', label: 'Compliance center' },
          { href: '/compliance/escalations', label: 'Escalations' },
          { href: '/dashboard', label: 'Dashboard' },
        ]}
        highlights={[
          { label: 'Open Cases', value: openItems.toLocaleString('id-ID'), detail: 'Communication items still under follow-up.' },
          { label: 'Critical Cases', value: criticalItems.toLocaleString('id-ID'), detail: 'Entries requiring leadership awareness.' },
          { label: 'Scope', value: 'MLC 2006', detail: 'Supports grievance and controlled communication monitoring.' },
        ]}
        actions={(
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            New communication entry is not available from this page yet. Use the tracked log below for monitoring and follow-up only.
          </div>
        )}
      />

        {/* Communication Type Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {communicationTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setFilter(type.value)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                filter === type.value
                  ? COMMUNICATION_TYPE_STYLES[type.value] || "border-slate-300 bg-slate-50"
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
        {error ? (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        ) : null}

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
                      <StatusBadge status={comm.status} className="px-3 py-2" />
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
  );
}
