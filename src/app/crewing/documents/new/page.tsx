'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DOCUMENT_TYPES } from '@/lib/document-types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface DocumentFormData {
  seafarerId: string;
  docType: string;
  docNumber: string;
  issueDate: string;
  expiryDate: string;
  remarks: string;
}

interface Seafarer {
  id: string;
  fullName: string | null;
}

function getCrewDisplayName(seafarer: Seafarer) {
  const normalized = seafarer.fullName?.trim();
  return normalized && normalized.length > 0 ? normalized : `Crew ${seafarer.id}`;
}

function mapSeafarersResponse(payload: unknown): Seafarer[] {
  const rawList =
    Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { data?: unknown } | null)?.data)
        ? (payload as { data: unknown[] }).data
        : [];

  return rawList.reduce<Seafarer[]>((items, item) => {
    if (typeof item !== "object" || item === null) {
      return items;
    }

    const candidate = item as { id?: unknown; fullName?: unknown };
    if (typeof candidate.id === "string") {
      items.push({
        id: candidate.id,
        fullName: typeof candidate.fullName === "string" ? candidate.fullName : null,
      });
    }

    return items;
  }, []);
}

export default function NewDocumentPage() {
  const router = useRouter();
  const formSteps = [
    {
      step: "Step 1",
      title: "Select Seafarer",
      detail: "Attach the upload to the correct active crew record before anything else.",
    },
    {
      step: "Step 2",
      title: "Enter Document Details",
      detail: "Use the exact type, number, issue date, and expiry date from the source document.",
    },
    {
      step: "Step 3",
      title: "Upload Evidence",
      detail: "Attach one clean file so document review and renewal follow-up stay traceable.",
    },
  ];

  const [formData, setFormData] = useState<DocumentFormData>({
    seafarerId: '',
    docType: '',
    docNumber: '',
    issueDate: '',
    expiryDate: '',
    remarks: '',
  });
  const [seafarers, setSeafarers] = useState<Seafarer[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchSeafarers = async () => {
      try {
        const response = await fetch('/api/seafarers');
        if (response.ok) {
          const data = await response.json();
          setSeafarers(mapSeafarersResponse(data));
        } else {
          const payload = await response.json().catch(() => null);
          setUploadError(payload?.error || 'Failed to load seafarers');
        }
      } catch (error) {
        console.error('Error fetching seafarers:', error);
        setUploadError('Failed to load seafarers');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchSeafarers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // Validate required fields
      if (!formData.seafarerId) {
        setUploadError('Please select a seafarer');
        setLoading(false);
        return;
      }
      if (!formData.docType) {
        setUploadError('Please select a document type');
        setLoading(false);
        return;
      }
      if (!formData.docNumber) {
        setUploadError('Please enter a document number');
        setLoading(false);
        return;
      }
      if (!formData.issueDate) {
        setUploadError('Please select an issue date');
        setLoading(false);
        return;
      }
      if (!formData.expiryDate) {
        setUploadError('Please select an expiry date');
        setLoading(false);
        return;
      }
      if (!selectedFile) {
        setUploadError('Please select a file to upload');
        setLoading(false);
        return;
      }

      // Validate file type and size
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
      const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      if (!ALLOWED_TYPES.includes(selectedFile.type)) {
        setUploadError(`Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX. Got: ${selectedFile.type || 'unknown'}`);
        setLoading(false);
        return;
      }

      if (selectedFile.size > MAX_FILE_SIZE) {
        setUploadError(`File size (${(selectedFile.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum of 10MB`);
        setLoading(false);
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('seafarerId', formData.seafarerId);
      formDataToSend.append('docType', formData.docType);
      formDataToSend.append('docNumber', formData.docNumber);
      formDataToSend.append('issueDate', formData.issueDate);
      formDataToSend.append('expiryDate', formData.expiryDate);
      formDataToSend.append('remarks', formData.remarks);
      formDataToSend.append('file', selectedFile);

      setUploadProgress(10);

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formDataToSend,
      });

      setUploadProgress(90);

      if (response.ok) {
        setUploadProgress(100);
        setTimeout(() => router.push('/crewing/documents'), 500);
      } else {
        let errorMsg = 'Unknown error';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const error = await response.json();
            errorMsg = error.error || 'Unknown error';
          } else {
            errorMsg = `Server error: ${response.status} ${response.statusText}`;
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorMsg = `Server error: ${response.status} ${response.statusText}`;
        }
        setUploadError(`Failed to create document: ${errorMsg}`);
        setUploadProgress(0);
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      setUploadError(`Error creating document: ${errorMsg}`);
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  if (fetchLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-slate-900" />
          <p className="mt-4 text-sm font-medium text-slate-600">Loading document form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-stack">
      <section className="surface-card p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">Document Upload</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Register new crew document</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Upload and register a controlled document under the active seafarer master record.
            </p>
          </div>
          <Link href="/crewing/documents" className="action-pill text-sm">
            Back to documents
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {formSteps.map((item) => (
            <div key={item.step} className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{item.step}</p>
              <p className="mt-2 text-base font-semibold text-slate-950">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="surface-card p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-900">
                Use this form to keep the controlled document register complete. Uploads here support document review and renewal follow-up, not automatic readiness approval.
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Step 1</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">Record Scope</h3>
                  <p className="mt-1 text-sm text-slate-600">Start by attaching the upload to the correct seafarer and document class.</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <Select
                  id="seafarerId"
                  name="seafarerId"
                  label="Seafarer"
                  value={formData.seafarerId}
                  onChange={handleChange}
                  required
                  placeholder="Select seafarer"
                  options={seafarers.map((seafarer) => ({
                    value: seafarer.id,
                    label: getCrewDisplayName(seafarer),
                  }))}
                  />

                  <Select
                  id="docType"
                  name="docType"
                  label="Document Type"
                  value={formData.docType}
                  onChange={handleChange}
                  required
                  placeholder="Select document type"
                  options={DOCUMENT_TYPES.map((docType) => ({
                    value: docType.value,
                    label: docType.label,
                  }))}
                  />
                </div>
              </div>

              <Input
                  id="docNumber"
                  name="docNumber"
                  label="Document Number"
                  value={formData.docNumber}
                  onChange={handleChange}
                  required
                  placeholder="Enter document number"
              />

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Input
                  id="issueDate"
                  name="issueDate"
                  label="Issue Date"
                  type="date"
                  value={formData.issueDate}
                  onChange={handleChange}
                  required
                />
                <Input
                  id="expiryDate"
                  name="expiryDate"
                  label="Expiry Date"
                  type="date"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="file" className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload Scanned Document *
                </label>
                <input
                  type="file"
                  id="file"
                  name="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-sm text-gray-500 mt-1">Accepted formats: PDF, JPG, JPEG, PNG, DOC, DOCX (Max 10MB)</p>
                {selectedFile && (
                  <p className="text-sm text-green-600 mt-1">✓ Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)</p>
                )}
              </div>

              <div>
                <label htmlFor="remarks" className="block text-sm font-semibold text-gray-700 mb-2">
                  Remarks
                </label>
                <textarea
                  id="remarks"
                  name="remarks"
                  rows={3}
                  value={formData.remarks}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Additional notes or remarks"
                />
              </div>

              {uploadError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm font-medium text-red-800">
                    <span className="font-bold">Error: </span>{uploadError}
                  </p>
                </div>
              )}

              {loading && uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-blue-600">
                      {uploadProgress < 90 ? 'Uploading file...' : 'Processing...'}
                    </p>
                    <p className="text-sm font-semibold text-blue-600">{uploadProgress}%</p>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-4 border-t border-slate-200 pt-6">
                <Button type="submit" isLoading={loading} disabled={!selectedFile}>
                  {loading ? (uploadProgress < 90 ? 'Uploading document' : 'Processing document') : 'Create document'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => router.back()} disabled={loading}>
                  Cancel
                </Button>
              </div>
            </form>
      </section>
    </div>
  );
}
