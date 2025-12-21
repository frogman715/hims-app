"use client";

import { useState, useEffect } from "react";

import Link from "next/link";

interface Risk {
  id: string;
  title: string;
  description: string;
  source: string;
  probability: number;
  impact: number;
  riskScore: number;
  status: string;
  treatmentStrategy: string;
  createdAt: string;
  createdBy: { name: string; email: string };
  actions: Array<{ status: string }>;
  reviews: Array<{ id: string }>;
}

interface RiskListProps {
  canEdit: boolean;
}

export default function RiskListContent({ canEdit }: RiskListProps) {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ACTIVE");

  useEffect(() => {
    fetchRisks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function fetchRisks() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/risks?status=${statusFilter}&limit=50`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch risks: ${res.status}`);
      }

      const data = await res.json();
      setRisks(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const getRiskColor = (score: number) => {
    if (score >= 15) return "red";
    if (score >= 10) return "yellow";
    return "green";
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: "bg-blue-100 text-blue-800",
      MITIGATED: "bg-green-100 text-green-800",
      ACCEPTED: "bg-yellow-100 text-yellow-800",
      TRANSFERRED: "bg-purple-100 text-purple-800",
      CLOSED: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading risks...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p>Error loading risks: {error}</p>
      </div>
    );
  }

  if (risks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-600">
        <p className="text-lg">No risks found</p>
        {canEdit && (
          <Link href="/hgqs/risks/new" className="text-blue-600 hover:underline mt-2">
            Create the first risk
          </Link>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {["ACTIVE", "MITIGATED", "ACCEPTED", "TRANSFERRED", "CLOSED"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg transition ${
              statusFilter === status
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:border-blue-600"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Risk Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Source</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Score</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Strategy</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {risks.map((risk) => (
              <tr key={risk.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm">
                  <Link
                    href={`/hgqs/risks/${risk.id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {risk.title}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{risk.source}</td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`inline-block px-3 py-1 rounded-full font-semibold text-${getRiskColor(risk.riskScore)}-700 bg-${getRiskColor(risk.riskScore)}-100`}
                  >
                    {risk.riskScore}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${getStatusBadge(risk.status)}`}>
                    {risk.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{risk.treatmentStrategy}</td>
                <td className="px-6 py-4 text-sm">
                  <span className="text-gray-600">
                    {risk.actions.length} actions | {risk.reviews.length} reviews
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/hgqs/risks/${risk.id}`}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mt-8">
        {risks.length > 0 && (
          <>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600">Total Risks</p>
              <p className="text-2xl font-bold text-gray-900">{risks.length}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600">High Risks (Score ≥ 15)</p>
              <p className="text-2xl font-bold text-red-600">
                {risks.filter((r) => r.riskScore >= 15).length}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600">Avg Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {(risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length).toFixed(1)}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-blue-600">
                {risks.filter((r) => r.status === "ACTIVE").length}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
