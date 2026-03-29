'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { canAccessOfficePath } from "@/lib/office-access";
import { normalizeToUserRoles } from "@/lib/type-guards";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";

interface Risk {
  id: string;
  title?: string;
  source: string;
  likelihood: number;
  consequence: number;
  level: string;
  mitigation: string;
  pic: string;
  residual: number | null;
  status?: string;
}

export default function Risks() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    source: '',
    likelihood: '1',
    consequence: '1',
    level: 'Low',
    mitigation: '',
    pic: '',
    residual: '',
  });
  const userRoles = normalizeToUserRoles(session?.user?.roles ?? session?.user?.role);
  const isSystemAdmin = session?.user?.isSystemAdmin === true;
  const canManageRisks = canAccessOfficePath("/api/risks", userRoles, isSystemAdmin, "POST");

  const fetchRisks = useCallback(async () => {
    try {
      const response = await fetch("/api/risks");
      if (response.ok) {
        const data = await response.json();
        const rows = Array.isArray(data?.data) ? data.data : [];
        setRisks(rows.map((risk: {
          id: string;
          title?: string | null;
          source?: string | null;
          probability?: number | null;
          impact?: number | null;
          riskScore?: number | null;
          treatmentPlan?: string | null;
          createdBy?: { name?: string | null } | null;
          status?: string | null;
        }) => ({
          id: risk.id,
          title: risk.title ?? undefined,
          source: risk.source ?? "Unknown source",
          likelihood: risk.probability ?? 0,
          consequence: risk.impact ?? 0,
          level: calculateRiskLevel(risk.probability ?? 0, risk.impact ?? 0),
          mitigation: risk.treatmentPlan ?? "",
          pic: risk.createdBy?.name ?? "System",
          residual: risk.riskScore ?? null,
          status: risk.status ?? undefined,
        })));
      }
    } catch (error) {
      console.error("Error fetching risks:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    } else {
      fetchRisks();
    }
  }, [fetchRisks, session, status, router]);

  const calculateRiskLevel = (likelihood: number, consequence: number) => {
    const score = likelihood * consequence;
    if (score >= 15) return 'Critical';
    if (score >= 8) return 'High';
    if (score >= 4) return 'Medium';
    return 'Low';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageRisks) {
      return;
    }
    const likelihood = parseInt(formData.likelihood);
    const consequence = parseInt(formData.consequence);
    try {
      const response = await fetch("/api/risks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.source,
          description: formData.mitigation,
          source: formData.source,
          probability: likelihood,
          impact: consequence,
          treatmentPlan: formData.mitigation,
        }),
      });

      if (response.ok) {
        setShowForm(false);
        setFormData({ source: '', likelihood: '1', consequence: '1', level: 'Low', mitigation: '', pic: '', residual: '' });
        fetchRisks();
      }
    } catch (error) {
      console.error("Error creating risk:", error);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const criticalCount = risks.filter((risk) => risk.level === "Critical").length;
  const highCount = risks.filter((risk) => risk.level === "High").length;
  const mediumCount = risks.filter((risk) => risk.level === "Medium").length;

  if (status === "loading" || loading) {
    return <div className="section-stack"><div className="surface-card px-6 py-12 text-center text-sm text-slate-600">Loading risk register...</div></div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="section-stack mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <WorkspaceHero
        eyebrow="Quality Risk Register"
        title="Risk register"
        subtitle="Identify, review, and mitigate operational or management risks from one structured quality workspace."
        helperLinks={[
          { href: "/quality", label: "Quality workspace" },
          { href: "/quality/hgqs-compliance", label: "Compliance tracking" },
          { href: "/dashboard", label: "Dashboard" },
        ]}
        highlights={[
          { label: "Total Risks", value: risks.length.toLocaleString("id-ID"), detail: "All risks currently listed in the register." },
          { label: "Critical", value: criticalCount.toLocaleString("id-ID"), detail: "Highest-exposure items needing fastest review." },
          { label: "High", value: highCount.toLocaleString("id-ID"), detail: "Risks requiring active mitigation follow-up." },
          { label: "Medium", value: mediumCount.toLocaleString("id-ID"), detail: "Items that should stay visible before escalation." },
        ]}
        actions={(
          <>
            <Link
              href="/quality"
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700"
            >
              Back to quality
            </Link>
            <button
              type="button"
              onClick={() => {
                if (!canManageRisks) return;
                setShowForm(true);
              }}
              disabled={!canManageRisks}
              className="inline-flex items-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {canManageRisks ? "Add risk" : "View only"}
            </button>
          </>
        )}
      />

      <main>
        <div>
          {/* Risk Register Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="px-6 py-4 border-b border-gray-300">
              <h2 className="text-xl font-semibold text-gray-900">Risk Assessment Matrix</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Likelihood
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Consequence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mitigation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PIC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Residual
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {risks.map((risk) => (
                    <tr key={risk.id} className="hover:bg-gray-100">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{risk.title || risk.source}</div>
                        {risk.title && risk.title !== risk.source ? (
                          <div className="text-xs text-gray-500 mt-1">{risk.source}</div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {risk.likelihood}/5
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {risk.consequence}/5
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-4 py-2 text-xs font-semibold rounded-full ${getRiskColor(risk.level)}`}>
                          {risk.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {risk.mitigation}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {risk.pic}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {risk.residual ? `${risk.residual}/25` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Add Risk Form Modal */}
      {showForm && canManageRisks ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-extrabold text-gray-900 mb-6">Add Risk Assessment</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Risk Source
                </label>
                <textarea
                  required
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Describe the source of the risk"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                    Likelihood (1-5)
                  </label>
                  <select
                    value={formData.likelihood}
                    onChange={(e) => setFormData({ ...formData, likelihood: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="1">1 - Very Low</option>
                    <option value="2">2 - Low</option>
                    <option value="3">3 - Medium</option>
                    <option value="4">4 - High</option>
                    <option value="5">5 - Very High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                    Consequence (1-5)
                  </label>
                  <select
                    value={formData.consequence}
                    onChange={(e) => setFormData({ ...formData, consequence: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="1">1 - Minor</option>
                    <option value="2">2 - Moderate</option>
                    <option value="3">3 - Significant</option>
                    <option value="4">4 - Major</option>
                    <option value="5">5 - Catastrophic</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Mitigation Measures
                </label>
                <textarea
                  required
                  value={formData.mitigation}
                  onChange={(e) => setFormData({ ...formData, mitigation: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Describe measures to mitigate this risk"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Person In Charge (PIC)
                </label>
                <input
                  type="text"
                  required
                  value={formData.pic}
                  onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Name of person responsible for mitigation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Residual Risk Score (Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={formData.residual}
                  onChange={(e) => setFormData({ ...formData, residual: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Risk score after mitigation (1-25)"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Add Risk
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
