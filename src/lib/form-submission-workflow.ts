import type { Session } from "next-auth";

export const FORM_APPROVAL_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "REJECTED",
] as const;

export type FormApprovalStatusValue = (typeof FORM_APPROVAL_STATUSES)[number];

const FORM_APPROVAL_TRANSITIONS: Record<FormApprovalStatusValue, FormApprovalStatusValue[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["UNDER_REVIEW", "APPROVED", "REJECTED", "CHANGES_REQUESTED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED", "CHANGES_REQUESTED"],
  CHANGES_REQUESTED: ["DRAFT", "SUBMITTED"],
  APPROVED: [],
  REJECTED: [],
};

export function isReviewerSession(session: Session | null): boolean {
  if (!session?.user) {
    return false;
  }

  const roles = [...(session.user.roles ?? []), session.user.role ?? ""];
  return roles.some((role) => role === "OPERATIONAL" || role === "DIRECTOR");
}

export function isValidFormApprovalTransition(
  currentStatus: FormApprovalStatusValue,
  nextStatus: FormApprovalStatusValue
): boolean {
  if (currentStatus === nextStatus) {
    return true;
  }

  return FORM_APPROVAL_TRANSITIONS[currentStatus]?.includes(nextStatus) ?? false;
}
