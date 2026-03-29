'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { canAccessOfficePath } from "@/lib/office-access";
import { normalizeToUserRoles } from "@/lib/type-guards";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";

export default function Quality() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userRoles = normalizeToUserRoles(session?.user?.roles ?? session?.user?.role);
  const isSystemAdmin = session?.user?.isSystemAdmin === true;
  const canManageDocuments = canAccessOfficePath("/api/quality/documents", userRoles, isSystemAdmin, "POST");
  const canManageAudits = canAccessOfficePath("/api/quality/audits", userRoles, isSystemAdmin, "POST");
  const canManageCapa = canAccessOfficePath("/api/quality/corrective-actions", userRoles, isSystemAdmin, "POST");
  const canManageRisks = canAccessOfficePath("/api/quality/risks", userRoles, isSystemAdmin, "POST");
  const canManageReviews = canAccessOfficePath("/api/quality/reviews", userRoles, isSystemAdmin, "POST");

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
    <div className="section-stack mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <WorkspaceHero
        eyebrow="HGQS Quality System"
        title="HGQS quality management system"
        subtitle="International-office quality workspace for ISO 9001:2015, MLC 2006, audit readiness, CAPA control, risk visibility, and controlled documentation."
        helperLinks={[
          { href: "/quality/qmr-dashboard", label: "QMR dashboard" },
          { href: "/quality/documents", label: "Document control" },
          { href: "/quality/forms/reference", label: "Forms library" },
          { href: "/dashboard", label: "Dashboard" },
        ]}
        highlights={[
          { label: "Standard", value: "ISO 9001:2015", detail: "Quality framework for office and controlled processes." },
          { label: "Maritime Scope", value: "MLC 2006", detail: "Integrated into welfare, crewing, and management controls." },
          { label: "Manual Revision", value: "HGQS-MM Rev. 00", detail: "Reference baseline currently shown in the workspace." },
          { label: "Desk Status", value: "Review Desk Live", detail: "Open the relevant module for action, not just reference." },
        ]}
        actions={(
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700"
          >
            Back to dashboard
          </Link>
        )}
      />

      <main className="space-y-8">
        {/* HGQS Overview */}
        <div>
          <div className="surface-card p-6">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-4">HGQS Quality Management System Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link
                href="/quality/manual/main"
                className="group text-center p-4 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors duration-300"
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
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 mb-6">Core Quality Management Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Document Control */}
            <Link
              href="/quality/documents"
              className="group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-xl font-extrabold">📋</span>
                </div>
                <h3 className="text-xl font-extrabold text-blue-900">Document Control</h3>
              </div>
              <p className="text-sm text-blue-700 leading-relaxed mb-4">
                HGQS document control desk for controlled copies, revisions, and approval records.
              </p>
              <div className="flex items-center text-blue-600 text-sm font-medium">
                <span>{canManageDocuments ? "Manage Documents" : "Review Documents"}</span>
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
                  <span className="text-white text-xl font-extrabold">🔍</span>
                </div>
                <h3 className="text-xl font-extrabold text-green-900">Internal Audits</h3>
              </div>
              <p className="text-sm text-green-700 leading-relaxed mb-4">
                Audit planning, live schedules, findings follow-up, and audit evidence review.
              </p>
              <div className="flex items-center text-green-600 text-sm font-medium">
                <span>{canManageAudits ? "Manage Audits" : "Review Audits"}</span>
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
                  <span className="text-white text-xl font-extrabold">🔧</span>
                </div>
                <h3 className="text-xl font-extrabold text-orange-900">Non-conformance & CAPA</h3>
              </div>
              <p className="text-sm text-orange-700 leading-relaxed mb-4">
                Corrective action board for open CAPA, overdue items, and closure follow-up.
              </p>
              <div className="flex items-center text-orange-600 text-sm font-medium">
                <span>{canManageCapa ? "Manage CAPA" : "Review CAPA"}</span>
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
                  <span className="text-white text-xl font-extrabold">⚠️</span>
                </div>
                <h3 className="text-xl font-extrabold text-red-900">Risk Management</h3>
              </div>
              <p className="text-sm text-red-700 leading-relaxed mb-4">
                Risk register and mitigation watch for operational, compliance, and office exposure.
              </p>
              <div className="flex items-center text-red-600 text-sm font-medium">
                <span>{canManageRisks ? "Manage Risks" : "Review Risks"}</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* QMR Command */}
            <Link
              href="/quality/qmr-dashboard"
              className="group bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 border border-indigo-200 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-xl font-extrabold">👔</span>
                </div>
                <h3 className="text-xl font-extrabold text-indigo-900">QMR Command</h3>
              </div>
              <p className="text-sm text-indigo-700 leading-relaxed mb-4">
                Executive quality follow-up for tasks, audit exposure, open CAPA, and pending approvals.
              </p>
              <div className="flex items-center text-indigo-600 text-sm font-medium">
                <span>Open QMR Dashboard</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Forms Library */}
            <Link
              href="/quality/forms/reference"
              className="group bg-gradient-to-br from-teal-50 to-teal-100 hover:from-teal-100 hover:to-teal-200 border border-teal-200 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-xl font-extrabold">📄</span>
                </div>
                <h3 className="text-xl font-extrabold text-teal-900">Forms Library</h3>
              </div>
              <p className="text-sm text-teal-700 leading-relaxed mb-4">
                Controlled reference library for HGQS forms, templates, and downloadable support documents.
              </p>
              <div className="flex items-center text-teal-600 text-sm font-medium">
                <span>Open Forms Library</span>
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
                    <span className="text-white text-xl font-extrabold">📊</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-purple-900">Management Review</h3>
                    <p className="text-sm text-purple-700 leading-relaxed mt-1">
                      Management review desk for meeting records, decisions, and improvement follow-up.
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-purple-600 text-sm font-medium">
                  <span>{canManageReviews ? "Manage Reviews" : "Review Meetings"}</span>
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
