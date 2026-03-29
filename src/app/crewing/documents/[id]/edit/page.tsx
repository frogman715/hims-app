'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { DOCUMENT_TYPES, getDocumentTypeLabel } from '@/lib/document-types';
import { WorkspaceLoadingState, WorkspaceState } from '@/components/layout/WorkspaceState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface DocumentEditForm {
  docType: string;
  docNumber: string;
  issueDate: string;
  expiryDate: string;
  remarks: string;
  file?: File;
}

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

export default function EditDocumentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<DocumentEditForm>({
    docType: '',
    docNumber: '',
    issueDate: '',
    expiryDate: '',
    remarks: '',
  });

  const loadDocument = useCallback(async () => {
    try {
      const response = await fetch(`/api/documents/${id}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);

        if (response.status === 403) {
          throw new Error(payload?.error || 'You do not have access to edit this document.');
        }

        if (response.status === 404) {
          throw new Error(payload?.error || 'Document not found or already removed.');
        }

        throw new Error(payload?.error || 'Failed to load document');
      }
      const data = (await response.json()) as DocumentDetail;
      setDocument(data);

      // Format dates for input fields (YYYY-MM-DD)
      const formatDateForInput = (dateString: string | null) => {
        if (!dateString) return '';
        try {
          const date = new Date(dateString);
          return date.toISOString().split('T')[0];
        } catch {
          return dateString;
        }
      };

      setFormData({
        docType: data.docType,
        docNumber: data.docNumber,
        issueDate: formatDateForInput(data.issueDate),
        expiryDate: formatDateForInput(data.expiryDate),
        remarks: data.remarks || '',
      });
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Could not load document details. Please try again.');
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        file,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.docType || !formData.docNumber || !formData.issueDate || !formData.expiryDate) {
        throw new Error('Please complete all required fields.');
      }

      const submitFormData = new FormData();
      submitFormData.append('docType', formData.docType);
      submitFormData.append('docNumber', formData.docNumber);
      submitFormData.append('issueDate', formData.issueDate);
      submitFormData.append('expiryDate', formData.expiryDate);
      submitFormData.append('remarks', formData.remarks);
      
      if (formData.file) {
        submitFormData.append('file', formData.file);
      }

      const response = await fetch(`/api/documents/${id}`, {
        method: 'PUT',
        body: submitFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save document');
      }

      // Redirect to view page
      router.push(`/crewing/documents/${id}/view`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred while saving.';
      setError(message);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return <WorkspaceLoadingState label="Loading document edit workspace..." />;
  }

  if (!session) {
    return null;
  }

  if (error && !document) {
    return (
      <WorkspaceState
        eyebrow="Document Update"
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
                setError(null);
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

  if (!document) {
    return (
      <WorkspaceState
        eyebrow="Document Update"
        title="Document record not available"
        description="The requested document is no longer available in the active register. Return to document control before starting a new update."
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
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">Edit Document</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {getDocumentTypeLabel(document.docType)}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Update controlled document data for {getCrewDisplayName(document.crew)}.</p>
          </div>
          <Link href="/crewing/documents" className="action-pill text-sm">
            Back to documents
          </Link>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="surface-card p-8 space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Select
                id="docType"
                name="docType"
                label="Document Type"
                value={formData.docType}
                onChange={handleInputChange}
                required
                placeholder="Select document type"
                options={DOCUMENT_TYPES.map((docType) => ({
                  value: docType.value,
                  label: docType.label,
                }))}
              />

            <Input
                id="docNumber"
                name="docNumber"
                label="Document Number"
                value={formData.docNumber}
                onChange={handleInputChange}
                required
                placeholder="Enter document number"
              />

            <Input
                id="issueDate"
                name="issueDate"
                label="Issue Date"
                type="date"
                value={formData.issueDate}
                onChange={handleInputChange}
                required
              />

            <Input
                id="expiryDate"
                name="expiryDate"
                label="Expiry Date"
                type="date"
                value={formData.expiryDate}
                onChange={handleInputChange}
                required
              />
          </div>

          <div>
            <label htmlFor="remarks" className="mb-2 block text-sm font-medium text-gray-700">
              Remarks
            </label>
            <textarea
              id="remarks"
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              rows={4}
              placeholder="Enter remarks if needed"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <label htmlFor="file" className="mb-2 block text-sm font-medium text-gray-700">
              Document File (Optional)
            </label>
            {document.fileUrl && (
              <p className="mb-2 text-xs text-gray-600">
                Current file: <a href={document.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Open file</a>
              </p>
            )}
            <input
              id="file"
              type="file"
              name="file"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {formData.file && (
              <p className="text-xs text-green-600 mt-2">
                Selected file: {formData.file.name}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">Format: PDF, JPG, PNG, DOC, DOCX</p>
          </div>

          <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200">
            <Button type="submit" isLoading={saving}>
              Save changes
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push('/crewing/documents')}>
              Cancel
            </Button>
          </div>
      </form>
    </div>
  );
}
