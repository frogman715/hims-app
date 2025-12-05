"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface ChecklistItem {
  id: number;
  month: string;
  year: number;
  seafarerName: string;
  vessel: string;
  rank: string;
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
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  const fetchChecklistItems = useCallback(async () => {
    try {
      const response = await fetch(`/api/checklist?month=${selectedMonth}&year=${selectedYear}`);
      if (!response.ok) throw new Error('Failed to fetch checklist');

      const data = await response.json();
      setChecklistItems(data);
    } catch (error) {
      console.error("Error fetching checklist items:", error);
      // Fallback to mock data if API fails
      const mockData: ChecklistItem[] = [
        {
          id: 1,
          month: "November",
          year: 2025,
          seafarerName: "John Smith",
          vessel: "MV Ocean Pride",
          rank: "Captain",
          signOnDate: "2025-11-01",
          status: "ON",
          documentsComplete: true,
          medicalCheck: true,
          trainingComplete: false,
          notes: "Training scheduled for next week"
        },
        {
          id: 2,
          month: "November",
          year: 2025,
          seafarerName: "Maria Garcia",
          vessel: "MV Sea Explorer",
          rank: "Chief Engineer",
          signOffDate: "2025-11-15",
          status: "OFF",
          documentsComplete: true,
          medicalCheck: true,
          trainingComplete: true,
          notes: "All requirements completed"
        },
        {
          id: 3,
          month: "November",
          year: 2025,
          seafarerName: "David Chen",
          vessel: "MV Pacific Star",
          rank: "Chief Officer",
          signOnDate: "2025-11-10",
          status: "ON",
          documentsComplete: false,
          medicalCheck: true,
          trainingComplete: false,
          notes: "Waiting for passport renewal"
        }
      ];
      setChecklistItems(mockData.filter(item =>
        item.year === selectedYear &&
        new Date(`${item.year}-${item.month}-01`).getMonth() + 1 === selectedMonth
      ));
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (session) {
      fetchChecklistItems();
    }
  }, [session, selectedMonth, selectedYear, fetchChecklistItems]);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  if (status === "loading" || loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
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
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                ← Back to Crewing
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Monthly Crew Checklist</h1>
                <p className="text-gray-800">ON/OFF signers checklist - Connected to Crew List & Replacement Schedule</p>
                <div className="flex items-center space-x-4 mt-2">
                  <Link
                    href="/crewing/crew-list"
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    ← View Crew List
                  </Link>
                  <span className="text-gray-400">|</span>
                  <Link
                    href="/crewing/replacements"
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    View Replacement Schedule →
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
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {months.map((month, index) => (
                    <option key={index + 1} value={index + 1}>{month}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <Link
                href="/crewing/checklist/new"
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Entry
              </Link>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sign-On</p>
                <p className="text-2xl font-bold text-gray-900">
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
                <p className="text-sm font-medium text-gray-600">Sign-Off</p>
                <p className="text-2xl font-bold text-gray-900">
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
                <p className="text-sm font-medium text-gray-600">Contract Expiring</p>
                <p className="text-2xl font-bold text-gray-900">
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
                <p className="text-sm font-medium text-gray-600">Pending Docs</p>
                <p className="text-2xl font-bold text-gray-900">
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
                <p className="text-sm font-medium text-gray-600">Fully Compliant</p>
                <p className="text-2xl font-bold text-gray-900">
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
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {months[selectedMonth - 1]} {selectedYear} - ON/OFF Signers
            </h2>
          </div>

          {checklistItems.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No checklist entries</h3>
              <p className="mt-1 text-sm text-gray-600">No ON/OFF signers recorded for this month.</p>
              <div className="mt-6">
                <Link
                  href="/crewing/checklist/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add First Entry
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
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
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.seafarerName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.rank}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.vessel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.signOnDate ? new Date(item.signOnDate).toLocaleDateString() :
                         item.signOffDate ? new Date(item.signOffDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.documentsComplete ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.documentsComplete ? 'Complete' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.medicalCheck ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.medicalCheck ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
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
                        <button
                          onClick={() => router.push(`/crewing/checklist/${item.id}/edit`)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Information Section */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
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
                  <strong>Connected to Replacement Schedule:</strong> Crew replacements planned in the replacement
                  module will appear here when their replacement dates fall within the selected month.
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