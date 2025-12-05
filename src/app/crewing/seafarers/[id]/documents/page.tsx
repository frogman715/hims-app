'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface SeafarerDocument {
  id: number;
  docType: string;
  docNumber: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  remarks: string | null;
}

interface Seafarer {
  id: number;
  fullName: string;
}

export default function SeafarerDocumentsPage() {
  const router = useRouter();
  const params = useParams();
  const seafarerId = params.id as string;

  const [seafarer, setSeafarer] = useState<Seafarer | null>(null);
  const [documents, setDocuments] = useState<SeafarerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

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
      const response = await fetch(`/api/seafarers/${seafarerId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
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
        fetchDocuments(); // Refresh the list
        e.currentTarget.reset(); // Clear the form
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
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Seafarer
        </button>
        <h1 className="text-2xl font-bold">Documents for {seafarer.fullName}</h1>
      </div>

      {/* Upload Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Upload New Document</h2>
        <form onSubmit={handleFileUpload} className="space-y-4">
          <input type="hidden" name="seafarerId" value={seafarerId} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="docType" className="block text-sm font-medium text-gray-700 mb-1">
                Document Type *
              </label>
              <select
                id="docType"
                name="docType"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label htmlFor="docNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Document Number
              </label>
              <input
                type="text"
                id="docNumber"
                name="docNumber"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700 mb-1">
                Issue Date
              </label>
              <input
                type="date"
                id="issueDate"
                name="issueDate"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                id="expiryDate"
                name="expiryDate"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-1">
              Remarks
            </label>
            <textarea
              id="remarks"
              name="remarks"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
              Document File *
            </label>
            <input
              type="file"
              id="file"
              name="file"
              required
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </form>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Existing Documents</h2>
        {documents.length === 0 ? (
          <p className="text-gray-500">No documents uploaded yet.</p>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{doc.docType}</h3>
                    {doc.docNumber && (
                      <p className="text-sm text-gray-600">Number: {doc.docNumber}</p>
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
                      <p className="text-sm text-gray-600 mt-1">{doc.remarks}</p>
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
    </div>
  );
}