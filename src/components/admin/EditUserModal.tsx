'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { InlineNotice } from '@/components/feedback/InlineNotice';
import { Button, Input, Label, Select } from '@/components/ui';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isSystemAdmin: boolean;
  isActive: boolean;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
  user: User | null;
  canSetSystemAdmin: boolean;
}

const ROLES = [
  { value: 'DIRECTOR', label: 'Director' },
  { value: 'CDMO', label: 'Document Control' },
  { value: 'OPERATIONAL', label: 'Operational' },
  { value: 'GA_DRIVER', label: 'General Affair / Driver' },
  { value: 'ACCOUNTING', label: 'Accounting' },
  { value: 'HR', label: 'HR' },
  { value: 'HR_ADMIN', label: 'HR Admin' },
  { value: 'QMR', label: 'QMR' },
  { value: 'SECTION_HEAD', label: 'Section Head' },
  { value: 'STAFF', label: 'Staff' },
  { value: 'CREW_PORTAL', label: 'Crew Portal' },
];

export default function EditUserModal({ isOpen, onClose, onUserUpdated, user, canSetSystemAdmin }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    role: 'STAFF',
    isSystemAdmin: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        role: user.role,
        isSystemAdmin: user.isSystemAdmin,
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user');
      }

      onUserUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'User access changes could not be saved.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update User Access"
      subtitle={`Review role assignment and account settings for ${user.email}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <InlineNotice tone="error" message={error} />
        )}

        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={user.email}
            disabled
            className="bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">Email identity is fixed for this user record.</p>
        </div>

        <div>
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="John Doe"
          />
        </div>

        <div>
          <Label htmlFor="role">Role *</Label>
          <Select
            id="role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            required
            options={ROLES}
          />
        </div>

        {canSetSystemAdmin && (
          <div className="flex items-center space-x-2">
            <input
              id="isSystemAdmin"
              type="checkbox"
              checked={formData.isSystemAdmin}
              onChange={(e) => setFormData({ ...formData, isSystemAdmin: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <Label htmlFor="isSystemAdmin" className="mb-0">
              System Administrator
            </Label>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
