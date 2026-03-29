import { prisma } from "@/lib/prisma";
import { ACTIVE_APPLICATION_STATUSES, detectDuplicateApplicationGroups } from "@/lib/crewing-hardening";
import {
  ACTIVE_CONTRACT_STATUSES,
  ACTIVE_DOCUMENT_CONTROL_STATUSES,
  ACTIVE_RECRUITMENT_STATUSES,
  detectContractOverlapGroups,
  detectDuplicateDocumentRegistryGroups,
  detectDuplicateRecruitmentGroups,
} from "@/lib/data-quality-hardening";
import { dispatchEscalationNotifications } from "@/lib/compliance-escalation-notifications";

const ACTIVE_PREPARE_JOINING_STATUSES = [
  "PENDING",
  "DOCUMENTS",
  "MEDICAL",
  "TRAINING",
  "TRAVEL",
  "READY",
  "DISPATCHED",
] as const;

const PREPARE_JOINING_SLA_DAYS = 3;
const RECRUITMENT_SLA_DAYS = 5;

export async function getOfficeAutomationSnapshot(
  db: typeof prisma = prisma,
  now: Date = new Date()
) {
  const prepareJoiningCutoff = new Date(
    now.getTime() - PREPARE_JOINING_SLA_DAYS * 24 * 60 * 60 * 1000
  );
  const recruitmentCutoff = new Date(
    now.getTime() - RECRUITMENT_SLA_DAYS * 24 * 60 * 60 * 1000
  );

  const [
    activeApplications,
    activeContracts,
    activeRecruitments,
    activeControlledDocuments,
    stalledPrepareJoiningItems,
    stalledRecruitmentItems,
    failedEscalationNotifications,
  ] = await Promise.all([
    db.application.findMany({
      where: {
        status: { in: [...ACTIVE_APPLICATION_STATUSES] },
      },
      select: {
        id: true,
        crewId: true,
        principalId: true,
        position: true,
        status: true,
        createdAt: true,
        crew: {
          select: { fullName: true },
        },
        principal: {
          select: { name: true },
        },
      },
    }),
    db.employmentContract.findMany({
      where: {
        status: { in: [...ACTIVE_CONTRACT_STATUSES] },
      },
      select: {
        id: true,
        crewId: true,
        contractNumber: true,
        contractKind: true,
        status: true,
        contractStart: true,
        contractEnd: true,
        crew: {
          select: { fullName: true },
        },
      },
    }),
    db.recruitment.findMany({
      where: {
        status: { in: [...ACTIVE_RECRUITMENT_STATUSES] },
      },
      select: {
        id: true,
        status: true,
        recruitmentDate: true,
        updatedAt: true,
        crew: {
          select: {
            fullName: true,
            rank: true,
            email: true,
            phone: true,
          },
        },
      },
    }),
    db.documentControl.findMany({
      where: {
        status: { in: ACTIVE_DOCUMENT_CONTROL_STATUSES },
      },
      select: {
        id: true,
        code: true,
        title: true,
        documentType: true,
        department: true,
        status: true,
        createdAt: true,
      },
    }),
    db.prepareJoining.findMany({
      where: {
        status: { in: [...ACTIVE_PREPARE_JOINING_STATUSES] },
        updatedAt: { lte: prepareJoiningCutoff },
      },
      select: {
        id: true,
        status: true,
        updatedAt: true,
        crew: {
          select: { fullName: true },
        },
        vessel: {
          select: { name: true },
        },
        principal: {
          select: { name: true },
        },
      },
      orderBy: { updatedAt: "asc" },
      take: 25,
    }),
    db.recruitment.findMany({
      where: {
        status: { in: [...ACTIVE_RECRUITMENT_STATUSES] },
        updatedAt: { lte: recruitmentCutoff },
      },
      select: {
        id: true,
        status: true,
        updatedAt: true,
        recruitmentDate: true,
        crew: {
          select: {
            fullName: true,
            rank: true,
          },
        },
      },
      orderBy: { updatedAt: "asc" },
      take: 25,
    }),
    db.escalationNotificationLog.count({
      where: { status: "FAILED" },
    }),
  ]);

  const duplicateNominationGroups = detectDuplicateApplicationGroups(activeApplications);
  const contractOverlapGroups = detectContractOverlapGroups(activeContracts);
  const duplicateRecruitmentGroups = detectDuplicateRecruitmentGroups(activeRecruitments);
  const duplicateControlledDocumentGroups =
    detectDuplicateDocumentRegistryGroups(activeControlledDocuments);

  return {
    generatedAt: now.toISOString(),
    duplicateNominationGroups,
    contractOverlapGroups,
    duplicateRecruitmentGroups,
    duplicateControlledDocumentGroups,
    stalledPrepareJoiningItems,
    stalledRecruitmentItems,
    failedEscalationNotifications,
    summary: {
      duplicateNominationAlerts: duplicateNominationGroups.length,
      contractOverlapAlerts: contractOverlapGroups.length,
      duplicateRecruitmentAlerts: duplicateRecruitmentGroups.length,
      duplicateControlledDocumentAlerts: duplicateControlledDocumentGroups.length,
      stalledPrepareJoiningAlerts: stalledPrepareJoiningItems.length,
      stalledRecruitmentAlerts: stalledRecruitmentItems.length,
      failedEscalationNotifications,
      totalAlerts:
        duplicateNominationGroups.length +
        contractOverlapGroups.length +
        duplicateRecruitmentGroups.length +
        duplicateControlledDocumentGroups.length +
        stalledPrepareJoiningItems.length +
        stalledRecruitmentItems.length +
        failedEscalationNotifications,
    },
  };
}

export async function runOfficeAutomation(options?: {
  db?: typeof prisma;
  now?: Date;
  dispatchNotifications?: boolean;
}) {
  const db = options?.db ?? prisma;
  const now = options?.now ?? new Date();
  const snapshot = await getOfficeAutomationSnapshot(db, now);
  const notificationSummary =
    options?.dispatchNotifications === false
      ? null
      : await dispatchEscalationNotifications();

  return {
    generatedAt: snapshot.generatedAt,
    summary: snapshot.summary,
    stalledPrepareJoiningItems: snapshot.stalledPrepareJoiningItems,
    stalledRecruitmentItems: snapshot.stalledRecruitmentItems,
    duplicateNominationGroups: snapshot.duplicateNominationGroups,
    contractOverlapGroups: snapshot.contractOverlapGroups,
    duplicateRecruitmentGroups: snapshot.duplicateRecruitmentGroups,
    duplicateControlledDocumentGroups: snapshot.duplicateControlledDocumentGroups,
    notificationSummary,
  };
}
