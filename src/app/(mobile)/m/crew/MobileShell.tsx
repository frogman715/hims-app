"use client";

import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

type MobileTabKey = "home" | "documents" | "upload" | "profile";

type MobileShellProps = {
  title: string;
  subtitle?: string;
  activeTab: MobileTabKey;
  children: ReactNode;
};

type IconProps = { className?: string };

const iconBase = "h-5 w-5";

const HomeIcon: ComponentType<IconProps> = ({ className }) => (
  <svg
    className={`${iconBase} ${className ?? ""}`.trim()}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 9.5 12 3l9 6.5" />
    <path d="M4.5 10.5V21h15V10.5" />
    <path d="M9 21v-6h6v6" />
  </svg>
);

const DocumentIcon: ComponentType<IconProps> = ({ className }) => (
  <svg
    className={`${iconBase} ${className ?? ""}`.trim()}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M7 3h7l5 5v13H7V3z" />
    <path d="M14 3v4h4" />
    <path d="M9 13h6" />
    <path d="M9 17h6" />
  </svg>
);

const UploadIcon: ComponentType<IconProps> = ({ className }) => (
  <svg
    className={`${iconBase} ${className ?? ""}`.trim()}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 16V4" />
    <path d="M8.5 7.5 12 4l3.5 3.5" />
    <path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16" />
  </svg>
);

const ProfileIcon: ComponentType<IconProps> = ({ className }) => (
  <svg
    className={`${iconBase} ${className ?? ""}`.trim()}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5z" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);

const NAV_ITEMS: Array<{ key: MobileTabKey; href: string; label: string; icon: ComponentType<IconProps> }> = [
  { key: "home", href: "/m/crew", label: "Home", icon: HomeIcon },
  { key: "documents", href: "/m/crew/documents", label: "Documents", icon: DocumentIcon },
  { key: "upload", href: "/m/crew/upload", label: "Upload", icon: UploadIcon },
  { key: "profile", href: "/m/crew/profile", label: "Profile", icon: ProfileIcon },
];

export default function MobileShell({ title, subtitle, activeTab, children }: MobileShellProps) {
  return (
    <main className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <header
        className="mx-auto w-full max-w-md px-6 pb-4 pt-6"
        style={{ paddingTop: "calc(1.5rem + env(safe-area-inset-top, 0px))" }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300/70">Crew Portal</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-50">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm leading-snug text-slate-400">{subtitle}</p> : null}
      </header>

      <section
        className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-y-auto px-6"
        style={{ paddingBottom: "calc(7rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="space-y-6 pb-10">{children}</div>
      </section>

      <nav
        className="mt-auto w-full border-t border-slate-800/60 bg-slate-950/95 backdrop-blur-sm sticky bottom-0 z-50"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <ul className="mx-auto flex w-full max-w-md items-center justify-between px-6 pt-3">
          {NAV_ITEMS.map((item) => {
            const isActive = item.key === activeTab;
            const Icon = item.icon;

            return (
              <li key={item.key} className="flex-1">
                <Link
                  href={item.href}
                  className={`group relative flex flex-col items-center gap-2 rounded-2xl px-3 py-2 text-[11px] font-semibold transition`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {isActive ? (
                    <span className="pointer-events-none absolute inset-0 rounded-2xl bg-emerald-500/10 blur" aria-hidden="true" />
                  ) : null}
                  <span
                    className={`relative z-10 flex h-10 w-12 items-center justify-center rounded-xl text-sm transition ${
                      isActive
                        ? "bg-emerald-500/20 text-emerald-200"
                        : "text-slate-400 hover:text-emerald-100"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span
                    className={`relative z-10 text-xs ${
                      isActive ? "text-emerald-100" : "text-slate-400 group-hover:text-emerald-100"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </main>
  );
}
