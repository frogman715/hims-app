"use client";

import Image from "next/image";
import WorldClock from "@/components/WorldClock";

export default function SidebarHeader() {
  return (
    <div className="border-b border-slate-200 px-4 pb-4 pt-5">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <Image
              src="/hanmarinereal.png"
              alt="HANMARINE Logo"
              fill
              priority
              unoptimized
              className="object-contain p-1.5"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold uppercase tracking-[0.18em] text-slate-900">Hanmarine</p>
            <p className="mt-1 text-xs text-slate-500">Integrated Maritime Management System</p>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <WorldClock variant="sidebar" />
        </div>
      </div>
    </div>
  );
}
