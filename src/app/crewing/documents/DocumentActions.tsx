'use client';

import Link from 'next/link';
import { useState } from 'react';

interface DocumentActionsProps {
  documentId: string;
  docNumber: string;
  fileUrl: string | null;
  seafarerName: string;
  onDeleteSuccess?: () => void;
}

export default function DocumentActions({
  documentId,
  docNumber,
  fileUrl,
  seafarerName,
  onDeleteSuccess,
}: DocumentActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete this document (${docNumber})?`)) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      // Refresh the page or notify parent
      if (onDeleteSuccess) {
        onDeleteSuccess();
      } else {
        window.location.reload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/crewing/documents/${documentId}/view`}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 text-sm font-medium transition"
      >
        View
      </Link>

      <Link
        href={`/crewing/documents/${documentId}/edit`}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 text-sm font-medium transition"
      >
        Edit
      </Link>

      {fileUrl && (
        <a
          href={fileUrl}
          download={`${docNumber || 'document'}`}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-green-300 text-green-700 hover:bg-green-50 text-sm font-medium transition"
          target="_blank"
          rel="noopener noreferrer"
        >
          Download
        </a>
      )}

      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>

      {error && (
        <div className="text-xs text-red-600 ml-2">
          {error}
        </div>
      )}
    </div>
  );
}
