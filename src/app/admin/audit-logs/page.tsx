'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AuditLogTable from '@/components/admin/AuditLogTable';
import { WorkspaceHero } from '@/components/layout/WorkspaceHero';
import { Button } from '@/components/ui/Button';
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
      <div className="section-stack">
        <section className="surface-card flex min-h-[320px] items-center justify-center p-8">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-cyan-700" />
            <p className="mt-4 text-sm text-slate-600">Loading audit trail workspace...</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Admin Traceability"
        title="Administrative audit logs"
        subtitle="Track user maintenance activity, password reset events, access status changes, and other controlled administrative actions."
        helperLinks={[
          { href: '/admin/users', label: 'User Management' },
          { href: '/admin/system-health', label: 'System Health' },
        ]}
        highlights={[
          { label: 'Log Scope', value: 'Admin Maintenance', detail: 'This register is limited to controlled administrative actions.' },
          { label: 'Primary Use', value: 'Traceability', detail: 'Use this page to confirm who changed what and when.' },
        ]}
        actions={(
          <div className="flex items-center gap-3">
            <Link href="/admin/users">
              <Button variant="secondary" size="sm">User Management</Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm">Dashboard</Button>
            </Link>
          </div>
        )}
      />

      <section className="surface-card space-y-6 p-6">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">1. Review sensitive changes</p>
            <p className="mt-2 text-sm text-slate-600">Focus on access changes, password resets, and role maintenance that affect platform control.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">2. Confirm actor and timestamp</p>
            <p className="mt-2 text-sm text-slate-600">Use the log to validate who performed the action and when it entered the audit trail.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">3. Escalate anomalies</p>
            <p className="mt-2 text-sm text-slate-600">Any unexpected maintenance action should be reviewed against approval and admin governance.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/80 px-5 py-4 text-sm leading-6 text-slate-700">
          This register is restricted to authorized administrative personnel for monitoring sensitive user changes and traceability of office control actions.
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-slate-900">Recent Administrative Activity</h2>
            <p className="mt-1 text-sm text-slate-600">
              Review who performed the action, when it happened, and what was changed in the user maintenance workflow.
            </p>
          </div>
          <div className="p-6">
            <AuditLogTable entityType="User" />
          </div>
        </div>
      </section>
    </div>
  );
}
