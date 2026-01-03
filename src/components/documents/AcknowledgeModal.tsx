'use client';

import React, { useState } from 'react';
import { Loader, AlertCircle, CheckCircle } from 'lucide-react';
import Modal from '../Modal';

interface AcknowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentCode: string;
  documentTitle: string;
  onSuccess?: () => void;
}

export default function AcknowledgeModal({
  isOpen,
  onClose,
  documentId,
  documentCode,
  documentTitle,
  onSuccess,
}: AcknowledgeModalProps) {
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleAcknowledge = async () => {
    if (!agreed) {
      setError('You must agree to acknowledge the document');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/documents/${documentId}/acknowledge`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            remarks: remarks || 'Acknowledged',
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to acknowledge');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to acknowledge');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!success) {
      setRemarks('');
      setAgreed(false);
      setError(null);
    }
    onClose();
  };

  if (success) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Acknowledged"
        size="sm"
      >
        <div className="flex flex-col items-center justify-center py-6">
          <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold text-green-700">
            Document Acknowledged!
          </h3>
          <p className="text-gray-600 text-sm mt-2">
            Your acknowledgement has been recorded
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Acknowledge Document"
      size="md"
    >
      <div className="space-y-4">
        {/* Document Info */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-600 font-mono font-semibold">
            {documentCode}
          </p>
          <p className="text-sm font-medium text-blue-900 mt-1">
            {documentTitle}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Remarks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Remarks (Optional)
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g., 'I have read and understood this document'"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Acknowledgement Checkbox */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
          <p className="text-sm font-medium text-gray-900">
            Acknowledgement Statement
          </p>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => {
                setAgreed(e.target.checked);
                if (e.target.checked) setError(null);
              }}
              className="w-4 h-4 mt-1 rounded"
            />
            <span className="text-xs text-gray-700">
              I confirm that I have received and understand the requirements of
              this document. I will comply with all the procedures and
              requirements outlined in this document.
            </span>
          </label>
        </div>

        {/* Info Message */}
        <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
          <p>
            <strong>Note:</strong> Your acknowledgement will be recorded with a
            timestamp for audit purposes.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAcknowledge}
            disabled={loading || !agreed}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            {loading ? 'Acknowledging...' : 'I Acknowledge'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
