'use client';

import Link from 'next/link';
import { useState } from 'react';
import { InlineConfirmStrip } from '@/components/feedback/InlineConfirmStrip';
import { InlineNotice } from '@/components/feedback/InlineNotice';

interface DocumentActionsProps {
  documentId: string;
  docNumber: string;
  fileUrl: string | null;
  canEdit?: boolean;
  canDelete?: boolean;
  onDeleteSuccess?: () => void;
}

export default function DocumentActions({
  documentId,
  docNumber,
  fileUrl,
  canEdit = true,
  canDelete = true,
  onDeleteSuccess,
}: DocumentActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || 'Failed to delete document');
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
      setIsConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-3">
      {isConfirmOpen ? (
        <InlineConfirmStrip
          tone="error"
          title="Delete this document?"
          message={`Remove document ${docNumber || documentId} only when the record was uploaded incorrectly.`}
          confirmLabel="Confirm Delete"
          cancelLabel="Keep Document"
          onCancel={() => setIsConfirmOpen(false)}
          onConfirm={handleDelete}
          isProcessing={isDeleting}
        />
      ) : null}

      {error ? <InlineNotice tone="error" message={error} onDismiss={() => setError(null)} /> : null}

      <div className="flex items-center gap-2">
      <Link
        href={`/crewing/documents/${documentId}/view`}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 text-sm font-medium transition"
      >
        Open Detail
      </Link>

      {canEdit ? (
        <Link
          href={`/crewing/documents/${documentId}/edit`}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 text-sm font-medium transition"
        >
          Edit Record
        </Link>
      ) : null}

      {fileUrl && (
        <a
          href={fileUrl}
          download={`${docNumber || 'document'}`}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-green-300 text-green-700 hover:bg-green-50 text-sm font-medium transition"
          target="_blank"
          rel="noopener noreferrer"
        >
          Download File
        </a>
      )}

      {canDelete ? (
        <button
          onClick={() => setIsConfirmOpen(true)}
          disabled={isDeleting}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? 'Deleting...' : 'Delete Record'}
        </button>
      ) : null}

      </div>
    </div>
  );
}
