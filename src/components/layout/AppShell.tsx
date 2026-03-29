"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { getRoleDisplayName } from "@/lib/role-display";
import { OFFICE_NAV_ITEMS } from "@/lib/office-navigation";
import SidebarHeader from "@/components/sidebar/SidebarHeader";
import SidebarNav from "@/components/sidebar/SidebarNav";
import { Breadcrumb } from "@/components/Breadcrumb";

const SHELL_EXCLUDED_PREFIXES = ["/auth", "/m", "/api"];
const SHELL_EXCLUDED_ROUTES = ["/"];

const SECTION_COPY: Record<string, string> = {
  dashboard: "Enterprise overview for crewing, compliance, documents, and finance operations.",
  crewing: "Crew operations, readiness, assignments, and seafarer records.",
  accounting: "Finance, payroll support, billing follow-up, and office expense control.",
  compliance: "Regulatory oversight, welfare monitoring, readiness risk, and escalation control.",
  quality: "Audit, QMS, CAPA, and controlled improvement workflows.",
  hr: "HR administration, personnel records, attendance, and recruitment oversight.",
  admin: "System administration, user control, and platform monitoring.",
  contracts: "Employment agreement tracking and contract review workflows.",
  documents: "Controlled documents, approvals, and office distribution records.",
  insurance: "Employee and seafarer insurance administration.",
  "agency-fees": "Agency billing and fee follow-up.",
};

function shouldRenderShell(pathname: string) {
  if (SHELL_EXCLUDED_ROUTES.includes(pathname)) {
    return false;
  }

  return !SHELL_EXCLUDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`) || pathname.startsWith("/m/")
  );
}

function getSectionLabel(pathname: string) {
  const segment = pathname.split("/").filter(Boolean)[0] ?? "dashboard";
  const label = segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return {
    title: label === "Dashboard" ? "Operations Workspace" : label,
    description: SECTION_COPY[segment] ?? "Structured workspace for day-to-day office operations.",
  };
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!shouldRenderShell(pathname)) {
    return <>{children}</>;
  }

  const { title, description } = getSectionLabel(pathname);
  const userName = session?.user?.name?.trim() || "Office User";
  const primaryRole =
    getRoleDisplayName(session?.user?.roles?.[0] || session?.user?.role || "", session?.user?.isSystemAdmin) ||
    "Office Access";

  const handleLogout = async () => {
    const result = await signOut({ redirect: false, callbackUrl: "/auth/signin" });
    window.location.href = result?.url || "/auth/signin";
  };

  return (
    <div className="office-shell">
      <aside className={`office-sidebar ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <SidebarHeader />
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <SidebarNav items={OFFICE_NAV_ITEMS} onNavigate={() => setIsSidebarOpen(false)} />
        </div>
        <div className="border-t border-slate-200 bg-slate-50/90 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{userName}</p>
              <p className="truncate text-xs text-slate-500">{primaryRole}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {isSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setIsSidebarOpen(false)}
        />
      ) : null}

      <div className="office-main">
        <header className="office-topbar">
          <div className="flex items-start gap-4">
            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden"
              aria-label={isSidebarOpen ? "Close navigation" : "Open navigation"}
              onClick={() => setIsSidebarOpen((open) => !open)}
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="min-w-0 flex-1">
              <Breadcrumb />
              <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Hanmarine Internal System</p>
                  <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 md:text-[2rem]">{title}</h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 md:text-[0.95rem]">{description}</p>
                </div>
                <div className="hidden items-center gap-3 lg:flex">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Workspace</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{primaryRole}</p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700"
                  >
                    Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="office-content">
          <div className="page-shell">{children}</div>
        </main>
      </div>
    </div>
  );
}
