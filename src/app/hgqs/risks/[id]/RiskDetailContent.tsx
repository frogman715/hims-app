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
  treatmentPlan: string;
  createdAt: string;
  createdBy: { id: string; name: string; email: string };
  actions: Array<{
    id: string;
    description: string;
    owner: string;
    dueDate: string;
    status: string;
  }>;
  reviews: Array<{
    id: string;
    effectiveness: string;
    notes: string;
    reviewDate: string;
  }>;
  auditLog: Array<{
    id: string;
    action: string;
    changedAt: string;
    changedBy: { name: string; email: string };
    changedFields: Record<string, unknown>;
  }>;
}

interface RiskDetailProps {
  riskId: string;
  canEdit: boolean;
}

export default function RiskDetailContent({ riskId, canEdit }: RiskDetailProps) {
  const [risk, setRisk] = useState<Risk | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showActionForm, setShowActionForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [actionForm, setActionForm] = useState({ description: "", owner: "", dueDate: "" });
  const [reviewForm, setReviewForm] = useState({ effectiveness: "EFFECTIVE", notes: "" });

  useEffect(() => {
    fetchRisk();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchRisk() {
    try {
      const res = await fetch(`/api/risks/${riskId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch risk");
      const data = await res.json();
      setRisk(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading risk");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddAction(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch(`/api/risks/${riskId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(actionForm),
      });
      if (!res.ok) throw new Error("Failed to add action");
      setActionForm({ description: "", owner: "", dueDate: "" });
      setShowActionForm(false);
      fetchRisk();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error adding action");
    }
  }

  async function handleAddReview(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch(`/api/risks/${riskId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(reviewForm),
      });
      if (!res.ok) throw new Error("Failed to add review");
      setReviewForm({ effectiveness: "EFFECTIVE", notes: "" });
      setShowReviewForm(false);
      fetchRisk();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error adding review");
    }
  }

  if (loading) return <div className="text-center py-8">Loading risk...</div>;
  if (error) return <div className="bg-red-50 p-4 rounded text-red-700">{error}</div>;
  if (!risk) return <div className="text-center py-8">Risk not found</div>;

  const getRiskColor = (score: number) => {
    if (score >= 15) return "bg-red-100 text-red-800 border-red-300";
    if (score >= 10) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-green-100 text-green-800 border-green-300";
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-8 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{risk.title}</h1>
            <p className="text-gray-600 mt-2">{risk.description}</p>
          </div>
          {canEdit && (
            <Link
              href={`/hgqs/risks/${riskId}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Edit
            </Link>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Risk Score</p>
            <p className={`text-2xl font-bold px-2 py-1 rounded ${getRiskColor(risk.riskScore)}`}>
              {risk.riskScore}
            </p>
            <p className="text-xs text-gray-500 mt-1">P:{risk.probability} × I:{risk.impact}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Status</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">{risk.status}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Source</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">{risk.source}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Treatment</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">{risk.treatmentStrategy}</p>
          </div>
        </div>
      </div>

      {/* Treatment Plan */}
      <div className="bg-white rounded-lg shadow p-8 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Treatment Plan</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{risk.treatmentPlan}</p>
      </div>

      {/* Actions Section */}
      <div className="bg-white rounded-lg shadow p-8 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Risk Actions</h2>
          {canEdit && (
            <button
              onClick={() => setShowActionForm(!showActionForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {showActionForm ? "Cancel" : "+ Add Action"}
            </button>
          )}
        </div>

        {showActionForm && (
          <form onSubmit={handleAddAction} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <input
              type="text"
              placeholder="Action description"
              value={actionForm.description}
              onChange={(e) => setActionForm({ ...actionForm, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mb-3 focus:outline-none focus:border-blue-500"
              required
            />
            <input
              type="email"
              placeholder="Owner email"
              value={actionForm.owner}
              onChange={(e) => setActionForm({ ...actionForm, owner: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mb-3 focus:outline-none focus:border-blue-500"
              required
            />
            <input
              type="date"
              value={actionForm.dueDate}
              onChange={(e) => setActionForm({ ...actionForm, dueDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mb-3 focus:outline-none focus:border-blue-500"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Action
            </button>
          </form>
        )}

        {risk.actions.length === 0 ? (
          <p className="text-gray-600">No actions yet</p>
        ) : (
          <div className="space-y-3">
            {risk.actions.map((action) => (
              <div key={action.id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-semibold text-gray-900">{action.description}</p>
                <div className="text-sm text-gray-600 mt-2">
                  <p>Owner: {action.owner}</p>
                  <p>Due: {new Date(action.dueDate).toLocaleDateString()}</p>
                  <p>Status: <span className="font-medium">{action.status}</span></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reviews Section */}
      <div className="bg-white rounded-lg shadow p-8 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Effectiveness Reviews</h2>
          {canEdit && (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {showReviewForm ? "Cancel" : "+ Add Review"}
            </button>
          )}
        </div>

        {showReviewForm && (
          <form onSubmit={handleAddReview} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <select
              value={reviewForm.effectiveness}
              onChange={(e) => setReviewForm({ ...reviewForm, effectiveness: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mb-3 focus:outline-none focus:border-blue-500"
            >
              <option>EFFECTIVE</option>
              <option>PARTIALLY_EFFECTIVE</option>
              <option>INEFFECTIVE</option>
            </select>
            <textarea
              placeholder="Review notes"
              value={reviewForm.notes}
              onChange={(e) => setReviewForm({ ...reviewForm, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mb-3 focus:outline-none focus:border-blue-500"
              rows={3}
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Review
            </button>
          </form>
        )}

        {risk.reviews.length === 0 ? (
          <p className="text-gray-600">No reviews yet</p>
        ) : (
          <div className="space-y-3">
            {risk.reviews.map((review) => (
              <div key={review.id} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="font-semibold text-gray-900">Effectiveness: {review.effectiveness}</p>
                <p className="text-gray-700 mt-2">{review.notes}</p>
                <p className="text-sm text-gray-600 mt-2">{new Date(review.reviewDate).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Log */}
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Audit Log</h2>
        {risk.auditLog.length === 0 ? (
          <p className="text-gray-600">No audit log entries</p>
        ) : (
          <div className="space-y-3">
            {risk.auditLog.map((log) => (
              <div key={log.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">{log.action}</p>
                    <p className="text-sm text-gray-600">{log.changedBy.name} ({log.changedBy.email})</p>
                  </div>
                  <p className="text-sm text-gray-500">{new Date(log.changedAt).toLocaleString()}</p>
                </div>
                {Object.keys(log.changedFields).length > 0 && (
                  <details className="mt-2">
                    <summary className="text-sm text-blue-600 cursor-pointer">View changes</summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(log.changedFields, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
