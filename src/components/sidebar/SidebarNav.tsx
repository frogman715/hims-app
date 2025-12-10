"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface SidebarNavProps {
  items: NavItem[];
}

export default function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto p-4">
      <div className="space-y-2 pb-4">
        {/* Dashboard - Always First */}
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 rounded-xl px-4 py-3.5 font-semibold border border-transparent shadow-md transition-colors duration-200 ${
            pathname === "/dashboard"
              ? "bg-white text-slate-900 hover:border-blue-200"
              : "bg-blue-600 text-white hover:bg-blue-500"
          }`}
        >
          <span className="text-2xl text-current">📊</span>
          <span className="text-base text-current">Dashboard</span>
        </Link>

        {/* Other Nav Items */}
        {items.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={index}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3.5 transition-colors duration-200 border border-transparent ${
                isActive
                  ? "bg-white text-slate-900 font-semibold shadow-md hover:border-blue-200"
                  : "bg-blue-500/20 text-white hover:bg-blue-500/35"
              }`}
            >
              <span className="text-2xl text-current">{item.icon}</span>
              <span className="text-base text-current">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
