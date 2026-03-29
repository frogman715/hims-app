"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { canAccessOfficePath } from "@/lib/office-access";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface ChecklistItem {
  id: string;
  crewId: string;
  month: string;
  year: number;
  crewName: string | null;
  vessel: string;
  rank: string | null;
  signOnDate?: string;
  signOffDate?: string;
  status: 'ON' | 'OFF' | 'CONTRACT_EXPIRING';
  documentsComplete: boolean;
  medicalCheck: boolean;
  trainingComplete: boolean;
  notes?: string;
}

export default function MonthlyChecklistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    const allowed = canAccessOfficePath(
      "/crewing/checklist",
      [...(session.user?.roles ?? []), session.user?.role ?? ""].filter(Boolean),
      session.user?.isSystemAdmin === true
    );

    if (!allowed) {
      setIsAuthorized(false);
      router.push("/dashboard");
      return;
    }
    setIsAuthorized(true);
  }, [session, status, router]);

  const fetchChecklistItems = useCallback(async () => {
    try {
      setLoadError(null);
      const response = await fetch(`/api/checklist?month=${selectedMonth}&year=${selectedYear}`);
      if (!response.ok) {
        throw new Error('Failed to fetch checklist');
      }

      const data = await response.json();
      setChecklistItems(data);
    } catch (error) {
      console.error("Error fetching checklist items:", error);
      setChecklistItems([]);
      setLoadError(error instanceof Error ? error.message : "Failed to load checklist");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (session && isAuthorized) {
      fetchChecklistItems();
    }
  }, [session, isAuthorized, selectedMonth, selectedYear, fetchChecklistItems]);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-sm font-medium text-slate-600">Loading monthly checklist...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="section-stack">
      <section className="surface-card p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700">Movement Compliance</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Monthly crew checklist</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Auto-generated ON/OFF signer review board linked to assignments and replacement planning.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm font-medium text-indigo-700">
              <Link href="/crewing/crew-list" className="hover:text-indigo-900">View crew list</Link>
              <Link href="/crewing/readiness" className="hover:text-indigo-900">Open readiness hub</Link>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => router.push("/crewing")}>
              Back to crewing
            </Button>
            <Button type="button" onClick={() => router.push("/crewing/readiness")}>
              Open readiness hub
            </Button>
          </div>
        </div>
      </section>

      <section className="surface-card p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[220px,220px,1fr]">
          <Select
            value={String(selectedMonth)}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            label="Month"
            options={months.map((month, index) => ({ value: String(index + 1), label: month }))}
          />
          <Select
            value={String(selectedYear)}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            label="Year"
            options={years.map((year) => ({ value: String(year), label: String(year) }))}
          />
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-900 shadow-sm">
            Reference board only. This checklist is derived from live assignment and replacement data. New manual entry is intentionally hidden so office staff do not create duplicate movement records.
          </div>
        </div>
      </section>

      {loadError ? (
        <section className="surface-card border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700 shadow-sm">
          {loadError}. Review the readiness hub or assignment records, then retry this page.
        </section>
      ) : null}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
          <div className="surface-card p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-700">Sign-On</p>
                <p className="text-2xl font-extrabold text-gray-900">
                  {checklistItems.filter(item => item.status === 'ON').length}
                </p>
              </div>
            </div>
          </div>

          <div className="surface-card p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📉</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-700">Sign-Off</p>
                <p className="text-2xl font-extrabold text-gray-900">
                  {checklistItems.filter(item => item.status === 'OFF').length}
                </p>
              </div>
            </div>
          </div>

          <div className="surface-card p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-700">Contract Expiring</p>
                <p className="text-2xl font-extrabold text-gray-900">
                  {checklistItems.filter(item => item.status === 'CONTRACT_EXPIRING').length}
                </p>
              </div>
            </div>
          </div>

          <div className="surface-card p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-700">Pending Docs</p>
                <p className="text-2xl font-extrabold text-gray-900">
                  {checklistItems.filter(item => !item.documentsComplete).length}
                </p>
              </div>
            </div>
          </div>

          <div className="surface-card p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-700">Fully Compliant</p>
                <p className="text-2xl font-extrabold text-gray-900">
                  {checklistItems.filter(item =>
                    item.documentsComplete && item.medicalCheck && item.trainingComplete
                  ).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Checklist Table */}
        <div className="surface-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-300">
            <h2 className="text-xl font-semibold text-gray-900">
              {months[selectedMonth - 1]} {selectedYear} - ON/OFF Signers
            </h2>
          </div>

          {checklistItems.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No checklist entries</h3>
              <p className="mt-1 text-sm text-gray-700">No ON/OFF signers recorded for this month.</p>
              <div className="mt-6">
                <Link
                  href="/crewing/readiness"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-md text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Open Readiness Hub
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-300">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Seafarer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vessel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documents
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Medical
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Training
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {checklistItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-100">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.crewName || 'Crew not recorded'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.rank}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.vessel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge
                          status={item.status === 'ON' ? 'ONBOARD' : item.status === 'OFF' ? 'OFF_SIGNED' : 'PENDING_REVIEW'}
                          label={item.status === 'ON' ? 'Sign-On' : item.status === 'OFF' ? 'Sign-Off' : 'Contract Expiring'}
                          className="px-4 py-2"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.signOnDate ? new Date(item.signOnDate).toLocaleDateString() :
                         item.signOffDate ? new Date(item.signOffDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge
                          status={item.documentsComplete ? 'APPROVED' : 'PENDING'}
                          label={item.documentsComplete ? 'Complete' : 'Pending Review'}
                          className="px-4 py-2"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge
                          status={item.medicalCheck ? 'APPROVED' : 'REJECTED'}
                          label={item.medicalCheck ? 'Passed' : 'Declined'}
                          className="px-4 py-2"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge
                          status={item.trainingComplete ? 'APPROVED' : 'PENDING'}
                          label={item.trainingComplete ? 'Complete' : 'Pending Review'}
                          className="px-4 py-2"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => router.push(`/crewing/checklist/${item.id}`)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          View
                        </button>
                        <span className="text-slate-400">Review only</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Information Section */}
        <section className="surface-card border-sky-200 bg-sky-50 p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">ℹ️</span>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold text-sky-900">How this checklist works</h3>
              <div className="space-y-2 text-sky-800">
                <p>
                  <strong>Auto-Populated from Crew List:</strong> This checklist automatically shows all crew members
                  scheduled for sign-on or sign-off in the selected month based on their assignment records.
                </p>
                <p>
                  <strong>Connected to Readiness Board:</strong> Crew change coordination now follows the readiness
                  board and assignment review flow, so this checklist only reflects validated movement records.
                </p>
                <p>
                  <strong>Document Verification:</strong> The system automatically checks for valid passports,
                  certificates (COC, COP, BST, GOC), and medical certificates from the seafarer&apos;s document records.
                </p>
                <p>
                  <strong>Compliance Tracking:</strong> Use this checklist to ensure all ON/OFF signers meet
                  regulatory requirements before boarding or disembarking vessels.
                </p>
              </div>
            </div>
          </div>
        </section>
    </div>
  );
}
