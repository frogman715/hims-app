'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { AppRole } from '@/lib/roles';
import { APP_ROLES } from '@/lib/roles';
import { ModuleName, PermissionLevel } from '@/lib/permissions';
import { hasExplicitRoleAccess, hasModuleAccess } from '@/lib/authorization';
import SidebarHeader from '@/components/sidebar/SidebarHeader';
import ComplianceStatusWidget from '@/components/compliance/ComplianceStatusWidget';
import { getRoleDisplayName } from '@/lib/role-display';
import { getFleetActivityBadgeClasses } from '@/lib/fleet-ui';
import StatCard from '@/components/ui/StatCard';
import { formatDateLabel, formatStatusLabel } from '@/lib/formatters';

interface DashboardData {
  totalCrew: number;
  activeVessels: number;
  operationalVessels: number;
  onboardVessels: number;
  pendingApplications: number;
  expiringDocuments: number;
  contractsExpiring45Days: number;
  contractsExpiring30Days: number;
  contractsExpiring14Days: number;
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

interface ContractAlertItem {
  seafarer: string;
  crewId: string;
  vessel: string;
  principal: string;
  expiryDate: string;
  daysLeft: number;
  band: string;
  nextAction: string;
  link: string;
}

interface PendingTask {
  id?: string;
  dueDate: string;
  type: string;
  description: string;
  status: string;
  link?: string;
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
  contractAlerts: ContractAlertItem[];
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
  group?: string;
  allowedRoles?: AppRole[];
}

interface CompliancePriority {
  title: string;
  detail: string;
  href: string;
}

const OFFICE_NAV_ITEMS: OfficeNavigationItem[] = [
  {
    module: ModuleName.crewing,
    href: '/crewing',
    label: 'Crewing Operations',
    icon: '⚓',
    group: 'CREWING OPERATIONS',
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.CDMO, APP_ROLES.OPERATIONAL, APP_ROLES.GA_DRIVER, APP_ROLES.ACCOUNTING, APP_ROLES.HR, APP_ROLES.HR_ADMIN, APP_ROLES.QMR],
  },
  {
    module: ModuleName.crewing,
    href: '/crewing/readiness',
    label: 'Crew Readiness',
    icon: '✅',
    group: 'CREWING OPERATIONS',
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.CDMO, APP_ROLES.OPERATIONAL, APP_ROLES.GA_DRIVER, APP_ROLES.ACCOUNTING, APP_ROLES.HR, APP_ROLES.HR_ADMIN, APP_ROLES.QMR],
  },
  {
    module: ModuleName.crewing,
    href: '/crewing/prepare-joining',
    label: 'Prepare Joining',
    icon: '🧾',
    group: 'CREWING OPERATIONS',
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.CDMO, APP_ROLES.OPERATIONAL, APP_ROLES.GA_DRIVER, APP_ROLES.ACCOUNTING, APP_ROLES.HR, APP_ROLES.HR_ADMIN, APP_ROLES.QMR],
  },
  {
    module: ModuleName.assignments,
    href: '/crewing/assignments',
    label: 'Vessel Assignment',
    icon: '🚐',
    group: 'CREWING OPERATIONS',
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.CDMO, APP_ROLES.OPERATIONAL, APP_ROLES.GA_DRIVER, APP_ROLES.ACCOUNTING, APP_ROLES.HR, APP_ROLES.HR_ADMIN, APP_ROLES.QMR],
  },
  {
    module: ModuleName.contracts,
    href: '/contracts',
    label: 'Contracts',
    icon: '📝',
    group: 'CREWING OPERATIONS',
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.CDMO, APP_ROLES.OPERATIONAL, APP_ROLES.GA_DRIVER, APP_ROLES.ACCOUNTING, APP_ROLES.HR, APP_ROLES.HR_ADMIN, APP_ROLES.QMR],
  },
  {
    module: ModuleName.documents,
    href: '/crewing/documents',
    label: 'Documents',
    icon: '📁',
    group: 'CREWING OPERATIONS',
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.CDMO, APP_ROLES.OPERATIONAL, APP_ROLES.GA_DRIVER, APP_ROLES.ACCOUNTING, APP_ROLES.HR, APP_ROLES.HR_ADMIN, APP_ROLES.QMR],
  },
  {
    module: ModuleName.principals,
    href: '/crewing/principals',
    label: 'Fleet & Principals',
    icon: '🚢',
    group: 'CREWING OPERATIONS',
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.CDMO, APP_ROLES.OPERATIONAL, APP_ROLES.GA_DRIVER, APP_ROLES.ACCOUNTING, APP_ROLES.HR, APP_ROLES.HR_ADMIN, APP_ROLES.QMR],
  },
  {
    module: ModuleName.accounting,
    href: '/accounting',
    label: 'Accounting',
    icon: '💰',
    group: 'FINANCE & ADMINISTRATION',
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.CDMO, APP_ROLES.OPERATIONAL, APP_ROLES.GA_DRIVER, APP_ROLES.ACCOUNTING, APP_ROLES.HR, APP_ROLES.HR_ADMIN, APP_ROLES.QMR],
  },
  {
    module: ModuleName.crew,
    href: '/hr',
    label: 'HR Management',
    icon: '👔',
    group: 'HR & PERSONNEL',
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.CDMO, APP_ROLES.OPERATIONAL, APP_ROLES.GA_DRIVER, APP_ROLES.ACCOUNTING, APP_ROLES.HR, APP_ROLES.HR_ADMIN, APP_ROLES.QMR],
  },
  {
    module: ModuleName.compliance,
    href: '/compliance',
    label: 'Compliance Command',
    icon: '🧭',
    group: 'QUALITY & COMPLIANCE',
    requiredLevel: PermissionLevel.VIEW_ACCESS,
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.CDMO, APP_ROLES.OPERATIONAL, APP_ROLES.GA_DRIVER, APP_ROLES.ACCOUNTING, APP_ROLES.HR, APP_ROLES.HR_ADMIN, APP_ROLES.QMR],
  },
  {
    module: ModuleName.quality,
    href: '/quality/qms-dashboard',
    label: 'QMS Dashboard',
    icon: '📊',
    group: 'QUALITY & COMPLIANCE',
    requiredLevel: PermissionLevel.VIEW_ACCESS,
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.CDMO, APP_ROLES.OPERATIONAL, APP_ROLES.GA_DRIVER, APP_ROLES.ACCOUNTING, APP_ROLES.HR, APP_ROLES.HR_ADMIN, APP_ROLES.QMR],
  },
  {
    module: ModuleName.quality,
    href: '/audit',
    label: 'Audit Management',
    icon: '📋',
    group: 'QUALITY & COMPLIANCE',
    requiredLevel: PermissionLevel.VIEW_ACCESS,
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.CDMO, APP_ROLES.OPERATIONAL, APP_ROLES.GA_DRIVER, APP_ROLES.ACCOUNTING, APP_ROLES.HR, APP_ROLES.HR_ADMIN, APP_ROLES.QMR],
  },
  {
    module: ModuleName.quality,
    href: '/nonconformity',
    label: 'Non-Conformities',
    icon: '⚠️',
    group: 'QUALITY & COMPLIANCE',
    requiredLevel: PermissionLevel.VIEW_ACCESS,
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.CDMO, APP_ROLES.OPERATIONAL, APP_ROLES.GA_DRIVER, APP_ROLES.ACCOUNTING, APP_ROLES.HR, APP_ROLES.HR_ADMIN, APP_ROLES.QMR],
  },
  {
    module: ModuleName.dashboard,
    href: '/admin/system-health',
    label: 'System Health',
    icon: '⚙️',
    group: 'SYSTEM ADMINISTRATION',
    requiredLevel: PermissionLevel.FULL_ACCESS,
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.HR_ADMIN],
  },
  {
    module: ModuleName.dashboard,
    href: '/admin/users',
    label: 'User Management',
    icon: '👥',
    group: 'SYSTEM ADMINISTRATION',
    requiredLevel: PermissionLevel.FULL_ACCESS,
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.HR_ADMIN],
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
    label: 'Active Fleet',
    description: 'Master vessels marked active',
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
    description: 'Renew before deployment',
    href: '/crewing/documents?filter=expiring',
    icon: '⏳',
  },
  {
    key: 'contractsExpiring45Days',
    label: 'Contracts ≤ 45 Days',
    description: 'Onboard renewal watch',
    href: '/crewing/crew-list',
    icon: '📣',
  },
];

const COMPLIANCE_PRIORITIES: CompliancePriority[] = [
  {
    title: 'Crew welfare and fatigue control',
    detail: 'Track grievances, welfare cases, rest hours, and readiness blockers before sign-on or audit review.',
    href: '/compliance/welfare',
  },
  {
    title: 'Fleet readiness and principal control',
    detail: 'Review active-fleet blockers and confirm principal or flag-state requirements before deployment.',
    href: '/compliance/fleet-board',
  },
  {
    title: 'Audit, CAPA, and escalation control',
    detail: 'Keep QMS procedures, audit findings, corrective actions, and escalation rules aligned with office operations.',
    href: '/compliance',
  },
];

export default function DashboardClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [crewMovement, setCrewMovement] = useState<CrewMovementItem[]>([]);
  const [expiringItems, setExpiringItems] = useState<ExpiringItem[]>([]);
  const [contractAlerts, setContractAlerts] = useState<ContractAlertItem[]>([]);
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await fetch('/api/dashboard/stats', { cache: 'no-store' });
        if (!response.ok) {
          if (response.status === 403) {
            console.warn('Dashboard access denied - insufficient permissions');
          } else if (response.status === 401) {
            console.warn('Dashboard access denied - not authenticated');
          }
          throw new Error(`Failed to load dashboard data: ${response.status}`);
        }

        const payload = await response.json();

        setData({
          totalCrew: payload.totalCrew ?? 0,
          activeVessels: payload.activeVessels ?? 0,
          operationalVessels: payload.operationalVessels ?? 0,
          onboardVessels: payload.onboardVessels ?? 0,
          pendingApplications: payload.pendingApplications ?? 0,
          expiringDocuments: payload.expiringDocuments ?? 0,
          contractsExpiring45Days: payload.contractsExpiring45Days ?? 0,
          contractsExpiring30Days: payload.contractsExpiring30Days ?? 0,
          contractsExpiring14Days: payload.contractsExpiring14Days ?? 0,
        });

        setCrewMovement(Array.isArray(payload.crewMovement) ? payload.crewMovement : []);
        setExpiringItems(Array.isArray(payload.expiringItems) ? payload.expiringItems : []);
        setContractAlerts(Array.isArray(payload.contractExpiryAlerts) ? payload.contractExpiryAlerts : []);
        setPendingTasks(Array.isArray(payload.pendingTasks) ? payload.pendingTasks : []);
        setRecentActivity(Array.isArray(payload.recentActivity) ? payload.recentActivity : []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set empty states to prevent undefined errors
        setData({
          totalCrew: 0,
          activeVessels: 0,
          operationalVessels: 0,
          onboardVessels: 0,
          pendingApplications: 0,
          expiringDocuments: 0,
          contractsExpiring45Days: 0,
          contractsExpiring30Days: 0,
          contractsExpiring14Days: 0,
        });
        setCrewMovement([]);
        setExpiringItems([]);
        setContractAlerts([]);
        setPendingTasks([]);
        setRecentActivity([]);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      loadDashboard();
    } else if (status === 'unauthenticated') {
      setData({
        totalCrew: 0,
        activeVessels: 0,
        operationalVessels: 0,
        onboardVessels: 0,
        pendingApplications: 0,
        expiringDocuments: 0,
        contractsExpiring45Days: 0,
        contractsExpiring30Days: 0,
        contractsExpiring14Days: 0,
      });
      setCrewMovement([]);
      setExpiringItems([]);
      setContractAlerts([]);
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
    // Crew portal users should be redirected, but render nothing while redirecting
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Redirecting...</h2>
        </div>
      </div>
    );
  }

  const renderRoleBasedDashboard = () => {
    const resolvedUser: DashboardUser =
      (session?.user as DashboardUser) || { name: userName, roles: [userRole] };

    const sharedProps: DashboardSectionProps = {
      data,
      crewMovement,
      expiringItems,
      contractAlerts,
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
      case APP_ROLES.GA_DRIVER:
        return <GADriverDashboard {...sharedProps} />;
      case APP_ROLES.HR:
        return <HRDashboard {...sharedProps} />;
      case APP_ROLES.HR_ADMIN:
        return <HRAdminDashboard {...sharedProps} />;
      case APP_ROLES.QMR:
        return <QMRDashboard {...sharedProps} />;
      case APP_ROLES.CREW_PORTAL:
        return <CrewPortalDashboard {...sharedProps} />;
      default:
        return <OperationalDashboard {...sharedProps} />;
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

    const subject = {
      roles: session?.user?.roles,
      role: session?.user?.role,
      isSystemAdmin: (session?.user as Record<string, unknown>)?.isSystemAdmin === true,
      permissionOverrides: (session?.user as Record<string, unknown>)?.permissionOverrides as never,
    };

    const items = OFFICE_NAV_ITEMS.filter((item) => {
      if (!hasExplicitRoleAccess(subject, item.allowedRoles)) {
        return false;
      }

      return hasModuleAccess(subject, item.module, item.requiredLevel ?? PermissionLevel.VIEW_ACCESS);
    });

    // Group items by their group property
    const groupedItems = items.reduce((acc, item) => {
      const group = item.group || 'OTHER';
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(item);
      return acc;
    }, {} as Record<string, OfficeNavigationItem[]>);

    // Define group order
    const groupOrder = [
      'CREWING OPERATIONS',
      'FINANCE & ADMINISTRATION',
      'HR & PERSONNEL',
      'QUALITY & COMPLIANCE',
      'SYSTEM ADMINISTRATION',
      'OTHER',
    ];

    return (
      <>
        {groupOrder.map((group) => {
          const groupItems = groupedItems[group];
          if (!groupItems || groupItems.length === 0) return null;

          return (
            <div key={group} className="space-y-1">
              <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {group}
              </div>
              <div className="space-y-1 pl-2">
                {groupItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg border border-transparent bg-white/50 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:border-blue-200 hover:bg-white hover:text-blue-600"
                  >
                    <span className="text-lg text-current" aria-hidden="true">{item.icon}</span>
                    <span className="text-current">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </>
    );
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
              <div className="text-xs text-gray-600">{getRoleDisplayName(userRole, (session?.user as Record<string, unknown>)?.isSystemAdmin as boolean | undefined)}</div>
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

function DirectorDashboard({ data, crewMovement, expiringItems, contractAlerts, pendingTasks, recentActivity }: DashboardSectionProps) {
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Executive Overview"
        subtitle="Summary of fleet readiness, recruitment, and compliance"
      />
      <ComplianceOperationsBanner />
      <FleetSnapshot data={data} />
      <SummaryCards data={data} />
      <ContractAlertStrip data={data} items={contractAlerts} />
      <div className="grid gap-6 xl:grid-cols-3">
        <CrewMovementSection crewMovement={crewMovement} className="xl:col-span-2" />
        <ExpiringItemsSection items={expiringItems} />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <PendingTasksSection tasks={pendingTasks} className="xl:col-span-2" />
        <RecentActivitySection events={recentActivity} />
      </div>
      <div className="surface-card p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Verification shortcuts</h3>
            <p className="mt-1 text-sm text-slate-600">
              Keep portal shortcuts available without placing a separate verification workflow on the dashboard.
            </p>
          </div>
          <Link href="/compliance" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">
            Open operations hub
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/compliance/external"
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-cyan-300 hover:bg-cyan-50"
          >
            <p className="text-sm font-semibold text-slate-900">Verification shortcuts</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Open the support launcher for KOSMA reference, Dephub checks, and visa portals.
            </p>
          </Link>
          <Link
            href="/crewing/documents?type=KOSMA"
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-cyan-300 hover:bg-cyan-50"
          >
            <p className="text-sm font-semibold text-slate-900">KOSMA records</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Review KOSMA training and certificate records under document control.
            </p>
          </Link>
          <Link
            href="/compliance/control-center"
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-cyan-300 hover:bg-cyan-50"
          >
            <p className="text-sm font-semibold text-slate-900">Command view</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Return to the MLC and IMO control center for the actual operating workflow.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

function CDMODashboard({ data, crewMovement, expiringItems, contractAlerts, pendingTasks, recentActivity }: DashboardSectionProps) {
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Document Control"
        subtitle="Crew records, certificates, and document validity control"
      />
      <ComplianceOperationsBanner />
      <FleetSnapshot data={data} />
      <SummaryCards data={data} />
      <ContractAlertStrip data={data} items={contractAlerts} />
      <div className="grid gap-6 xl:grid-cols-3">
        <CrewMovementSection crewMovement={crewMovement} className="xl:col-span-2" />
        <div className="surface-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Verification Snapshot</h3>
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
      <FleetSnapshot data={data} />
      <SummaryCards data={data} />
      <PendingTasksSection tasks={pendingTasks} />
      <EmptyState message="Connect accounting data sources to surface revenue, allotment, and payroll analytics." />
    </div>
  );
}

function OperationalDashboard({ data, crewMovement, expiringItems, contractAlerts, pendingTasks }: DashboardSectionProps) {
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Operational Control"
        subtitle="Crew logistics, sign-on readiness, and vessel documentation"
      />
      <ComplianceOperationsBanner />
      <FleetSnapshot data={data} />
      <SummaryCards data={data} />
      <ContractAlertStrip data={data} items={contractAlerts} />
      <div className="grid gap-6 xl:grid-cols-2">
        <CrewMovementSection crewMovement={crewMovement} />
        <ExpiringItemsSection items={expiringItems} />
      </div>
      <PendingTasksSection tasks={pendingTasks} />
    </div>
  );
}

function GADriverDashboard({ data, pendingTasks, recentActivity }: DashboardSectionProps) {
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="General Affair and Driver"
        subtitle="Vessel assignment, transport coordination, and logistics support"
      />
      <FleetSnapshot data={data} />
      <SummaryCards data={data} />
      <div className="surface-card p-6">
        <h3 className="text-lg font-semibold text-slate-900">Primary workflow</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This role focuses on vessel assignment, transport coordination, pickup handling, and field logistics support.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/crewing/assignments" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Open Vessel Assignment
          </Link>
          <Link href="/crewing/crew-list" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
            Crew List
          </Link>
        </div>
      </div>
      <PendingTasksSection tasks={pendingTasks} />
      <RecentActivitySection events={recentActivity} />
    </div>
  );
}

function HRDashboard({ data, expiringItems, contractAlerts, pendingTasks, recentActivity }: DashboardSectionProps) {
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="HR & Welfare"
        subtitle="Document renewals, onboarding status, and recent updates"
      />
      <ComplianceOperationsBanner />
      <FleetSnapshot data={data} />
      <SummaryCards data={data} />
      <ContractAlertStrip data={data} items={contractAlerts} />
      <div className="grid gap-6 xl:grid-cols-2">
        <ExpiringItemsSection items={expiringItems} />
        <PendingTasksSection tasks={pendingTasks} />
      </div>
      <RecentActivitySection events={recentActivity} />
    </div>
  );
}

function HRAdminDashboard({ data, expiringItems, contractAlerts, pendingTasks, recentActivity }: DashboardSectionProps) {
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="HR Administration"
        subtitle="User administration, HR control, and office support oversight"
      />
      <ComplianceOperationsBanner />
      <FleetSnapshot data={data} />
      <SummaryCards data={data} />
      <ContractAlertStrip data={data} items={contractAlerts} />
      <div className="grid gap-6 xl:grid-cols-2">
        <PendingTasksSection tasks={pendingTasks} />
        <ExpiringItemsSection items={expiringItems} />
      </div>
      <RecentActivitySection events={recentActivity} />
    </div>
  );
}

function QMRDashboard({ data, contractAlerts, pendingTasks, recentActivity }: DashboardSectionProps) {
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Quality and Compliance"
        subtitle="Audit follow-up, QMS control, and MLC / IMO oversight"
      />
      <ComplianceOperationsBanner />
      <FleetSnapshot data={data} />
      <SummaryCards data={data} />
      <ContractAlertStrip data={data} items={contractAlerts} />
        <div className="surface-card p-6">
          <h3 className="text-lg font-semibold text-slate-900">Priority focus</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {COMPLIANCE_PRIORITIES.map((priority) => (
            <Link
              key={priority.title}
              href={priority.href}
              className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-cyan-300 hover:shadow-sm"
            >
              <p className="text-sm font-semibold text-slate-900">{priority.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{priority.detail}</p>
            </Link>
          ))}
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="surface-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Verification Snapshot</h3>
          <ComplianceStatusWidget />
        </div>
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

function ComplianceOperationsBanner() {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 text-slate-50 shadow-2xl">
      <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.2fr,0.8fr] lg:px-8">
        <div className="space-y-4">
          <div className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
            International Shipping Operations
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              MLC and IMO control tower for crewing, compliance, and fleet readiness
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-300">
              HIMS now positions daily office work around crew welfare, statutory documentation, internal audits,
              controlled deployment workflows, and vessel-by-vessel compliance review expected in an international ship management environment.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-slate-200">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">MLC 2006</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">IMO ISM</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">IMO STCW</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">CAPA and Audit Trail</span>
          </div>
        </div>
        <div className="grid gap-3">
          {COMPLIANCE_PRIORITIES.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-300/40 hover:bg-white/10"
            >
              <div className="text-sm font-semibold text-white">{item.title}</div>
              <p className="mt-1 text-sm leading-6 text-slate-300">{item.detail}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function SummaryCards({ data }: { data: DashboardData | null }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
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

function FleetSnapshot({ data }: { data: DashboardData | null }) {
  const activeFleet = data?.activeVessels ?? 0;
  const operationalFleet = data?.operationalVessels ?? 0;
  const onboardFleet = data?.onboardVessels ?? 0;

  return (
    <section className="surface-card p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">Fleet Snapshot</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">Master fleet and live deployment picture</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Dashboard fleet numbers are separated so master vessel records do not get mixed with onboard deployment activity.
          </p>
        </div>
        <Link href="/compliance/fleet-board" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">
          Open fleet board
        </Link>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <StatCard label="Active Fleet" value={activeFleet.toLocaleString('id-ID')} description="Master vessels with status set to active." tone="slate" />
        <StatCard label="Operational Fleet" value={operationalFleet.toLocaleString('id-ID')} description="Active fleet with assignments or prepare joining activity." tone="cyan" />
        <StatCard label="Onboard Fleet" value={onboardFleet.toLocaleString('id-ID')} description="Vessels currently carrying onboard crew assignments." tone="emerald" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">Active = master vessel status ACTIVE</span>
        <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-cyan-800">Operational = active fleet with assignment or prepare joining activity</span>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-800">Onboard = active crew currently deployed onboard</span>
      </div>
    </section>
  );
}

function getContractBandStyles(band: string) {
  if (band === 'EXPIRED' || band === 'CRITICAL') return 'bg-rose-100 text-rose-700';
  if (band === 'URGENT') return 'bg-amber-100 text-amber-800';
  if (band === 'FOLLOW_UP') return 'bg-cyan-100 text-cyan-800';
  return 'bg-slate-100 text-slate-700';
}

function ContractAlertStrip({ data, items }: { data: DashboardData | null; items: ContractAlertItem[] }) {
  const topItems = items.slice(0, 4);

  return (
    <section className="surface-card p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-700">Contract Alert Deck</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">Onboard contracts requiring follow-up</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Escalation window is now tracked at 45, 30, and 14 days so renewal or reliever planning stays visible from the dashboard.
          </p>
        </div>
        <Link href="/crewing/crew-list" className="text-sm font-semibold text-rose-700 hover:text-rose-800">
          Open crew list
        </Link>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Within 45 days</p>
          <p className="mt-2 text-3xl font-semibold text-amber-700">{data?.contractsExpiring45Days ?? 0}</p>
          <p className="mt-1 text-sm text-slate-600">Urgent review and reliever planning.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Within 30 days</p>
          <p className="mt-2 text-3xl font-semibold text-rose-700">{data?.contractsExpiring30Days ?? 0}</p>
          <p className="mt-1 text-sm text-slate-600">Critical renewal or sign-off decision.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Within 14 days</p>
          <p className="mt-2 text-3xl font-semibold text-rose-700">{data?.contractsExpiring14Days ?? 0}</p>
          <p className="mt-1 text-sm text-slate-600">Director escalation required immediately.</p>
        </div>
      </div>
      {topItems.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
          No onboard contracts are currently inside the contract escalation window.
        </div>
      ) : (
        <div className="mt-5 grid gap-3 xl:grid-cols-2">
          {topItems.map((item, index) => (
            <Link
              key={`${item.crewId}-${index}`}
              href={item.link}
              className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-rose-300 hover:bg-rose-50"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{item.seafarer}</p>
                  <p className="text-sm text-slate-500">{item.principal} • {item.vessel}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getContractBandStyles(item.band)}`}>
                  {item.band.replaceAll('_', ' ')}
                </span>
              </div>
              <p className="mt-3 text-sm font-medium text-slate-700">
                Contract end {formatDateLabel(item.expiryDate, 'id-ID')} • {item.daysLeft} day(s) left
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.nextAction}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function CrewMovementSection({ crewMovement, className = '' }: { crewMovement: CrewMovementItem[]; className?: string }) {
  return (
    <section className={`surface-card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Crew Movement
            {crewMovement.length > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                {crewMovement.length}
              </span>
            )}
          </h3>
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
          <h3 className="text-lg font-semibold text-slate-900">
            Expiring Items
            {items.length > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                {items.length}
              </span>
            )}
          </h3>
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
                  <p className="text-sm font-semibold text-amber-900">{formatDateLabel(item.expiryDate, 'id-ID')}</p>
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
          <h3 className="text-lg font-semibold text-slate-900">
            Pending Tasks
            {tasks.length > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                {tasks.length}
              </span>
            )}
          </h3>
          <p className="text-sm text-slate-600">Operational, audit, and compliance follow ups</p>
        </div>
        <Link href="/crewing/applications" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
          View All Tasks →
        </Link>
      </div>
      {tasks.length === 0 ? (
        <EmptyState message="No tasks registered yet." />
      ) : (
        <div className="space-y-3">
          {tasks.map((task, index) => {
            const baseClassName = "border border-gray-200 rounded-lg p-4 flex items-start gap-4";
            const hoverClassName = "hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer";
            
            const taskContent = (
              <>
                <div className="text-sm font-semibold text-gray-900 w-24">
                  <div>{formatDateLabel(task.dueDate, 'id-ID')}</div>
                  <span className={`inline-flex mt-2 items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getTaskStatusBadge(task.status)}`}>
                    {formatStatusLabel(task.status)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{task.type}</p>
                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                </div>
              </>
            );
            
            return task.link ? (
              <Link 
                key={`${task.description}-${index}`} 
                href={task.link} 
                className={`${baseClassName} ${hoverClassName}`}
              >
                {taskContent}
              </Link>
            ) : (
              <div key={`${task.description}-${index}`} className={baseClassName}>
                {taskContent}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function RecentActivitySection({ events, className = '' }: { events: RecentActivity[]; className?: string }) {
  return (
    <section className={`surface-card p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Recent Activity
        {events.length > 0 && (
          <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
            {events.length}
          </span>
        )}
      </h3>
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

function getCrewStatusBadge(status: string) {
  return getFleetActivityBadgeClasses(status);
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
