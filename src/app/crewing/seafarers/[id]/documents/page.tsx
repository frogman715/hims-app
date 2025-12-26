'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { AppRole } from '@/lib/roles';
import { OFFICE_ROLES } from '@/lib/roles';
import { CREWING_DOCUMENT_RECEIPTS_ROUTE } from '@/lib/routes';
import { PageHeader } from '@/components/layout/PageHeader';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/layout/Breadcrumbs';
import { FeatureUnavailableAlert } from '@/components/feedback/FeatureUnavailableAlert';

interface SeafarerDocument {
  id: string;
  docType: string;
  docNumber: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  remarks: string | null;
}

interface Seafarer {
  id: string;
  fullName: string;
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

export default function SeafarerDocumentsPage() {
  const router = useRouter();
  const params = useParams();
  const seafarerId = params.id as string;
  const { data: session } = useSession();
  const userRoles = session?.user?.roles;

  const [seafarer, setSeafarer] = useState<Seafarer | null>(null);
  const [documents, setDocuments] = useState<SeafarerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [receipts, setReceipts] = useState<DocumentReceiptSummary[]>([]);
  const [receiptsRouteAvailable, setReceiptsRouteAvailable] = useState(true);
  const formRef = useRef<HTMLFormElement | null>(null);

  const roles = useMemo<AppRole[]>(() => {
    return Array.isArray(userRoles) ? (userRoles as AppRole[]) : [];
  }, [userRoles]);

  const hasOfficeAccess = useMemo(() => {
    return roles.some((role) => (OFFICE_ROLES as readonly AppRole[]).includes(role));
  }, [roles]);

  useEffect(() => {
    if (!hasOfficeAccess) {
      setReceiptsRouteAvailable(false);
      return;
    }

    let cancelled = false;
    const verifyRouteAvailability = async () => {
      try {
        const response = await fetch(CREWING_DOCUMENT_RECEIPTS_ROUTE, { method: 'HEAD', cache: 'no-store' });
        if (cancelled) {
          return;
        }
        setReceiptsRouteAvailable(response.ok || response.status === 405);
      } catch {
        if (!cancelled) {
          setReceiptsRouteAvailable(false);
        }
      }
    };

    verifyRouteAvailability();

    return () => {
      cancelled = true;
    };
  }, [hasOfficeAccess]);

  const sortedReceipts = useMemo(() => {
    return [...receipts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [receipts]);
  const breadcrumbItems = useMemo<BreadcrumbItem[]>(() => {
    return [
      { label: 'Crewing', href: hasOfficeAccess ? '/crewing' : undefined },
      { label: 'Seafarers', href: hasOfficeAccess ? '/crewing/seafarers' : undefined },
      { label: 'Documents', href: hasOfficeAccess ? `/crewing/seafarers/${seafarerId}/documents` : undefined },
      { label: 'Receipts' },
    ];
  }, [hasOfficeAccess, seafarerId]);

  const fetchSeafarer = useCallback(async () => {
    try {
      const response = await fetch(`/api/seafarers/${seafarerId}`);
      if (response.ok) {
        const data = await response.json();
        setSeafarer(data);
      }
    } catch (error) {
      console.error('Error fetching seafarer:', error);
    }
  }, [seafarerId]);

  const fetchDocuments = useCallback(async () => {
    try {
      const [documentsResponse, receiptsResponse] = await Promise.all([
        fetch(`/api/seafarers/${seafarerId}/documents`),
        fetch(`/api/seafarers/${seafarerId}/document-receipts`),
      ]);

      if (documentsResponse.ok) {
        const documentsData = await documentsResponse.json();
        setDocuments(documentsData);
        setShowUploadForm(documentsData.length === 0);
      }

      if (receiptsResponse.ok) {
        const receiptsData = await receiptsResponse.json();
        setReceipts(receiptsData);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  }, [seafarerId]);

  useEffect(() => {
    if (seafarerId) {
      fetchSeafarer();
      fetchDocuments();
    }
  }, [seafarerId, fetchSeafarer, fetchDocuments]);

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await fetchDocuments(); // Refresh the list
        e.currentTarget.reset(); // Clear the form
        setShowUploadForm(false);
      } else {
        alert('Failed to upload document');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error uploading document');
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
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!seafarer) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">Seafarer not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Reference layout: Breadcrumbs + PageHeader pattern for Crewing, Accounting, and HGQS modules. */}
      <Breadcrumbs items={breadcrumbItems} />
      <PageHeader
        title={`Documents for ${seafarer.fullName}`}
        subtitle={`Seafarer ID: ${seafarerId}`}
        actions={(
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/crewing/seafarers/${seafarerId}/biodata`}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-400 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              ← Back to Seafarer
            </Link>
            {hasOfficeAccess ? (
              <Link
                href={CREWING_DOCUMENT_RECEIPTS_ROUTE}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-400 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Lihat Semua Tanda Terima
              </Link>
            ) : null}
          </div>
        )}
      />
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          onClick={() => setShowUploadForm(true)}
          className="bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg shadow hover:bg-blue-700"
        >
          + Upload Document
        </button>
        <button
          onClick={() => router.push(`/crewing/seafarers/${seafarerId}/document-receipts/new`)}
          className="bg-emerald-600 text-white font-semibold px-5 py-2 rounded-lg shadow hover:bg-emerald-700"
        >
          + Tanda Terima Dokumen
        </button>
      </div>

      {/* Upload Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold">Upload New Document</h2>
          <div className="flex flex-wrap gap-3">
            {!showUploadForm && (
              <button
                type="button"
                onClick={() => setShowUploadForm(true)}
                className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow hover:bg-blue-700"
              >
                + Add Document
              </button>
            )}
            {showUploadForm && documents.length > 0 && (
              <button
                type="button"
                onClick={handleCancel}
                className="border border-gray-400 text-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-100"
                disabled={uploading}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {showUploadForm ? (
          <form ref={formRef} onSubmit={handleFileUpload} className="space-y-6">
            <input type="hidden" name="seafarerId" value={seafarerId} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="docType" className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Document Type *
                </label>
                <select
                  id="docType"
                  name="docType"
                  required
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select document type</option>
                  <option value="Passport">Passport</option>
                  <option value="COC">Certificate of Competency (COC)</option>
                  <option value="COP">Certificate of Proficiency (COP)</option>
                  <option value="BST">Basic Safety Training</option>
                  <option value="Medical Certificate">Medical Certificate</option>
                  <option value="Seaman Book">Seaman Book</option>
                  <option value="Visa">Visa</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="docNumber" className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Document Number
                </label>
                <input
                  type="text"
                  id="docNumber"
                  name="docNumber"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="issueDate" className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Issue Date
                </label>
                <input
                  type="date"
                  id="issueDate"
                  name="issueDate"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Expiry Date
                </label>
                <input
                  type="date"
                  id="expiryDate"
                  name="expiryDate"
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="remarks" className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                Remarks
              </label>
              <textarea
                id="remarks"
                name="remarks"
                rows={3}
                className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                Document File *
              </label>
              <input
                type="file"
                id="file"
                name="file"
                required
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                type="submit"
                disabled={uploading}
                className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading…' : 'Save Document'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={uploading}
                className="border border-gray-400 text-gray-700 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p className="text-gray-600">Click &quot;Add Document&quot; to upload a new file for this seafarer.</p>
        )}
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-300 p-8">
        <h2 className="text-xl font-semibold mb-4">Existing Documents</h2>
        {documents.length === 0 ? (
          <p className="text-gray-500">No documents uploaded yet.</p>
        ) : (
          <div className="space-y-6">
            {documents.map((doc) => (
              <div key={doc.id} className="border border-gray-300 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{doc.docType}</h3>
                    {doc.docNumber && (
                      <p className="text-sm text-gray-800">Number: {doc.docNumber}</p>
                    )}
                    <div className="flex gap-4 text-sm text-gray-500 mt-1">
                      {doc.issueDate && (
                        <span>Issued: {new Date(doc.issueDate).toLocaleDateString()}</span>
                      )}
                      {doc.expiryDate && (
                        <span>Expires: {new Date(doc.expiryDate).toLocaleDateString()}</span>
                      )}
                    </div>
                    {doc.remarks && (
                      <p className="text-sm text-gray-800 mt-1">{doc.remarks}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      View
                    </button>
                    <button className="text-red-600 hover:text-red-800 text-sm">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg border border-gray-300 p-8 mt-8">
        <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <h2 className="text-xl font-semibold">Riwayat Tanda Terima Dokumen</h2>
            {sortedReceipts.length > 0 && (
              <span className="text-sm text-gray-600">{sortedReceipts.length} catatan</span>
            )}
          </div>
          {hasOfficeAccess && (
            <button
              type="button"
              onClick={() => router.push(CREWING_DOCUMENT_RECEIPTS_ROUTE)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-400 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!receiptsRouteAvailable}
            >
              ← Back to Receipts
            </button>
          )}
        </div>
        {hasOfficeAccess && !receiptsRouteAvailable ? (
          <FeatureUnavailableAlert
            message="Sistem tidak can membuka halaman daftar receipt saat ini."
            details="Silakan hubungi administrator jika masalah ini berlanjut."
          />
        ) : null}
        {sortedReceipts.length === 0 ? (
          <div className="text-gray-500">No receipt dokumen yang tercatat.</div>
        ) : (
          <div className="space-y-5">
            {sortedReceipts.map((receipt) => (
              <div key={receipt.id} className="border border-gray-200 rounded-xl p-5">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{receipt.vesselName || 'Tanpa Nama Kapal'}</h3>
                    <p className="text-sm text-gray-700">
                      Status: {receipt.crewStatus === 'NEW' ? 'Crew Baru' : 'Ex Crew'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Dibuat pada {formatDate(receipt.createdAt) ?? '-'}
                    </p>
                    {receipt.deliveryLocation && (
                      <p className="text-sm text-gray-600">
                        Lokasi Penyerahan: {receipt.deliveryLocation}
                        {receipt.deliveryDate ? `, ${formatDate(receipt.deliveryDate) ?? ''}` : ''}
                      </p>
                    )}
                    {receipt.notes && (
                      <p className="text-sm text-gray-700 mt-2">Catatan: {receipt.notes}</p>
                    )}
                    {receipt.createdBy?.name && (
                      <p className="text-xs text-gray-500 mt-2">Dicatat oleh {receipt.createdBy.name}</p>
                    )}
                  </div>
                  <div className="md:text-right">
                    <p className="text-sm font-semibold text-gray-800">Dokumen:</p>
                    <ul className="mt-2 space-y-1 text-sm text-gray-700">
                      {receipt.items.slice(0, 5).map((item) => (
                        <li key={item.id}>
                          {item.certificateName}
                          {item.certificateNumber ? ` – ${item.certificateNumber}` : ''}
                        </li>
                      ))}
                    </ul>
                    {receipt.items.length > 5 && (
                      <p className="text-xs text-gray-500 mt-2">
                        +{receipt.items.length - 5} dokumen lainnya
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}