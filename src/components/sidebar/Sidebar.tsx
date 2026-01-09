"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ModuleName, PermissionLevel } from "@/lib/permissions";
import SidebarHeader from "./SidebarHeader";
import SidebarNav, { type NavItem } from "./SidebarNav";

interface SidebarProps {
  navigationItems?: NavItem[];
}

export default function Sidebar({ navigationItems }: SidebarProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const defaultNavItems: NavItem[] = [
    // ========== DASHBOARD ==========
    { href: "/dashboard", label: "Dashboard", icon: "📊", group: "MAIN", module: ModuleName.crewing, requiredLevel: PermissionLevel.VIEW_ACCESS },
    
    // ========== CREWING OPERATIONS ==========
    { href: "/crewing", label: "Crewing Department", icon: "👥", group: "CREWING OPERATIONS", module: ModuleName.crewing, requiredLevel: PermissionLevel.VIEW_ACCESS },
    { href: "/crewing/seafarers", label: "Seafarers List", icon: "👤", group: "CREWING OPERATIONS", module: ModuleName.crew, requiredLevel: PermissionLevel.VIEW_ACCESS },
    { href: "/contracts", label: "Contracts", icon: "📝", group: "CREWING OPERATIONS", module: ModuleName.contracts, requiredLevel: PermissionLevel.VIEW_ACCESS },
    { href: "/crewing/documents", label: "Documents", icon: "📁", group: "CREWING OPERATIONS", module: ModuleName.documents, requiredLevel: PermissionLevel.VIEW_ACCESS },
    { href: "/crewing/form-reference", label: "Form References", icon: "📄", group: "CREWING OPERATIONS", module: ModuleName.crewing, requiredLevel: PermissionLevel.VIEW_ACCESS },
    { href: "/crewing/principals", label: "Fleet Management", icon: "🚢", group: "CREWING OPERATIONS", module: ModuleName.principals, requiredLevel: PermissionLevel.VIEW_ACCESS },
    { href: "/insurance", label: "Insurance", icon: "🛡️", group: "CREWING OPERATIONS", module: ModuleName.insurance, requiredLevel: PermissionLevel.VIEW_ACCESS },
    
    // ========== FINANCE & ADMINISTRATION ==========
    { href: "/accounting", label: "Accounting", icon: "💵", group: "FINANCE & ADMINISTRATION", module: ModuleName.accounting, requiredLevel: PermissionLevel.VIEW_ACCESS },
    { href: "/agency-fees", label: "Agency Fees", icon: "💰", group: "FINANCE & ADMINISTRATION", module: ModuleName.accounting, requiredLevel: PermissionLevel.VIEW_ACCESS },
    
    // ========== HR & PERSONNEL ==========
    { href: "/hr", label: "HR", icon: "👔", group: "HR & PERSONNEL", module: ModuleName.crew, requiredLevel: PermissionLevel.VIEW_ACCESS },
    { href: "/disciplinary", label: "Disciplinary", icon: "⚡", group: "HR & PERSONNEL", module: ModuleName.crew, requiredLevel: PermissionLevel.VIEW_ACCESS },
    
    // ========== QUALITY & COMPLIANCE ==========
    { href: "/quality/qms-dashboard", label: "QMS Dashboard", icon: "📊", group: "QUALITY & COMPLIANCE", module: ModuleName.quality, requiredLevel: PermissionLevel.VIEW_ACCESS },
    { href: "/documents", label: "Document Control", icon: "📋", group: "QUALITY & COMPLIANCE", module: ModuleName.quality, requiredLevel: PermissionLevel.VIEW_ACCESS },
    { href: "/quality/audits", label: "Internal Audits (QMS)", icon: "🔍", group: "QUALITY & COMPLIANCE", module: ModuleName.quality, requiredLevel: PermissionLevel.VIEW_ACCESS },
    { href: "/quality/corrective-actions", label: "Corrective Actions (QMS)", icon: "🔧", group: "QUALITY & COMPLIANCE", module: ModuleName.quality, requiredLevel: PermissionLevel.VIEW_ACCESS },

    // ========== AUDIT & COMPLIANCE (NEW - POINT 4.3) ==========
    { href: "/audit", label: "Audit Management", icon: "📋", group: "AUDIT & COMPLIANCE", module: ModuleName.quality, requiredLevel: PermissionLevel.VIEW_ACCESS },
    { href: "/nonconformity", label: "Non-Conformities", icon: "⚠️", group: "AUDIT & COMPLIANCE", module: ModuleName.quality, requiredLevel: PermissionLevel.VIEW_ACCESS },

    // ========== SYSTEM ADMINISTRATION ==========
    { href: "/admin/users", label: "User Management", icon: "👥", group: "SYSTEM ADMINISTRATION", module: ModuleName.dashboard, requiredLevel: PermissionLevel.FULL_ACCESS },
    { href: "/admin/roles", label: "Role Management", icon: "🔐", group: "SYSTEM ADMINISTRATION", module: ModuleName.dashboard, requiredLevel: PermissionLevel.FULL_ACCESS },
    { href: "/admin/system-health", label: "System Health", icon: "⚙️", group: "SYSTEM ADMINISTRATION", module: ModuleName.dashboard, requiredLevel: PermissionLevel.FULL_ACCESS },
    { href: "/admin/users", label: "User Management", icon: "👥", group: "SYSTEM ADMINISTRATION", module: ModuleName.dashboard, requiredLevel: PermissionLevel.FULL_ACCESS },
    { href: "/admin/settings", label: "System Settings", icon: "⚙️", group: "SYSTEM ADMINISTRATION", module: ModuleName.dashboard, requiredLevel: PermissionLevel.FULL_ACCESS },
    { href: "/admin/audit-logs", label: "Audit Logs", icon: "📜", group: "SYSTEM ADMINISTRATION", module: ModuleName.dashboard, requiredLevel: PermissionLevel.FULL_ACCESS },
    { href: "/admin/database", label: "Database Management", icon: "🗄️", group: "SYSTEM ADMINISTRATION", module: ModuleName.dashboard, requiredLevel: PermissionLevel.FULL_ACCESS },
  ];

  const navItems = navigationItems || defaultNavItems;

  const handleLogout = async () => {
    const result = await signOut({ redirect: false, callbackUrl: "/auth/signin" });
    if (result?.url) {
      router.replace(result.url);
    } else {
      router.replace("/auth/signin");
    }
  };

  return (
    <div className="fixed left-0 top-0 h-full w-72 md:w-[300px] bg-gradient-to-b from-[#003b7a] to-[#028cff] shadow-2xl border-r border-white/10 z-40 flex flex-col">
      {/* Header with Logo & Clock */}
      <SidebarHeader />

      {/* Navigation */}
      <SidebarNav items={navItems} />

      {/* User Info & Logout */}
      <div className="border-t border-white/20 bg-black/10 p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-semibold border border-white/30">
            {session?.user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1">
            <div className="font-medium text-white text-sm">
              {session?.user?.name || "User"}
            </div>
            <div className="text-xs text-white/70">
              {session?.user?.isSystemAdmin ? "SUPER_ADMIN" : (session?.user?.roles?.[0] || "Role")}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full bg-red-500/90 hover:bg-red-600 backdrop-blur-sm text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg border border-red-400/30"
        >
          <span className="text-lg">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
