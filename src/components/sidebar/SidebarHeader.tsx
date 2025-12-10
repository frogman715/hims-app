"use client";

import Image from "next/image";
import WorldClock from "@/components/WorldClock";

export default function SidebarHeader() {
  return (
    <div className="w-full px-2 pt-3 pb-2">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg flex flex-col items-center p-3 mb-1">
        <div className="flex w-full items-center justify-between gap-4">
          <div className="flex basis-[132px] justify-center pr-1">
            <div className="relative h-28 w-full">
              <div className="absolute inset-0 rounded-[24px] border border-white/40 bg-white/15 shadow-[0_18px_42px_rgba(15,23,42,0.25)]" />
              <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[22px]">
                <Image
                  src="/hanmarinereal.png"
                  alt="HANMARINE Logo"
                  fill
                  priority
                  className="object-contain"
                />
              </div>
            </div>
          </div>
          <div className="flex basis-[132px] justify-center pl-1">
            <WorldClock variant="sidebar" />
          </div>
        </div>
      </div>
      <div className="w-full text-center text-sm font-semibold text-[#003b7a] tracking-wide mt-1 mb-1 px-2 whitespace-nowrap">
        Integrated Management System
      </div>
    </div>
  );
}