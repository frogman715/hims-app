'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { AppRole } from '@/lib/roles';
import { APP_ROLES } from '@/lib/roles';
import ComplianceStatusWidget from '@/components/compliance/ComplianceStatusWidget';
import { getRoleDisplayName, getRoleWorkspaceProfile } from '@/lib/role-display';
import StatCard from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDateLabel, formatStatusLabel } from '@/lib/formatters';

interface DashboardData {
  totalCrew: number;
  activeVessels: number;
  operationalVessels: number;
  onboardVessels: number;
  crewReady: number;
  crewOnboard: number;
  pendingApplications: number;
  expiringDocuments: number;
  expiredDocuments: number;
  prepareJoiningAlerts: number;
  readinessAlerts: number;
  urgentCrewCases: number;
  contractsExpiring45Days: number;
  contractsExpiring30Days: number;
  contractsExpiring14Days: number;
  mlcMedicalAlerts: number;
  stcwComplianceAlerts: number;
  travelDocumentAlerts: number;
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

interface CompliancePriority {
  title: string;
  detail: string;
  href: string;
}

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
          crewReady: payload.crewReady ?? 0,
          crewOnboard: payload.crewOnboard ?? 0,
          pendingApplications: payload.pendingApplications ?? 0,
          expiringDocuments: payload.expiringDocuments ?? 0,
          expiredDocuments: payload.expiredDocuments ?? 0,
          prepareJoiningAlerts: payload.prepareJoiningAlerts ?? 0,
          readinessAlerts: payload.readinessAlerts ?? 0,
          urgentCrewCases: payload.urgentCrewCases ?? 0,
          contractsExpiring45Days: payload.contractsExpiring45Days ?? 0,
          contractsExpiring30Days: payload.contractsExpiring30Days ?? 0,
          contractsExpiring14Days: payload.contractsExpiring14Days ?? 0,
          mlcMedicalAlerts: payload.mlcMedicalAlerts ?? 0,
          stcwComplianceAlerts: payload.stcwComplianceAlerts ?? 0,
          travelDocumentAlerts: payload.travelDocumentAlerts ?? 0,
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
          crewReady: 0,
          crewOnboard: 0,
          pendingApplications: 0,
          expiringDocuments: 0,
          expiredDocuments: 0,
          prepareJoiningAlerts: 0,
          readinessAlerts: 0,
          urgentCrewCases: 0,
          contractsExpiring45Days: 0,
          contractsExpiring30Days: 0,
          contractsExpiring14Days: 0,
          mlcMedicalAlerts: 0,
          stcwComplianceAlerts: 0,
          travelDocumentAlerts: 0,
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
        crewReady: 0,
        crewOnboard: 0,
        pendingApplications: 0,
        expiringDocuments: 0,
        expiredDocuments: 0,
        prepareJoiningAlerts: 0,
        readinessAlerts: 0,
        urgentCrewCases: 0,
        contractsExpiring45Days: 0,
        contractsExpiring30Days: 0,
        contractsExpiring14Days: 0,
        mlcMedicalAlerts: 0,
        stcwComplianceAlerts: 0,
        travelDocumentAlerts: 0,
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

  return (
    <div className="section-stack">
      {renderRoleBasedDashboard()}
    </div>
  );
}

function DirectorDashboard({ data, crewMovement, expiringItems, contractAlerts, pendingTasks, recentActivity, user }: DashboardSectionProps) {
  const primaryTask = pendingTasks[0] ?? null;
  const criticalContract = contractAlerts[0] ?? null;
  const topExpiringItem = expiringItems[0] ?? null;

  return (
    <div className="space-y-6">
      <DashboardHeader
        role={user?.roles?.[0]}
        title="Executive Command Center"
        subtitle="One integrated workspace for crew readiness, contract exposure, operational backlog, and cross-department follow-up."
      />
      <DirectorOverviewStructure data={data} pendingTasks={pendingTasks} />
      <DirectorCommandCenter
        data={data}
        primaryTask={primaryTask}
        criticalContract={criticalContract}
        topExpiringItem={topExpiringItem}
      />
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <PendingTasksSection tasks={pendingTasks} />
        <DirectorActionBoard />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <ContractAlertStrip data={data} items={contractAlerts} />
        <FleetSnapshot data={data} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <CrewMovementSection crewMovement={crewMovement} />
        <ExpiringItemsSection items={expiringItems} />
      </div>
      <DirectorFinanceSummary data={data} />
      <RecentActivitySection events={recentActivity} />
    </div>
  );
}

function DirectorOverviewStructure({ data, pendingTasks }: { data: DashboardData | null; pendingTasks: PendingTask[] }) {
  const structureCards = [
    {
      label: "Total Crew",
      value: (data?.totalCrew ?? 0).toLocaleString("id-ID"),
      detail: "Active seafarers managed across the office system.",
      href: "/crewing/seafarers",
      tone: "slate" as const,
    },
    {
      label: "Open Tasks",
      value: pendingTasks.length.toLocaleString("id-ID"),
      detail: "Actionable work currently visible from operations, audit, and contract review.",
      href: "/dashboard",
      tone: "cyan" as const,
    },
    {
      label: "Readiness Alerts",
      value: (data?.readinessAlerts ?? 0).toLocaleString("id-ID"),
      detail: "Combined document and contract alerts affecting deployment readiness.",
      href: "/crewing/documents?filter=expiring",
      tone: "amber" as const,
    },
    {
      label: "Urgent Cases",
      value: (data?.urgentCrewCases ?? 0).toLocaleString("id-ID"),
      detail: "Expired documents and active prepare-joining blockers needing immediate attention.",
      href: "/crewing/prepare-joining",
      tone: "rose" as const,
    },
  ];

  return (
    <section className="surface-card p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">Director Dashboard Structure</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">Core signals for office monitoring</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            The dashboard is reduced to one hierarchy: enterprise count, action queue, readiness pressure, and urgent cases that need leadership intervention.
          </p>
        </div>
        <Link href="/dashboard" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">
          Refresh overview
        </Link>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {structureCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-white"
          >
            <p className={`text-xs font-semibold uppercase tracking-wide ${card.tone === 'rose' ? 'text-rose-700' : card.tone === 'amber' ? 'text-amber-700' : card.tone === 'cyan' ? 'text-cyan-700' : 'text-slate-500'}`}>
              {card.label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{card.detail}</p>
          </Link>
        ))}
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">MLC 2006</p>
          <p className="mt-3 text-3xl font-semibold text-cyan-950">{(data?.mlcMedicalAlerts ?? 0).toLocaleString('id-ID')}</p>
          <p className="mt-2 text-sm leading-6 text-cyan-900">Crew with medical fitness records that still require compliance follow-up.</p>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">STCW 2010</p>
          <p className="mt-3 text-3xl font-semibold text-violet-950">{(data?.stcwComplianceAlerts ?? 0).toLocaleString('id-ID')}</p>
          <p className="mt-2 text-sm leading-6 text-violet-900">Crew records with missing, expiring, or blocked core STCW certificate coverage.</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Travel Readiness</p>
          <p className="mt-3 text-3xl font-semibold text-amber-950">{(data?.travelDocumentAlerts ?? 0).toLocaleString('id-ID')}</p>
          <p className="mt-2 text-sm leading-6 text-amber-900">Passport, seaman book, or visa packages that can block owner release or mobilization.</p>
        </div>
      </div>
    </section>
  );
}

function DirectorFinanceSummary({ data }: { data: DashboardData | null }) {
  const items = [
    {
      label: "Contracts ≤ 45 Days",
      value: data?.contractsExpiring45Days ?? 0,
      detail: "Review travel cost exposure, reliever planning, and payroll impact.",
    },
    {
      label: "Contracts ≤ 30 Days",
      value: data?.contractsExpiring30Days ?? 0,
      detail: "Priority renewal or sign-off decisions.",
    },
    {
      label: "Contracts ≤ 14 Days",
      value: data?.contractsExpiring14Days ?? 0,
      detail: "Most urgent contract exposure for office follow-up.",
    },
  ];

  return (
    <section className="surface-card p-6">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-700">Finance Summary</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-900">Contract exposure</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{item.value.toLocaleString("id-ID")}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DirectorCommandCenter({
  data,
  primaryTask,
  criticalContract,
  topExpiringItem,
}: {
  data: DashboardData | null;
  primaryTask: PendingTask | null;
  criticalContract: ContractAlertItem | null;
  topExpiringItem: ExpiringItem | null;
}) {
  const cards = [
    {
      eyebrow: "Current Lead Task",
      title: primaryTask?.type ?? "No open task in queue",
      detail: primaryTask
        ? `${primaryTask.description} Due ${formatDateLabel(primaryTask.dueDate, 'en-US')}.`
        : "No pending tasks are currently registered for leadership follow-up.",
      href: primaryTask?.link ?? "/dashboard",
      cta: primaryTask?.link ? "Open task" : "Refresh dashboard",
      accent: "border-cyan-200 bg-cyan-50/80",
    },
    {
      eyebrow: "Contract Exposure",
      title: criticalContract ? `${criticalContract.seafarer} • ${criticalContract.vessel}` : "No critical contract case",
      detail: criticalContract
        ? `${criticalContract.daysLeft} day(s) left. ${criticalContract.nextAction}`
        : "No onboard contract is currently in the escalation band.",
      href: criticalContract?.link ?? "/contracts",
      cta: "Review contracts",
      accent: "border-rose-200 bg-rose-50/80",
    },
    {
      eyebrow: "Readiness Blocker",
      title: topExpiringItem ? `${topExpiringItem.seafarer} • ${topExpiringItem.name}` : "No document blocker",
      detail: topExpiringItem
        ? `${topExpiringItem.daysLeft} day(s) remaining before expiry on ${formatDateLabel(topExpiringItem.expiryDate, 'en-US')}.`
        : "No immediate document or contract blocker is visible in the current data set.",
      href: "/crewing/documents?filter=expiring",
      cta: "Open document control",
      accent: "border-amber-200 bg-amber-50/80",
    },
  ];

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_34%),linear-gradient(135deg,#ffffff_0%,#f8fbff_52%,#ecf5ff_100%)] p-6 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">Leadership Action Grid</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-950">Priorities, not duplicate modules</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Director view now highlights the next action, the most exposed contract, and the strongest readiness blocker from one integrated layer.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Crew Planned</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{(data?.crewReady ?? 0).toLocaleString('id-ID')}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Crew Onboard</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{(data?.crewOnboard ?? 0).toLocaleString('id-ID')}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Prepare Joining Alerts</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{(data?.prepareJoiningAlerts ?? 0).toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.eyebrow}
            href={card.href}
            className={`rounded-[1.5rem] border p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white ${card.accent}`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{card.eyebrow}</p>
            <h4 className="mt-3 text-lg font-semibold text-slate-950">{card.title}</h4>
            <p className="mt-2 text-sm leading-6 text-slate-600">{card.detail}</p>
            <p className="mt-4 text-sm font-semibold text-slate-900">{card.cta}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function DirectorActionBoard() {
  const actions = [
    {
      title: "Operations backlog",
      detail: "Open the mobilization queue to clear document, medical, training, travel, and release blockers from one desk.",
      href: "/crewing/prepare-joining",
    },
    {
      title: "Application decisions",
      detail: "Review nomination intake and move each case forward without leaving duplicate candidate decisions in the queue.",
      href: "/crewing/applications",
    },
    {
      title: "Expired documents",
      detail: "Use the controlled document desk to clear expired or soon-to-expire crew documents before deployment is committed.",
      href: "/crewing/documents?filter=expiring",
    },
    {
      title: "Regulatory readiness",
      detail: "Review MLC medical fitness, STCW certificate coverage, and travel papers from one compliance-focused readiness desk.",
      href: "/crewing/readiness",
    },
    {
      title: "Quality schedule",
      detail: "Keep audits and escalations visible in the same command path, not on disconnected pages.",
      href: "/audit",
    },
  ];

  return (
    <section className="surface-card p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Department Routing</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">What needs to be opened next</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Each route below maps one real office responsibility to one working page so users are not bounced between duplicate menus.
          </p>
        </div>
        <Link href="/compliance/control-center" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">
          Open control center
        </Link>
      </div>
      <div className="mt-5 space-y-3">
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-cyan-300 hover:bg-white"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">{action.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{action.detail}</p>
            </div>
            <span className="whitespace-nowrap text-sm font-semibold text-cyan-700">Open</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CDMODashboard({ data, crewMovement, expiringItems, contractAlerts, pendingTasks, recentActivity, user }: DashboardSectionProps) {
  return (
    <div className="space-y-6">
      <DashboardHeader
        role={user?.roles?.[0]}
        title="Crewing Document Control"
        subtitle="Professional control desk for crew records, certificate validity, and document follow-up"
      />
      <CDMOFocusPanel />
      <CDMOKpiStrip data={data} items={expiringItems} tasks={pendingTasks} />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <CDMOQuickLinks />
        <div className="surface-card p-6">
          <h3 className="mb-2 text-lg font-semibold text-slate-900">Verification Snapshot</h3>
          <p className="mb-4 text-sm leading-6 text-slate-600">
            Keep a clean view of document-control verification pressure without mixing it with unrelated workflow steps.
          </p>
          <ComplianceStatusWidget />
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <ExpiringItemsSection items={expiringItems} />
        <CDMODocumentAttention items={expiringItems} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <CrewMovementSection crewMovement={crewMovement} />
        <PendingTasksSection tasks={pendingTasks} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ContractAlertStrip data={data} items={contractAlerts} />
        <RecentActivitySection events={recentActivity} />
      </div>
    </div>
  );
}

function AccountingDashboard({ data, pendingTasks, user }: DashboardSectionProps) {
  return (
    <div className="space-y-6">
      <DashboardHeader
        role={user?.roles?.[0]}
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

function OperationalDashboard({ data, crewMovement, expiringItems, contractAlerts, pendingTasks, user }: DashboardSectionProps) {
  return (
    <div className="space-y-6">
      <DashboardHeader
        role={user?.roles?.[0]}
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

function GADriverDashboard({ data, pendingTasks, recentActivity, user }: DashboardSectionProps) {
  return (
    <div className="space-y-6">
      <DashboardHeader
        role={user?.roles?.[0]}
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

function HRDashboard({ data, expiringItems, contractAlerts, pendingTasks, recentActivity, user }: DashboardSectionProps) {
  return (
    <div className="space-y-6">
      <DashboardHeader
        role={user?.roles?.[0]}
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

function HRAdminDashboard({ data, expiringItems, contractAlerts, pendingTasks, recentActivity, user }: DashboardSectionProps) {
  return (
    <div className="space-y-6">
      <DashboardHeader
        role={user?.roles?.[0]}
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

function QMRDashboard({ data, contractAlerts, pendingTasks, recentActivity, user }: DashboardSectionProps) {
  return (
    <div className="space-y-6">
      <DashboardHeader
        role={user?.roles?.[0]}
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
        role={user?.roles?.[0]}
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

function DashboardHeader({ title, subtitle, role }: { title: string; subtitle?: string; role?: AppRole }) {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const roleLabel = getRoleDisplayName(role ?? APP_ROLES.STAFF);
  const workspaceProfile = getRoleWorkspaceProfile(role ?? APP_ROLES.STAFF);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-white shadow-2xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
            Maritime Operations Dashboard
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">{title}</h1>
          {subtitle && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{subtitle}</p>}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Primary Role</p>
              <p className="mt-2 text-base font-semibold text-white">{roleLabel}</p>
              <p className="mt-1 text-sm text-slate-300">{workspaceProfile.primaryDesk}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Role Focus</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">{workspaceProfile.focus}</p>
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:max-w-md">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Snapshot Date</p>
            <p className="mt-2 text-base font-semibold text-white">{formattedDate}</p>
          </div>
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-200">Dashboard Focus</p>
            <p className="mt-2 text-base font-semibold text-white">{workspaceProfile.actionLabels[0] ?? 'Action first, history second'}</p>
          </div>
        </div>
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

function CDMOFocusPanel() {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white shadow-2xl">
      <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.2fr,0.8fr] lg:px-8">
        <div className="space-y-4">
          <div className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
            CDMO Control Desk
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Clean document control for crewing records, expiry review, and office follow-up
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-300">
              This dashboard is focused on practical CDMO work: keep crew records complete, detect expiring certificates early,
              and move document issues to the correct follow-up path without mixing them with unrelated operational screens.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-slate-200">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Crew records</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Certificate expiry</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Document verification</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Controlled follow-up</span>
          </div>
        </div>
        <div className="grid gap-3">
          <Link
            href="/crewing/documents"
            className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-300/40 hover:bg-white/10"
          >
            <div className="text-sm font-semibold text-white">Open document register</div>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              Review uploads, validity dates, and supporting files from one controlled list.
            </p>
          </Link>
          <Link
            href="/crewing?section=database"
            className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-300/40 hover:bg-white/10"
          >
            <div className="text-sm font-semibold text-white">Open crewing workspace</div>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              Continue biodata review, applications, and crew profile maintenance from the department workspace.
            </p>
          </Link>
          <Link
            href="/compliance"
            className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-300/40 hover:bg-white/10"
          >
            <div className="text-sm font-semibold text-white">Open compliance oversight</div>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              Use compliance pages only for monitoring and escalation once document control review is complete.
            </p>
          </Link>
        </div>
      </div>
    </section>
  );
}

function CDMOKpiStrip({
  data,
  items,
  tasks,
}: {
  data: DashboardData | null;
  items: ExpiringItem[];
  tasks: PendingTask[];
}) {
  const cards = [
    {
      label: "Crew Records",
      value: (data?.totalCrew ?? 0).toLocaleString("id-ID"),
      detail: "Profiles currently controlled by the office.",
      tone: "slate",
    },
    {
      label: "Expiring Documents",
      value: (data?.expiringDocuments ?? 0).toLocaleString("id-ID"),
      detail: "Documents requiring renewal attention.",
      tone: "amber",
    },
    {
      label: "Review Queue",
      value: tasks.length.toLocaleString("id-ID"),
      detail: "Pending follow-up items for document control.",
      tone: "blue",
    },
    {
      label: "Priority Cases",
      value: items.slice(0, 5).length.toLocaleString("id-ID"),
      detail: "Immediate document cases visible on this dashboard.",
      tone: "rose",
    },
  ] as const;

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{card.value}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{card.detail}</p>
        </div>
      ))}
    </section>
  );
}

function CDMOQuickLinks({ className = "" }: { className?: string }) {
  const links = [
    {
      href: "/crewing/documents",
      title: "Document Register",
      description: "Main working page for uploads, expiry review, and document-file tracking.",
    },
    {
      href: "/crewing/documents?filter=expiring",
      title: "Expiry Follow-Up",
      description: "Review documents approaching expiry and keep renewal actions visible.",
    },
    {
      href: "/crewing/seafarers",
      title: "Crew Profiles",
      description: "Open seafarer records when document review requires biodata confirmation.",
    },
    {
      href: "/crewing/applications",
      title: "Applications Queue",
      description: "Check new entries that may need document completeness review before next processing.",
    },
  ];

  return (
    <section className={`surface-card p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Document Control Shortcuts</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Keep Rizkie’s daily path simple: document register first, then crew profile or application follow-up only when needed.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-cyan-300 hover:bg-white"
          >
            <p className="text-sm font-semibold text-slate-900">{link.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{link.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CDMODocumentAttention({ items }: { items: ExpiringItem[] }) {
  const topItems = items.slice(0, 4);

  return (
    <section className="surface-card p-6">
      <h3 className="text-lg font-semibold text-slate-900">Attention Notes</h3>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        A clean summary for quick office judgment before opening the full register.
      </p>
      {topItems.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
          No urgent document attention items are currently visible.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {topItems.map((item, index) => (
            <div key={`${item.seafarer}-${item.name}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">{item.name}</p>
              <p className="mt-1 text-sm text-slate-600">{item.seafarer}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
                {item.daysLeft} day(s) remaining
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SummaryCards({ data }: { data: DashboardData | null }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
      {SUMMARY_CARDS.map((card) => {
        const value = data?.[card.key] ?? 0;
        return (
          <Link
            key={card.key}
            href={card.href}
            className="surface-card group flex items-start justify-between gap-4 px-6 py-5 transition hover:-translate-y-0.5 hover:border-cyan-300"
          >
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
              <p className="text-2xl font-bold text-slate-900">{value.toLocaleString('id-ID')}</p>
              <p className="text-sm text-slate-600">{card.description}</p>
            </div>
            <span className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-2xl text-cyan-700 ring-1 ring-cyan-200/70" aria-hidden="true">
              {card.icon}
            </span>
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
                <StatusBadge status={item.band} label={item.band.replaceAll('_', ' ')} />
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
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-gray-500 uppercase tracking-wide text-xs">
              <tr>
                <th className="px-4 py-3 pr-4 font-medium">Crew</th>
                <th className="px-4 py-3 pr-4 font-medium">Principal / Vessel</th>
                <th className="px-4 py-3 pr-4 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Next Action</th>
              </tr>
            </thead>
            <tbody>
              {crewMovement.map((item, index) => (
                <tr key={`${item.seafarer}-${item.vessel}-${index}`} className="border-t border-gray-100 bg-white">
                  <td className="px-4 py-3 pr-4">
                    <div className="font-medium text-gray-900">{item.seafarer}</div>
                    <div className="text-xs text-gray-500">{item.rank}</div>
                  </td>
                  <td className="px-4 py-3 pr-4">
                    <div className="text-sm text-gray-900">{item.principal}</div>
                    <div className="text-xs text-gray-500">{item.vessel}</div>
                  </td>
                  <td className="px-4 py-3 pr-4">
                    <StatusBadge status={item.status} label={formatStatusLabel(item.status)} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.nextAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
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
            const baseClassName = "rounded-2xl border border-gray-200 bg-white p-4 flex items-start gap-4 shadow-sm";
            const hoverClassName = "hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer";
            
            const taskContent = (
              <>
                <div className="text-sm font-semibold text-gray-900 w-24">
                  <div>{formatDateLabel(task.dueDate, 'id-ID')}</div>
                  <StatusBadge
                    status={task.status}
                    label={formatStatusLabel(task.status)}
                    className="mt-2"
                  />
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
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">
          Recent Activity
          {events.length > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
              {events.length}
            </span>
          )}
        </h3>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Audit trail feed</span>
      </div>
      {events.length === 0 ? (
        <EmptyState message="Latest activity will appear after system receives updates." />
      ) : (
        <div className="space-y-4">
          {events.map((event, index) => (
            <div key={`${event.timestamp}-${index}`} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="w-20 flex-shrink-0 text-xs font-medium text-gray-500 pt-0.5">{event.timestamp}</div>
              <div className="flex-1 border-l border-gray-200 pl-4">
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
      label: 'My Profile',
      description: 'Review and update personal data and emergency contact details.',
      icon: '👤',
    },
    {
      href: '/m/crew/documents',
      label: 'My Documents',
      description: 'Upload or download certificates, passports, and important documents.',
      icon: '📄',
    },
    {
      href: '/m/crew',
      label: 'Prepare Joining',
      description: 'Review medical status, tickets, and pre-departure handling.',
      icon: '🧭',
    },
    {
      href: '/m/crew',
      label: 'Insurance & Welfare',
      description: 'Check insurance coverage and crew welfare claim status.',
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
