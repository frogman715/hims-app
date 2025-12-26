'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

interface DocumentDetail {
  id: string;
  docType: string;
  docNumber: string;
  issueDate: string | null;
  expiryDate: string | null;
  remarks: string | null;
  fileUrl: string | null;
  crew: {
    id: string;
    fullName: string;
  };
}

export default function ViewDocumentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocument = useCallback(async () => {
    try {
      const response = await fetch(`/api/documents/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load document details');
      }
      const data = (await response.json()) as DocumentDetail;
      setDocument(data);
      setError(null);
    } catch (fetchError) {
      console.error(fetchError);
      setError('Tidak dapat memuat detail dokumen. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    setLoading(true);
    loadDocument();
  }, [id, loadDocument, router, session, status]);

  const formattedDetails = useMemo(() => {
    if (!document) return null;

    const formatDate = (value: string | null) => {
      if (!value) return '—';
      try {
        return new Date(value).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      } catch {
        return value;
      }
    };

    const getExpiringThreshold = (reference: Date) => {
      const threshold = new Date(reference.getTime());
      threshold.setMonth(threshold.getMonth() + 14);
      return threshold;
    };

    const now = new Date();
    const expiry = document.expiryDate ? new Date(document.expiryDate) : null;
    const expiringThreshold = getExpiringThreshold(now);

    let statusLabel = 'Valid';
    let statusClass = 'bg-emerald-100 text-emerald-700';

    if (!expiry) {
      statusLabel = 'No Expiry';
      statusClass = 'bg-gray-100 text-gray-700';
    } else if (expiry <= now) {
      statusLabel = 'Expired';
      statusClass = 'bg-rose-100 text-rose-700';
    } else if (expiry <= expiringThreshold) {
      statusLabel = 'Expiring Soon';
      statusClass = 'bg-amber-100 text-amber-700';
    }

    return {
      issueDate: formatDate(document.issueDate),
      expiryDate: formatDate(document.expiryDate),
      statusLabel,
      statusClass,
    };
  }, [document]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        <p className="text-sm font-semibold text-gray-700">Loading detail dokumen…</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-3xl mx-auto py-16 px-6">
          <div className="surface-card p-8 text-center space-y-4">
            <h1 className="text-2xl font-semibold text-gray-900">Failed to Load Document</h1>
            <p className="text-sm text-gray-600">{error}</p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/crewing/documents"
                className="action-pill"
              >
                ← Back to List
              </Link>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  loadDocument();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!document || !formattedDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-3xl mx-auto py-16 px-6">
          <div className="surface-card p-8 text-center space-y-3">
            <h1 className="text-2xl font-semibold text-gray-900">Dokumen tidak ditemukan</h1>
            <p className="text-sm text-gray-600">Dokumen yang Anda cari mungkin telah dihapus atau tidak tersedia.</p>
            <Link href="/crewing/documents" className="action-pill">
              ← Back to List
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600 uppercase">Document Preview</p>
            <h1 className="text-3xl font-bold text-gray-900 mt-1">{document.docType}</h1>
            <p className="text-sm text-gray-600 mt-2">Diterbitkan untuk {document.crew.fullName}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/crewing/documents"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
            >
              ← Back to List
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <section className="surface-card p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Informasi Dokumen</h2>
              <dl className="grid grid-cols-1 gap-4 text-sm">
                <div>
                  <dt className="font-medium text-gray-600">Seafarer</dt>
                  <dd className="text-gray-900">{document.crew.fullName}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Nomor Dokumen</dt>
                  <dd className="text-gray-900">{document.docNumber || '—'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Tanggal Terbit</dt>
                  <dd className="text-gray-900">{formattedDetails.issueDate}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Tanggal Kedaluwarsa</dt>
                  <dd className="text-gray-900">{formattedDetails.expiryDate}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Status</dt>
                  <dd>
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${formattedDetails.statusClass}`}>
                      {formattedDetails.statusLabel}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Catatan</dt>
                  <dd className="text-gray-900 whitespace-pre-wrap">{document.remarks?.trim() || '—'}</dd>
                </div>
              </dl>
            </div>

            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Lampiran Dokumen</h2>
              {document.fileUrl ? (
                <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                  <div className="relative w-full h-[420px] bg-white">
                    <Image
                      src={document.fileUrl}
                      alt={`Dokumen ${document.docType}`}
                      fill
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className="object-contain"
                      priority
                    />
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
                    <span className="text-sm text-gray-600">Pratinjau dokumen</span>
                    <a
                      href={document.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Buka file →
                    </a>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-600">
                  Lampiran dokumen belum tersedia.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
