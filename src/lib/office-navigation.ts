import { ModuleName, PermissionLevel } from "@/lib/permissions";
import { getSidebarAllowedRolesForHref } from "@/lib/hgi-rbac";
import type { AppRole } from "@/lib/roles";

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
    label: "Crewing Department",
    icon: "⚓",
    group: "CREW OPERATIONS",
    allowedRoles: getSidebarAllowedRolesForHref("/crewing"),
  },
  {
    module: ModuleName.crewing,
    href: "/crewing/readiness",
    label: "Crew Readiness",
    icon: "✅",
    group: "CREW OPERATIONS",
    allowedRoles: getSidebarAllowedRolesForHref("/crewing/readiness"),
  },
  {
    module: ModuleName.crewing,
    href: "/crewing/prepare-joining",
    label: "Prepare Joining",
    icon: "🧾",
    group: "CREW OPERATIONS",
    allowedRoles: getSidebarAllowedRolesForHref("/crewing/prepare-joining"),
  },
  {
    module: ModuleName.assignments,
    href: "/crewing/assignments",
    label: "Transport Assignment",
    icon: "🚐",
    group: "CREW OPERATIONS",
    allowedRoles: getSidebarAllowedRolesForHref("/crewing/assignments"),
  },
  {
    module: ModuleName.assignments,
    href: "/crewing/crew-list",
    label: "Crew Onboard",
    icon: "🚢",
    group: "CREW OPERATIONS",
    allowedRoles: getSidebarAllowedRolesForHref("/crewing/crew-list"),
  },
  {
    module: ModuleName.crew,
    href: "/crewing/seafarers",
    label: "Seafarer Records",
    icon: "👤",
    group: "CREW OPERATIONS",
    allowedRoles: getSidebarAllowedRolesForHref("/crewing/seafarers"),
  },
  {
    module: ModuleName.contracts,
    href: "/contracts",
    label: "Contracts",
    icon: "📝",
    group: "CREW OPERATIONS",
    allowedRoles: getSidebarAllowedRolesForHref("/contracts"),
  },
  {
    module: ModuleName.documents,
    href: "/crewing/documents",
    label: "Document Control",
    icon: "📁",
    group: "DOCUMENT CONTROL",
    allowedRoles: getSidebarAllowedRolesForHref("/crewing/documents"),
  },
  {
    module: ModuleName.principals,
    href: "/crewing/principals",
    label: "Fleet & Principals",
    icon: "🚢",
    group: "CREW OPERATIONS",
    allowedRoles: getSidebarAllowedRolesForHref("/crewing/principals"),
  },
  {
    module: ModuleName.accounting,
    href: "/accounting",
    label: "Finance",
    icon: "💰",
    group: "FINANCE & ADMINISTRATION",
    allowedRoles: getSidebarAllowedRolesForHref("/accounting"),
  },
  {
    module: ModuleName.crew,
    href: "/hr",
    label: "HR Management",
    icon: "👔",
    group: "HR & PERSONNEL",
    allowedRoles: getSidebarAllowedRolesForHref("/hr"),
  },
  {
    module: ModuleName.compliance,
    href: "/compliance",
    label: "Compliance Center",
    icon: "🧭",
    requiredLevel: PermissionLevel.VIEW_ACCESS,
    group: "QUALITY & COMPLIANCE",
    allowedRoles: getSidebarAllowedRolesForHref("/compliance"),
  },
  {
    module: ModuleName.quality,
    href: "/quality/qms-dashboard",
    label: "QMS Dashboard",
    icon: "📊",
    requiredLevel: PermissionLevel.VIEW_ACCESS,
    group: "QUALITY & COMPLIANCE",
    allowedRoles: getSidebarAllowedRolesForHref("/quality/qms-dashboard"),
  },
  {
    module: ModuleName.quality,
    href: "/audit",
    label: "Audit Management",
    icon: "📋",
    requiredLevel: PermissionLevel.VIEW_ACCESS,
    group: "QUALITY & COMPLIANCE",
    allowedRoles: getSidebarAllowedRolesForHref("/audit"),
  },
  {
    module: ModuleName.quality,
    href: "/nonconformity",
    label: "Non-Conformities",
    icon: "⚠️",
    requiredLevel: PermissionLevel.VIEW_ACCESS,
    group: "QUALITY & COMPLIANCE",
    allowedRoles: getSidebarAllowedRolesForHref("/nonconformity"),
  },
  {
    module: ModuleName.dashboard,
    href: "/admin/users",
    label: "User Management",
    icon: "👥",
    requiredLevel: PermissionLevel.FULL_ACCESS,
    group: "SYSTEM ADMINISTRATION",
    allowedRoles: getSidebarAllowedRolesForHref("/admin/users"),
  },
  {
    module: ModuleName.dashboard,
    href: "/admin/system-health",
    label: "System Health",
    icon: "⚙️",
    requiredLevel: PermissionLevel.FULL_ACCESS,
    group: "SYSTEM ADMINISTRATION",
    allowedRoles: getSidebarAllowedRolesForHref("/admin/system-health"),
  },
  {
    module: ModuleName.dashboard,
    href: "/admin/audit-logs",
    label: "Audit Logs",
    icon: "📜",
    requiredLevel: PermissionLevel.FULL_ACCESS,
    group: "SYSTEM ADMINISTRATION",
    allowedRoles: getSidebarAllowedRolesForHref("/admin/audit-logs"),
  },
];
