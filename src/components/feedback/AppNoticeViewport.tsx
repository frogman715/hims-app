"use client";

import { useEffect, useState } from "react";
import { APP_NOTICE_EVENT, type AppNoticePayload } from "@/lib/app-notice";
import { cn } from "@/lib/utils";

type NoticeRecord = Required<Pick<AppNoticePayload, "id" | "tone" | "message" | "durationMs">> &
  Pick<AppNoticePayload, "title">;

const toneClasses: Record<NoticeRecord["tone"], string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-rose-200 bg-rose-50 text-rose-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-sky-200 bg-sky-50 text-sky-900",
};

export function AppNoticeViewport() {
  const [notices, setNotices] = useState<NoticeRecord[]>([]);

  useEffect(() => {
    const dismiss = (id: string) => {
      setNotices((current) => current.filter((notice) => notice.id !== id));
    };

    const handleNotice = (event: Event) => {
      const customEvent = event as CustomEvent<NoticeRecord>;
      const detail = customEvent.detail;
      if (!detail?.id) {
        return;
      }

      setNotices((current) => [...current.filter((notice) => notice.id !== detail.id), detail]);

      window.setTimeout(() => {
        dismiss(detail.id);
      }, detail.durationMs);
    };

    window.addEventListener(APP_NOTICE_EVENT, handleNotice as EventListener);
    return () => {
      window.removeEventListener(APP_NOTICE_EVENT, handleNotice as EventListener);
    };
  }, []);

  if (notices.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-full max-w-sm flex-col gap-3">
      {notices.map((notice) => (
        <div
          key={notice.id}
          className={cn("pointer-events-auto rounded-2xl border px-4 py-3 shadow-lg backdrop-blur", toneClasses[notice.tone])}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              {notice.title ? <p className="text-sm font-semibold">{notice.title}</p> : null}
              <p className={cn("text-sm", notice.title ? "mt-1" : "")}>{notice.message}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setNotices((current) => current.filter((entry) => entry.id !== notice.id));
              }}
              className="rounded-full border border-current px-2 py-0.5 text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
