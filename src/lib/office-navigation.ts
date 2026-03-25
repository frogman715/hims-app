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
    label: "Crew Operations",
    icon: "⚓",
    group: "CREW OPERATIONS",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.OPERATIONAL, APP_ROLES.GA_DRIVER, APP_ROLES.HR, APP_ROLES.HR_ADMIN],
  },
  {
    module: ModuleName.crewing,
    href: "/crewing/readiness",
    label: "Crew Readiness",
    icon: "✅",
    group: "CREW OPERATIONS",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.OPERATIONAL, APP_ROLES.HR, APP_ROLES.HR_ADMIN],
  },
  {
    module: ModuleName.crewing,
    href: "/crewing/prepare-joining",
    label: "Pre-Departure Preparation",
    icon: "🧾",
    group: "CREW OPERATIONS",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.OPERATIONAL],
  },
  {
    module: ModuleName.assignments,
    href: "/crewing/assignments",
    label: "Transport Assignment",
    icon: "🚐",
    group: "CREW OPERATIONS",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.OPERATIONAL, APP_ROLES.GA_DRIVER],
  },
  {
    module: ModuleName.assignments,
    href: "/crewing/crew-list",
    label: "Crew Onboard",
    icon: "🚢",
    group: "CREW OPERATIONS",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.OPERATIONAL, APP_ROLES.GA_DRIVER],
  },
  {
    module: ModuleName.crew,
    href: "/crewing/seafarers",
    label: "Seafarer Records",
    icon: "👤",
    group: "CREW OPERATIONS",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.OPERATIONAL, APP_ROLES.HR, APP_ROLES.HR_ADMIN],
  },
  {
    module: ModuleName.contracts,
    href: "/contracts",
    label: "Contracts",
    icon: "📝",
    group: "CREW OPERATIONS",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.OPERATIONAL, APP_ROLES.ACCOUNTING],
  },
  {
    module: ModuleName.documents,
    href: "/crewing/documents",
    label: "Crew Documents",
    icon: "📁",
    group: "DOCUMENT CONTROL",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.CDMO, APP_ROLES.OPERATIONAL, APP_ROLES.HR, APP_ROLES.HR_ADMIN],
  },
  {
    module: ModuleName.principals,
    href: "/crewing/principals",
    label: "Fleet & Principals",
    icon: "🚢",
    group: "CREW OPERATIONS",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.OPERATIONAL],
  },
  {
    module: ModuleName.accounting,
    href: "/accounting",
    label: "Finance",
    icon: "💰",
    group: "FINANCE & ADMINISTRATION",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.ACCOUNTING],
  },
  {
    module: ModuleName.crew,
    href: "/hr",
    label: "HR Management",
    icon: "👔",
    group: "HR & PERSONNEL",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.HR, APP_ROLES.HR_ADMIN],
  },
  {
    module: ModuleName.compliance,
    href: "/compliance",
    label: "Compliance Center",
    icon: "🧭",
    requiredLevel: PermissionLevel.VIEW_ACCESS,
    group: "QUALITY & COMPLIANCE",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.CDMO, APP_ROLES.HR_ADMIN, APP_ROLES.QMR],
  },
  {
    module: ModuleName.quality,
    href: "/quality/qms-dashboard",
    label: "QMS Dashboard",
    icon: "📊",
    requiredLevel: PermissionLevel.VIEW_ACCESS,
    group: "QUALITY & COMPLIANCE",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.CDMO, APP_ROLES.HR_ADMIN, APP_ROLES.QMR],
  },
  {
    module: ModuleName.quality,
    href: "/audit",
    label: "Audit Management",
    icon: "📋",
    requiredLevel: PermissionLevel.VIEW_ACCESS,
    group: "QUALITY & COMPLIANCE",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.CDMO, APP_ROLES.HR_ADMIN, APP_ROLES.QMR],
  },
  {
    module: ModuleName.quality,
    href: "/nonconformity",
    label: "Non-Conformities",
    icon: "⚠️",
    requiredLevel: PermissionLevel.VIEW_ACCESS,
    group: "QUALITY & COMPLIANCE",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.CDMO, APP_ROLES.HR_ADMIN, APP_ROLES.QMR],
  },
  {
    module: ModuleName.dashboard,
    href: "/admin/users",
    label: "User Management",
    icon: "👥",
    requiredLevel: PermissionLevel.FULL_ACCESS,
    group: "SYSTEM ADMINISTRATION",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.HR_ADMIN],
  },
  {
    module: ModuleName.dashboard,
    href: "/admin/system-health",
    label: "System Health",
    icon: "⚙️",
    requiredLevel: PermissionLevel.FULL_ACCESS,
    group: "SYSTEM ADMINISTRATION",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.HR_ADMIN],
  },
  {
    module: ModuleName.dashboard,
    href: "/admin/audit-logs",
    label: "Audit Logs",
    icon: "📜",
    requiredLevel: PermissionLevel.FULL_ACCESS,
    group: "SYSTEM ADMINISTRATION",
    allowedRoles: [APP_ROLES.DIRECTOR, APP_ROLES.HR_ADMIN],
  },
];
