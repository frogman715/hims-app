'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface DocumentFormData {
  docType: string;
  docNumber: string;
  issueDate: string;
  expiryDate: string;
  remarks: string;
}

interface Document {
  id: number;
  seafarerId: number;
  seafarer: {
    id: number;
    fullName: string;
  };
  docType: string;
  docNumber: string;
  issueDate: string | null;
  expiryDate: string | null;
  remarks: string | null;
}

export default function EditDocumentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState<DocumentFormData>({
    docType: '',
    docNumber: '',
    issueDate: '',
    expiryDate: '',
    remarks: '',
  });
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch(`/api/documents/${id}`);
        if (response.ok) {
          const doc: Document = await response.json();
          setDocument(doc);
          setFormData({
            docType: doc.docType,
            docNumber: doc.docNumber,
            issueDate: doc.issueDate ? doc.issueDate.split('T')[0] : '',
            expiryDate: doc.expiryDate ? doc.expiryDate.split('T')[0] : '',
            remarks: doc.remarks || '',
          });
        } else {
          alert('Failed to fetch document');
          router.push('/crewing/documents');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error fetching document');
      } finally {
        setFetchLoading(false);
      }
    };

    if (id) {
      fetchDocument();
    }
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('docType', formData.docType);
      formDataToSend.append('docNumber', formData.docNumber);
      formDataToSend.append('issueDate', formData.issueDate);
      formDataToSend.append('expiryDate', formData.expiryDate);
      formDataToSend.append('remarks', formData.remarks);

      if (selectedFile) {
        formDataToSend.append('file', selectedFile);
      }

      const response = await fetch(`/api/documents/${id}`, {
        method: 'PUT',
        body: formDataToSend,
      });

      if (response.ok) {
        router.push('/crewing/documents');
      } else {
        const error = await response.json();
        alert(`Failed to update document: ${error.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating document');
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

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/crewing/documents');
      } else {
        alert('Failed to delete document');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting document');
    }
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
                Edit Document
              </h1>
              <p className="text-lg text-gray-700 mt-2 font-medium">
                Update document details for {document?.seafarer.fullName}
              </p>
            </div>
              <div className="flex items-center space-x-4 no-print">
                <button
                  onClick={() => window.print()}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-2xl"
                >
                  🖨️ Print Document
                </button>
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
            {/* Print Header */}
            <div className="print-only text-center mb-8 pb-4 border-b-2 border-gray-400">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">HANMARINE SHIPPING</h1>
              <p className="text-lg text-gray-700">Document Management System</p>
              <p className="text-sm text-gray-500 mt-2">Printed on: {new Date().toLocaleDateString()}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                  <option value="Passport">Passport</option>
                  <option value="Seaman's Book">Seaman&apos;s Book (Buku Pelaut)</option>
                  <option value="Certificate of Competency">Certificate of Competency (COC)</option>
                  <option value="Certificate of Proficiency">Certificate of Proficiency (COP)</option>
                  <option value="Basic Safety Training">Basic Safety Training (BST)</option>
                  <option value="General Operator Certificate">General Operator Certificate (GOC)</option>
                  <option value="Medical Certificate">Medical Certificate</option>
                  <option value="Visa">Visa</option>
                  <option value="Yellow Fever Certificate">Yellow Fever Certificate</option>
                  <option value="Drug Test Certificate">Drug Test Certificate</option>
                  <option value="Employment Contract">Employment Contract</option>
                  <option value="Contract Extension">Contract Extension</option>
                  <option value="Addendum">Contract Addendum</option>
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
                  Upload Scanned Document (Optional)
                </label>
                <input
                  type="file"
                  id="file"
                  name="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-transparent transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-sm text-gray-500 mt-1">Accepted formats: PDF, JPG, JPEG, PNG</p>
                {selectedFile && (
                  <p className="text-sm text-green-600 mt-1">Selected: {selectedFile.name}</p>
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

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-300 no-print">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Update Document'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl"
                >
                  Delete Document
                </button>
              </div>
            </form>

            {/* Print Footer */}
            <div className="print-only text-center mt-8 pt-4 border-t-2 border-gray-400">
              <p className="text-sm text-gray-500">This document was generated from the Hanmarine HIMS system</p>
              <p className="text-xs text-gray-700 mt-1">Document ID: {id} | Seafarer: {document?.seafarer.fullName}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}