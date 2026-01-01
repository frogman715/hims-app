'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getDocumentTypeLabel } from "@/lib/document-types";
import DocumentActions from "./DocumentActions";

interface SeafarerDocument {
  id: string;
  crewId: string;
  crew: {
    id: string;
    fullName: string;
  };
  docType: string;
  docNumber: string;
  issueDate: string | null;
  expiryDate: string | null;
  remarks: string | null;
  fileUrl?: string | null;
}

export default function Documents() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [documents, setDocuments] = useState<SeafarerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, expiring, expired
  const [searchTerm, setSearchTerm] = useState('');

  // Read filter from URL query params (manual parse to avoid useSearchParams issue)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const filterParam = params.get('filter');
      const typeParam = params.get('type');
      if (filterParam) {
        setFilter(filterParam);
      } else if (typeParam) {
        setFilter(typeParam);
      }
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
  }, [session, status, router]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/documents");
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const getExpiringThreshold = (reference: Date) => {
    const threshold = new Date(reference.getTime());
    threshold.setMonth(threshold.getMonth() + 14);
    return threshold;
  };

  const getStatusColor = (expiryDate: string | null) => {
    if (!expiryDate) return 'bg-gray-100 text-gray-800';

    const now = new Date();
    const expiry = new Date(expiryDate);
    const expiringThreshold = getExpiringThreshold(now);

    if (expiry <= now) return 'bg-rose-100 text-rose-700';
    if (expiry <= expiringThreshold) return 'bg-amber-100 text-amber-700';
    return 'bg-emerald-100 text-emerald-700';
  };

  const getStatusText = (expiryDate: string | null) => {
    if (!expiryDate) return 'No Expiry';

    const now = new Date();
    const expiry = new Date(expiryDate);
    const expiringThreshold = getExpiringThreshold(now);

    if (expiry <= now) return 'Expired';
    if (expiry <= expiringThreshold) return 'Expiring Soon';
    return 'Valid';
  };

  const filteredDocuments = useMemo(() => {
    const now = new Date();
    const expiringThreshold = getExpiringThreshold(now);

    const base = (() => {
      switch (filter) {
        case 'expiring':
          return documents.filter((doc) => {
            if (!doc.expiryDate) return false;
            const expiry = new Date(doc.expiryDate);
            return expiry > now && expiry <= expiringThreshold;
          });
        case 'expired':
          return documents.filter((doc) => {
            if (!doc.expiryDate) return false;
            const expiry = new Date(doc.expiryDate);
            return expiry <= now;
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
      const values = [doc.crew.fullName, doc.docType, doc.docNumber, doc.remarks ?? ""];
      return values.some((value) => value?.toLowerCase().includes(query));
    });
  }, [documents, filter, searchTerm]);

  const expiringSoonCount = useMemo(() => {
    const now = new Date();
    const threshold = getExpiringThreshold(now);
    return documents.filter((doc) => {
      if (!doc.expiryDate) return false;
      const expiry = new Date(doc.expiryDate);
      return expiry > now && expiry <= threshold;
    }).length;
  }, [documents]);

  const expiredCount = useMemo(
    () =>
      documents.filter((doc) => {
        if (!doc.expiryDate) return false;
        return new Date(doc.expiryDate) <= new Date();
      }).length,
    [documents]
  );

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        <p className="text-sm font-semibold text-gray-700">Loading documents…</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Document Management</h1>
            <p className="text-base md:text-lg text-gray-700 mt-2">Monitor STCW certificate, passport, medical, and visa document status.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/crewing/documents/new"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition"
            >
              <span className="text-lg leading-none">＋</span>
              Tambah Dokumen
            </Link>
            <Link
              href="/crewing"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-300 text-sm font-semibold text-gray-800 hover:border-blue-500 hover:text-blue-600 transition"
            >
              ← Back to Crewing
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Filter Status Dokumen</h2>
              <p className="text-sm text-gray-600">Select to display specific documents based on expiration status or search by crew name, type, or document number.</p>
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
                  Semua ({documents.length})
                </button>
                <button
                  onClick={() => setFilter('expiring')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    filter === 'expiring'
                      ? 'bg-amber-500 text-white shadow'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Akan Kedaluwarsa ≤14 bln ({expiringSoonCount})
                </button>
                <button
                  onClick={() => setFilter('expired')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    filter === 'expired'
                      ? 'bg-rose-500 text-white shadow'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Kedaluwarsa ({expiredCount})
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {filter === 'all' ? 'Seluruh Dokumen' : filter === 'expiring' ? 'Dokumen Akan Kedaluwarsa' : 'Dokumen Kedaluwarsa' }
            </h2>
            <span className="text-sm font-medium text-gray-600">{formatSummaryLabel(filter, filteredDocuments.length)}</span>
          </div>

          {filteredDocuments.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-600">
              No documents in this category.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Seafarer</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tipe Dokumen</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nomor Dokumen</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date Terbit</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date Expired</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredDocuments.map((document) => (
                    <tr key={document.id} className="hover:bg-blue-50/40 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{document.crew.fullName}</td>
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
      </main>
    </div>
  );
}

function formatSummaryLabel(filter: string, count: number) {
  if (filter === 'all') {
    return `${count} dokumen terdaftar`;
  }
  if (filter === 'expiring') {
    return `${count} dokumen perlu diperbarui ≤14 bulan`;
  }
  return `${count} dokumen melewati masa is valid`;
}