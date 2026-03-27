"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { canAccessOfficePath } from "@/lib/office-access";

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
    return <div>Loading monthly checklist...</div>;
  }

  if (!session) {
    return null;
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/crewing"
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-2xl"
              >
                ← Back to Crewing
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Monthly Crew Checklist</h1>
                <p className="text-gray-800">Auto-generated ON/OFF signer review board linked to assignments and replacement planning</p>
                <div className="flex items-center space-x-4 mt-2">
                  <Link
                    href="/crewing/crew-list"
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    ← View Crew List
                  </Link>
                  <span className="text-gray-700">|</span>
                  <Link
                    href="/crewing/readiness-board"
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Open Readiness Board →
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Month/Year Selector */}
              <div className="flex items-center space-x-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-400 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {months.map((month, index) => (
                    <option key={index + 1} value={index + 1}>{month}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-400 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <Link
                href="/crewing/readiness-board"
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-lg"
              >
                Open Readiness Board
              </Link>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-900 shadow-sm">
          Reference board only. This checklist is derived from live assignment and replacement data. New manual entry is intentionally hidden so office staff do not create duplicate movement records.
        </div>

        {loadError ? (
          <div className="mb-8 rounded-xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700 shadow-sm">
            {loadError}. Review the readiness board or assignment records, then retry this page.
          </div>
        ) : null}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
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

          <div className="bg-white rounded-xl shadow-lg p-6">
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

          <div className="bg-white rounded-xl shadow-lg p-6">
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

          <div className="bg-white rounded-xl shadow-lg p-6">
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

          <div className="bg-white rounded-xl shadow-lg p-6">
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
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
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
                  href="/crewing/readiness-board"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-md text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Open Readiness Board
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
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
                        <span className={`inline-flex px-4 py-2 text-xs font-semibold rounded-full ${
                          item.status === 'ON'
                            ? 'bg-green-100 text-green-800'
                            : item.status === 'OFF'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {item.status === 'ON' ? 'Sign-On' :
                           item.status === 'OFF' ? 'Sign-Off' : 'Contract Expiring'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.signOnDate ? new Date(item.signOnDate).toLocaleDateString() :
                         item.signOffDate ? new Date(item.signOffDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-4 py-2 text-xs font-semibold rounded-full ${
                          item.documentsComplete ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.documentsComplete ? 'Complete' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-4 py-2 text-xs font-semibold rounded-full ${
                          item.medicalCheck ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.medicalCheck ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-4 py-2 text-xs font-semibold rounded-full ${
                          item.trainingComplete ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.trainingComplete ? 'Complete' : 'Pending'}
                        </span>
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
        <div className="mt-8 bg-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">ℹ️</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">How This Checklist Works</h3>
              <div className="text-blue-800 space-y-2">
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
        </div>
      </div>
    </div>
  );
}
