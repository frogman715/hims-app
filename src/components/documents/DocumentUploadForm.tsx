'use client';

import React, { useState } from 'react';
import { Upload, X, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface DocumentUploadFormProps {
  onSuccess?: (document: Record<string, unknown>) => void;
  onClose?: () => void;
}

const DOCUMENT_TYPES = [
  'SOP',
  'WORK_INSTRUCTION',
  'POLICY',
  'PROCEDURE',
  'FORM',
  'RECORD',
  'OTHER',
];

const DEPARTMENTS = ['QMS', 'OPERATIONS', 'HR', 'FINANCE', 'MARINE', 'OTHER'];

const RETENTION_PERIODS = [
  { value: 'THREE_MONTHS', label: '3 Bulan' },
  { value: 'SIX_MONTHS', label: '6 Bulan' },
  { value: 'ONE_YEAR', label: '1 Tahun' },
  { value: 'TWO_YEARS', label: '2 Tahun' },
  { value: 'THREE_YEARS', label: '3 Tahun' },
  { value: 'FIVE_YEARS', label: '5 Tahun' },
  { value: 'SEVEN_YEARS', label: '7 Tahun' },
  { value: 'TEN_YEARS', label: '10 Tahun' },
  { value: 'PERMANENT', label: 'Permanen' },
];

export default function DocumentUploadForm({
  onSuccess,
  onClose,
}: DocumentUploadFormProps) {
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    documentType: 'SOP',
    department: 'QMS',
    retentionPeriod: 'ONE_YEAR',
    effectiveDate: new Date().toISOString().split('T')[0],
  });

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      const droppedFile = droppedFiles[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      validateAndSetFile(selectedFiles[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const maxSize = 50 * 1024 * 1024; // 50 MB
    const allowedTypes = ['application/pdf', 'application/msword'];

    if (selectedFile.size > maxSize) {
      setError('File size must be less than 50 MB');
      return;
    }

    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Only PDF and Word documents are allowed');
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.title) {
      setError('Code and Title are required');
      return;
    }

    if (!file) {
      setError('Please select a document file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Upload file to storage (S3 or similar)
      // For now, we'll use a placeholder URL
      const contentUrl = `file://${file.name}`;

      // Create document via API
      const response = await fetch('/api/documents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          contentUrl,
          fileName: file.name,
          fileSize: file.size,
          effectiveDate: new Date(formData.effectiveDate),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create document');
      }

      const newDocument = await response.json();
      setSuccess(true);

      // Reset form
      setTimeout(() => {
        onSuccess?.(newDocument);
        setFormData({
          code: '',
          title: '',
          description: '',
          documentType: 'SOP',
          department: 'QMS',
          retentionPeriod: 'ONE_YEAR',
          effectiveDate: new Date().toISOString().split('T')[0],
        });
        setFile(null);
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
        <h3 className="text-lg font-semibold text-green-700">
          Document Created Successfully!
        </h3>
        <p className="text-gray-600 mt-2">Redirecting...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Document Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Document Code *
          </label>
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleInputChange}
            placeholder="e.g., DOC-2024-001"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Document Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type *
          </label>
          <select
            name="documentType"
            value={formData.documentType}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title *
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Document title"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Brief description of the document"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Department */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Department *
          </label>
          <select
            name="department"
            value={formData.department}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Retention Period */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Retention Period *
          </label>
          <select
            name="retentionPeriod"
            value={formData.retentionPeriod}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {RETENTION_PERIODS.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Effective Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Effective Date *
        </label>
        <input
          type="date"
          name="effectiveDate"
          value={formData.effectiveDate}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Document File *
        </label>
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx"
            className="hidden"
            id="file-input"
          />

          {file ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="file-input"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-900">
                Drag and drop your document here
              </p>
              <p className="text-xs text-gray-500 mt-1">
                or click to browse (PDF, DOC, DOCX max 50 MB)
              </p>
            </label>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
        >
          {loading && <Loader className="w-4 h-4 animate-spin" />}
          {loading ? 'Creating...' : 'Create Document'}
        </button>
      </div>
    </form>
  );
}
