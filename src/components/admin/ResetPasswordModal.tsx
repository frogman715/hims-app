'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';
import { InlineNotice } from '@/components/feedback/InlineNotice';
import { Button } from '@/components/ui';
import { pushAppNotice } from '@/lib/app-notice';

interface User {
  id: string;
  name: string;
  email: string;
}

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPasswordReset: () => void;
  user: User | null;
}

export default function ResetPasswordModal({ isOpen, onClose, onPasswordReset, user }: ResetPasswordModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleReset = async () => {
    if (!user) return;

    setError('');
    setLoading(true);
    setTempPassword('');

    try {
      const response = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Password reset could not be completed.');
      }

      setTempPassword(data.tempPassword);
      setShowPassword(true);
      onPasswordReset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTempPassword('');
    setShowPassword(false);
    setError('');
    onClose();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(tempPassword);
    pushAppNotice({
      tone: 'success',
      title: 'Password copied',
      message: 'Temporary password copied to the clipboard.',
    });
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reset User Password"
      subtitle={showPassword ? 'Temporary password is ready to share securely.' : `Reset password for ${user.name}`}
      size="md"
    >
      <div className="space-y-4">
        {error && (
          <InlineNotice tone="error" message={error} />
        )}

        {!showPassword ? (
          <>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Confirm Password Reset
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      This will generate a new temporary password for <strong>{user.name}</strong> ({user.email}).
                      The user must use this password at the next sign-in.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleReset}
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Temporary Password Generated
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p className="mb-2">
                      A new temporary password has been generated. Share it through an approved secure channel.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temporary Password
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tempPassword}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={copyToClipboard}
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Save this password before closing the dialog. It will not be shown again.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                onClick={handleClose}
              >
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
