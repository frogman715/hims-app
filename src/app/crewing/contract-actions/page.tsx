"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface SeafarerWithIssues {
  name: string;
  seafarerId: number;
  documents: DocumentIssue[];
  contracts: ContractIssue[];
}

interface DocumentIssue {
  type: string;
  expiryDate: Date;
  daysUntilExpiry: number;
}

interface ContractIssue {
  vesselName: string;
  expiryDate: Date;
  daysUntilExpiry: number;
  assignmentId: number;
}

export default function ContractActionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [seafarersWithIssues, setSeafarersWithIssues] = useState<SeafarerWithIssues[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session) {
      fetchSeafarersWithIssues();
    }
  }, [session]);

  const fetchSeafarersWithIssues = async () => {
    try {
      const response = await fetch("/api/dashboard/stats");
      if (response.ok) {
        const data = await response.json();
        setSeafarersWithIssues(data.seafarersWithIssues || []);
      }
    } catch (error) {
      console.error("Error fetching seafarers with issues:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) return 'bg-red-100 text-red-800 border-red-200';
    if (daysUntilExpiry <= 30) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusText = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) return 'Expired';
    if (daysUntilExpiry === 0) return 'Expires Today';
    if (daysUntilExpiry === 1) return 'Expires Tomorrow';
    return `${daysUntilExpiry} days left`;
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading contract actions...</p>
        </div>
      </div>
    );
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
                href="/dashboard"
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-2xl"
              >
                ← Back to Dashboard
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Contract & Document Actions</h1>
                <p className="text-gray-800">Seafarers requiring immediate attention</p>
              </div>
            </div>
            <div className="bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-bold animate-pulse">
              {seafarersWithIssues.length} Seafarer{seafarersWithIssues.length !== 1 ? 's' : ''} Need Action
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-white text-xl font-extrabold">⚠️</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-red-800">Expired Contracts</p>
                  <p className="text-2xl font-extrabold text-red-900">
                    {seafarersWithIssues.reduce((acc, seafarer) =>
                      acc + seafarer.contracts.filter(c => c.daysUntilExpiry < 0).length, 0
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-white text-xl font-extrabold">📅</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-800">Expiring Soon</p>
                  <p className="text-2xl font-extrabold text-amber-900">
                    {seafarersWithIssues.reduce((acc, seafarer) =>
                      acc + seafarer.contracts.filter(c => c.daysUntilExpiry >= 0 && c.daysUntilExpiry <= 30).length, 0
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-white text-xl font-extrabold">📄</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">Document Issues</p>
                  <p className="text-2xl font-extrabold text-blue-900">
                    {seafarersWithIssues.reduce((acc, seafarer) => acc + seafarer.documents.length, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seafarers List */}
        {seafarersWithIssues.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-2xl">✅</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">All Clear!</h3>
            <p className="text-gray-700">No seafarers require immediate attention at this time.</p>
            <Link
              href="/dashboard"
              className="inline-flex items-center mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {seafarersWithIssues.map((seafarer, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-300 overflow-hidden hover:shadow-2xl transition-all duration-300">
                {/* Seafarer Header */}
                <div className="bg-gradient-to-r from-slate-600 to-slate-700 p-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-3 shadow-lg">
                      <span className="text-slate-700 text-lg font-bold">
                        {seafarer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg">{seafarer.name}</h3>
                      <p className="text-slate-200 text-sm">ID: {seafarer.seafarerId}</p>
                    </div>
                  </div>
                </div>

                {/* Issues List */}
                <div className="p-4 space-y-4">
                  {/* Contract Issues */}
                  {seafarer.contracts && seafarer.contracts.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <span className="text-red-600 mr-2">⚖️</span>
                        Contract Issues
                      </h4>
                      <div className="space-y-2">
                        {seafarer.contracts.map((contract, contractIndex) => (
                          <div key={contractIndex} className={`p-3 rounded-lg border ${getStatusColor(contract.daysUntilExpiry)}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{contract.vesselName}</span>
                              <span className="text-xs font-bold px-4 py-2 rounded-full bg-white">
                                {getStatusText(contract.daysUntilExpiry)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-700 mb-3">
                              Expires: {new Date(contract.expiryDate).toLocaleDateString()}
                            </p>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <Link
                                href={`/crewing/assignments/${contract.assignmentId}`}
                                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-3 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 text-center text-sm"
                              >
                                🔄 Extend Contract
                              </Link>
                              <Link
                                href={`/crewing/replacements/new?replaceSeafarerId=${seafarer.seafarerId}&assignmentId=${contract.assignmentId}`}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-3 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 text-center text-sm"
                              >
                                👤 Replace Crew
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Document Issues */}
                  {seafarer.documents && seafarer.documents.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <span className="text-blue-600 mr-2">📄</span>
                        Document Issues
                      </h4>
                      <div className="space-y-2">
                        {seafarer.documents.map((doc, docIndex) => (
                          <div key={docIndex} className={`p-3 rounded-lg border ${getStatusColor(doc.daysUntilExpiry)}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{doc.type}</span>
                              <span className="text-xs font-bold px-4 py-2 rounded-full bg-white">
                                {getStatusText(doc.daysUntilExpiry)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-700">
                              Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Document Action Button */}
                      <div className="mt-3">
                        <Link
                          href={`/crewing/seafarers/${seafarer.seafarerId}/documents`}
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 text-center text-sm inline-block"
                        >
                          📋 Manage Documents
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions Footer */}
        {seafarersWithIssues.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Quick Actions</h3>
                <p className="text-gray-700 text-sm">Common tasks for managing crew contracts and documents</p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/crewing/assignments"
                  className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  📅 All Assignments
                </Link>
                <Link
                  href="/crewing/replacements"
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  🔄 Crew Replacements
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}