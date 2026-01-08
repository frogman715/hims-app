'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ComplianceItem {
  id: string;
  category: string;
  requirement: string;
  standard: string;
  status: "Compliant" | "Non-Compliant" | "Pending Review";
  lastReview: string;
  responsible: string;
  evidence: string[];
}

const HGQS_REQUIREMENTS: ComplianceItem[] = [
  // RECRUITMENT & PLACEMENT (Reg 1.4 MLC2006)
  {
    id: "mlc-1-1",
    category: "Recruitment & Placement",
    requirement: "No seafarers below 18 years of age employed",
    standard: "MLC 2006 Reg 1.1",
    status: "Compliant",
    lastReview: "2024-12-15",
    responsible: "Crewing Manager",
    evidence: ["PASPOR copies", "Seaman Book verification"],
  },
  {
    id: "mlc-1-2",
    category: "Medical Fitness",
    requirement: "All seafarers medically fit with valid PEME certificates",
    standard: "MLC 2006 Reg 1.2",
    status: "Compliant",
    lastReview: "2024-12-10",
    responsible: "Medical Officer",
    evidence: ["PEME certificates", "Medical clinic records"],
  },
  {
    id: "mlc-1-3",
    category: "Qualifications",
    requirement: "All seafarers properly trained and certified (STCW95)",
    standard: "MLC 2006 Reg 1.3 & STCW95",
    status: "Compliant",
    lastReview: "2024-12-08",
    responsible: "Training Manager",
    evidence: ["COC certificates", "Basic Safety training", "GMDSS certs"],
  },
  {
    id: "mlc-1-4",
    category: "Recruitment & Placement Service",
    requirement: "No fees charged to seafarers except statutory costs",
    standard: "MLC 2006 Reg 1.4",
    status: "Compliant",
    lastReview: "2024-11-30",
    responsible: "Finance Officer",
    evidence: ["Allotment records", "Contract agreements"],
  },
  
  // ISO 9001:2015 REQUIREMENTS
  {
    id: "iso-4-1",
    category: "Quality Management",
    requirement: "Quality policy established and communicated",
    standard: "ISO 9001:2015 Clause 5.2",
    status: "Compliant",
    lastReview: "2024-12-01",
    responsible: "QMR",
    evidence: ["Quality policy document", "HGQS manual", "Training records"],
  },
  {
    id: "iso-6-1",
    category: "Quality Management",
    requirement: "Risks and opportunities identified and addressed",
    standard: "ISO 9001:2015 Clause 6.1",
    status: "Compliant",
    lastReview: "2024-11-28",
    responsible: "QMR",
    evidence: ["Risk register", "Treatment table", "Management review"],
  },
  {
    id: "iso-7-1",
    category: "Resource Management",
    requirement: "Adequate resources provided for QMS implementation",
    standard: "ISO 9001:2015 Clause 7.1",
    status: "Compliant",
    lastReview: "2024-12-05",
    responsible: "Director",
    evidence: ["Budget allocation", "Staff records", "Infrastructure audit"],
  },
  {
    id: "iso-8-1",
    category: "Operations",
    requirement: "Service requirements determined and met",
    standard: "ISO 9001:2015 Clause 8.2",
    status: "Compliant",
    lastReview: "2024-12-12",
    responsible: "Crewing Manager",
    evidence: ["Customer contracts", "Service records"],
  },
  {
    id: "iso-9-2",
    category: "Evaluation",
    requirement: "Internal audits conducted semi-annually",
    standard: "ISO 9001:2015 Clause 9.2",
    status: "Compliant",
    lastReview: "2024-12-15",
    responsible: "Internal Auditor",
    evidence: ["Audit schedule", "Audit reports", "Findings & corrective actions"],
  },
  
  // OPERATIONAL REQUIREMENTS
  {
    id: "op-doc-control",
    category: "Document Control",
    requirement: "All documents reviewed, approved, and version controlled",
    standard: "HGQS-PM Clause 7.5.3",
    status: "Compliant",
    lastReview: "2024-12-10",
    responsible: "QMR",
    evidence: ["Master list", "Document log", "Revision history"],
  },
  {
    id: "op-records",
    category: "Records Management",
    requirement: "Quality records maintained and retained per schedule",
    standard: "HGQS-PM Clause 7.5.3.2",
    status: "Compliant",
    lastReview: "2024-12-08",
    responsible: "Document Officer",
    evidence: ["Record list", "Filing system", "Retention schedule"],
  },
  {
    id: "op-training",
    category: "Competence",
    requirement: "Seafarers training records and competency assessments",
    standard: "HGQS-MM Clause 7.2",
    status: "Compliant",
    lastReview: "2024-12-12",
    responsible: "Training Manager",
    evidence: ["Training certificates", "Appraisal reports", "Assessment forms"],
  },
];

const STATUS_COLORS = {
  "Compliant": "bg-green-100 text-green-800 border-green-200",
  "Non-Compliant": "bg-red-100 text-red-800 border-red-200",
  "Pending Review": "bg-yellow-100 text-yellow-800 border-yellow-200",
};

export default function HGQSCompliancePage() {
  const router = useRouter();
  const [items] = useState<ComplianceItem[]>(HGQS_REQUIREMENTS);
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");

  const categories = ["All", ...new Set(HGQS_REQUIREMENTS.map(i => i.category))];
  const statuses = ["All", "Compliant", "Non-Compliant", "Pending Review"];

  const filteredItems = items.filter(item => {
    const matchCategory = filterCategory === "All" || item.category === filterCategory;
    const matchStatus = filterStatus === "All" || item.status === filterStatus;
    return matchCategory && matchStatus;
  });

  const complianceStats = {
    total: items.length,
    compliant: items.filter(i => i.status === "Compliant").length,
    nonCompliant: items.filter(i => i.status === "Non-Compliant").length,
    pending: items.filter(i => i.status === "Pending Review").length,
  };

  const compliancePercentage = Math.round((complianceStats.compliant / complianceStats.total) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-slate-900/95 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">HGQS Compliance Tracking</h1>
              <p className="text-blue-200 mt-1">ISO 9001:2015 & MLC 2006 Compliance Dashboard</p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Compliance Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Compliance Score */}
          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg p-6 text-white shadow-lg">
            <div className="text-sm font-semibold opacity-90">Compliance Score</div>
            <div className="text-4xl font-bold mt-2">{compliancePercentage}%</div>
            <div className="text-xs opacity-75 mt-2">{complianceStats.compliant} of {complianceStats.total} items</div>
          </div>

          {/* Compliant Items */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
            <div className="text-sm font-semibold opacity-90">Compliant</div>
            <div className="text-4xl font-bold mt-2">{complianceStats.compliant}</div>
            <div className="text-xs opacity-75 mt-2">Requirements met</div>
          </div>

          {/* Non-Compliant Items */}
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white shadow-lg">
            <div className="text-sm font-semibold opacity-90">Non-Compliant</div>
            <div className="text-4xl font-bold mt-2">{complianceStats.nonCompliant}</div>
            <div className="text-xs opacity-75 mt-2">Requires attention</div>
          </div>

          {/* Pending Review */}
          <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
            <div className="text-sm font-semibold opacity-90">Pending Review</div>
            <div className="text-4xl font-bold mt-2">{complianceStats.pending}</div>
            <div className="text-xs opacity-75 mt-2">Under evaluation</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-lg rounded-lg border border-white/10 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-white/10 text-white rounded-lg focus:outline-none focus:border-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-white/10 text-white rounded-lg focus:outline-none focus:border-blue-500"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Compliance Items Table */}
        <div className="bg-white/5 backdrop-blur-lg rounded-lg border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Requirement</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Standard</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Responsible</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Last Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-white">{item.requirement}</div>
                          {item.evidence.length > 0 && (
                            <div className="text-xs text-gray-400 mt-1">
                              Evidence: {item.evidence.join(", ")}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{item.standard}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{item.category}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[item.status]}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{item.responsible}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{new Date(item.lastReview).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                      No compliance items match your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-blue-900/30 border border-blue-500/20 rounded-lg p-4 text-blue-100 text-sm">
          <div className="font-semibold mb-2">📋 Documentation References</div>
          <ul className="space-y-1 text-xs opacity-90">
            <li>• HGQS Main Manual (HGQS-MM) - ISO 9001:2015 & MLC 2006 Framework</li>
            <li>• HGQS Procedures Manual (HGQS-PM) - Operational procedures and guidelines</li>
            <li>• HGQS Management Guidelines (HGQS-MG) - Office employee policies</li>
            <li>• Seafarers Rights and CBA (HGD-SR) - Labor agreements and crew rights</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
