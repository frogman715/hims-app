"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function HRManagementPage() {
  const [activeTab, setActiveTab] = useState("REQUISITIONS");
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [appraisals, setAppraisals] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "REQUISITIONS") {
        const res = await fetch("/api/hr/requisitions");
        if (res.ok) setRequisitions((await res.json()).requisitions || []);
      } else if (activeTab === "APPRAISALS") {
        const res = await fetch("/api/hr/appraisals");
        if (res.ok) setAppraisals((await res.json()).appraisals || []);
      } else if (activeTab === "PURCHASES") {
        const res = await fetch("/api/admin/purchases");
        if (res.ok) setPurchases((await res.json()).purchases || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1">
            <li><Link href="/dashboard" className="text-gray-700 hover:text-blue-600">Dashboard</Link></li>
            <li><span className="ml-1 text-gray-500">HR & Administration</span></li>
          </ol>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">HR & Administration Management</h1>
          <p className="text-gray-600 mt-1">HGQS Annex E - Human Resources, Administration & Purchasing</p>
        </div>

        {/* Module Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => setActiveTab("REQUISITIONS")}
            className={`p-6 rounded-xl text-left transition-all ${
              activeTab === "REQUISITIONS"
                ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg"
                : "bg-white text-gray-800 border-2 border-gray-200 hover:border-blue-300"
            }`}
          >
            <div className="text-4xl mb-3">👥</div>
            <h3 className="text-xl font-bold mb-2">Manpower Requisition</h3>
            <p className={`text-sm ${activeTab === "REQUISITIONS" ? "text-blue-100" : "text-gray-600"}`}>
              Form HCF-AD-25: Request new employees
            </p>
          </button>

          <button
            onClick={() => setActiveTab("APPRAISALS")}
            className={`p-6 rounded-xl text-left transition-all ${
              activeTab === "APPRAISALS"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                : "bg-white text-gray-800 border-2 border-gray-200 hover:border-purple-300"
            }`}
          >
            <div className="text-4xl mb-3">⭐</div>
            <h3 className="text-xl font-bold mb-2">Performance Appraisal</h3>
            <p className={`text-sm ${activeTab === "APPRAISALS" ? "text-purple-100" : "text-gray-600"}`}>
              Form HCF-AD-06: Employee evaluations
            </p>
          </button>

          <button
            onClick={() => setActiveTab("PURCHASES")}
            className={`p-6 rounded-xl text-left transition-all ${
              activeTab === "PURCHASES"
                ? "bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg"
                : "bg-white text-gray-800 border-2 border-gray-200 hover:border-green-300"
            }`}
          >
            <div className="text-4xl mb-3">🛒</div>
            <h3 className="text-xl font-bold mb-2">Purchase Orders</h3>
            <p className={`text-sm ${activeTab === "PURCHASES" ? "text-green-100" : "text-gray-600"}`}>
              Form HCF-AD-15: Equipment & supplies
            </p>
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {activeTab === "REQUISITIONS" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Manpower Requisitions</h2>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                      + New Requisition
                    </button>
                  </div>
                  {requisitions.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📋</div>
                      <p className="text-gray-600">No requisitions found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Form No.</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Position</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Department</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Vacancies</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {requisitions.map((req) => (
                            <tr key={req.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">{req.formNumber}</td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{req.position}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{req.department}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{req.numberOfVacancy}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  req.status === "APPROVED" ? "bg-green-100 text-green-800" :
                                  req.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                                  "bg-gray-100 text-gray-800"
                                }`}>
                                  {req.status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View</button>
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
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Performance Appraisals</h2>
                    <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">
                      + New Appraisal
                    </button>
                  </div>
                  {appraisals.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">⭐</div>
                      <p className="text-gray-600">No appraisals found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {appraisals.map((appraisal) => (
                        <div key={appraisal.id} className="border rounded-lg p-4">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="font-bold text-gray-900">{appraisal.employeeName}</h3>
                              <p className="text-sm text-gray-600">{appraisal.position} - {appraisal.department}</p>
                              <p className="text-sm text-gray-500">Period: {appraisal.appraisalPeriod}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-600">{appraisal.overallScore}/5.0</div>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                appraisal.recommendation === "EXCELLENT_PROMOTE" ? "bg-green-100 text-green-800" :
                                appraisal.recommendation === "GOOD_MAINTAIN" ? "bg-blue-100 text-blue-800" :
                                "bg-yellow-100 text-yellow-800"
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
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Purchase Orders</h2>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                      + New Purchase Order
                    </button>
                  </div>
                  {purchases.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🛒</div>
                      <p className="text-gray-600">No purchase orders found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">PO Number</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Supplier</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {purchases.map((po) => (
                            <tr key={po.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{po.poNumber}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{po.supplierName}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">${po.totalAmount.toLocaleString()}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  po.status === "RECEIVED" ? "bg-green-100 text-green-800" :
                                  po.status === "APPROVED" ? "bg-blue-100 text-blue-800" :
                                  "bg-yellow-100 text-yellow-800"
                                }`}>
                                  {po.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
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

        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>HGQS Procedures Manual - Annex E | HR, Administration & Purchasing Procedures</p>
        </div>
      </div>
    </div>
  );
}
