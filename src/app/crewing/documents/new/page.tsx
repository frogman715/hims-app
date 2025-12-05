'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('seafarerId', formData.seafarerId);
      formDataToSend.append('docType', formData.docType);
      formDataToSend.append('docNumber', formData.docNumber);
      formDataToSend.append('issueDate', formData.issueDate);
      formDataToSend.append('expiryDate', formData.expiryDate);
      formDataToSend.append('remarks', formData.remarks);

      if (selectedFile) {
        formDataToSend.append('file', selectedFile);
      }

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        router.push('/crewing/documents');
      } else {
        const error = await response.json();
        alert(`Failed to create document: ${error.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating document');
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
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
            <div className="text-center">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                Add New Document
              </h1>
              <p className="text-lg text-gray-600 mt-2 font-medium">
                Upload and register a new seafarer document
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/crewing/documents"
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                ← Back to Documents
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                  <option value="Training Certificate">Training Certificate</option>
                  <option value="Other">Other</option>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Additional notes or remarks"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Document'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
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