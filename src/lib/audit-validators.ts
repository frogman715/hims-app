/**
 * Audit Management Validators
 * Type-safe validation for all audit management endpoints
 * Used for payload validation without `any` types
 */

import { ApiError } from "./error-handler";

// ============================================================================
// Request Payload Types & Validators
// ============================================================================

export interface CreateAuditSchedulePayload {
  title: string;
  description: string;
  auditType: "INTERNAL_QMS" | "EXTERNAL_CERTIFICATION" | "SURVEILLANCE" | "SPECIAL";
  frequency: string; // "QUARTERLY", "SEMI-ANNUAL", "ANNUAL", "ON_DEMAND"
  startDate: string; // ISO 8601 date string
  endDate?: string; // ISO 8601 date string
  auditees: string[]; // User IDs
  auditors: string[]; // User IDs
}

export function validateCreateAuditSchedule(payload: unknown): CreateAuditSchedulePayload {
  if (!payload || typeof payload !== "object") {
    throw new ApiError(400, "Invalid request body", "VALIDATION_ERROR");
  }

  const p = payload as Record<string, unknown>;

  // Validate title
  if (typeof p.title !== "string" || p.title.trim().length === 0) {
    throw new ApiError(400, "title is required and must be a non-empty string", "VALIDATION_ERROR");
  }

  // Validate description
  if (typeof p.description !== "string" || p.description.trim().length === 0) {
    throw new ApiError(400, "description is required and must be a non-empty string", "VALIDATION_ERROR");
  }

  // Validate auditType
  const validAuditTypes = ["INTERNAL_QMS", "EXTERNAL_CERTIFICATION", "SURVEILLANCE", "SPECIAL"];
  if (!validAuditTypes.includes(p.auditType as string)) {
    throw new ApiError(400, `auditType must be one of: ${validAuditTypes.join(", ")}`, "VALIDATION_ERROR");
  }

  // Validate frequency
  const validFrequencies = ["QUARTERLY", "SEMI-ANNUAL", "ANNUAL", "ON_DEMAND"];
  if (!validFrequencies.includes(p.frequency as string)) {
    throw new ApiError(400, `frequency must be one of: ${validFrequencies.join(", ")}`, "VALIDATION_ERROR");
  }

  // Validate startDate
  if (typeof p.startDate !== "string") {
    throw new ApiError(400, "startDate is required and must be a date string", "VALIDATION_ERROR");
  }
  const startDate = new Date(p.startDate as string);
  if (Number.isNaN(startDate.getTime())) {
    throw new ApiError(400, "startDate must be a valid ISO 8601 date", "VALIDATION_ERROR");
  }

  // Validate auditees (array of user IDs)
  if (!Array.isArray(p.auditees) || !p.auditees.every((id) => typeof id === "string")) {
    throw new ApiError(400, "auditees must be an array of user IDs", "VALIDATION_ERROR");
  }

  // Validate auditors (array of user IDs)
  if (!Array.isArray(p.auditors) || !p.auditors.every((id) => typeof id === "string")) {
    throw new ApiError(400, "auditors must be an array of user IDs", "VALIDATION_ERROR");
  }

  const result: CreateAuditSchedulePayload = {
    title: p.title as string,
    description: p.description as string,
    auditType: p.auditType as CreateAuditSchedulePayload["auditType"],
    frequency: p.frequency as string,
    startDate: p.startDate as string,
    auditees: p.auditees as string[],
    auditors: p.auditors as string[],
  };

  // Optional: endDate
  if (p.endDate !== undefined) {
    if (typeof p.endDate !== "string") {
      throw new ApiError(400, "endDate must be a date string if provided", "VALIDATION_ERROR");
    }
    const endDate = new Date(p.endDate as string);
    if (Number.isNaN(endDate.getTime())) {
      throw new ApiError(400, "endDate must be a valid ISO 8601 date", "VALIDATION_ERROR");
    }
    result.endDate = p.endDate as string;
  }

  return result;
}

export interface UpdateAuditSchedulePayload {
  status?: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  endDate?: string; // ISO 8601 date string
}

export function validateUpdateAuditSchedule(payload: unknown): UpdateAuditSchedulePayload {
  if (!payload || typeof payload !== "object") {
    throw new ApiError(400, "Invalid request body", "VALIDATION_ERROR");
  }

  const p = payload as Record<string, unknown>;
  const result: UpdateAuditSchedulePayload = {};

  // Validate optional status
  if (p.status !== undefined) {
    const validStatuses = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
    if (!validStatuses.includes(p.status as string)) {
      throw new ApiError(400, `status must be one of: ${validStatuses.join(", ")}`, "VALIDATION_ERROR");
    }
    result.status = p.status as UpdateAuditSchedulePayload["status"];
  }

  // Validate optional endDate
  if (p.endDate !== undefined) {
    if (typeof p.endDate !== "string") {
      throw new ApiError(400, "endDate must be a date string if provided", "VALIDATION_ERROR");
    }
    const endDate = new Date(p.endDate as string);
    if (Number.isNaN(endDate.getTime())) {
      throw new ApiError(400, "endDate must be a valid ISO 8601 date", "VALIDATION_ERROR");
    }
    result.endDate = p.endDate as string;
  }

  return result;
}

export interface CreateAuditFindingPayload {
  clause: string; // ISO 9001 or MLC reference, e.g., "6.1"
  description: string;
  severity: "OBSERVATION" | "MINOR_NC" | "MAJOR_NC";
  evidence: string[]; // Array of strings (notes)
}

export function validateCreateAuditFinding(payload: unknown): CreateAuditFindingPayload {
  if (!payload || typeof payload !== "object") {
    throw new ApiError(400, "Invalid request body", "VALIDATION_ERROR");
  }

  const p = payload as Record<string, unknown>;

  // Validate clause
  if (typeof p.clause !== "string" || p.clause.trim().length === 0) {
    throw new ApiError(400, "clause is required and must be a non-empty string", "VALIDATION_ERROR");
  }

  // Validate description
  if (typeof p.description !== "string" || p.description.trim().length === 0) {
    throw new ApiError(400, "description is required and must be a non-empty string", "VALIDATION_ERROR");
  }

  // Validate severity
  const validSeverities = ["OBSERVATION", "MINOR_NC", "MAJOR_NC"];
  if (!validSeverities.includes(p.severity as string)) {
    throw new ApiError(400, `severity must be one of: ${validSeverities.join(", ")}`, "VALIDATION_ERROR");
  }

  // Validate evidence (array of strings)
  if (!Array.isArray(p.evidence) || !p.evidence.every((e) => typeof e === "string")) {
    throw new ApiError(400, "evidence must be an array of strings", "VALIDATION_ERROR");
  }

  return {
    clause: p.clause as string,
    description: p.description as string,
    severity: p.severity as CreateAuditFindingPayload["severity"],
    evidence: p.evidence as string[],
  };
}

export interface CreateAuditReportPayload {
  summary: string;
  recommendations: string;
  findings: {
    total: number;
    observations: number;
    minorNC: number;
    majorNC: number;
  };
}

export function validateCreateAuditReport(payload: unknown): CreateAuditReportPayload {
  if (!payload || typeof payload !== "object") {
    throw new ApiError(400, "Invalid request body", "VALIDATION_ERROR");
  }

  const p = payload as Record<string, unknown>;

  // Validate summary
  if (typeof p.summary !== "string" || p.summary.trim().length === 0) {
    throw new ApiError(400, "summary is required and must be a non-empty string", "VALIDATION_ERROR");
  }

  // Validate recommendations
  if (typeof p.recommendations !== "string" || p.recommendations.trim().length === 0) {
    throw new ApiError(400, "recommendations is required and must be a non-empty string", "VALIDATION_ERROR");
  }

  // Validate findings object
  if (!p.findings || typeof p.findings !== "object") {
    throw new ApiError(400, "findings is required and must be an object", "VALIDATION_ERROR");
  }

  const findings = p.findings as Record<string, unknown>;
  const requiredFields = ["total", "observations", "minorNC", "majorNC"];
  for (const field of requiredFields) {
    if (typeof findings[field] !== "number" || findings[field] < 0) {
      throw new ApiError(400, `findings.${field} must be a non-negative number`, "VALIDATION_ERROR");
    }
  }

  return {
    summary: p.summary as string,
    recommendations: p.recommendations as string,
    findings: {
      total: findings.total as number,
      observations: findings.observations as number,
      minorNC: findings.minorNC as number,
      majorNC: findings.majorNC as number,
    },
  };
}
