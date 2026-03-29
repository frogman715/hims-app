'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getDocumentTypeLabel } from "@/lib/document-types";
import DocumentActions from "./DocumentActions";
import { canAccessOfficePath } from "@/lib/office-access";
import {
  DOCUMENT_CONTROL_WARNING_MONTHS,
  getDocumentExpiryPresentation,
  getDocumentExpiryState,
} from "@/lib/document-expiry";
import { normalizeToUserRoles } from "@/lib/type-guards";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";

interface SeafarerDocument {
  id: string;
  crewId: string;
  crew: {
    id: string;
    fullName: string | null;
  };
  docType: string;
  docNumber: string;
  issueDate: string | null;
  expiryDate: string | null;
  remarks: string | null;
  fileUrl?: string | null;
}

function getCrewDisplayName(crew: SeafarerDocument["crew"]) {
  const normalized = crew.fullName?.trim();
  return normalized && normalized.length > 0 ? normalized : `Crew ${crew.id}`;
}

export default function Documents() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [documents, setDocuments] = useState<SeafarerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all'); // all, expiring, expired
  const [searchTerm, setSearchTerm] = useState('');
  const userRoles = normalizeToUserRoles(session?.user?.roles ?? session?.user?.role);
  const isSystemAdmin = session?.user?.isSystemAdmin === true;
  const canManageDocuments = canAccessOfficePath("/api/documents", userRoles, isSystemAdmin, "POST");

  const fetchDocuments = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/documents", { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      } else {
        const payload = await response.json().catch(() => null);
        if (response.status === 401) {
          router.push("/auth/signin");
          return;
        }
        if (response.status === 403) {
          setError(payload?.error || "Access to crew documents is restricted for your role.");
          setDocuments([]);
          return;
        }
        setError(payload?.error || "Document data could not be loaded. Please try again or contact admin.");
        setDocuments([]);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      setError("Document data could not be loaded. Please try again or contact admin.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Read filter from URL query params on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const filterParam = params.get('filter');
      const typeParam = params.get('type');
      // Set initial filter from URL, default to 'all' if not specified
      const initialFilter = filterParam || typeParam || 'all';
      setFilter(initialFilter);
    }
  }, []);

  // Update URL when filter changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (filter === 'all') {
        params.delete('filter');
      } else {
        params.set('filter', filter);
      }
      const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [filter]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    } else {
      fetchDocuments();
    }
  }, [fetchDocuments, router, session, status]);

  const getStatusColor = (expiryDate: string | null) => {
    return getDocumentExpiryPresentation(expiryDate).className;
  };

  const getStatusText = (expiryDate: string | null) => {
    return getDocumentExpiryPresentation(expiryDate).label;
  };

  const filteredDocuments = useMemo(() => {
    const now = new Date();

    const base = (() => {
      switch (filter) {
        case 'expiring':
          return documents.filter((doc) => {
            if (!doc.expiryDate) return false;
            return getDocumentExpiryState(doc.expiryDate, now) === 'EXPIRING_SOON';
          });
        case 'expired':
          return documents.filter((doc) => {
            return getDocumentExpiryState(doc.expiryDate, now) === 'EXPIRED';
          });
        default:
          return documents;
      }
    })();

    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return base;
    }

    return base.filter((doc) => {
      const values = [getCrewDisplayName(doc.crew), doc.docType, doc.docNumber, doc.remarks ?? ""];
      return values.some((value) => value?.toLowerCase().includes(query));
    });
  }, [documents, filter, searchTerm]);

  const expiringSoonCount = useMemo(() => {
    const now = new Date();
    return documents.filter((doc) => {
      return getDocumentExpiryState(doc.expiryDate, now) === 'EXPIRING_SOON';
    }).length;
  }, [documents]);

  const expiredCount = useMemo(
    () =>
      documents.filter((doc) => {
        return getDocumentExpiryState(doc.expiryDate) === 'EXPIRED';
      }).length,
    [documents]
  );

  if (status === "loading" || loading) {
    return (
      <div className="section-stack">
        <section className="surface-card flex min-h-[320px] flex-col items-center justify-center gap-4 p-8">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-cyan-700" />
          <p className="text-sm font-semibold text-gray-700">Loading documents…</p>
        </section>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Document Control"
        title="Document control register"
        subtitle="Central register for STCW certificates, passports, visas, medical records, and renewal follow-up across the active crew pool."
        helperLinks={[
          { href: "/crewing/seafarers", label: "Seafarer records" },
          { href: "/crewing/prepare-joining", label: "Prepare joining" },
          { href: "/dashboard", label: "Dashboard" },
        ]}
        highlights={[
          { label: "All Documents", value: documents.length.toLocaleString("id-ID"), detail: "Records currently visible in the controlled register." },
          { label: `Expiring ≤ ${DOCUMENT_CONTROL_WARNING_MONTHS} Months`, value: expiringSoonCount.toLocaleString("id-ID"), detail: "Renewal cases that need follow-up soon." },
          { label: "Expired", value: expiredCount.toLocaleString("id-ID"), detail: "Documents already outside valid operating window." },
          { label: "Filtered View", value: filteredDocuments.length.toLocaleString("id-ID"), detail: "Records currently shown after filter and search." },
        ]}
        actions={(
          <>
            {canManageDocuments ? (
              <Link
                href="/crewing/documents/new"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <span className="text-lg leading-none">＋</span>
                Upload new document
              </Link>
            ) : null}
            <Link
              href="/crewing"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-600"
            >
              Back to crewing
            </Link>
          </>
        )}
      />

        <section className="rounded-2xl border border-blue-200 bg-blue-50 px-6 py-4">
          <p className="text-sm font-semibold text-blue-900">Working guidance</p>
          <p className="mt-1 text-sm text-blue-800">
            {canManageDocuments
              ? "Use this register to review completeness, expiry, and file quality. Document control owns uploads, replacements, and metadata correction."
              : "Use this register to view and cross-check completeness and expiry. Document entry, replacement, and deletion remain with document control."}
          </p>
        </section>

        {error ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4">
            <p className="text-sm font-semibold text-rose-900">Document data could not be loaded</p>
            <p className="mt-1 text-sm text-rose-800">{error}</p>
          </section>
        ) : null}

        <section className="surface-card p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Document status filter</h2>
              <p className="text-sm text-gray-600">Filter by expiry status or search by crew name, document type, number, or remarks.</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                Advisory only. Expiring document visibility supports manual office follow-up and does not approve readiness automatically.
              </p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
              <div className="relative w-full md:w-72">
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search documents..."
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <svg
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a4.5 4.5 0 013.773 7.036l3.346 3.346a.75.75 0 11-1.06 1.06l-3.346-3.345A4.5 4.5 0 1110.5 6z" />
                </svg>
              </div>
              <div className="inline-flex flex-wrap gap-2 justify-end">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  All ({documents.length})
                </button>
                <button
                  onClick={() => setFilter('expiring')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    filter === 'expiring'
                      ? 'bg-amber-500 text-white shadow'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Expiring ≤{DOCUMENT_CONTROL_WARNING_MONTHS} months ({expiringSoonCount})
                </button>
                <button
                  onClick={() => setFilter('expired')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    filter === 'expired'
                      ? 'bg-rose-500 text-white shadow'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Expired ({expiredCount})
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="surface-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {filter === 'all' ? 'All Documents' : filter === 'expiring' ? 'Expiring Documents' : 'Expired Documents' }
            </h2>
            <span className="text-sm font-medium text-gray-600">{formatSummaryLabel(filter, filteredDocuments.length)}</span>
          </div>

          {filteredDocuments.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-600">
              No documents match the current filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Seafarer</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Document Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Document Number</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Issue Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Expiry Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredDocuments.map((document) => (
                    <tr key={document.id} className="hover:bg-blue-50/40 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        <Link href={`/crewing/seafarers/${document.crew.id}/biodata`} className="hover:text-blue-700">
                          {getCrewDisplayName(document.crew)}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{getDocumentTypeLabel(document.docType)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{document.docNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {document.issueDate ? new Date(document.issueDate).toLocaleDateString('id-ID') : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {document.expiryDate ? new Date(document.expiryDate).toLocaleDateString('id-ID') : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full ${getStatusColor(document.expiryDate)}`}>
                          {getStatusText(document.expiryDate)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        <DocumentActions
                          documentId={document.id}
                          docNumber={document.docNumber}
                          fileUrl={document.fileUrl ?? null}
                          canEdit={canManageDocuments}
                          canDelete={canManageDocuments}
                          onDeleteSuccess={() => fetchDocuments()}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
    </div>
  );
}

function formatSummaryLabel(filter: string, count: number) {
  if (filter === 'all') {
    return `${count} documents listed`;
  }
  if (filter === 'expiring') {
    return `${count} documents need renewal within ${DOCUMENT_CONTROL_WARNING_MONTHS} months`;
  }
  return `${count} documents already expired`;
}
