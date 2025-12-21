"use client";

import { useState, useEffect } from "react";


interface AuditSchedule {
  id: string;
  title: string;
  description: string;
  auditType: string;
  status: string;
  startDate: string;
  endDate: string;
  scope: string[];
  auditedAreas: string[];
  findings: Array<{
    id: string;
    findingNumber: string;
    clause: string;
    description: string;
    severity: string;
    evidence: string[];
  }>;
  report: {
    id: string;
    reportNumber: string;
    summary: string;
    recommendations: string[];
    findings: Record<string, unknown>;
    status: string;
    generatedAt: string;
  } | null;
}

interface AuditDetailProps {
  auditId: string;
  canEdit: boolean;
}

export default function AuditDetailContent({ auditId, canEdit }: AuditDetailProps) {
  const [audit, setAudit] = useState<AuditSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFindingForm, setShowFindingForm] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [findingForm, setFindingForm] = useState({
    clause: "",
    description: "",
    severity: "OBSERVATION",
    evidence: "",
  });
  const [reportForm, setReportForm] = useState({
    summary: "",
    recommendations: "",
    findings: { majorNC: 0, minorNC: 0, observations: 0 },
  });

  useEffect(() => {
    fetchAudit();
  }, []);

  async function fetchAudit() {
    try {
      const res = await fetch(`/api/audits/${auditId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch audit");
      const data = await res.json();
      setAudit(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading audit");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddFinding(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch(`/api/audits/${auditId}/findings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...findingForm,
          evidence: findingForm.evidence.split("\n").filter((e) => e.trim()),
        }),
      });
      if (!res.ok) throw new Error("Failed to add finding");
      setFindingForm({ clause: "", description: "", severity: "OBSERVATION", evidence: "" });
      setShowFindingForm(false);
      fetchAudit();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    }
  }

  async function handleGenerateReport(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch(`/api/audits/${auditId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          summary: reportForm.summary,
          recommendations: reportForm.recommendations.split("\n").filter((r) => r.trim()),
          findings: reportForm.findings,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate report");
      setShowReportForm(false);
      fetchAudit();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    }
  }

  if (loading) return <div className="text-center py-8">Loading audit...</div>;
  if (error) return <div className="bg-red-50 p-4 rounded text-red-700">{error}</div>;
  if (!audit) return <div className="text-center py-8">Audit not found</div>;

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-8 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{audit.title}</h1>
        <p className="text-gray-600 mt-2">{audit.description}</p>

        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">Status</p>
            <p className="text-lg font-semibold">{audit.status}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">Type</p>
            <p className="text-lg font-semibold">{audit.auditType}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">Start Date</p>
            <p className="text-lg font-semibold">{new Date(audit.startDate).toLocaleDateString()}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">End Date</p>
            <p className="text-lg font-semibold">{new Date(audit.endDate).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Scope & Areas */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Scope</h2>
          <ul className="space-y-2">
            {audit.scope?.map((item, i) => (
              <li key={i} className="text-gray-700">
                • {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Audited Areas</h2>
          <ul className="space-y-2">
            {audit.auditedAreas?.map((item, i) => (
              <li key={i} className="text-gray-700">
                • {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Findings Section */}
      <div className="bg-white rounded-lg shadow p-8 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Findings ({audit.findings?.length || 0})</h2>
          {canEdit && (
            <button
              onClick={() => setShowFindingForm(!showFindingForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {showFindingForm ? "Cancel" : "+ Add Finding"}
            </button>
          )}
        </div>

        {showFindingForm && (
          <form onSubmit={handleAddFinding} className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
            <input
              type="text"
              placeholder="ISO Clause"
              value={findingForm.clause}
              onChange={(e) => setFindingForm({ ...findingForm, clause: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mb-3 focus:outline-none focus:border-blue-500"
              required
            />
            <textarea
              placeholder="Finding description"
              value={findingForm.description}
              onChange={(e) => setFindingForm({ ...findingForm, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mb-3 focus:outline-none focus:border-blue-500"
              rows={2}
              required
            />
            <select
              value={findingForm.severity}
              onChange={(e) => setFindingForm({ ...findingForm, severity: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mb-3 focus:outline-none focus:border-blue-500"
            >
              <option>OBSERVATION</option>
              <option>MINOR_NC</option>
              <option>MAJOR_NC</option>
            </select>
            <textarea
              placeholder="Evidence (one per line)"
              value={findingForm.evidence}
              onChange={(e) => setFindingForm({ ...findingForm, evidence: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mb-3 focus:outline-none focus:border-blue-500"
              rows={2}
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Finding
            </button>
          </form>
        )}

        {audit.findings && audit.findings.length > 0 ? (
          <div className="space-y-3">
            {audit.findings.map((finding) => (
              <div key={finding.id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-semibold text-gray-900">{finding.findingNumber}: Clause {finding.clause}</p>
                  <span className="text-xs px-2 py-1 rounded bg-red-200 text-red-800">{finding.severity}</span>
                </div>
                <p className="text-gray-700">{finding.description}</p>
                {finding.evidence && finding.evidence.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    <p className="font-medium">Evidence:</p>
                    <ul>
                      {finding.evidence.map((e, i) => (
                        <li key={i}>• {e}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No findings yet</p>
        )}
      </div>

      {/* Report Section */}
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Audit Report</h2>
          {canEdit && !audit.report && (
            <button
              onClick={() => setShowReportForm(!showReportForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {showReportForm ? "Cancel" : "+ Generate Report"}
            </button>
          )}
        </div>

        {showReportForm && (
          <form onSubmit={handleGenerateReport} className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
            <textarea
              placeholder="Summary"
              value={reportForm.summary}
              onChange={(e) => setReportForm({ ...reportForm, summary: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mb-3 focus:outline-none focus:border-blue-500"
              rows={3}
              required
            />
            <textarea
              placeholder="Recommendations (one per line)"
              value={reportForm.recommendations}
              onChange={(e) => setReportForm({ ...reportForm, recommendations: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mb-3 focus:outline-none focus:border-blue-500"
              rows={3}
              required
            />
            <div className="grid grid-cols-3 gap-3 mb-3">
              <input
                type="number"
                placeholder="Major NC"
                value={reportForm.findings.majorNC}
                onChange={(e) =>
                  setReportForm({
                    ...reportForm,
                    findings: { ...reportForm.findings, majorNC: parseInt(e.target.value) },
                  })
                }
                className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
              <input
                type="number"
                placeholder="Minor NC"
                value={reportForm.findings.minorNC}
                onChange={(e) =>
                  setReportForm({
                    ...reportForm,
                    findings: { ...reportForm.findings, minorNC: parseInt(e.target.value) },
                  })
                }
                className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
              <input
                type="number"
                placeholder="Observations"
                value={reportForm.findings.observations}
                onChange={(e) =>
                  setReportForm({
                    ...reportForm,
                    findings: { ...reportForm.findings, observations: parseInt(e.target.value) },
                  })
                }
                className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Generate Report
            </button>
          </form>
        )}

        {audit.report ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-gray-600">Report Number</p>
            <p className="font-bold text-gray-900 mb-4">{audit.report.reportNumber}</p>
            <p className="text-sm text-gray-600">Summary</p>
            <p className="text-gray-700 mb-4">{audit.report.summary}</p>
            <p className="text-sm text-gray-600">Recommendations</p>
            <ul className="mb-4">
              {audit.report.recommendations?.map((rec, i) => (
                <li key={i} className="text-gray-700">
                  • {rec}
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-500">Generated: {new Date(audit.report.generatedAt).toLocaleString()}</p>
          </div>
        ) : (
          <p className="text-gray-600">No report generated yet</p>
        )}
      </div>
    </div>
  );
}
