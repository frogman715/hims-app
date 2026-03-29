"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";
import { Button } from "@/components/ui/Button";

interface ManpowerRequisitionSummary {
  id: string;
  formNumber: string;
  position: string;
  department: string;
  numberOfVacancy: number;
  status: string;
}

interface PerformanceAppraisalSummary {
  id: string;
  employeeName: string;
  position: string;
  department: string;
  appraisalPeriod: string;
  overallScore: number;
  recommendation: string;
}

interface PurchaseOrderSummary {
  id: string;
  poNumber: string;
  supplierName: string;
  totalAmount: number;
  status: string;
  requestDate: string;
}

const MANAGEMENT_STATUS_LABELS: Record<string, string> = {
  APPROVED: "Approved",
  PENDING: "Pending Review",
  RECEIVED: "Received",
};

export default function HRManagementPage() {
  const [activeTab, setActiveTab] = useState("REQUISITIONS");
  const [requisitions, setRequisitions] = useState<ManpowerRequisitionSummary[]>([]);
  const [appraisals, setAppraisals] = useState<PerformanceAppraisalSummary[]>([]);
  const [purchases, setPurchases] = useState<PurchaseOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "REQUISITIONS") {
        const res = await fetch("/api/hr/requisitions");
        if (res.ok) {
          const data = await res.json();
          const requisitionList = Array.isArray(data.requisitions)
            ? (data.requisitions as ManpowerRequisitionSummary[])
            : [];
          setRequisitions(requisitionList);
        }
      } else if (activeTab === "APPRAISALS") {
        const res = await fetch("/api/hr/appraisals");
        if (res.ok) {
          const data = await res.json();
          const appraisalList = Array.isArray(data.appraisals)
            ? (data.appraisals as PerformanceAppraisalSummary[])
            : [];
          setAppraisals(appraisalList);
        }
      } else if (activeTab === "PURCHASES") {
        const res = await fetch("/api/admin/purchases");
        if (res.ok) {
          const data = await res.json();
          const purchaseList = Array.isArray(data.purchases)
            ? (data.purchases as PurchaseOrderSummary[])
            : [];
          setPurchases(purchaseList);
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const moduleCards = [
    {
      key: "REQUISITIONS",
      title: "Manpower Requisition",
      description: "Form HCF-AD-25: staffing requests and vacancy approvals.",
    },
    {
      key: "APPRAISALS",
      title: "Performance Appraisal",
      description: "Form HCF-AD-06: employee performance and recommendation records.",
    },
    {
      key: "PURCHASES",
      title: "Purchase Orders",
      description: "Form HCF-AD-15: procurement support for office and operational needs.",
    },
  ] as const;

  const requisitionPendingCount = requisitions.filter((item) => item.status === "PENDING").length;
  const appraisalAverageScore = appraisals.length
    ? (appraisals.reduce((sum, item) => sum + item.overallScore, 0) / appraisals.length).toFixed(1)
    : "0.0";
  const purchasePendingCount = purchases.filter((item) => item.status !== "RECEIVED").length;

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="HR Management"
        title="HR and administration management"
        subtitle="Decision-driven workspace for manpower requisitions, appraisal records, and purchasing support references."
        helperLinks={[
          { href: "/hr", label: "HR Workspace" },
          { href: "/dashboard", label: "Dashboard" },
        ]}
        highlights={[
          { label: "Pending Requisitions", value: requisitionPendingCount, detail: "Staffing requests still waiting for review or release." },
          { label: "Appraisal Average", value: appraisalAverageScore, detail: "Average score across loaded appraisal records." },
          { label: "Open Purchases", value: purchasePendingCount, detail: "Purchasing items that are not yet fully received." },
        ]}
        actions={(
          <Link href="/dashboard" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-800">
            Dashboard
          </Link>
        )}
      />

      <section className="surface-card space-y-8 p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)]">
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/80 p-5 text-sm text-slate-700">
            <h2 className="text-base font-semibold text-slate-900">Procedure alignment</h2>
            <p className="mt-2 leading-6">
              Keep manpower requisitions, appraisal outputs, and purchasing support records aligned with the approved HR and administration procedure. Use this desk for internal review, follow-up, and reference.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Desk Focus</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              <li>Track staffing requests and approval status.</li>
              <li>Review appraisal outcomes and recommendations.</li>
              <li>Monitor purchasing references for support services.</li>
            </ul>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">1. Review active queue</p>
            <p className="mt-2 text-sm text-slate-600">Start with items pending approval, recommendation, or procurement follow-up.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">2. Use one desk at a time</p>
            <p className="mt-2 text-sm text-slate-600">Switch by business function so staffing, appraisal, and purchase decisions do not mix.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">3. Keep outcomes traceable</p>
            <p className="mt-2 text-sm text-slate-600">Statuses and recommendations should stay readable for management review and audit follow-up.</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {moduleCards.map((card) => {
            const isActive = activeTab === card.key;
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => setActiveTab(card.key)}
                className={`rounded-2xl border p-5 text-left transition ${
                  isActive
                    ? "border-cyan-700 bg-slate-900 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-900 hover:border-cyan-300 hover:bg-slate-50"
                }`}
              >
                <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${isActive ? "text-cyan-200" : "text-slate-500"}`}>
                  {card.key}
                </p>
                <h3 className="mt-3 text-lg font-semibold">{card.title}</h3>
                <p className={`mt-2 text-sm leading-6 ${isActive ? "text-slate-200" : "text-slate-600"}`}>
                  {card.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {loading ? (
            <div className="flex min-h-[280px] items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-cyan-700" />
            </div>
          ) : (
            <>
              {activeTab === "REQUISITIONS" && (
                <div>
                  <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-900">Manpower Requisitions</h2>
                      <p className="mt-1 text-sm text-slate-600">
                        Review staffing requests, headcount justification, and approval progress.
                      </p>
                    </div>
                    <Button size="sm">New Requisition</Button>
                  </div>
                  {requisitions.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                      <p className="text-sm font-medium text-slate-700">No requisitions recorded.</p>
                      <p className="mt-2 text-sm text-slate-500">Open a new request when a vacancy or replacement demand is approved.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full min-w-[720px]">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Form No.</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Position</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Department</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Vacancies</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {requisitions.map((req) => (
                            <tr key={req.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-sm text-slate-700">{req.formNumber}</td>
                              <td className="px-4 py-3 text-sm font-medium text-slate-900">{req.position}</td>
                              <td className="px-4 py-3 text-sm text-slate-700">{req.department}</td>
                              <td className="px-4 py-3 text-sm text-slate-900">{req.numberOfVacancy}</td>
                              <td className="px-4 py-3">
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  req.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                                  req.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                                  "bg-slate-100 text-slate-700"
                                }`}>
                                  {MANAGEMENT_STATUS_LABELS[req.status] ?? req.status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <button type="button" className="text-sm font-medium text-cyan-700 hover:text-cyan-900">View</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "APPRAISALS" && (
                <div>
                  <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-900">Performance Appraisals</h2>
                      <p className="mt-1 text-sm text-slate-600">
                        Review scoring outcomes, department context, and appraisal recommendations.
                      </p>
                    </div>
                    <Button size="sm">New Appraisal</Button>
                  </div>
                  {appraisals.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                      <p className="text-sm font-medium text-slate-700">No appraisal records found.</p>
                      <p className="mt-2 text-sm text-slate-500">Create an appraisal record after the formal performance review cycle is completed.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {appraisals.map((appraisal) => (
                        <div key={appraisal.id} className="rounded-2xl border border-slate-200 p-5">
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div>
                              <h3 className="font-semibold text-slate-900">{appraisal.employeeName}</h3>
                              <p className="mt-1 text-sm text-slate-700">{appraisal.position} - {appraisal.department}</p>
                              <p className="mt-1 text-sm text-slate-500">Period: {appraisal.appraisalPeriod}</p>
                            </div>
                            <div className="text-left md:text-right">
                              <div className="text-2xl font-bold text-cyan-700">{appraisal.overallScore}/5.0</div>
                              <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                appraisal.recommendation === "EXCELLENT_PROMOTE" ? "bg-emerald-100 text-emerald-700" :
                                appraisal.recommendation === "GOOD_MAINTAIN" ? "bg-cyan-100 text-cyan-700" :
                                "bg-amber-100 text-amber-700"
                              }`}>
                                {appraisal.recommendation.replace(/_/g, " ")}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "PURCHASES" && (
                <div>
                  <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-900">Purchase Orders</h2>
                      <p className="mt-1 text-sm text-slate-600">
                        Monitor purchasing references, suppliers, and request status for administration support.
                      </p>
                    </div>
                    <Button size="sm">New Purchase Order</Button>
                  </div>
                  {purchases.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                      <p className="text-sm font-medium text-slate-700">No purchase orders recorded.</p>
                      <p className="mt-2 text-sm text-slate-500">Add a purchasing record once the internal request is approved for procurement follow-up.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full min-w-[720px]">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">PO Number</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Supplier</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {purchases.map((po) => (
                            <tr key={po.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-sm font-medium text-slate-900">{po.poNumber}</td>
                              <td className="px-4 py-3 text-sm text-slate-700">{po.supplierName}</td>
                              <td className="px-4 py-3 text-sm text-slate-900">${po.totalAmount.toLocaleString()}</td>
                              <td className="px-4 py-3">
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  po.status === "RECEIVED" ? "bg-emerald-100 text-emerald-700" :
                                  po.status === "APPROVED" ? "bg-cyan-100 text-cyan-700" :
                                  "bg-amber-100 text-amber-700"
                                }`}>
                                  {MANAGEMENT_STATUS_LABELS[po.status] ?? po.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-700">
                                {new Date(po.requestDate).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="border-t border-slate-200 pt-6 text-center text-sm text-slate-500">
          <p>HGQS Procedures Manual - Annex E | HR, Administration & Purchasing Procedures</p>
        </div>
      </section>
    </div>
  );
}
