'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AuditLogTable from '@/components/admin/AuditLogTable';
import { ADMIN_MAINTENANCE_SCOPES, hasAdminMaintenanceScope } from '@/lib/admin-access';

export default function AdminAuditLogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

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
      ADMIN_MAINTENANCE_SCOPES.AUDIT_LOGS
    );

    if (!hasAccess) {
      router.push('/403');
    }
  }, [router, session, status]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Memuat riwayat aktivitas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Riwayat Aktivitas</h1>
              <p className="text-gray-700 mt-1">Pantau perubahan user, role, reset password, dan aktivasi</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/users"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Kembali ke Kelola User
              </Link>
              <Link
                href="/dashboard"
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:from-blue-700 hover:to-blue-800"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-900">
          Halaman ini hanya untuk Director dan HR Admin dalam memantau aktivitas admin yang sensitif.
        </div>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Aktivitas Admin Terbaru</h2>
          </div>
          <div className="p-6">
            <AuditLogTable entityType="User" />
          </div>
        </div>
      </div>
    </div>
  );
}
