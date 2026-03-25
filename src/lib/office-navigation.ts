import { ModuleName, PermissionLevel } from "@/lib/permissions";
import { APP_ROLES, type AppRole } from "@/lib/roles";

export interface OfficeNavigationItem {
  module: ModuleName;
  href: string;
  label: string;
  icon: string;
  requiredLevel?: PermissionLevel;
  group?: string;
  allowedRoles?: AppRole[];
}

export const OFFICE_NAV_ITEMS: OfficeNavigationItem[] = [
  {
    module: ModuleName.crewing,
    href: "/crewing",
    label: "Operasional Crew",
    icon: "⚓",
    group: "ALUR CREW",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.OPERATIONAL, APP_ROLES.GA_DRIVER, APP_ROLES.HR, APP_ROLES.HR_ADMIN],
  },
  {
    module: ModuleName.crewing,
    href: "/crewing/readiness",
    label: "Kesiapan Crew",
    icon: "✅",
    group: "ALUR CREW",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.OPERATIONAL, APP_ROLES.HR, APP_ROLES.HR_ADMIN],
  },
  {
    module: ModuleName.crewing,
    href: "/crewing/prepare-joining",
    label: "Persiapan Keberangkatan",
    icon: "🧾",
    group: "ALUR CREW",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.OPERATIONAL],
  },
  {
    module: ModuleName.assignments,
    href: "/crewing/assignments",
    label: "Penugasan Transport",
    icon: "🚐",
    group: "ALUR CREW",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.OPERATIONAL, APP_ROLES.GA_DRIVER],
  },
  {
    module: ModuleName.assignments,
    href: "/crewing/crew-list",
    label: "Crew Onboard",
    icon: "🚢",
    group: "ALUR CREW",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.OPERATIONAL, APP_ROLES.GA_DRIVER],
  },
  {
    module: ModuleName.crew,
    href: "/crewing/seafarers",
    label: "Data Crew",
    icon: "👤",
    group: "ALUR CREW",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.OPERATIONAL, APP_ROLES.HR, APP_ROLES.HR_ADMIN],
  },
  {
    module: ModuleName.contracts,
    href: "/contracts",
    label: "Contracts",
    icon: "📝",
    group: "ALUR CREW",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.OPERATIONAL, APP_ROLES.ACCOUNTING],
  },
  {
    module: ModuleName.documents,
    href: "/crewing/documents",
    label: "Dokumen Crew",
    icon: "📁",
    group: "ALUR DOKUMEN",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.CDMO, APP_ROLES.OPERATIONAL, APP_ROLES.HR, APP_ROLES.HR_ADMIN],
  },
  {
    module: ModuleName.principals,
    href: "/crewing/principals",
    label: "Armada & Principal",
    icon: "🚢",
    group: "ALUR CREW",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.OPERATIONAL],
  },
  {
    module: ModuleName.accounting,
    href: "/accounting",
    label: "Keuangan",
    icon: "💰",
    group: "KEUANGAN & ADMIN",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.ACCOUNTING],
  },
  {
    module: ModuleName.crew,
    href: "/hr",
    label: "SDM",
    icon: "👔",
    group: "SDM",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.HR, APP_ROLES.HR_ADMIN],
  },
  {
    module: ModuleName.compliance,
    href: "/compliance",
    label: "Pusat Kepatuhan",
    icon: "🧭",
    requiredLevel: PermissionLevel.VIEW_ACCESS,
    group: "MUTU & KEPATUHAN",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.CDMO, APP_ROLES.HR_ADMIN, APP_ROLES.QMR],
  },
  {
    module: ModuleName.quality,
    href: "/quality/qms-dashboard",
    label: "Dashboard QMS",
    icon: "📊",
    requiredLevel: PermissionLevel.VIEW_ACCESS,
    group: "MUTU & KEPATUHAN",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.CDMO, APP_ROLES.HR_ADMIN, APP_ROLES.QMR],
  },
  {
    module: ModuleName.quality,
    href: "/audit",
    label: "Manajemen Audit",
    icon: "📋",
    requiredLevel: PermissionLevel.VIEW_ACCESS,
    group: "MUTU & KEPATUHAN",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.CDMO, APP_ROLES.HR_ADMIN, APP_ROLES.QMR],
  },
  {
    module: ModuleName.quality,
    href: "/nonconformity",
    label: "Ketidaksesuaian",
    icon: "⚠️",
    requiredLevel: PermissionLevel.VIEW_ACCESS,
    group: "MUTU & KEPATUHAN",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.CDMO, APP_ROLES.HR_ADMIN, APP_ROLES.QMR],
  },
  {
    module: ModuleName.dashboard,
    href: "/admin/users",
    label: "Kelola User",
    icon: "👥",
    requiredLevel: PermissionLevel.FULL_ACCESS,
    group: "ADMIN SISTEM",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.HR_ADMIN],
  },
  {
    module: ModuleName.dashboard,
    href: "/admin/system-health",
    label: "Status Sistem",
    icon: "⚙️",
    requiredLevel: PermissionLevel.FULL_ACCESS,
    group: "ADMIN SISTEM",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.HR_ADMIN],
  },
  {
    module: ModuleName.dashboard,
    href: "/admin/audit-logs",
    label: "Riwayat Aktivitas",
    icon: "📜",
    requiredLevel: PermissionLevel.FULL_ACCESS,
    group: "ADMIN SISTEM",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.HR_ADMIN],
  },
];
