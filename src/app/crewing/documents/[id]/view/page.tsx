'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDocumentDate } from '@/lib/date-utils';
import { getDocumentExpiryPresentation } from '@/lib/document-expiry';
import { WorkspaceLoadingState, WorkspaceState } from '@/components/layout/WorkspaceState';
import { Button } from '@/components/ui/Button';

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
    fullName: string | null;
  };
}

function getCrewDisplayName(crew: DocumentDetail["crew"]) {
  const normalized = crew.fullName?.trim();
  return normalized && normalized.length > 0 ? normalized : `Crew ${crew.id}`;
}

function isImageAttachment(fileUrl: string | null | undefined) {
  if (!fileUrl) {
    return false;
  }

  return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileUrl);
}

export default function ViewDocumentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fallbackPreviewSrc = "/logo.png";
  const [previewSrc, setPreviewSrc] = useState(fallbackPreviewSrc);

  const loadDocument = useCallback(async () => {
    try {
      const response = await fetch(`/api/documents/${id}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);

        if (response.status === 403) {
          throw new Error(payload?.error || 'You do not have access to this document.');
        }

        if (response.status === 404) {
          throw new Error(payload?.error || 'Document not found or already removed.');
        }

        throw new Error(payload?.error || 'Failed to load document details');
      }
      const data = (await response.json()) as DocumentDetail;
      setDocument(data);
      setPreviewSrc(data.fileUrl || fallbackPreviewSrc);
      setError(null);
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Could not load document details. Please try again.');
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
    const expiryPresentation = getDocumentExpiryPresentation(document.expiryDate);

    return {
      issueDate: formatDocumentDate(document.issueDate),
      expiryDate: formatDocumentDate(document.expiryDate),
      statusLabel: expiryPresentation.label,
      statusClass: expiryPresentation.className,
    };
  }, [document]);

  const isPdfAttachment = document?.fileUrl?.toLowerCase().includes(".pdf") ?? false;
  const isImagePreview = isImageAttachment(document?.fileUrl);
  const documentHealth =
    formattedDetails?.statusLabel?.toLowerCase().includes("expired")
      ? {
          label: "Renew document",
          helper: "This document is already expired. Update the record before assignment release or READY review.",
          tone: "bg-rose-100 text-rose-800",
        }
      : formattedDetails?.statusLabel?.toLowerCase().includes("expire")
        ? {
            label: "Monitor expiry",
            helper: "Expiry is approaching. Confirm whether a replacement upload is needed before movement planning.",
            tone: "bg-amber-100 text-amber-800",
          }
        : {
            label: "Document clear",
            helper: "This attachment currently supports crew document readiness review.",
            tone: "bg-emerald-100 text-emerald-800",
          };

  if (status === 'loading' || loading) {
    return <WorkspaceLoadingState label="Loading document detail..." />;
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <WorkspaceState
        eyebrow="Document Control"
        title="Document record could not be opened"
        description={error}
        tone="danger"
        action={(
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/crewing/documents" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-800">
              Return to Document Register
            </Link>
            <Button
              type="button"
              onClick={() => {
                setLoading(true);
                loadDocument();
              }}
            >
              Reload Record
            </Button>
          </div>
        )}
      />
    );
  }

  if (!document || !formattedDetails) {
    return (
      <WorkspaceState
        eyebrow="Document Control"
        title="Document record not available"
        description="The requested document may have been removed or is no longer available in the active register. Return to document control to reopen a valid record."
        tone="danger"
        action={(
          <Link href="/crewing/documents" className="inline-flex items-center rounded-xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800">
            Return to Document Register
          </Link>
        )}
      />
    );
  }

  return (
    <div className="section-stack">
      <section className="surface-card p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Document Control</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{document.docType}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Issued for {getCrewDisplayName(document.crew)}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => router.push('/crewing/documents')}>
              Back to list
            </Button>
            <Link href={`/crewing/seafarers/${document.crew.id}/documents`} className="action-pill text-sm">
              Crew document list
            </Link>
          </div>
        </div>
      </section>

      <section className="surface-card border-sky-200 bg-sky-50 p-5">
          <section className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
          <p className="text-sm font-semibold text-sky-900">How to use this page</p>
          <p className="mt-1 text-sm text-sky-800">
            Review the document metadata first, then open the file or preview to confirm the uploaded attachment matches the crew record.
          </p>
        </section>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Document Desk Action</p>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-slate-900">{documentHealth.label}</p>
                <p className="mt-1 max-w-2xl text-sm text-slate-600">{documentHealth.helper}</p>
              </div>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${documentHealth.tone}`}>
                {formattedDetails.statusLabel}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Related Desks</p>
            <div className="mt-3 flex flex-col gap-2">
              <Link
                href={`/crewing/seafarers/${document.crew.id}/documents`}
                className="inline-flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-700"
              >
                Return to crew document list
                <span>→</span>
              </Link>
              <Link
                href={`/crewing/seafarers/${document.crew.id}/biodata`}
                className="inline-flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-700"
              >
                Open crew biodata
                <span>→</span>
              </Link>
              <Link
                href="/crewing/prepare-joining"
                className="inline-flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-700"
              >
                Check Prepare Joining queue
                <span>→</span>
              </Link>
            </div>
          </div>
        </section>

      <section className="surface-card p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Document information</h2>
              <dl className="grid grid-cols-1 gap-4 text-sm">
                <div>
                  <dt className="font-medium text-gray-600">Seafarer</dt>
                  <dd className="text-gray-900">{getCrewDisplayName(document.crew)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Document Number</dt>
                  <dd className="text-gray-900">{document.docNumber || '—'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Issue Date</dt>
                  <dd className="text-gray-900">{formattedDetails.issueDate}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Expiry Date</dt>
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
                  <dt className="font-medium text-gray-600">Remarks</dt>
                  <dd className="text-gray-900 whitespace-pre-wrap">{document.remarks?.trim() || '—'}</dd>
                </div>
              </dl>
            </div>

            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Document attachment</h2>
              {document.fileUrl ? (
                <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                  {isPdfAttachment || !isImagePreview ? (
                    <div className="flex h-[420px] flex-col items-center justify-center gap-3 bg-white p-8 text-center">
                      <div className="text-5xl">📄</div>
                      <p className="text-sm font-semibold text-slate-900">
                        {isPdfAttachment ? "PDF preview opens in a new tab" : "Attachment is not an image file"}
                      </p>
                      <p className="max-w-sm text-sm text-slate-600">
                        The file is available, but it cannot be rendered as an image preview on this page.
                      </p>
                    </div>
                  ) : (
                    <div className="relative w-full h-[420px] bg-white">
                      <Image
                        src={previewSrc}
                        alt={`Document ${document.docType}`}
                        fill
                        unoptimized
                        sizes="(min-width: 1024px) 50vw, 100vw"
                        className="object-contain"
                        priority
                        onError={(event) => {
                          const target = event.currentTarget;
                          if (target.src.endsWith(fallbackPreviewSrc)) {
                            return;
                          }
                          setPreviewSrc(fallbackPreviewSrc);
                        }}
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
                    <span className="text-sm text-gray-600">Document preview</span>
                    <a
                      href={document.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Open file →
                    </a>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-600">
                  No document attachment is available yet.
                </div>
              )}
            </div>
          </div>
      </section>
    </div>
  );
}
