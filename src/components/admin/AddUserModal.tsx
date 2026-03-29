'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';
import { InlineNotice } from '@/components/feedback/InlineNotice';
import { Button, Input, Label, Select } from '@/components/ui';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
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

export default function AddUserModal({ isOpen, onClose, onUserAdded, canSetSystemAdmin }: AddUserModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'STAFF',
    password: '',
    isSystemAdmin: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      // Reset form
      setFormData({
        name: '',
        email: '',
        role: 'STAFF',
        password: '',
        isSystemAdmin: false,
      });

      onUserAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'User registration could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    // Generate a random 12-character password
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register User"
      subtitle="Create a controlled office user account and assign the operational role."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <InlineNotice tone="error" message={error} />
        )}

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
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="john.doe@hanmarine.co"
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

        <div>
          <Label htmlFor="password">Temporary Password *</Label>
          <div className="flex gap-2">
            <Input
              id="password"
              type="text"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="Minimum 6 characters"
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={generatePassword}
            >
              Generate
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Set a temporary password the user can change after first sign-in.</p>
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
            {loading ? 'Registering...' : 'Register User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
