'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { AppRole } from '@/lib/roles';
import { APP_ROLES } from '@/lib/roles';
import { hasPermission, ModuleName, PermissionLevel, UserRole } from '@/lib/permissions';
import SidebarHeader from '@/components/sidebar/SidebarHeader';
import ComplianceStatusWidget from '@/components/compliance/ComplianceStatusWidget';
import ExternalComplianceWidget from '@/components/compliance/ExternalComplianceWidget';

interface DashboardData {
  totalCrew: number;
  activeVessels: number;
  pendingApplications: number;
  expiringDocuments: number;
}

interface CrewMovementItem {
  seafarer: string;
  rank: string;
  principal: string;
  vessel: string;
  status: string;
  nextAction: string;
}

interface ExpiringItem {
  seafarer: string;
  type: string;
  name: string;
  expiryDate: string;
  daysLeft: number;
}

interface PendingTask {
  dueDate: string;
  type: string;
  description: string;
  status: string;
}

interface RecentActivity {
  timestamp: string;
  user: string;
  action: string;
}

interface DashboardUser {
  name?: string | null;
  roles?: AppRole[];
  email?: string | null;
}

interface DashboardSectionProps {
  data: DashboardData | null;
  crewMovement: CrewMovementItem[];
  expiringItems: ExpiringItem[];
  pendingTasks: PendingTask[];
  recentActivity: RecentActivity[];
  user?: DashboardUser;
}

interface SummaryCardConfig {
  key: keyof DashboardData;
  label: string;
  description: string;
  href: string;
  icon: string;
}

interface OfficeNavigationItem {
  module: ModuleName;
  href: string;
  label: string;
  icon: string;
  requiredLevel?: PermissionLevel;
}

const OFFICE_NAV_ITEMS: OfficeNavigationItem[] = [
  {
    module: ModuleName.crewing,
    href: '/crewing',
    label: 'Crewing Department',
    icon: '⚓',
  },
  {
    module: ModuleName.contracts,
    href: '/contracts',
    label: 'Contracts',
    icon: '📋',
  },
  {
    module: ModuleName.documents,
    href: '/crewing/documents',
    label: 'Documents',
    icon: '📁',
  },
  {
    module: ModuleName.insurance,
    href: '/insurance',
    label: 'Insurance',
    icon: '⚡',
  },
  {
    module: ModuleName.principals,
    href: '/crewing/principals',
    label: 'Fleet Management',
    icon: '🚢',
  },
  {
    module: ModuleName.accounting,
    href: '/accounting',
    label: 'Accounting',
    icon: '💵',
  },
  {
    module: ModuleName.agencyFees,
    href: '/agency-fees',
    label: 'Agency Fees',
    icon: '💲',
  },
  {
    module: ModuleName.crew,
    href: '/hr',
    label: 'HR',
    icon: '👔',
  },
  {
    module: ModuleName.disciplinary,
    href: '/disciplinary',
    label: 'Disciplinary',
    icon: '⚖️',
  },
];

const CREW_PORTAL_NAV_ITEMS: Array<{ href: string; label: string; icon: string }> = [
  { href: '/m/crew', label: 'Crew Home', icon: '🏠' },
  { href: '/m/crew/documents', label: 'My Documents', icon: '📄' },
  { href: '/m/crew/upload', label: 'Upload Documents', icon: '⬆️' },
  { href: '/m/crew/profile', label: 'Profile', icon: '👤' },
];

const SUMMARY_CARDS: SummaryCardConfig[] = [
  {
    key: 'totalCrew',
    label: 'Crew Complement',
    description: 'Active seafarers',
    href: '/crewing/seafarers',
    icon: '👥',
  },
  {
    key: 'activeVessels',
    label: 'Active Vessels',
    description: 'Managed fleet',
    href: '/crewing/principals',
    icon: '🚢',
  },
  {
    key: 'pendingApplications',
    label: 'Pending Applications',
    description: 'Awaiting review',
    href: '/crewing/applications',
    icon: '📝',
  },
  {
    key: 'expiringDocuments',
    label: 'Expiring Documents',
    description: 'Need renewal follow up',
    href: '/crewing/documents?filter=expiring',
    icon: '📄',
  },
];

export default function DashboardClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [crewMovement, setCrewMovement] = useState<CrewMovementItem[]>([]);
  const [expiringItems, setExpiringItems] = useState<ExpiringItem[]>([]);
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await fetch('/api/dashboard/stats', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to load dashboard data');
        }

        const payload = await response.json();

        setData({
          totalCrew: payload.totalCrew ?? 0,
          activeVessels: payload.activeVessels ?? 0,
          pendingApplications: payload.pendingApplications ?? 0,
          expiringDocuments: payload.expiringDocuments ?? 0,
        });

        setCrewMovement(Array.isArray(payload.crewMovement) ? payload.crewMovement : []);
        setExpiringItems(Array.isArray(payload.expiringItems) ? payload.expiringItems : []);
        setPendingTasks(Array.isArray(payload.pendingTasks) ? payload.pendingTasks : []);
        setRecentActivity(Array.isArray(payload.recentActivity) ? payload.recentActivity : []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setData(null);
        setCrewMovement([]);
        setExpiringItems([]);
        setPendingTasks([]);
        setRecentActivity([]);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      loadDashboard();
    } else if (status === 'unauthenticated') {
      setData(null);
      setCrewMovement([]);
      setExpiringItems([]);
      setPendingTasks([]);
      setRecentActivity([]);
      setLoading(false);
    }
  }, [status]);

  const userRole: AppRole = useMemo(() => {
    const rawPrimary = (session?.user?.role ?? session?.user?.roles?.[0] ?? '').toString().toUpperCase();
    if (!rawPrimary) {
      return APP_ROLES.CREW_PORTAL;
    }
    if (rawPrimary === APP_ROLES.CREW) {
      return APP_ROLES.CREW_PORTAL;
    }
    return rawPrimary as AppRole;
  }, [session?.user?.role, session?.user?.roles]);
  const userName = session?.user?.name || 'Preview User';
  const permissionOverrides = session?.user?.permissionOverrides ?? null;
  const allUserRoles = useMemo(() => {
    const reportedRoles = Array.isArray(session?.user?.roles)
      ? (session?.user?.roles ?? [])
      : [];
    const validRoles = new Set(Object.values(UserRole) as string[]);
    const aggregated = new Set<UserRole>();

    for (const role of reportedRoles) {
      const upper = role?.toUpperCase();
      if (upper && validRoles.has(upper)) {
        aggregated.add(upper as UserRole);
      }
    }

    const normalizedPrimary = userRole?.toUpperCase();
    if (normalizedPrimary && validRoles.has(normalizedPrimary)) {
      aggregated.add(normalizedPrimary as UserRole);
    }

    if (aggregated.size === 0) {
      aggregated.add(UserRole.CREW_PORTAL);
    }

    return Array.from(aggregated);
  }, [session?.user?.roles, userRole]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Loading Dashboard...</h2>
          <p className="text-gray-500 mt-2">Preparing your maritime management overview</p>
        </div>
      </div>
    );
  }

  if (status === 'authenticated' && userRole === APP_ROLES.CREW_PORTAL) {
    return null;
  }

  const renderRoleBasedDashboard = () => {
    const resolvedUser: DashboardUser =
      (session?.user as DashboardUser) || { name: userName, roles: [userRole] };

    const sharedProps: DashboardSectionProps = {
      data,
      crewMovement,
      expiringItems,
      pendingTasks,
      recentActivity,
      user: resolvedUser,
    };

    switch (userRole) {
      case APP_ROLES.DIRECTOR:
        return <DirectorDashboard {...sharedProps} />;
      case APP_ROLES.CDMO:
        return <CDMODashboard {...sharedProps} />;
      case APP_ROLES.ACCOUNTING:
        return <AccountingDashboard {...sharedProps} />;
      case APP_ROLES.OPERATIONAL:
        return <OperationalDashboard {...sharedProps} />;
      case APP_ROLES.HR:
        return <HRDashboard {...sharedProps} />;
      case APP_ROLES.CREW_PORTAL:
        return <CrewPortalDashboard {...sharedProps} />;
      default:
        return <DirectorDashboard {...sharedProps} />;
    }
  };

  const renderRoleBasedNavigation = () => {
    if (userRole === APP_ROLES.CREW_PORTAL) {
      return CREW_PORTAL_NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex items-center gap-3 rounded-xl border border-transparent bg-white/75 px-4 py-3 font-medium text-slate-800 shadow-sm transition-all duration-200 hover:border-blue-200 hover:bg-white"
        >
          <span className="text-xl text-current" aria-hidden="true">{item.icon}</span>
          <span className="text-current">{item.label}</span>
        </Link>
      ));
    }

    const items = OFFICE_NAV_ITEMS.filter((item) =>
      hasPermission(
        allUserRoles,
        item.module,
        item.requiredLevel ?? PermissionLevel.VIEW_ACCESS,
        permissionOverrides ?? undefined
      )
    );

    return items.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        className="flex items-center gap-3 rounded-xl border border-transparent bg-white/75 px-4 py-3 font-medium text-slate-800 shadow-sm transition-all duration-200 hover:border-blue-200 hover:bg-white"
      >
        <span className="text-xl text-current" aria-hidden="true">{item.icon}</span>
        <span className="text-current">{item.label}</span>
      </Link>
    ));
  };

  const handleLogout = async () => {
    const result = await signOut({ redirect: false, callbackUrl: '/auth/signin' });
    if (result?.url) {
      router.replace(result.url);
    } else {
      router.replace('/auth/signin');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="fixed left-0 top-0 h-full w-72 bg-white shadow-xl border-r border-gray-200 z-40 flex flex-col">
        <SidebarHeader />

        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-xl border border-transparent bg-white text-slate-900 px-4 py-3 font-semibold shadow-md transition-all duration-200 hover:border-blue-200 hover:shadow-lg"
            >
              <span className="text-xl text-current" aria-hidden="true">📊</span>
              <span className="leading-none text-current">Dashboard</span>
            </Link>
            {renderRoleBasedNavigation()}
          </div>
        </nav>

        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
              {userName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 text-sm truncate">{userName}</div>
              <div className="text-xs text-gray-600">{userRole}</div>
            </div>
          </div>
          {session ? (
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <span className="text-lg" aria-hidden="true">🚪</span>
              <span>Logout</span>
            </button>
          ) : (
            <div className="text-center text-xs text-gray-500 py-2">Preview Mode</div>
          )}
        </div>
      </div>

      <div className="ml-72 px-8 py-10">
        <div className="page-shell section-stack">
          {renderRoleBasedDashboard()}
        </div>
      </div>
    </div>
  );
}

function DirectorDashboard({ data, crewMovement, expiringItems, pendingTasks, recentActivity }: DashboardSectionProps) {
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Executive Overview"
        subtitle="Summary of fleet readiness, recruitment, and compliance"
      />
      <SummaryCards data={data} />
      <div className="grid gap-6 xl:grid-cols-3">
        <CrewMovementSection crewMovement={crewMovement} className="xl:col-span-2" />
        <ExpiringItemsSection items={expiringItems} />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <PendingTasksSection tasks={pendingTasks} className="xl:col-span-2" />
        <RecentActivitySection events={recentActivity} />
      </div>
      <ExternalComplianceWidget className="border border-gray-200" />
    </div>
  );
}

function CDMODashboard({ data, crewMovement, expiringItems, pendingTasks, recentActivity }: DashboardSectionProps) {
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Crewing & Compliance"
        subtitle="Assignments pipeline and regulatory status"
      />
      <SummaryCards data={data} />
      <div className="grid gap-6 xl:grid-cols-3">
        <CrewMovementSection crewMovement={crewMovement} className="xl:col-span-2" />
        <div className="surface-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Snapshot</h3>
          <ComplianceStatusWidget />
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <ExpiringItemsSection items={expiringItems} />
        <PendingTasksSection tasks={pendingTasks} className="xl:col-span-2" />
      </div>
      <RecentActivitySection events={recentActivity} />
    </div>
  );
}

function AccountingDashboard({ data, pendingTasks }: DashboardSectionProps) {
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Accounting Overview"
        subtitle="Monitor payroll, allotments, and billing follow ups"
      />
      <SummaryCards data={data} />
      <PendingTasksSection tasks={pendingTasks} />
      <EmptyState message="Connect accounting data sources to surface revenue, allotment, and payroll analytics." />
    </div>
  );
}

function OperationalDashboard({ data, crewMovement, expiringItems, pendingTasks }: DashboardSectionProps) {
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Operational Control"
        subtitle="Crew logistics, sign-on readiness, and vessel documentation"
      />
      <SummaryCards data={data} />
      <div className="grid gap-6 xl:grid-cols-2">
        <CrewMovementSection crewMovement={crewMovement} />
        <ExpiringItemsSection items={expiringItems} />
      </div>
      <PendingTasksSection tasks={pendingTasks} />
    </div>
  );
}

function HRDashboard({ data, expiringItems, pendingTasks, recentActivity }: DashboardSectionProps) {
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="HR & Welfare"
        subtitle="Document renewals, onboarding status, and recent updates"
      />
      <SummaryCards data={data} />
      <div className="grid gap-6 xl:grid-cols-2">
        <ExpiringItemsSection items={expiringItems} />
        <PendingTasksSection tasks={pendingTasks} />
      </div>
      <RecentActivitySection events={recentActivity} />
    </div>
  );
}

function CrewPortalDashboard({ expiringItems, pendingTasks, recentActivity, user }: DashboardSectionProps) {
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Crew Portal"
        subtitle={`Welcome, ${user?.name ?? 'Crew Member'}`}
      />
      <QuickLinksSection />
      <div className="grid gap-6 lg:grid-cols-2">
        <ExpiringItemsSection items={expiringItems} />
        <PendingTasksSection tasks={pendingTasks} />
      </div>
      <RecentActivitySection events={recentActivity} />
    </div>
  );
}

function DashboardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="surface-card p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
        </div>
        <span className="action-pill text-xs font-semibold tracking-wide">{formattedDate}</span>
      </div>
    </div>
  );
}

function SummaryCards({ data }: { data: DashboardData | null }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {SUMMARY_CARDS.map((card) => {
        const value = data?.[card.key] ?? 0;
        return (
          <Link
            key={card.key}
            href={card.href}
            className="surface-card group flex items-center justify-between px-6 py-5"
          >
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
              <p className="text-2xl font-bold text-slate-900">{value.toLocaleString('id-ID')}</p>
              <p className="text-sm text-slate-600">{card.description}</p>
            </div>
            <span className="badge-soft bg-blue-500/10 text-blue-600 text-xl" aria-hidden="true">{card.icon}</span>
          </Link>
        );
      })}
    </div>
  );
}

function CrewMovementSection({ crewMovement, className = '' }: { crewMovement: CrewMovementItem[]; className?: string }) {
  return (
    <section className={`surface-card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Crew Movement</h3>
          <p className="text-sm text-slate-600">Assignments, sign-on readiness, and sign-off schedule</p>
        </div>
        <Link href="/crewing/prepare-joining" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
          Manage Pipeline →
        </Link>
      </div>
      {crewMovement.length === 0 ? (
        <EmptyState message="No crew movement data yet." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-gray-500 uppercase tracking-wide text-xs">
              <tr>
                <th className="py-3 pr-4 font-medium">Crew</th>
                <th className="py-3 pr-4 font-medium">Principal / Vessel</th>
                <th className="py-3 pr-4 font-medium">Status</th>
                <th className="py-3 font-medium">Next Action</th>
              </tr>
            </thead>
            <tbody>
              {crewMovement.map((item, index) => (
                <tr key={`${item.seafarer}-${item.vessel}-${index}`} className="border-t border-gray-100">
                  <td className="py-3 pr-4">
                    <div className="font-medium text-gray-900">{item.seafarer}</div>
                    <div className="text-xs text-gray-500">{item.rank}</div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="text-sm text-gray-900">{item.principal}</div>
                    <div className="text-xs text-gray-500">{item.vessel}</div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getCrewStatusBadge(item.status)}`}>
                      {formatStatusLabel(item.status)}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-gray-700">{item.nextAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ExpiringItemsSection({ items, className = '' }: { items: ExpiringItem[]; className?: string }) {
  return (
    <section className={`surface-card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Expiring Items</h3>
          <p className="text-sm text-slate-600">Documents and contracts requiring follow up</p>
        </div>
        <Link href="/crewing/documents?filter=expiring" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
          Review Documents →
        </Link>
      </div>
      {items.length === 0 ? (
        <EmptyState message="No documents or contracts approaching expiration." />
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={`${item.seafarer}-${item.name}-${index}`} className="border border-amber-200 bg-amber-50 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-amber-900">{item.name}</p>
                  <p className="text-sm text-amber-800">{item.seafarer}</p>
                  <p className="text-xs text-amber-700 mt-1">Type: {formatStatusLabel(item.type)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-amber-700 uppercase tracking-wide">Expires</p>
                  <p className="text-sm font-semibold text-amber-900">{formatDate(item.expiryDate)}</p>
                  <p className="text-xs text-amber-600">{item.daysLeft} days left</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function PendingTasksSection({ tasks, className = '' }: { tasks: PendingTask[]; className?: string }) {
  return (
    <section className={`surface-card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Pending Tasks</h3>
          <p className="text-sm text-slate-600">Operational, audit, and compliance follow ups</p>
        </div>
        <Link href="/quality" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
          View All Tasks →
        </Link>
      </div>
      {tasks.length === 0 ? (
        <EmptyState message="No tasks registered yet." />
      ) : (
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <div key={`${task.description}-${index}`} className="border border-gray-200 rounded-lg p-4 flex items-start gap-4">
              <div className="text-sm font-semibold text-gray-900 w-24">
                <div>{formatDate(task.dueDate)}</div>
                <span className={`inline-flex mt-2 items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getTaskStatusBadge(task.status)}`}>
                  {formatStatusLabel(task.status)}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{task.type}</p>
                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function RecentActivitySection({ events, className = '' }: { events: RecentActivity[]; className?: string }) {
  return (
    <section className={`surface-card p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
      {events.length === 0 ? (
        <EmptyState message="Latest activity will appear after system receives updates." />
      ) : (
        <div className="space-y-4">
          {events.map((event, index) => (
            <div key={`${event.timestamp}-${index}`} className="flex items-start gap-3">
              <div className="w-16 text-xs text-gray-500 pt-0.5">{event.timestamp}</div>
              <div className="flex-1 border-l border-gray-200 pl-3">
                <p className="text-sm font-semibold text-gray-900">{event.user}</p>
                <p className="text-sm text-gray-600">{event.action}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function QuickLinksSection() {
  const links = [
    {
      href: '/m/crew/profile',
      label: 'Profil Saya',
      description: 'Periksa dan perbarui data pribadi serta kontak darurat.',
      icon: '👤',
    },
    {
      href: '/m/crew/documents',
      label: 'Dokumen Saya',
      description: 'Upload or download certificates, passports, and important documents.',
      icon: '📄',
    },
    {
      href: '/m/crew',
      label: 'Persiapan Keberangkatan',
      description: 'Lihat status medis, tiket, dan pengurusan keberangkatan.',
      icon: '🧭',
    },
    {
      href: '/m/crew',
      label: 'Asuransi & Welfare',
      description: 'Cek polis asuransi dan klaim kesejahteraan crew.',
      icon: '🛡️',
    },
  ];

  return (
    <section className="surface-card p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Links</h3>
      <div className="grid gap-3 md:grid-cols-2">
        {links.map((link) => (
          <Link
            key={`${link.href}-${link.label}`}
            href={link.href}
            className="surface-card p-4 transition hover:-translate-y-0.5"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl" aria-hidden="true">{link.icon}</span>
              <div>
                <p className="font-semibold text-slate-900">{link.label}</p>
                <p className="text-sm text-slate-600 mt-1">{link.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="border border-dashed border-slate-200/70 rounded-lg bg-slate-50 text-center text-sm text-slate-500 py-6 px-4">
      {message}
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatStatusLabel(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const crewStatusBadges: Record<string, string> = {
  ONBOARD: 'bg-green-100 text-green-700',
  READY: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-gray-100 text-gray-600',
  SIGN_OFF_DUE: 'bg-amber-100 text-amber-700',
};

function getCrewStatusBadge(status: string) {
  return crewStatusBadges[status] ?? 'bg-slate-100 text-slate-600';
}

const taskStatusBadges: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  OVERDUE: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-green-100 text-green-700',
};

function getTaskStatusBadge(status: string) {
  return taskStatusBadges[status] ?? 'bg-slate-100 text-slate-600';
}
