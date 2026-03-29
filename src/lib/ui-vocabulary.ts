type StatusTone = "neutral" | "info" | "progress" | "warning" | "success" | "danger";

const STATUS_TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "border-slate-200 bg-slate-100 text-slate-700",
  info: "border-sky-200 bg-sky-100 text-sky-800",
  progress: "border-indigo-200 bg-indigo-100 text-indigo-800",
  warning: "border-amber-200 bg-amber-100 text-amber-800",
  success: "border-emerald-200 bg-emerald-100 text-emerald-800",
  danger: "border-rose-200 bg-rose-100 text-rose-800",
};

const STATUS_META: Record<string, { label: string; tone: StatusTone }> = {
  ACTIVE: { label: "Active", tone: "success" },
  ASSIGNED: { label: "Assigned", tone: "progress" },
  APPROVED: { label: "Approved", tone: "success" },
  AVAILABLE: { label: "Available", tone: "info" },
  BLOCKED: { label: "Blocked", tone: "warning" },
  CANCELLED: { label: "Cancelled", tone: "danger" },
  CLOSED: { label: "Closed", tone: "neutral" },
  COMPLIANT: { label: "Compliant", tone: "success" },
  COMPLETED: { label: "Completed", tone: "success" },
  CRITICAL: { label: "Critical", tone: "danger" },
  DECLINED: { label: "Declined", tone: "danger" },
  DISPATCHED: { label: "Dispatched", tone: "progress" },
  DRAFT: { label: "Draft", tone: "info" },
  ESCALATED: { label: "Escalated", tone: "danger" },
  EXPIRED: { label: "Expired", tone: "danger" },
  EXPIRING_SOON: { label: "Expiring Soon", tone: "warning" },
  FAILED: { label: "Closed Without Hire", tone: "danger" },
  FOR_APPROVAL: { label: "Awaiting Approval", tone: "warning" },
  FOLLOW_UP: { label: "Follow Up", tone: "warning" },
  HIGH: { label: "High", tone: "warning" },
  IN_PROGRESS: { label: "In Progress", tone: "progress" },
  INACTIVE: { label: "Inactive", tone: "neutral" },
  LATE: { label: "Late", tone: "warning" },
  LOW: { label: "Low", tone: "success" },
  MEDIUM: { label: "Medium", tone: "info" },
  MISSING: { label: "Missing", tone: "danger" },
  NON_COMPLIANT: { label: "Non-Compliant", tone: "danger" },
  NOT_REQUIRED: { label: "Not Required", tone: "neutral" },
  OBSOLETE: { label: "Obsolete", tone: "danger" },
  OFF_SIGNED: { label: "Off Signed", tone: "neutral" },
  ONBOARD: { label: "Onboard", tone: "success" },
  OPEN: { label: "Open", tone: "info" },
  PAID: { label: "Paid", tone: "success" },
  PENDING: { label: "Pending Review", tone: "warning" },
  PENDING_REVIEW: { label: "Pending Review", tone: "warning" },
  PLANNED: { label: "Planned", tone: "info" },
  PRESENT: { label: "Present", tone: "success" },
  READY: { label: "Ready", tone: "success" },
  REJECTED: { label: "Declined", tone: "danger" },
  REVIEWING: { label: "Under Review", tone: "progress" },
  STANDBY: { label: "Standby", tone: "info" },
  SUBMITTED: { label: "Submitted", tone: "progress" },
  TODO: { label: "Open Task", tone: "danger" },
  URGENT: { label: "Urgent", tone: "danger" },
  UNDER_APPEAL: { label: "Under Appeal", tone: "warning" },
  UNDER_REVIEW: { label: "Under Review", tone: "progress" },
  VALID: { label: "Valid", tone: "success" },
  VERIFIED: { label: "Verified", tone: "success" },
};

function humanizeStatus(raw: string) {
  return raw
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function getStatusPresentation(status: string | null | undefined) {
  const normalized = (status ?? "").trim();
  if (!normalized) {
    return {
      label: "No Status",
      tone: "neutral" as const,
      className: STATUS_TONE_CLASSES.neutral,
    };
  }

  const key = normalized.toUpperCase().replace(/\s+/g, "_");
  const meta = STATUS_META[key];
  const tone = meta?.tone ?? "neutral";

  return {
    label: meta?.label ?? humanizeStatus(key),
    tone,
    className: STATUS_TONE_CLASSES[tone],
  };
}

export function createRequiredFieldMessage(fieldLabel: string) {
  return `${fieldLabel} is required before saving.`;
}

export function createSelectionRequiredMessage(fieldLabel: string) {
  return `Select ${fieldLabel} before continuing this workflow.`;
}

export function createEmptyStateMessage(subject: string, context?: string) {
  return context ? `No ${subject} are available in ${context} yet.` : `No ${subject} are available yet.`;
}
