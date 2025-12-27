'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { DOCUMENT_TYPES, getDocumentTypeLabel } from '@/lib/document-types';

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
    fullName: string;
  };
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
        throw new Error('Failed to load document');
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
      setError('Gagal memuat detail dokumen. Silakan coba lagi.');
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
        throw new Error('Mohon isi semua field yang diperlukan');
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
        throw new Error(errorData.error || 'Gagal menyimpan dokumen');
      }

      // Redirect to view page
      router.push(`/crewing/documents/${id}/view`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan';
      setError(message);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        <p className="text-sm font-semibold text-gray-700">Memuat dokumen…</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error && !document) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-3xl mx-auto py-16 px-6">
          <div className="surface-card p-8 text-center space-y-4">
            <h1 className="text-2xl font-semibold text-gray-900">Gagal Memuat Dokumen</h1>
            <p className="text-sm text-gray-600">{error}</p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/crewing/documents" className="action-pill">
                ← Kembali ke Daftar
              </Link>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setError(null);
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

  if (!document) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-3xl mx-auto py-16 px-6">
          <div className="surface-card p-8 text-center space-y-3">
            <h1 className="text-2xl font-semibold text-gray-900">Dokumen tidak ditemukan</h1>
            <p className="text-sm text-gray-600">Dokumen yang Anda cari mungkin telah dihapus atau tidak available.</p>
            <Link href="/crewing/documents" className="action-pill">
              ← Kembali ke Daftar
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
            <p className="text-sm font-semibold text-blue-600 uppercase">Edit Dokumen</p>
            <h1 className="text-3xl font-bold text-gray-900 mt-1">
              {getDocumentTypeLabel(document.docType)}
            </h1>
            <p className="text-sm text-gray-600 mt-2">Untuk {document.crew.fullName}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/crewing/documents" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold transition">
              ← Batal
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <form onSubmit={handleSubmit} className="surface-card p-8 space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Document Type */}
            <div>
              <label htmlFor="docType" className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Dokumen <span className="text-red-500">*</span>
              </label>
              <select
                id="docType"
                name="docType"
                value={formData.docType}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih Jenis Dokumen</option>
                {DOCUMENT_TYPES.map((docType) => (
                  <option key={docType.value} value={docType.value}>
                    {docType.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Document Number */}
            <div>
              <label htmlFor="docNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Nomor Dokumen <span className="text-red-500">*</span>
              </label>
              <input
                id="docNumber"
                type="text"
                name="docNumber"
                value={formData.docNumber}
                onChange={handleInputChange}
                required
                placeholder="Masukkan nomor dokumen"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Issue Date */}
            <div>
              <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Terbit <span className="text-red-500">*</span>
              </label>
              <input
                id="issueDate"
                type="date"
                name="issueDate"
                value={formData.issueDate}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Kedaluwarsa <span className="text-red-500">*</span>
              </label>
              <input
                id="expiryDate"
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-2">
              Catatan / Keterangan
            </label>
            <textarea
              id="remarks"
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              rows={4}
              placeholder="Masukkan catatan jika diperlukan"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* File Upload */}
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
              Berkas Dokumen (Opsional)
            </label>
            {document.fileUrl && (
              <p className="text-xs text-gray-600 mb-2">
                Berkas saat ini: <a href={document.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Lihat berkas</a>
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
                File yang dipilih: {formData.file.name}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">Format: PDF, JPG, PNG, DOC, DOCX</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
            <Link href="/crewing/documents" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition">
              Batal
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
