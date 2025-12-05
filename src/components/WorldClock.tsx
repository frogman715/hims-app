'use client';

import { useState, useEffect } from 'react';

interface DigitalClockProps {
  country: string;
  timezone: string;
  flag: string;
}

function DigitalClock({ country, timezone, flag }: DigitalClockProps) {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      setTime(now.toLocaleTimeString('en-US', options));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [timezone]);

  return (
    <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded px-2 py-1 mb-1">
      <div className="flex items-center gap-1.5">
        <span className="text-sm">{flag}</span>
        <div className="text-xs font-medium text-white/90">{country}</div>
      </div>
      <div className="text-xs font-mono font-bold text-white">{time}</div>
    </div>
  );
}

export default function WorldClock() {
  return (
    <div>
      <DigitalClock
        country="ID"
        timezone="Asia/Jakarta"
        flag="🇮🇩"
      />
      <DigitalClock
        country="KR"
        timezone="Asia/Seoul"
        flag="🇰🇷"
      />
    </div>
  );
}