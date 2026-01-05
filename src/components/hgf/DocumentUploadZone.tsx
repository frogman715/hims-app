/**
 * Document Upload Zone Component
 * Drag & drop interface untuk upload dokumen
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';

interface UploadedFile {
  file: File;
  preview?: string;
  uploadProgress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface DocumentUploadZoneProps {
  submissionId: string;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedFormats?: string[];
  onUploadComplete?: (fileUrl: string, fileData: UploadedFile) => void;
  onError?: (error: string) => void;
  isLoading?: boolean;
}

export function DocumentUploadZone({
  submissionId,
  maxFiles = 5,
  maxFileSize = 10, // 10 MB
  acceptedFormats = ['pdf', 'jpg', 'jpeg', 'png'],
  onUploadComplete,
  onError,
  isLoading = false,
}: DocumentUploadZoneProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload file to server
  const uploadFile_async = async (uploadFile: UploadedFile) => {
    try {
      setFiles((prev) =>
        prev.map((f) =>
          f.file === uploadFile.file ? { ...f, status: 'uploading' } : f
        )
      );

      const formData = new FormData();
      formData.append('file', uploadFile.file);
      formData.append('submissionId', submissionId);
      formData.append(
        'documentType',
        uploadFile.file.name.split('.')[0].toUpperCase()
      );

      const response = await fetch('/api/hgf/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = (await response.json()) as { fileUrl: string };

      setFiles((prev) =>
        prev.map((f) =>
          f.file === uploadFile.file
            ? { ...f, status: 'success', uploadProgress: 100 }
            : f
        )
      );

      onUploadComplete?.(data.fileUrl, uploadFile);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';

      setFiles((prev) =>
        prev.map((f) =>
          f.file === uploadFile.file
            ? { ...f, status: 'error', error: errorMessage }
            : f
        )
      );

      onError?.(errorMessage);
    }
  };

  // Validate file
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const fileSizeMB = file.size / (1024 * 1024);
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileSizeMB > maxFileSize) {
      return {
        valid: false,
        error: `File size must be less than ${maxFileSize}MB`,
      };
    }

    if (!fileExtension || !acceptedFormats.includes(fileExtension)) {
      return {
        valid: false,
        error: `Only ${acceptedFormats.join(', ').toUpperCase()} files allowed`,
      };
    }

    return { valid: true };
  };

  // Handle file selection
  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;

      const newFiles: UploadedFile[] = [];

      Array.from(fileList).forEach((file) => {
        // Check if file already exists
        if (files.some((f) => f.file.name === file.name)) {
          onError?.(`File "${file.name}" already selected`);
          return;
        }

        // Validate file
        const validation = validateFile(file);
        if (!validation.valid) {
          onError?.(validation.error || 'Invalid file');
          return;
        }

        // Check max files
        if (files.length + newFiles.length >= maxFiles) {
          onError?.(`Maximum ${maxFiles} files allowed`);
          return;
        }

        newFiles.push({
          file,
          uploadProgress: 0,
          status: 'pending',
        });
      });

      setFiles((prev) => [...prev, ...newFiles]);

      // Auto upload
      newFiles.forEach((uploadFile) => {
        uploadFile_async(uploadFile);
      });
    },
    [files, maxFiles, onError, uploadFile_async, validateFile]
  );

  // Handle drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  // Remove file
  const removeFile = (fileToRemove: UploadedFile) => {
    setFiles((prev) => prev.filter((f) => f !== fileToRemove));
  };

  return (
    <div className="w-full space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFormats.map((fmt) => `.${fmt}`).join(',')}
          onChange={(e) => handleFiles(e.target.files)}
          disabled={isLoading}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-2">
          <Upload className="w-12 h-12 text-gray-400" />
          <div>
            <p className="text-lg font-semibold text-gray-900">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Supported: {acceptedFormats.map((f) => f.toUpperCase()).join(', ')} (Max {maxFileSize}MB)
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, idx) => (
            <FileItem
              key={idx}
              file={file}
              onRemove={() => removeFile(file)}
            />
          ))}
        </div>
      )}

      {/* Summary */}
      {files.length > 0 && (
        <div className="text-sm text-gray-600">
          <p>
            {files.filter((f) => f.status === 'success').length} of{' '}
            {files.length} files uploaded
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Individual File Item Component
 */
interface FileItemProps {
  file: UploadedFile;
  onRemove: () => void;
}

function FileItem({ file, onRemove }: FileItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
      {/* Status Icon */}
      <div className="flex-shrink-0">
        {file.status === 'pending' && (
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        )}
        {file.status === 'uploading' && (
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        )}
        {file.status === 'success' && (
          <CheckCircle className="w-5 h-5 text-green-600" />
        )}
        {file.status === 'error' && (
          <AlertCircle className="w-5 h-5 text-red-600" />
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {file.file.name}
        </p>
        <p className="text-xs text-gray-500">
          {(file.file.size / 1024 / 1024).toFixed(2)} MB
        </p>

        {/* Progress Bar */}
        {file.status === 'uploading' && (
          <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all"
              style={{ width: `${file.uploadProgress}%` }}
            />
          </div>
        )}

        {/* Error Message */}
        {file.status === 'error' && file.error && (
          <p className="text-xs text-red-600 mt-1">{file.error}</p>
        )}
      </div>

      {/* Remove Button */}
      {(file.status === 'pending' || file.status === 'error') && (
        <button
          onClick={onRemove}
          type="button"
          className="flex-shrink-0 p-1 hover:bg-red-100 rounded text-red-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
