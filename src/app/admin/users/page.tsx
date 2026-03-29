'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AddUserModal from '@/components/admin/AddUserModal';
import EditUserModal from '@/components/admin/EditUserModal';
import ResetPasswordModal from '@/components/admin/ResetPasswordModal';
import { InlineConfirmStrip } from '@/components/feedback/InlineConfirmStrip';
import { InlineNotice } from '@/components/feedback/InlineNotice';
import { WorkspaceHero } from '@/components/layout/WorkspaceHero';
import { Button } from '@/components/ui/Button';
import { getRoleDisplayName } from '@/lib/role-display';
import { ADMIN_MAINTENANCE_SCOPES, hasAdminMaintenanceScope } from '@/lib/admin-access';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isSystemAdmin: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function UserManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [pendingStatusUser, setPendingStatusUser] = useState<User | null>(null);

  // Check authentication and authorization
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    const hasAccess = hasAdminMaintenanceScope(
      {
        roles: session.user.roles,
        role: session.user.role,
        isSystemAdmin: session.user.isSystemAdmin,
        adminMaintenanceScopes: session.user.adminMaintenanceScopes,
      },
      ADMIN_MAINTENANCE_SCOPES.USER_MANAGEMENT
    );

    if (!hasAccess) {
      router.push('/403');
      return;
    }

    fetchUsers();
  }, [session, status, router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      setUsers(data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      setFeedback({ tone: 'error', message: 'User records could not be loaded.' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = !user.isActive;

    try {
      const response = await fetch(`/api/admin/users/${user.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user status');
      }

      fetchUsers();
      setPendingStatusUser(null);
      setFeedback({
        tone: 'success',
        message: `User ${newStatus ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'User status could not be updated.',
      });
    }
  };

  const handleUserAdded = () => {
    fetchUsers();
  };

  const handleUserUpdated = () => {
    fetchUsers();
  };

  const handlePasswordReset = () => {
    fetchUsers();
  };

  const canSetSystemAdmin = session?.user.isSystemAdmin || false;
  const activeUsers = users.filter(u => u.isActive).length;
  const inactiveUsers = users.length - activeUsers;
  const systemAdmins = users.filter(u => u.isSystemAdmin).length;

  if (status === 'loading' || loading) {
    return (
      <div className="section-stack">
        <section className="surface-card flex min-h-[320px] items-center justify-center p-8">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-cyan-700" />
            <p className="mt-4 text-sm text-slate-600">Loading user management workspace...</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Admin Control"
        title="User management"
        subtitle="Manage active users, controlled roles, and access status for the internal office platform."
        helperLinks={[
          { href: '/admin/audit-logs', label: 'Audit Logs' },
          { href: '/admin/system-health', label: 'System Health' },
        ]}
        highlights={[
          { label: 'Total Users', value: users.length, detail: 'All users currently registered in the office platform.' },
          { label: 'Active Users', value: activeUsers, detail: 'Accounts that can currently access the system.' },
          { label: 'Inactive Users', value: inactiveUsers, detail: 'Accounts currently blocked from access.' },
          { label: 'System Admins', value: systemAdmins, detail: 'Users with the highest administrative maintenance scope.' },
        ]}
        actions={(
          <Link href="/dashboard">
            <Button size="sm">Dashboard</Button>
          </Link>
        )}
      />

      <section className="surface-card space-y-6 p-6">
        {feedback ? <InlineNotice tone={feedback.tone} message={feedback.message} onDismiss={() => setFeedback(null)} /> : null}

        {pendingStatusUser ? (
          <InlineConfirmStrip
            title={pendingStatusUser.isActive ? 'Deactivate this user?' : 'Activate this user?'}
            message={
              pendingStatusUser.isActive
                ? `${pendingStatusUser.name} will lose access to the system until the account is activated again.`
                : `${pendingStatusUser.name} will regain access to the system with the current role and access scope.`
            }
            confirmLabel={`Confirm ${pendingStatusUser.isActive ? 'Deactivation' : 'Activation'}`}
            cancelLabel="Keep Current Status"
            onCancel={() => setPendingStatusUser(null)}
            onConfirm={() => handleToggleStatus(pendingStatusUser)}
          />
        ) : null}

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">1. Verify identity first</p>
            <p className="mt-2 text-sm text-slate-600">Confirm the correct user record before editing roles, status, or password controls.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">2. Change access carefully</p>
            <p className="mt-2 text-sm text-slate-600">Activation, deactivation, and system admin changes should follow approved admin control.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">3. Keep audit visibility</p>
            <p className="mt-2 text-sm text-slate-600">Use audit logs to review who changed user access and when the change was made.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/80 px-5 py-4 text-sm leading-6 text-slate-700">
          Use this desk to maintain authorized users, confirm role assignments, and control activation status under the approved admin maintenance scope.
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center">
              <div className="rounded-2xl bg-cyan-100 p-3">
                <svg className="h-6 w-6 text-cyan-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Total Users</p>
                <p className="text-2xl font-bold text-slate-900">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center">
              <div className="rounded-2xl bg-emerald-100 p-3">
                <svg className="h-6 w-6 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Active Users</p>
                <p className="text-2xl font-bold text-slate-900">
                  {activeUsers}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center">
              <div className="rounded-2xl bg-violet-100 p-3">
                <svg className="h-6 w-6 text-violet-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">System Admins</p>
                <p className="text-2xl font-bold text-slate-900">
                  {systemAdmins}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">User Register</h2>
              <p className="mt-1 text-sm text-slate-600">Review user identity, role access, and account status before applying changes.</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/audit-logs"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Open Audit Logs
              </Link>
              <Button size="sm" onClick={() => setShowAddModal(true)}>Add User</Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-cyan-100">
                          <span className="font-semibold text-cyan-700">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-700">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
                        {getRoleDisplayName(user.role, user.isSystemAdmin)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        user.isActive 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {user.isSystemAdmin ? (
                        <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                          System Admin
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowEditModal(true);
                        }}
                        className="text-cyan-700 hover:text-cyan-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowResetPasswordModal(true);
                        }}
                        className="text-amber-700 hover:text-amber-900"
                      >
                        Reset Password
                      </button>
                      <button
                        onClick={() => setPendingStatusUser(user)}
                        className={user.isActive ? 'text-rose-700 hover:text-rose-900' : 'text-emerald-700 hover:text-emerald-900'}
                        disabled={session?.user.id === user.id}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </section>

      {/* Modals */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onUserAdded={handleUserAdded}
        canSetSystemAdmin={canSetSystemAdmin}
      />

      <EditUserModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        onUserUpdated={handleUserUpdated}
        user={selectedUser}
        canSetSystemAdmin={canSetSystemAdmin}
      />

      <ResetPasswordModal
        isOpen={showResetPasswordModal}
        onClose={() => {
          setShowResetPasswordModal(false);
          setSelectedUser(null);
        }}
        onPasswordReset={handlePasswordReset}
        user={selectedUser}
      />
    </div>
  );
}
