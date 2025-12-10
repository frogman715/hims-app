"use client";

import { useEffect, useState } from "react";

interface TimeZoneData {
  flag: string;
  timezone: string;
}

interface WorldClockProps {
  variant?: "default" | "sidebar";
}

const timeZones: TimeZoneData[] = [
  { flag: "🇮🇩", timezone: "Asia/Jakarta" },
  { flag: "🇰🇷", timezone: "Asia/Seoul" },
];

export default function WorldClock({ variant = "default" }: WorldClockProps) {
  const [times, setTimes] = useState<Record<string, string>>({});

  useEffect(() => {
    const updateTimes = () => {
      const newTimes: Record<string, string> = {};

      timeZones.forEach(({ timezone }) => {
        const time = new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date());

        newTimes[timezone] = time;
      });

      setTimes(newTimes);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);

    return () => clearInterval(interval);
  }, []);

  const containerClasses =
    variant === "sidebar"
      ? "flex w-full max-w-[130px] flex-col gap-2 text-slate-900"
      : "space-y-1 text-xs";

  const rowClasses =
    variant === "sidebar"
      ? "flex items-center justify-between rounded-2xl border border-white/45 bg-white/88 px-3.5 py-2 backdrop-blur-sm shadow-[0_12px_24px_rgba(15,23,42,0.2)]"
      : "flex items-center justify-between rounded-lg border border-slate-200/80 bg-white/70 px-2 py-1";

  const timeClasses =
    variant === "sidebar"
      ? "font-semibold tabular-nums tracking-[0.18em] text-[0.98rem] text-slate-900"
      : "font-semibold tabular-nums text-slate-900";

  const flagClasses =
    variant === "sidebar"
      ? "text-lg"
      : "text-base";

  const getTimeFor = (timezone: string) => times[timezone] ?? "--:--:--";

  return (
    <div className={containerClasses}>
      {timeZones.map(({ flag, timezone }) => (
        <div key={timezone} className={rowClasses}>
          <span className={`${flagClasses} mr-2`}>{flag}</span>
          <span className={timeClasses}>{getTimeFor(timezone)}</span>
        </div>
      ))}
    </div>
  );
}