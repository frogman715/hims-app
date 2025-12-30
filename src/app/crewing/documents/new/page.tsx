'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DOCUMENT_TYPES } from '@/lib/document-types';

interface DocumentFormData {
  seafarerId: string;
  docType: string;
  docNumber: string;
  issueDate: string;
  expiryDate: string;
  remarks: string;
}

interface Seafarer {
  id: number;
  fullName: string;
}

export default function NewDocumentPage() {
  const router = useRouter();

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
          setSeafarers(data);
        }
      } catch (error) {
        console.error('Error fetching seafarers:', error);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white backdrop-blur-md rounded-2xl shadow-lg border border-white p-6">
            <div className="text-center">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white backdrop-blur-lg shadow-2xl border-b border-white/20">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                Add New Document
              </h1>
              <p className="text-lg text-gray-700 mt-2 font-medium">
                Upload and register a new seafarer document
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/crewing/documents"
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-2xl"
              >
                ← Back to Documents
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white backdrop-blur-md rounded-2xl shadow-lg border border-white p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Seafarer Selection */}
              <div>
                <label htmlFor="seafarerId" className="block text-sm font-semibold text-gray-700 mb-2">
                  Seafarer *
                </label>
                <select
                  id="seafarerId"
                  name="seafarerId"
                  required
                  value={formData.seafarerId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select Seafarer</option>
                  {seafarers.map((seafarer) => (
                    <option key={seafarer.id} value={seafarer.id}>
                      {seafarer.fullName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Document Type */}
              <div>
                <label htmlFor="docType" className="block text-sm font-semibold text-gray-700 mb-2">
                  Document Type *
                </label>
                <select
                  id="docType"
                  name="docType"
                  required
                  value={formData.docType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select Document Type</option>
                  {DOCUMENT_TYPES.map((docType) => (
                    <option key={docType.value} value={docType.value}>
                      {docType.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Document Number */}
              <div>
                <label htmlFor="docNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                  Document Number *
                </label>
                <input
                  type="text"
                  id="docNumber"
                  name="docNumber"
                  required
                  value={formData.docNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter document number"
                />
              </div>

              {/* Issue Date */}
              <div>
                <label htmlFor="issueDate" className="block text-sm font-semibold text-gray-700 mb-2">
                  Issue Date *
                </label>
                <input
                  type="date"
                  id="issueDate"
                  name="issueDate"
                  required
                  value={formData.issueDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Expiry Date */}
              <div>
                <label htmlFor="expiryDate" className="block text-sm font-semibold text-gray-700 mb-2">
                  Expiry Date *
                </label>
                <input
                  type="date"
                  id="expiryDate"
                  name="expiryDate"
                  required
                  value={formData.expiryDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* File Upload */}
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

              {/* Remarks */}
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

              {/* Error Alert */}
              {uploadError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm font-medium text-red-800">
                    <span className="font-bold">Error: </span>{uploadError}
                  </p>
                </div>
              )}

              {/* Upload Progress */}
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

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-300">
                <button
                  type="submit"
                  disabled={loading || !selectedFile}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-400 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      {uploadProgress < 90 ? 'UPLOADING...' : 'PROCESSING...'}
                    </span>
                  ) : (
                    '✓ Create Document'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 disabled:from-gray-400 disabled:to-gray-400 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}