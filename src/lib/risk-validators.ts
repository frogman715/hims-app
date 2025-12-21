/**
 * Risk Management Validators
 * Type-safe validation for all risk management endpoints
 * Used for payload validation without `any` types
 */

import { ApiError } from "./error-handler";

// ============================================================================
// Request Payload Types & Validators
// ============================================================================

export interface CreateRiskPayload {
  title: string;
  description: string;
  source: "REGULATORY" | "OPERATIONAL" | "STRATEGIC" | "FINANCIAL" | "ENVIRONMENTAL";
  probability: number; // 1-5
  impact: number; // 1-5
  treatmentStrategy: "MITIGATE" | "ACCEPT" | "TRANSFER" | "AVOID";
  treatmentPlan: string;
}

export function validateCreateRisk(payload: unknown): CreateRiskPayload {
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

  // Validate source
  const validSources = ["REGULATORY", "OPERATIONAL", "STRATEGIC", "FINANCIAL", "ENVIRONMENTAL"];
  if (!validSources.includes(p.source as string)) {
    throw new ApiError(400, `source must be one of: ${validSources.join(", ")}`, "VALIDATION_ERROR");
  }

  // Validate probability (1-5)
  if (typeof p.probability !== "number" || p.probability < 1 || p.probability > 5 || !Number.isInteger(p.probability)) {
    throw new ApiError(400, "probability must be an integer between 1 and 5", "VALIDATION_ERROR");
  }

  // Validate impact (1-5)
  if (typeof p.impact !== "number" || p.impact < 1 || p.impact > 5 || !Number.isInteger(p.impact)) {
    throw new ApiError(400, "impact must be an integer between 1 and 5", "VALIDATION_ERROR");
  }

  // Validate treatmentStrategy
  const validStrategies = ["MITIGATE", "ACCEPT", "TRANSFER", "AVOID"];
  if (!validStrategies.includes(p.treatmentStrategy as string)) {
    throw new ApiError(400, `treatmentStrategy must be one of: ${validStrategies.join(", ")}`, "VALIDATION_ERROR");
  }

  // Validate treatmentPlan
  if (typeof p.treatmentPlan !== "string" || p.treatmentPlan.trim().length === 0) {
    throw new ApiError(400, "treatmentPlan is required and must be a non-empty string", "VALIDATION_ERROR");
  }

  return {
    title: p.title as string,
    description: p.description as string,
    source: p.source as CreateRiskPayload["source"],
    probability: p.probability as number,
    impact: p.impact as number,
    treatmentStrategy: p.treatmentStrategy as CreateRiskPayload["treatmentStrategy"],
    treatmentPlan: p.treatmentPlan as string,
  };
}

export interface UpdateRiskPayload {
  title?: string;
  description?: string;
  probability?: number;
  impact?: number;
  treatmentStrategy?: "MITIGATE" | "ACCEPT" | "TRANSFER" | "AVOID";
  treatmentPlan?: string;
  status?: "ACTIVE" | "MITIGATED" | "TRANSFERRED" | "ACCEPTED" | "CLOSED";
}

export function validateUpdateRisk(payload: unknown): UpdateRiskPayload {
  if (!payload || typeof payload !== "object") {
    throw new ApiError(400, "Invalid request body", "VALIDATION_ERROR");
  }

  const p = payload as Record<string, unknown>;
  const result: UpdateRiskPayload = {};

  // Validate optional fields
  if (p.title !== undefined) {
    if (typeof p.title !== "string" || p.title.trim().length === 0) {
      throw new ApiError(400, "title must be a non-empty string if provided", "VALIDATION_ERROR");
    }
    result.title = p.title;
  }

  if (p.description !== undefined) {
    if (typeof p.description !== "string" || p.description.trim().length === 0) {
      throw new ApiError(400, "description must be a non-empty string if provided", "VALIDATION_ERROR");
    }
    result.description = p.description;
  }

  if (p.probability !== undefined) {
    if (typeof p.probability !== "number" || p.probability < 1 || p.probability > 5) {
      throw new ApiError(400, "probability must be between 1 and 5 if provided", "VALIDATION_ERROR");
    }
    result.probability = p.probability;
  }

  if (p.impact !== undefined) {
    if (typeof p.impact !== "number" || p.impact < 1 || p.impact > 5) {
      throw new ApiError(400, "impact must be between 1 and 5 if provided", "VALIDATION_ERROR");
    }
    result.impact = p.impact;
  }

  if (p.treatmentStrategy !== undefined) {
    const validStrategies = ["MITIGATE", "ACCEPT", "TRANSFER", "AVOID"];
    if (!validStrategies.includes(p.treatmentStrategy as string)) {
      throw new ApiError(400, `treatmentStrategy must be one of: ${validStrategies.join(", ")}`, "VALIDATION_ERROR");
    }
    result.treatmentStrategy = p.treatmentStrategy as UpdateRiskPayload["treatmentStrategy"];
  }

  if (p.treatmentPlan !== undefined) {
    if (typeof p.treatmentPlan !== "string" || p.treatmentPlan.trim().length === 0) {
      throw new ApiError(400, "treatmentPlan must be a non-empty string if provided", "VALIDATION_ERROR");
    }
    result.treatmentPlan = p.treatmentPlan;
  }

  if (p.status !== undefined) {
    const validStatuses = ["ACTIVE", "MITIGATED", "TRANSFERRED", "ACCEPTED", "CLOSED"];
    if (!validStatuses.includes(p.status as string)) {
      throw new ApiError(400, `status must be one of: ${validStatuses.join(", ")}`, "VALIDATION_ERROR");
    }
    result.status = p.status as UpdateRiskPayload["status"];
  }

  return result;
}

export interface CreateRiskActionPayload {
  description: string;
  dueDate: string; // ISO 8601 date string
}

export function validateCreateRiskAction(payload: unknown): CreateRiskActionPayload {
  if (!payload || typeof payload !== "object") {
    throw new ApiError(400, "Invalid request body", "VALIDATION_ERROR");
  }

  const p = payload as Record<string, unknown>;

  if (typeof p.description !== "string" || p.description.trim().length === 0) {
    throw new ApiError(400, "description is required and must be a non-empty string", "VALIDATION_ERROR");
  }

  if (typeof p.dueDate !== "string") {
    throw new ApiError(400, "dueDate is required and must be a date string", "VALIDATION_ERROR");
  }

  const date = new Date(p.dueDate as string);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, "dueDate must be a valid ISO 8601 date", "VALIDATION_ERROR");
  }

  return {
    description: p.description as string,
    dueDate: p.dueDate as string,
  };
}

export interface CreateRiskReviewPayload {
  newProbability?: number; // 1-5
  newImpact?: number; // 1-5
  effectiveness: number; // 1-5
  notes: string;
}

export function validateCreateRiskReview(payload: unknown): CreateRiskReviewPayload {
  if (!payload || typeof payload !== "object") {
    throw new ApiError(400, "Invalid request body", "VALIDATION_ERROR");
  }

  const p = payload as Record<string, unknown>;

  // Validate effectiveness
  if (typeof p.effectiveness !== "number" || p.effectiveness < 1 || p.effectiveness > 5 || !Number.isInteger(p.effectiveness)) {
    throw new ApiError(400, "effectiveness must be an integer between 1 and 5", "VALIDATION_ERROR");
  }

  // Validate notes
  if (typeof p.notes !== "string" || p.notes.trim().length === 0) {
    throw new ApiError(400, "notes is required and must be a non-empty string", "VALIDATION_ERROR");
  }

  const result: CreateRiskReviewPayload = {
    effectiveness: p.effectiveness as number,
    notes: p.notes as string,
  };

  // Optional: newProbability
  if (p.newProbability !== undefined) {
    if (typeof p.newProbability !== "number" || p.newProbability < 1 || p.newProbability > 5) {
      throw new ApiError(400, "newProbability must be between 1 and 5 if provided", "VALIDATION_ERROR");
    }
    result.newProbability = p.newProbability as number;
  }

  // Optional: newImpact
  if (p.newImpact !== undefined) {
    if (typeof p.newImpact !== "number" || p.newImpact < 1 || p.newImpact > 5) {
      throw new ApiError(400, "newImpact must be between 1 and 5 if provided", "VALIDATION_ERROR");
    }
    result.newImpact = p.newImpact as number;
  }

  return result;
}
