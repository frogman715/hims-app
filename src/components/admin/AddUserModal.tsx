'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';
import { Button, Input, Label, Select } from '@/components/ui';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
  canSetSystemAdmin: boolean;
}

const ROLES = [
  { value: 'DIRECTOR', label: 'Director' },
  { value: 'CDMO', label: 'CDMO' },
  { value: 'OPERATIONAL', label: 'Operational' },
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
      setError(err instanceof Error ? err.message : 'An error occurred');
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
      title="Add New User"
      subtitle="Create a new user account with assigned role"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {error}
          </div>
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
          >
            {ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="password">Password *</Label>
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
              variant="outline"
              onClick={generatePassword}
            >
              Generate
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Minimum 6 characters required</p>
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
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
