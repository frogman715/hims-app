import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getEscalationCenterData, type EscalationItem } from "@/lib/compliance-escalations";
import { EmailService } from "@/lib/email/email-service";
import { getEmailConfig, validateEmailConfig } from "@/lib/email/email-config";

function mapOwnerToRoles(owner: string): Role[] {
  const normalized = owner.toUpperCase();

  if (normalized.includes("QMR")) return [Role.QMR];
  if (normalized.includes("DIRECTOR") && normalized.includes("OPERATIONAL")) return [Role.DIRECTOR, Role.OPERATIONAL];
  if (normalized.includes("CDMO")) return [Role.CDMO, Role.OPERATIONAL];
  if (normalized.includes("COMPLIANCE")) return [Role.QMR, Role.CDMO];
  if (normalized.includes("OPERATIONAL")) return [Role.OPERATIONAL, Role.CDMO];
  return [Role.DIRECTOR, Role.CDMO];
}

function parseEntity(item: EscalationItem) {
  const separatorIndex = item.id.indexOf("-");
  const entityId = separatorIndex >= 0 ? item.id.slice(separatorIndex + 1) : item.id;

  const entityType = (() => {
    if (item.ruleCode === "DOC-EXPIRY") return "CrewDocument";
    if (item.ruleCode === "CAPA-OVERDUE") return "CorrectiveAction";
    if (item.ruleCode === "CONTRACT-EXPIRY") return "EmploymentContract";
    if (item.ruleCode === "DEPLOY-BLOCK") return "Crew";
    if (item.ruleCode === "EXT-COMPLIANCE") return "ExternalCompliance";
    return "ComplianceItem";
  })();

  return { entityId, entityType };
}

export async function getEscalationNotificationOverview() {
  const logs = await prisma.escalationNotificationLog.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 20,
  });

  return logs.map((log) => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
    updatedAt: log.updatedAt.toISOString(),
    sentAt: log.sentAt?.toISOString() ?? null,
    lastAttemptAt: log.lastAttemptAt?.toISOString() ?? null,
  }));
}

export async function dispatchEscalationNotifications() {
  const escalationData = await getEscalationCenterData();
  const emailConfig = getEmailConfig();
  const emailConfigValidation = validateEmailConfig(emailConfig);
  const emailService =
    emailConfigValidation.valid ? new EmailService(emailConfig) : null;

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: [Role.DIRECTOR, Role.CDMO, Role.OPERATIONAL, Role.QMR] },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const results = [];

  for (const item of escalationData.items) {
    const ownerRoles = mapOwnerToRoles(item.owner);
    const recipients = users.filter(
      (user) => ownerRoles.includes(user.role) && Boolean(user.email)
    );
    const entity = parseEntity(item);
    const subject = `[${item.severity}] ${item.title}`;

    const resolvedRecipients = recipients.length > 0 ? recipients : [null];

    for (const recipient of resolvedRecipients) {
      const existingLog = await prisma.escalationNotificationLog.findFirst({
        where: {
          ruleCode: item.ruleCode,
          relatedEntityType: entity.entityType,
          relatedEntityId: entity.entityId,
          recipientEmail: recipient?.email ?? null,
          createdAt: { gte: oneDayAgo },
        },
        orderBy: { createdAt: "desc" },
      });

      if (existingLog) {
        results.push({
          itemId: item.id,
          status: "SKIPPED_DUPLICATE",
          recipientEmail: recipient?.email ?? null,
        });
        continue;
      }

      const baseLog = await prisma.escalationNotificationLog.create({
        data: {
          ruleCode: item.ruleCode,
          severity: item.severity,
          ownerRole: ownerRoles.join(", "),
          recipientEmail: recipient?.email ?? null,
          recipientName: recipient?.name ?? null,
          relatedEntityType: entity.entityType,
          relatedEntityId: entity.entityId,
          subject,
          status: emailService && recipient?.email ? "PENDING" : "SKIPPED",
          failureReason:
            recipient?.email
              ? emailService
                ? null
                : `Email config invalid: ${emailConfigValidation.errors.join(", ")}`
              : "No active recipient mapped for owner role",
          lastAttemptAt: new Date(),
        },
      });

      if (!emailService || !recipient?.email) {
        results.push({
          itemId: item.id,
          status: baseLog.status,
          recipientEmail: recipient?.email ?? null,
        });
        continue;
      }

      const html = `
        <p>Escalation rule <strong>${item.ruleCode}</strong> is active.</p>
        <p><strong>${item.title}</strong></p>
        <p>${item.detail}</p>
        <p>Open item: ${item.href}</p>
      `;

      const sendResult = await emailService.send({
        to: recipient.email,
        subject,
        html,
        text: `${item.title}\n\n${item.detail}\n\nOpen item: ${item.href}`,
      });

      await prisma.escalationNotificationLog.update({
        where: { id: baseLog.id },
        data: {
          status: sendResult.success ? "SENT" : "FAILED",
          sentAt: sendResult.success ? new Date() : null,
          failureReason: sendResult.success ? null : sendResult.error ?? "Unknown email error",
          lastAttemptAt: new Date(),
        },
      });

      results.push({
        itemId: item.id,
        status: sendResult.success ? "SENT" : "FAILED",
        recipientEmail: recipient.email,
      });
    }
  }

  return {
    generatedAt: escalationData.generatedAt,
    totalItems: escalationData.items.length,
    results,
  };
}
