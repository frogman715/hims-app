'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { AppRole } from '@/lib/roles';
import { OFFICE_ROLES } from '@/lib/roles';
import { WorkspaceHero } from '@/components/layout/WorkspaceHero';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/layout/Breadcrumbs';
import { InlineConfirmStrip } from '@/components/feedback/InlineConfirmStrip';
import { InlineNotice } from '@/components/feedback/InlineNotice';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { normalizeToUserRoles } from '@/lib/type-guards';
import { CrewDocumentWorkspaceCard } from '@/components/crewing/CrewDocumentWorkspaceCard';
import { buildCrewDocumentWorkspaceView, type CrewDocumentWorkspaceView } from '@/lib/document-control';
import { canAccessOfficePath } from '@/lib/office-access';
import { getAllDocumentTypes } from '@/lib/document-types';

interface SeafarerDocument {
  id: string;
  docType: string | null;
  docNumber: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  remarks: string | null;
}

interface Seafarer {
  id: string;
  fullName: string | null;
  rank?: string | null;
  crewCode?: string | null;
  status?: string | null;
  crewStatus?: string | null;
  assignments?: Array<{
    status?: string | null;
  }>;
  documentWorkspace?: CrewDocumentWorkspaceView | null;
}

interface DocumentReceiptSummary {
  id: string;
  crewStatus: 'NEW' | 'EX_CREW';
  vesselName: string | null;
  deliveryDate: string | null;
  deliveryLocation: string | null;
  createdAt: string;
  notes: string | null;
  items: Array<{
    id: string;
    certificateName: string;
    certificateNumber: string | null;
  }>;
  createdBy?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

function getCrewDisplayName(seafarer: Pick<Seafarer, 'id' | 'fullName'>) {
  const normalized = seafarer.fullName?.trim();
  return normalized && normalized.length > 0 ? normalized : `Crew ${seafarer.id}`;
}

function normalizeDocumentType(value: string | null | undefined) {
  return (value ?? '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_');
}

const documentTypeCategories: Array<{
  key: ReturnType<typeof getAllDocumentTypes>[number]['category'];
  label: string;
}> = [
  { key: 'identity', label: 'Identity Documents' },
  { key: 'certification', label: 'Certification & Qualifications' },
  { key: 'safety', label: 'Safety Certificates' },
  { key: 'technical', label: 'Technical & Training Certificates' },
  { key: 'management', label: 'Management Certificates' },
  { key: 'health', label: 'Health & Medical' },
  { key: 'other', label: 'Other Documents' },
];

export default function SeafarerDocumentsPage() {
  const router = useRouter();
  const params = useParams();
  const seafarerId = params.id as string;
  const { data: session } = useSession();
  const userRoles = session?.user?.roles;
  const normalizedRoles = normalizeToUserRoles(session?.user?.roles ?? session?.user?.role);
  const isSystemAdmin = session?.user?.isSystemAdmin === true;

  const [seafarer, setSeafarer] = useState<Seafarer | null>(null);
  const [documents, setDocuments] = useState<SeafarerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [receipts, setReceipts] = useState<DocumentReceiptSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; docType: string } | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const roles = useMemo<AppRole[]>(() => {
    return Array.isArray(userRoles) ? (userRoles as AppRole[]) : [];
  }, [userRoles]);

  const hasOfficeAccess = useMemo(() => {
    return roles.some((role) => (OFFICE_ROLES as readonly AppRole[]).includes(role));
  }, [roles]);
  const canManageDocuments = canAccessOfficePath("/api/documents", normalizedRoles, isSystemAdmin, "POST");
  const documentTypes = useMemo(() => getAllDocumentTypes(), []);

  const sortedReceipts = useMemo(() => {
    return [...receipts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [receipts]);
  const documentSummary = useMemo(() => {
    const now = new Date();
    const threshold = new Date(now.getTime());
    threshold.setMonth(threshold.getMonth() + 14);

    const expired = documents.filter((document) => {
      if (!document.expiryDate) {
        return false;
      }
      return new Date(document.expiryDate) <= now;
    }).length;

    const expiringSoon = documents.filter((document) => {
      if (!document.expiryDate) {
        return false;
      }
      const expiry = new Date(document.expiryDate);
      return expiry > now && expiry <= threshold;
    }).length;

    return {
      total: documents.length,
      expired,
      expiringSoon,
    };
  }, [documents]);
  const documentReadiness = useMemo(() => {
    const documentTypes = documents.map((document) => normalizeDocumentType(document.docType));
    const hasPassport = documentTypes.some((docType) => ['PASSPORT', 'PASPOR'].includes(docType));
    const hasSeamanBook = documentTypes.some((docType) => ['SEAMAN_BOOK', 'SEAMANBOOK'].includes(docType));
    const hasMedical = documentTypes.some((docType) => ['MEDICAL', 'MEDICAL_CERTIFICATE', 'MC', 'MCU'].includes(docType));
    const missingCoreDocuments = [
      hasPassport ? null : 'passport',
      hasSeamanBook ? null : 'seaman book',
      hasMedical ? null : 'medical certificate',
    ].filter(Boolean) as string[];

    return {
      hasPassport,
      hasSeamanBook,
      hasMedical,
      missingCoreDocuments,
      status:
        documentSummary.expired > 0 || missingCoreDocuments.length > 0
          ? 'NOT READY'
          : documentSummary.expiringSoon > 0
            ? 'REVIEW REQUIRED'
            : 'READY',
    };
  }, [documentSummary.expired, documentSummary.expiringSoon, documents]);
  const documentActionLabel = canManageDocuments
    ? documentReadiness.status === 'READY'
      ? 'Document set is under control. Upload only when renewals or new records arrive.'
      : 'Resolve the active document blockers from this page before assignment release or CV submission.'
    : 'Document updates are locked to Document Staff. Use this page to review completeness and raise follow-up.';
  const workspace = useMemo(() => {
    return buildCrewDocumentWorkspaceView({
      documents,
      identity: seafarer
        ? {
            crewId: seafarer.id,
            crewCode: seafarer.crewCode,
            fullName: getCrewDisplayName(seafarer),
            rank: seafarer.rank,
            status: seafarer.status,
            crewStatus: seafarer.crewStatus,
            assignments: seafarer.assignments,
          }
        : undefined,
      stored: seafarer?.documentWorkspace ?? undefined,
    });
  }, [documents, seafarer]);
  const breadcrumbItems = useMemo<BreadcrumbItem[]>(() => {
    const crewLabel = seafarer ? getCrewDisplayName(seafarer) : 'Seafarer';

    return [
      { label: 'Crewing', href: hasOfficeAccess ? '/crewing' : undefined },
      { label: 'Seafarers', href: hasOfficeAccess ? '/crewing/seafarers' : undefined },
      { label: crewLabel, href: hasOfficeAccess ? `/crewing/seafarers/${seafarerId}/biodata` : undefined },
      { label: 'Receipts' },
    ];
  }, [hasOfficeAccess, seafarer, seafarerId]);

  const fetchSeafarer = useCallback(async () => {
    try {
      setError(null);
      setErrorCode(null);
      const response = await fetch(`/api/crewing/seafarers/${seafarerId}`, { cache: 'no-store' });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload) {
        const message =
          payload?.error ||
          (response.status === 404
            ? 'Seafarer record was not found in the active crew database.'
            : response.status === 403
              ? 'You do not have permission to open this crew document profile.'
              : response.status === 401
                ? 'Your session expired. Please sign in again.'
                : 'Seafarer data could not be loaded.');
        setSeafarer(null);
        setDocuments([]);
        setError(message);
        setErrorCode(payload?.code || String(response.status));
        return;
      }

      setSeafarer(payload);
      setDocuments(Array.isArray(payload.documents) ? payload.documents : []);
      setShowUploadForm(!Array.isArray(payload.documents) || payload.documents.length === 0);
    } catch (error) {
      console.error('Error fetching seafarer:', error);
      setSeafarer(null);
      setDocuments([]);
      setError('Seafarer data could not be loaded. Check API or database connectivity.');
      setErrorCode('FETCH_FAILED');
    }
  }, [seafarerId]);

  const fetchReceipts = useCallback(async () => {
    try {
      const receiptsResponse = await fetch(`/api/seafarers/${seafarerId}/document-receipts`, { cache: 'no-store' });
      if (receiptsResponse.ok) {
        const receiptsData = await receiptsResponse.json();
        setReceipts(Array.isArray(receiptsData) ? receiptsData : []);
      } else {
        const payload = await receiptsResponse.json().catch(() => null);
        setError((current) => current ?? payload?.error ?? 'Document receipt history could not be loaded.');
        setErrorCode((current) => current ?? payload?.code ?? String(receiptsResponse.status));
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
      setError((current) => current ?? 'Document receipt history could not be loaded.');
      setErrorCode((current) => current ?? 'FETCH_FAILED');
    } finally {
      setLoading(false);
    }
  }, [seafarerId]);

  useEffect(() => {
    if (seafarerId) {
      fetchSeafarer();
      fetchReceipts();
    }
  }, [seafarerId, fetchSeafarer, fetchReceipts]);

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    setFeedback(null);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await fetchSeafarer();
        await fetchReceipts();
        e.currentTarget.reset(); // Clear the form
        setShowUploadForm(false);
        setFeedback({ tone: 'success', message: 'Document uploaded successfully.' });
      } else {
        const payload = await response.json().catch(() => null);
        setFeedback({ tone: 'error', message: payload?.error || 'Document upload failed.' });
      }
    } catch (error) {
      console.error('Error:', error);
      setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Document upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    if (uploading) {
      return;
    }
    formRef.current?.reset();
    if (documents.length > 0) {
      setShowUploadForm(false);
    }
  };

  const handleViewDocument = (docId: string) => {
    // Navigate to document viewer page
    router.push(`/crewing/documents/${docId}/view`);
  };

  const handleDeleteDocument = async (docId: string, docType: string) => {
    try {
      const response = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPendingDelete(null);
        setFeedback({ tone: 'success', message: `${docType} document removed successfully.` });
        await fetchSeafarer();
        await fetchReceipts();
      } else {
        const errorData = await response.json();
        setFeedback({ tone: 'error', message: errorData.error || `Failed to remove ${docType} document.` });
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      setFeedback({ tone: 'error', message: 'Document could not be removed.' });
    }
  };

  const formatDate = (value: string | null | undefined) => {
    if (!value) {
      return null;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return parsed.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="section-stack">
        <div className="surface-card px-6 py-12 text-center text-sm text-slate-600">Loading crew document profile...</div>
      </div>
    );
  }

  if (!seafarer) {
    return (
      <div className="section-stack">
        <div className="surface-card rounded-2xl border border-rose-200 bg-rose-50 px-4 py-6 text-center text-rose-700">
          <div className="font-semibold">Unable to open crew documents</div>
          <div className="mt-2 text-sm">{error || 'Seafarer record is unavailable.'}</div>
          <div className="mt-2 text-xs text-rose-600">
            Crew ID: {seafarerId}
            {errorCode ? ` • Code: ${errorCode}` : ''}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section-stack">
      <Breadcrumbs items={breadcrumbItems} />
      {feedback ? <InlineNotice tone={feedback.tone} message={feedback.message} onDismiss={() => setFeedback(null)} /> : null}
      {pendingDelete ? (
        <InlineConfirmStrip
          tone="error"
          title={`Remove ${pendingDelete.docType} document?`}
          message="Use removal only when the uploaded document is incorrect or should not remain in the crew document profile."
          confirmLabel="Confirm Removal"
          cancelLabel="Keep Document"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => handleDeleteDocument(pendingDelete.id, pendingDelete.docType)}
        />
      ) : null}
      <WorkspaceHero
        eyebrow="Crew Documents"
        title={`Documents for ${getCrewDisplayName(seafarer)}`}
        subtitle={`${getCrewDisplayName(seafarer)}${seafarer.rank ? ` • ${seafarer.rank}` : ''}`}
        helperLinks={[
          { href: `/crewing/seafarers/${seafarerId}/biodata`, label: 'Biodata' },
          { href: `/crewing/seafarers/${seafarerId}/medical`, label: 'Medical' },
          { href: '/crewing/document-receipts', label: 'Receipt History' },
        ]}
        highlights={[
          { label: 'Total Documents', value: documentSummary.total, detail: 'All active document records attached to this seafarer.' },
          { label: 'Expired', value: documentSummary.expired, detail: 'Documents that are no longer valid for operational use.' },
          { label: 'Expiring Soon', value: documentSummary.expiringSoon, detail: 'Documents approaching expiry and needing renewal follow-up.' },
          { label: 'Readiness Gate', value: documentReadiness.status, detail: 'Current document readiness state for workflow use.' },
        ]}
        actions={(
          <Button type="button" variant="secondary" size="sm" onClick={() => router.push(`/crewing/seafarers/${seafarerId}/biodata`)}>
            Back to Seafarer
          </Button>
        )}
      />

      <section className="surface-card space-y-6 p-6">
        <div className="flex flex-wrap gap-3">
          {canManageDocuments ? (
            <Button type="button" size="sm" onClick={() => setShowUploadForm((current) => !current)}>
              {showUploadForm ? 'Hide Upload Form' : 'Upload Document'}
            </Button>
          ) : null}
        </div>

        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/80 px-4 py-4 text-sm text-slate-700">
          Use this desk to monitor one crew member&apos;s passport, certificates, medical support documents, and expiry exposure. Document Staff updates records here; other desks stay in review mode.
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Document Readiness</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                  documentReadiness.status === 'READY'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : documentReadiness.status === 'REVIEW REQUIRED'
                      ? 'border-amber-200 bg-amber-50 text-amber-800'
                      : 'border-rose-200 bg-rose-50 text-rose-800'
                }`}
              >
                {documentReadiness.status}
              </span>
              <p className="text-sm text-slate-600">
                Check this gate before assignment release, prepare joining work, or CV submission.
              </p>
            </div>
            <p className="mt-3 text-sm text-slate-600">{documentActionLabel}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => router.push(`/crewing/seafarers/${seafarerId}/biodata`)}>
              Open Crew Biodata
            </Button>
            {canManageDocuments ? (
              <Button
                type="button"
                onClick={() => setShowUploadForm(true)}
              >
                Resolve document gate
              </Button>
            ) : (
              <span className="inline-flex items-center rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-500">
                Upload locked to Document Staff
              </span>
            )}
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className={`rounded-2xl border px-4 py-4 ${documentReadiness.hasPassport ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
            <p className="text-sm font-semibold text-slate-900">Passport</p>
            <p className={`mt-1 text-sm ${documentReadiness.hasPassport ? 'text-emerald-800' : 'text-rose-800'}`}>
              {documentReadiness.hasPassport ? 'Recorded in the active document set.' : 'Missing from the active document set.'}
            </p>
          </div>
          <div className={`rounded-2xl border px-4 py-4 ${documentReadiness.hasSeamanBook ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
            <p className="text-sm font-semibold text-slate-900">Seaman Book</p>
            <p className={`mt-1 text-sm ${documentReadiness.hasSeamanBook ? 'text-emerald-800' : 'text-rose-800'}`}>
              {documentReadiness.hasSeamanBook ? 'Recorded in the active document set.' : 'Missing from the active document set.'}
            </p>
          </div>
          <div className={`rounded-2xl border px-4 py-4 ${documentReadiness.hasMedical ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
            <p className="text-sm font-semibold text-slate-900">Medical</p>
            <p className={`mt-1 text-sm ${documentReadiness.hasMedical ? 'text-emerald-800' : 'text-rose-800'}`}>
              {documentReadiness.hasMedical ? 'Recorded in the active document set.' : 'Missing from the active document set.'}
            </p>
          </div>
        </div>
        {documentReadiness.missingCoreDocuments.length > 0 || documentSummary.expired > 0 || documentSummary.expiringSoon > 0 ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            <span className="font-semibold">Next action:</span>{' '}
            {documentReadiness.missingCoreDocuments.length > 0
              ? `complete the core set (${documentReadiness.missingCoreDocuments.join(', ')})`
              : documentSummary.expired > 0
                ? 'replace or renew expired documents before operational release'
                : 'review documents that are nearing expiry'}
            .
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
            Core crew documents are in place and no active expiry blocker is visible from this page.
          </div>
        )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total documents</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{documentSummary.total}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Expiring soon</p>
          <p className="mt-2 text-3xl font-bold text-amber-900">{documentSummary.expiringSoon}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Expired</p>
          <p className="mt-2 text-3xl font-bold text-rose-900">{documentSummary.expired}</p>
        </div>
        </div>

        <CrewDocumentWorkspaceCard workspace={workspace} />

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-slate-950">{canManageDocuments ? 'Upload New Document' : 'Document Review'}</h2>
          <div className="flex flex-wrap gap-3">
            {canManageDocuments && !showUploadForm ? (
              <Button type="button" size="sm" onClick={() => setShowUploadForm(true)}>Add Document</Button>
            ) : null}
            {showUploadForm && documents.length > 0 && (
              <Button type="button" variant="secondary" size="sm" onClick={handleCancel} disabled={uploading}>
                Cancel
              </Button>
            )}
          </div>
        </div>

        {showUploadForm && canManageDocuments ? (
          <form ref={formRef} onSubmit={handleFileUpload} className="space-y-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
            <input type="hidden" name="seafarerId" value={seafarerId} />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="w-full">
                <label htmlFor="docType" className="mb-2 block text-sm font-semibold text-gray-700">
                  Document Type <span className="ml-1 text-red-500">*</span>
                </label>
                <select
                  id="docType"
                  name="docType"
                  required
                  className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-base text-gray-900 transition-all duration-200 hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  defaultValue=""
                >
                  <option value="" disabled>Select document type</option>
                  {documentTypeCategories.map((category) => {
                    const options = documentTypes.filter((documentType) => documentType.category === category.key);
                    if (options.length === 0) {
                      return null;
                    }

                    return (
                      <optgroup key={category.key} label={category.label}>
                        {options.map((documentType) => (
                          <option key={documentType.value} value={documentType.value}>
                            {documentType.label}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>

              <Input id="docNumber" name="docNumber" label="Document Number" required />
              <Input id="issueDate" name="issueDate" label="Issue Date" type="date" />
              <Input id="expiryDate" name="expiryDate" label="Expiry Date" type="date" />
            </div>

            <Textarea id="remarks" name="remarks" label="Remarks" rows={3} />

            <Input
              id="file"
              name="file"
              label="Document File"
              type="file"
              required
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              helperText="Accepted formats: PDF, JPG, PNG, DOC, DOCX."
            />

            <div className="flex flex-wrap gap-4 pt-2">
              <Button type="submit" isLoading={uploading} disabled={uploading}>
                {uploading ? 'Uploading…' : 'Save Document'}
              </Button>
              <Button type="button" variant="secondary" onClick={handleCancel} disabled={uploading}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-slate-600">
            {canManageDocuments
              ? 'Use this section to upload or hide the document form. Existing records stay in the document list below.'
              : 'This page is available for viewing and cross-checking documents. Editing remains with Document Staff.'}
          </p>
        )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8">
        <h2 className="mb-4 text-xl font-semibold text-slate-950">Existing Documents</h2>
        {documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
            No documents uploaded yet. Upload the first crew document to start expiry tracking.
          </div>
        ) : (
          <div className="space-y-6">
            {documents.map((doc) => (
              <div key={doc.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-slate-900">{doc.docType || 'Not specified'}</h3>
                    {doc.docNumber && (
                      <p className="text-sm text-slate-700">Number: {doc.docNumber}</p>
                    )}
                    <div className="mt-1 flex gap-4 text-sm text-slate-500">
                      {doc.issueDate && (
                        <span>Issued: {new Date(doc.issueDate).toLocaleDateString()}</span>
                      )}
                      {doc.expiryDate && (
                        <span>Expires: {new Date(doc.expiryDate).toLocaleDateString()}</span>
                      )}
                    </div>
                    {doc.remarks && (
                      <p className="mt-1 text-sm text-slate-700">{doc.remarks}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" size="sm" className="!px-3 !py-2 !text-sm" onClick={() => handleViewDocument(doc.id)}>
                      View
                    </Button>
                    {canManageDocuments ? (
                      <Button type="button" variant="danger" size="sm" className="!px-3 !py-2 !text-sm" onClick={() => setPendingDelete({ id: doc.id, docType: doc.docType || 'selected' })}>
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8">
        <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <h2 className="text-xl font-semibold text-slate-950">Document Receipt History</h2>
            {sortedReceipts.length > 0 && (
              <span className="text-sm text-slate-600">{sortedReceipts.length} records</span>
            )}
          </div>
        </div>
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Receipt history remains available for review only. New receipt entry is temporarily hidden until the active crewing API is aligned.
        </div>
        {sortedReceipts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">No document receipt records are available.</div>
        ) : (
          <div className="space-y-5">
            {sortedReceipts.map((receipt) => (
              <div key={receipt.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{receipt.vesselName || 'No Vessel Name'}</h3>
                    <p className="text-sm text-slate-700">
                      Status: {receipt.crewStatus === 'NEW' ? 'Crew New' : 'Ex Crew'}
                    </p>
                    <p className="text-sm text-slate-600">
                      Created on {formatDate(receipt.createdAt) ?? '-'}
                    </p>
                    {receipt.deliveryLocation && (
                      <p className="text-sm text-slate-600">
                        Delivery Location: {receipt.deliveryLocation}
                        {receipt.deliveryDate ? `, ${formatDate(receipt.deliveryDate) ?? ''}` : ''}
                      </p>
                    )}
                    {receipt.notes && (
                      <p className="mt-2 text-sm text-slate-700">Remarks: {receipt.notes}</p>
                    )}
                    {receipt.createdBy?.name && (
                      <p className="mt-2 text-xs text-slate-500">Recorded by {receipt.createdBy.name}</p>
                    )}
                  </div>
                  <div className="md:text-right">
                    <p className="text-sm font-semibold text-slate-800">Documents:</p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-700">
                      {receipt.items.slice(0, 5).map((item) => (
                        <li key={item.id}>
                          {item.certificateName}
                          {item.certificateNumber ? ` - ${item.certificateNumber}` : ''}
                        </li>
                      ))}
                    </ul>
                    {receipt.items.length > 5 && (
                      <p className="mt-2 text-xs text-slate-500">
                        +{receipt.items.length - 5} more documents
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </section>
    </div>
  );
}
