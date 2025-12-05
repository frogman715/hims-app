'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function Quality() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header with HGQS branding */}
      <header className="bg-white/80 backdrop-blur-lg shadow-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                HGQS Quality Management System
              </h1>
              <p className="text-lg text-gray-600 mt-2 font-medium">ISO 9001:2015 & MLC 2006 Compliant Quality Assurance</p>
              <div className="flex items-center space-x-4 mt-3">
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  ISO 9001:2015 Certified
                </div>
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  MLC 2006 Compliant
                </div>
                <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  HGQS-MM Rev. 00
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                ← Back to Dashboard
              </Link>
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                System Online
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        {/* HGQS Overview */}
        <div className="px-4 py-6 sm:px-0 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">HGQS Quality Management System Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link
                href="/quality/manual/main"
                className="group text-center p-4 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors duration-300"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-blue-600 text-2xl">📋</span>
                </div>
                <h3 className="font-semibold text-slate-800 group-hover:text-blue-700">HGQS Main Manual</h3>
                <p className="text-sm text-slate-600">ISO 9001:2015 & MLC 2006 Framework</p>
              </Link>
              <Link
                href="/quality/manual/procedures"
                className="group text-center p-4 rounded-lg border border-green-200 hover:bg-green-50 transition-colors duration-300"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-green-600 text-2xl">📖</span>
                </div>
                <h3 className="font-semibold text-slate-800 group-hover:text-green-700">HGQS Procedures Manual</h3>
                <p className="text-sm text-slate-600">Operational Procedures & Guidelines</p>
              </Link>
              <Link
                href="/quality/manual/guidelines"
                className="group text-center p-4 rounded-lg border border-purple-200 hover:bg-purple-50 transition-colors duration-300"
              >
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-purple-600 text-2xl">👥</span>
                </div>
                <h3 className="font-semibold text-slate-800 group-hover:text-purple-700">Management Guidelines</h3>
                <p className="text-sm text-slate-600">Office Employee Policies & Ethics</p>
              </Link>
            </div>
          </div>
        </div>

        {/* Core HGQS Modules */}
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Core Quality Management Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Document Control */}
            <Link
              href="/quality/documents"
              className="group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-xl font-bold">📋</span>
                </div>
                <h3 className="text-xl font-bold text-blue-900">Document Control</h3>
              </div>
              <p className="text-sm text-blue-700 leading-relaxed mb-4">
                HGQS Document Management System - Control quality documents, procedures, and maintain version control
              </p>
              <div className="flex items-center text-blue-600 text-sm font-medium">
                <span>Manage Documents</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Internal Audits */}
            <Link
              href="/quality/audits"
              className="group bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border border-green-200 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-xl font-bold">🔍</span>
                </div>
                <h3 className="text-xl font-bold text-green-900">Internal Audits</h3>
              </div>
              <p className="text-sm text-green-700 leading-relaxed mb-4">
                Conduct internal quality audits, track findings, and ensure ISO 9001:2015 compliance
              </p>
              <div className="flex items-center text-green-600 text-sm font-medium">
                <span>Manage Audits</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Non-conformance & CAPA */}
            <Link
              href="/quality/corrective-actions"
              className="group bg-gradient-to-br from-yellow-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 border border-orange-200 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-xl font-bold">🔧</span>
                </div>
                <h3 className="text-xl font-bold text-orange-900">Non-conformance & CAPA</h3>
              </div>
              <p className="text-sm text-orange-700 leading-relaxed mb-4">
                Track non-conformities, implement corrective and preventive actions (CAPA)
              </p>
              <div className="flex items-center text-orange-600 text-sm font-medium">
                <span>View Actions</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Risk Management */}
            <Link
              href="/quality/risks"
              className="group bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 border border-red-200 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-xl font-bold">⚠️</span>
                </div>
                <h3 className="text-xl font-bold text-red-900">Risk Management</h3>
              </div>
              <p className="text-sm text-red-700 leading-relaxed mb-4">
                Identify, assess, and mitigate operational risks - HGQS Risk Evaluation & Treatment
              </p>
              <div className="flex items-center text-red-600 text-sm font-medium">
                <span>View Risks</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Training Management */}
            <Link
              href="/quality/training"
              className="group bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 border border-indigo-200 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-xl font-bold">🎓</span>
                </div>
                <h3 className="text-xl font-bold text-indigo-900">Training Management</h3>
              </div>
              <p className="text-sm text-indigo-700 leading-relaxed mb-4">
                Employee training programs, competency assessment, and STCW compliance
              </p>
              <div className="flex items-center text-indigo-600 text-sm font-medium">
                <span>Manage Training</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Supplier Evaluation */}
            <Link
              href="/quality/suppliers"
              className="group bg-gradient-to-br from-teal-50 to-teal-100 hover:from-teal-100 hover:to-teal-200 border border-teal-200 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-xl font-bold">🏢</span>
                </div>
                <h3 className="text-xl font-bold text-teal-900">Supplier Evaluation</h3>
              </div>
              <p className="text-sm text-teal-700 leading-relaxed mb-4">
                Evaluate and monitor external providers, subcontractors, and service suppliers
              </p>
              <div className="flex items-center text-teal-600 text-sm font-medium">
                <span>Manage Suppliers</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>

          {/* Management Review - Full Width */}
          <div className="mt-8">
            <Link
              href="/quality/reviews"
              className="group bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border border-purple-200 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-105 block"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white text-xl font-bold">📊</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-purple-900">Management Review</h3>
                    <p className="text-sm text-purple-700 leading-relaxed mt-1">
                      Conduct management review meetings, track decisions, and monitor continuous improvement initiatives - HGQS Management Review Process
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-purple-600 text-sm font-medium">
                  <span>View Reviews</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}