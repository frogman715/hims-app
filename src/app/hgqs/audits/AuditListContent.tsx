"use client";

import { useState, useEffect } from "react";

import Link from "next/link";

interface AuditSchedule {
  id: string;
  title: string;
  description: string;
  auditType: string;
  status: string;
  startDate: string;
  endDate: string;
  findings: Array<{ id: string }>;
  report: { status: string } | null;
}

type AuditListProps = {
  // Props can be added here as needed
};

export default function AuditListContent({}: AuditListProps) {
  const [audits, setAudits] = useState<AuditSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("PLANNED");

  useEffect(() => {
    fetchAudits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function fetchAudits() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/audits?status=${statusFilter}&limit=50`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch audits");
      const data = await res.json();
      setAudits(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PLANNED: "bg-blue-100 text-blue-800",
      IN_PROGRESS: "bg-yellow-100 text-yellow-800",
      COMPLETED: "bg-green-100 text-green-800",
      DEFERRED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) return <div className="text-center py-8 text-gray-600">Loading audits...</div>;
  if (error) return <div className="bg-red-50 p-4 rounded text-red-700">{error}</div>;

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {["PLANNED", "IN_PROGRESS", "COMPLETED", "DEFERRED"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg transition ${
              statusFilter === status
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:border-blue-600"
            }`}
          >
            {status.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Audits Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {audits.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <p>No audits found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Dates</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Findings</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {audits.map((audit) => (
                <tr key={audit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    <Link href={`/hgqs/audits/${audit.id}`} className="text-blue-600 hover:underline font-medium">
                      {audit.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{audit.auditType}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${getStatusBadge(audit.status)}`}>
                      {audit.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(audit.startDate).toLocaleDateString()} - {new Date(audit.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="text-gray-600">{audit.findings.length} finding{audit.findings.length !== 1 ? "s" : ""}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/hgqs/audits/${audit.id}`} className="text-blue-600 hover:underline text-sm">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
