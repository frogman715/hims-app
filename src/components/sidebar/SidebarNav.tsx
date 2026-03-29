"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession as useSessionAuth } from "next-auth/react";
import { ModuleName, PermissionLevel } from "@/lib/permissions";
import { canAccessOfficeNavigationItem } from "@/lib/office-navigation-access";
import { isSystemAdmin } from "@/lib/type-guards";
import type { AppRole } from "@/lib/roles";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  group?: string;
  module?: ModuleName;
  requiredLevel?: PermissionLevel;
  allowedRoles?: AppRole[];
}

interface SidebarNavProps {
  items: NavItem[];
  onNavigate?: () => void;
}

const GROUP_ORDER = [
  "CREW OPERATIONS",
  "DOCUMENT CONTROL",
  "FINANCE & ADMINISTRATION",
  "HR & PERSONNEL",
  "QUALITY & COMPLIANCE",
  "SYSTEM ADMINISTRATION",
  "OTHER",
];

export default function SidebarNav({ items, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const { data: session } = useSessionAuth();
  
  // Filter items based on user permissions
  const filteredItems = items.filter((item) => {
    // If no module specified, always show (no permission check needed)
    if (!item.module) return true;
    
    // System admins see EVERYTHING - bypass all permission checks
    if (isSystemAdmin(session)) return true;
    
    // If session not loaded, show nothing to be safe
    if (!session?.user) return false;
    
    const subject = {
      roles: session.user.roles,
      role: session.user.role,
      isSystemAdmin: session.user.isSystemAdmin === true,
      permissionOverrides: session.user.permissionOverrides,
      adminMaintenanceScopes: session.user.adminMaintenanceScopes,
    };

    return canAccessOfficeNavigationItem(
      {
        ...item,
        module: item.module,
        requiredLevel: item.requiredLevel ?? PermissionLevel.VIEW_ACCESS,
      },
      subject
    );
  });
  
  // Group items by department
  const groupedItems = filteredItems.reduce((acc, item) => {
    const group = item.group || "OTHER";
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  return (
    <nav className="space-y-5">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 font-semibold transition ${
          pathname === "/dashboard"
            ? "border-cyan-200 bg-cyan-50 text-cyan-900 shadow-sm"
            : "border-slate-200 bg-white text-slate-700 hover:border-cyan-200 hover:bg-cyan-50/60 hover:text-cyan-800"
        }`}
      >
        <span className="text-lg text-current">📊</span>
        <span className="text-sm text-current">Dashboard</span>
      </Link>

      {GROUP_ORDER.filter((group) => group !== "MAIN" && groupedItems[group]?.length).map((group) => {
        const groupItems = groupedItems[group];
        return (
          <div key={group} className="space-y-2">
            <div className="px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              {group}
            </div>
            <div className="space-y-1">
              {groupItems.map((item, index) => {
                const isActive = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={index}
                    href={item.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                        : "border-transparent bg-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="leading-5">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
