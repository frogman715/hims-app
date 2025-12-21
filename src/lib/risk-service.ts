/**
 * Risk Management Service
 * Business logic for risk operations
 * Handles calculations, transitions, and audit logging
 */

import { prisma } from "./prisma";
import { Prisma, type $Enums } from "@prisma/client";
import { ApiError } from "./error-handler";

/**
 * Calculate risk score from probability and impact
 * Formula: probability × impact
 * Range: 1-25
 */
export function calculateRiskScore(probability: number, impact: number): number {
  return probability * impact;
}

/**
 * Create a new risk with audit log entry
 */
export async function createRisk(
  data: {
    title: string;
    description: string;
    source: string;
    probability: number;
    impact: number;
    treatmentStrategy: string;
    treatmentPlan: string;
    createdById: string;
  },
  trx?: Prisma.TransactionClient
) {
  const client = trx || prisma;

  const riskScore = calculateRiskScore(data.probability, data.impact);

  const risk = await client.risk.create({
    data: {
      title: data.title,
      description: data.description,
      source: data.source as $Enums.RiskSource,
      probability: data.probability,
      impact: data.impact,
      riskScore,
      treatmentStrategy: data.treatmentStrategy as $Enums.RiskTreatmentStrategy,
      treatmentPlan: data.treatmentPlan,
      createdById: data.createdById,
      status: "ACTIVE",
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      auditLog: true,
      actions: true,
      reviews: true,
    },
  });

  // Create audit log entry
  await client.riskAuditLog.create({
    data: {
      riskId: risk.id,
      action: "CREATED",
      changedFields: {
        title: data.title,
        source: data.source,
        probability: data.probability,
        impact: data.impact,
        riskScore: riskScore,
        treatmentStrategy: data.treatmentStrategy,
      } as Prisma.InputJsonValue,
      changedById: data.createdById,
    },
  });

  return risk;
}

/**
 * Update risk and create audit log entry
 */
export async function updateRisk(
  riskId: string,
  data: {
    title?: string;
    description?: string;
    probability?: number;
    impact?: number;
    treatmentStrategy?: string;
    treatmentPlan?: string;
    status?: string;
  },
  userId: string,
  trx?: Prisma.TransactionClient
) {
  const client = trx || prisma;

  // Fetch current risk
  const currentRisk = await client.risk.findUnique({
    where: { id: riskId },
  });

  if (!currentRisk) {
    throw new ApiError(404, "Risk not found", "NOT_FOUND");
  }

  // Prepare update data
  const updateData: Prisma.RiskUpdateInput = {};
  const changedFields: Record<string, unknown> = {};

  if (data.title !== undefined) {
    updateData.title = data.title;
    changedFields.title = data.title;
  }
  if (data.description !== undefined) {
    updateData.description = data.description;
    changedFields.description = data.description;
  }
  if (data.probability !== undefined) {
    updateData.probability = data.probability;
    changedFields.probability = data.probability;
  }
  if (data.impact !== undefined) {
    updateData.impact = data.impact;
    changedFields.impact = data.impact;
  }
  if (data.treatmentStrategy !== undefined) {
    updateData.treatmentStrategy = data.treatmentStrategy as $Enums.RiskTreatmentStrategy;
    changedFields.treatmentStrategy = data.treatmentStrategy;
  }
  if (data.treatmentPlan !== undefined) {
    updateData.treatmentPlan = data.treatmentPlan;
    changedFields.treatmentPlan = data.treatmentPlan;
  }
  if (data.status !== undefined) {
    updateData.status = data.status;
    changedFields.status = data.status;
  }

  // Recalculate risk score if probability or impact changed
  if (data.probability !== undefined || data.impact !== undefined) {
    const newProbability = data.probability ?? currentRisk.probability;
    const newImpact = data.impact ?? currentRisk.impact;
    const newRiskScore = calculateRiskScore(newProbability, newImpact);
    updateData.riskScore = newRiskScore;
    changedFields.riskScore = newRiskScore;
  }

  // Update risk
  const updatedRisk = await client.risk.update({
    where: { id: riskId },
    data: updateData,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      auditLog: true,
      actions: true,
      reviews: true,
    },
  });

  // Create audit log entry
  await client.riskAuditLog.create({
    data: {
      riskId,
      action: "UPDATED",
      changedFields: changedFields as Prisma.InputJsonValue,
      changedById: userId,
    },
  });

  return updatedRisk;
}

/**
 * Add action to risk
 */
export async function addRiskAction(
  riskId: string,
  data: {
    description: string;
    dueDate: Date;
  },
  userId: string,
  trx?: Prisma.TransactionClient
) {
  const client = trx || prisma;

  // Verify risk exists
  const risk = await client.risk.findUnique({ where: { id: riskId } });
  if (!risk) {
    throw new ApiError(404, "Risk not found", "NOT_FOUND");
  }

  const action = await client.riskAction.create({
    data: {
      riskId,
      description: data.description,
      owner: userId, // Current user owns the action initially
      dueDate: data.dueDate,
      status: "OPEN",
    },
    include: {
      ownedBy: { select: { id: true, name: true, email: true } },
      risk: true,
    },
  });

  // Create audit log entry
  await client.riskAuditLog.create({
    data: {
      riskId,
      action: "ADDED_ACTION",
      changedFields: {
        actionId: action.id,
        description: data.description,
        dueDate: data.dueDate.toISOString(),
      } as Prisma.InputJsonValue,
      changedById: userId,
    },
  });

  return action;
}

/**
 * Create effectiveness review for risk
 */
export async function createRiskReview(
  riskId: string,
  data: {
    newProbability?: number;
    newImpact?: number;
    effectiveness: number;
    notes: string;
  },
  userId: string,
  trx?: Prisma.TransactionClient
) {
  const client = trx || prisma;

  // Verify risk exists
  const risk = await client.risk.findUnique({ where: { id: riskId } });
  if (!risk) {
    throw new ApiError(404, "Risk not found", "NOT_FOUND");
  }

  // Calculate new risk score if probabilities were updated
  let newRiskScore: number | null = null;
  if (data.newProbability !== undefined && data.newImpact !== undefined) {
    newRiskScore = calculateRiskScore(data.newProbability, data.newImpact);
  }

  const review = await client.riskReview.create({
    data: {
      riskId,
      newProbability: data.newProbability ?? null,
      newImpact: data.newImpact ?? null,
      newRiskScore,
      effectiveness: data.effectiveness,
      notes: data.notes,
      reviewedById: userId,
    },
    include: {
      reviewedBy: { select: { id: true, name: true, email: true } },
      risk: true,
    },
  });

  // Create audit log entry
  await client.riskAuditLog.create({
    data: {
      riskId,
      action: "REVIEWED",
      changedFields: {
        effectiveness: data.effectiveness,
        newProbability: data.newProbability,
        newImpact: data.newImpact,
        newRiskScore,
      } as Prisma.InputJsonValue,
      changedById: userId,
    },
  });

  return review;
}

/**
 * Get risk metrics for dashboard
 */
export async function getRiskMetrics() {
  const risks = await prisma.risk.findMany({
    select: {
      status: true,
      riskScore: true,
      source: true,
    },
  });

  const metrics = {
    total: risks.length,
    byStatus: {
      ACTIVE: risks.filter((r) => r.status === "ACTIVE").length,
      MITIGATED: risks.filter((r) => r.status === "MITIGATED").length,
      TRANSFERRED: risks.filter((r) => r.status === "TRANSFERRED").length,
      ACCEPTED: risks.filter((r) => r.status === "ACCEPTED").length,
      CLOSED: risks.filter((r) => r.status === "CLOSED").length,
    },
    bySource: {
      REGULATORY: risks.filter((r) => r.source === "REGULATORY").length,
      OPERATIONAL: risks.filter((r) => r.source === "OPERATIONAL").length,
      STRATEGIC: risks.filter((r) => r.source === "STRATEGIC").length,
      FINANCIAL: risks.filter((r) => r.source === "FINANCIAL").length,
      ENVIRONMENTAL: risks.filter((r) => r.source === "ENVIRONMENTAL").length,
    },
    averageScore: risks.length > 0 ? Math.round(risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length) : 0,
    highRisks: risks.filter((r) => r.riskScore >= 15).length, // Score 15+
    mediumRisks: risks.filter((r) => r.riskScore >= 9 && r.riskScore < 15).length,
    lowRisks: risks.filter((r) => r.riskScore < 9).length,
  };

  return metrics;
}
