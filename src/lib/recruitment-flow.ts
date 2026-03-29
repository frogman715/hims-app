export const RECRUITMENT_STATUSES = [
  "APPLICANT",
  "SCREENING",
  "INTERVIEW",
  "SELECTED",
  "APPROVED",
  "ON_HOLD",
  "WITHDRAWN",
  "REJECTED",
  "HIRED",
] as const;

export type RecruitmentStatus = (typeof RECRUITMENT_STATUSES)[number];

export type RecruitmentAction = "approve" | "reject" | "hire";

export function isRecruitmentStatus(value: unknown): value is RecruitmentStatus {
  return typeof value === "string" && RECRUITMENT_STATUSES.includes(value as RecruitmentStatus);
}

export function getNextRecruitmentStatus(status: RecruitmentStatus): RecruitmentStatus | null {
  switch (status) {
    case "APPLICANT":
      return "SCREENING";
    case "SCREENING":
      return "INTERVIEW";
    case "INTERVIEW":
      return "SELECTED";
    case "SELECTED":
      return "APPROVED";
    default:
      return null;
  }
}

export function getAllowedRecruitmentActions(status: RecruitmentStatus): RecruitmentAction[] {
  switch (status) {
    case "APPLICANT":
    case "SCREENING":
    case "INTERVIEW":
    case "SELECTED":
      return ["approve", "reject"];
    case "APPROVED":
      return ["hire", "reject"];
    case "REJECTED":
    case "ON_HOLD":
    case "WITHDRAWN":
    case "HIRED":
      return [];
    default:
      return [];
  }
}

export function getRecruitmentBadgeTone(status: RecruitmentStatus) {
  switch (status) {
    case "APPLICANT":
      return "bg-slate-100 text-slate-700";
    case "SCREENING":
      return "bg-amber-100 text-amber-700";
    case "INTERVIEW":
      return "bg-violet-100 text-violet-700";
    case "SELECTED":
      return "bg-blue-100 text-blue-700";
    case "APPROVED":
      return "bg-indigo-100 text-indigo-700";
    case "ON_HOLD":
      return "bg-yellow-100 text-yellow-700";
    case "WITHDRAWN":
      return "bg-slate-200 text-slate-700";
    case "REJECTED":
      return "bg-rose-100 text-rose-700";
    case "HIRED":
      return "bg-emerald-100 text-emerald-700";
  }
}

export function getRecruitmentStatusLabel(status: RecruitmentStatus) {
  switch (status) {
    case "APPLICANT":
      return "Applicant";
    case "SCREENING":
      return "Screening";
    case "INTERVIEW":
      return "Interview";
    case "SELECTED":
      return "Selected";
    case "APPROVED":
      return "Approved";
    case "ON_HOLD":
      return "On Hold";
    case "WITHDRAWN":
      return "Withdrawn";
    case "REJECTED":
      return "Rejected";
    case "HIRED":
      return "Hired";
  }
}

export function getRecruitmentActionLabel(status: RecruitmentStatus) {
  switch (status) {
    case "APPLICANT":
      return "Approve to Screening";
    case "SCREENING":
      return "Advance to Interview";
    case "INTERVIEW":
      return "Mark Selected";
    case "SELECTED":
      return "Send for Approval";
    case "APPROVED":
      return "Hire Candidate";
    default:
      return null;
  }
}
