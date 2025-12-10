"use client";

import { useSession, signOut } from "next-auth/react";
import SidebarHeader from "./SidebarHeader";
import SidebarNav, { type NavItem } from "./SidebarNav";

interface SidebarProps {
  navigationItems?: NavItem[];
}

export default function Sidebar({ navigationItems }: SidebarProps) {
  const { data: session } = useSession();

  const defaultNavItems: NavItem[] = [
    { href: "/crewing", label: "Crewing Department", icon: "⚓" },
    { href: "/contracts", label: "Contracts", icon: "📋" },
    { href: "/crewing/documents", label: "Documents", icon: "📁" },
    { href: "/insurance", label: "Insurance", icon: "⚡" },
    { href: "/crewing/principals", label: "Fleet Management", icon: "🚢" },
    { href: "/accounting", label: "Accounting", icon: "💵" },
  ];

  const navItems = navigationItems || defaultNavItems;

  const handleLogout = () => {
    signOut({ callbackUrl: "/auth/signin" });
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
              {session?.user?.roles?.[0] || "Role"}
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
