import { TOAST_DURATION } from "@/lib/constants";

export const APP_NOTICE_EVENT = "hims:app-notice";

export type AppNoticeTone = "success" | "error" | "warning" | "info";

export interface AppNoticePayload {
  id?: string;
  tone: AppNoticeTone;
  title?: string;
  message: string;
  durationMs?: number;
}

export function pushAppNotice(payload: AppNoticePayload): void {
  if (typeof window === "undefined") {
    return;
  }

  const detail: Required<Pick<AppNoticePayload, "tone" | "message">> &
    Omit<AppNoticePayload, "tone" | "message"> = {
    id: payload.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    tone: payload.tone,
    title: payload.title,
    message: payload.message,
    durationMs: payload.durationMs ?? TOAST_DURATION,
  };

  window.dispatchEvent(new CustomEvent(APP_NOTICE_EVENT, { detail }));
}
