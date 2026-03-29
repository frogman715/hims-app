import type { HgiBusinessRole } from "@/lib/hgi-rbac";

export type HgiCandidateFlowStage =
  | "DRAFT"
  | "DOCUMENT_CHECK"
  | "CV_READY"
  | "SUBMITTED_TO_DIRECTOR"
  | "DIRECTOR_APPROVED"
  | "SENT_TO_OWNER"
  | "OWNER_APPROVED"
  | "OWNER_REJECTED"
  | "PRE_JOINING";

export interface HgiCandidateFlowMapping {
  stage: HgiCandidateFlowStage;
  ownerRole: HgiBusinessRole;
  legacyStatuses: readonly string[];
  pages: readonly string[];
  apiRoutes: readonly string[];
  notes: string;
}

export const HGI_CANDIDATE_FLOW: readonly HgiCandidateFlowMapping[] = [
  {
    stage: "DRAFT",
    ownerRole: "DOCUMENT",
    legacyStatuses: [],
    pages: ["/hr/recruitment/new", "/hr/recruitment"],
    apiRoutes: ["/api/recruitments"],
    notes: "Candidate exists before crewing application status starts. This remains outside the application enum.",
  },
  {
    stage: "DOCUMENT_CHECK",
    ownerRole: "DOCUMENT",
    legacyStatuses: ["REVIEWING"],
    pages: ["/crewing/seafarers", "/crewing/seafarers/[id]/documents", "/crewing/documents"],
    apiRoutes: ["/api/documents", "/api/seafarers/[id]/documents", "/api/applications/[id]"],
    notes: "Current application flow mixes screening with document readiness. REVIEWING is the nearest live status.",
  },
  {
    stage: "CV_READY",
    ownerRole: "DOCUMENT",
    legacyStatuses: [],
    pages: ["/crewing/seafarers/[id]/biodata"],
    apiRoutes: ["/api/crewing/seafarers/[id]/cv"],
    notes: "CV readiness exists operationally but is not persisted as a dedicated application status yet.",
  },
  {
    stage: "SUBMITTED_TO_DIRECTOR",
    ownerRole: "DOCUMENT",
    legacyStatuses: ["RECEIVED"],
    pages: ["/crewing/applications", "/crewing/applications/[id]"],
    apiRoutes: ["/api/applications", "/api/applications/[id]"],
    notes: "RECEIVED is the current persisted handoff point from document handling into director review.",
  },
  {
    stage: "DIRECTOR_APPROVED",
    ownerRole: "DIRECTOR",
    legacyStatuses: ["PASSED"],
    pages: ["/crewing/applications/[id]"],
    apiRoutes: ["/api/crewing/applications/[id]/transition"],
    notes: "The current system still carries REVIEWING and INTERVIEW before PASSED. PASSED is the closest live approval milestone.",
  },
  {
    stage: "SENT_TO_OWNER",
    ownerRole: "DIRECTOR",
    legacyStatuses: ["OFFERED"],
    pages: ["/crewing/applications", "/crewing/applications/[id]"],
    apiRoutes: ["/api/crewing/applications/[id]/transition"],
    notes: "OFFERED is currently used as owner/principal review pending.",
  },
  {
    stage: "OWNER_APPROVED",
    ownerRole: "PRINCIPAL",
    legacyStatuses: ["ACCEPTED"],
    pages: ["/crewing/applications/[id]", "/crewing/prepare-joining"],
    apiRoutes: ["/api/crewing/applications/[id]/transition", "/api/prepare-joining"],
    notes: "ACCEPTED currently triggers prepare joining creation and is the effective owner-approved handoff.",
  },
  {
    stage: "OWNER_REJECTED",
    ownerRole: "PRINCIPAL",
    legacyStatuses: ["REJECTED"],
    pages: ["/crewing/applications/[id]"],
    apiRoutes: ["/api/crewing/applications/[id]/transition"],
    notes: "Owner rejection is not yet separated from general rejection in the persisted status model.",
  },
  {
    stage: "PRE_JOINING",
    ownerRole: "OPERATIONAL",
    legacyStatuses: ["PENDING", "DOCUMENTS", "MEDICAL", "TRAINING", "TRAVEL", "READY", "DISPATCHED"],
    pages: ["/crewing/prepare-joining"],
    apiRoutes: ["/api/prepare-joining", "/api/prepare-joining/[id]"],
    notes: "Operational work begins only after the accepted/owner-approved transition creates the prepare joining record.",
  },
] as const;

export const HGI_CANDIDATE_FLOW_GAPS = [
  {
    area: "status-overlap",
    detail: "Application enum still mixes internal screening/interview statuses with director and owner approval milestones.",
  },
  {
    area: "missing-principal-role-model",
    detail: "PRINCIPAL flow ownership exists in business terms, but there is no first-class principal user/session scope yet.",
  },
  {
    area: "duplicate-entry-points",
    detail: "Candidate intake spans HR recruitment, seafarer master data, and crewing applications, so the business flow is split across multiple route families.",
  },
  {
    area: "cv-readiness-not-persisted",
    detail: "CV preparation is operationally present but not represented as a dedicated persisted workflow status.",
  },
] as const;
