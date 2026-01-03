"use client";

import Link from "next/link";
import { usePathname, useSession } from "next/navigation";
import { useSession as useSessionAuth } from "next-auth/react";
import { hasPermission, ModuleName, PermissionLevel } from "@/lib/permissions";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  group?: string;
  module?: ModuleName;
  requiredLevel?: PermissionLevel;
}

interface SidebarNavProps {
  items: NavItem[];
}

export default function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();
  const { data: session } = useSessionAuth();
  
  // Filter items based on user permissions
  const filteredItems = items.filter((item) => {
    // If no module specified, always show
    if (!item.module) return true;
    
    // If session not loaded, show nothing to be safe
    if (!session?.user) return false;
    
    // Check permission
    const userRoles = Array.isArray(session.user.roles) 
      ? session.user.roles 
      : [session.user.roles];
    
    return hasPermission(
      userRoles,
      item.module,
      item.requiredLevel ?? PermissionLevel.VIEW_ACCESS
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
    <nav className="flex-1 overflow-y-auto p-3 space-y-1">
      {/* Dashboard - Always First */}
      <Link
        href="/dashboard"
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 font-semibold border border-transparent shadow-md transition-all duration-200 ${
          pathname === "/dashboard"
            ? "bg-white text-slate-900 hover:border-blue-200"
            : "bg-blue-600 text-white hover:bg-blue-500"
        }`}
      >
        <span className="text-xl text-current">📊</span>
        <span className="text-sm text-current">Dashboard</span>
      </Link>

      <div className="h-px bg-white/10 my-2"></div>

      {/* Grouped Navigation Items */}
      {Object.entries(groupedItems).map(([group, groupItems]) => (
        <div key={group} className="pt-1">
          <div className="px-3 py-1.5 text-xs font-bold text-white/50 uppercase tracking-wider">
            {group}
          </div>
          <div className="space-y-1 pl-1">
            {groupItems.map((item, index) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={index}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200 border border-transparent text-sm font-medium ${
                    isActive
                      ? "bg-white text-slate-900 shadow-md hover:border-blue-200"
                      : "bg-blue-500/20 text-white/90 hover:bg-blue-500/35 hover:text-white"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
