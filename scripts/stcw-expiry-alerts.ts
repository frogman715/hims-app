import { PrismaClient } from "@prisma/client";
import { DOCUMENT_TYPES } from "@/lib/document-types";

const prisma = new PrismaClient();

type RunOptions = {
  dryRun: boolean;
  days: number;
  limit?: number;
};

function parseArgs(argv: string[]): RunOptions {
  const options: RunOptions = { dryRun: false, days: 90 };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--days") {
      const value = argv[i + 1];
      const parsed = value ? Number(value) : NaN;
      if (!Number.isNaN(parsed)) {
        options.days = parsed;
        i += 1;
      }
    } else if (arg === "--limit") {
      const value = argv[i + 1];
      const parsed = value ? Number(value) : NaN;
      if (!Number.isNaN(parsed)) {
        options.limit = parsed;
        i += 1;
      }
    }
  }
  return options;
}

function getStcwDocTypes(): string[] {
  const envTypes = process.env.STCW_DOC_TYPES;
  if (envTypes && envTypes.trim()) {
    return envTypes
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  const allowedCategories = new Set(["certification", "safety", "technical", "management", "other"]);
  return DOCUMENT_TYPES.filter(
    (doc) => allowedCategories.has(doc.category) && doc.value !== "OTHER"
  ).map((doc) => doc.value);
}

function toStartOfDay(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

function calculateDaysUntil(expiryDate: Date, now: Date): number {
  const diffMs = expiryDate.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function resolvePriority(daysUntilExpiry: number): "LOW" | "MEDIUM" | "HIGH" {
  if (daysUntilExpiry <= 7) return "HIGH";
  if (daysUntilExpiry <= 30) return "HIGH";
  if (daysUntilExpiry <= 60) return "MEDIUM";
  return "LOW";
}

async function resolveActorUserId(): Promise<string> {
  const envActor = process.env.STCW_ACTOR_USER_ID;
  if (envActor) {
    const existing = await prisma.user.findUnique({ where: { id: envActor }, select: { id: true } });
    if (existing) {
      return envActor;
    }
  }

  const systemAdmin = await prisma.user.findFirst({
    where: { isSystemAdmin: true },
    select: { id: true },
  });
  if (!systemAdmin) {
    throw new Error("No system admin user available for audit logging.");
  }
  return systemAdmin.id;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const now = new Date();
  const windowEnd = new Date(now.getTime() + options.days * 24 * 60 * 60 * 1000);
  const stcwDocTypes = getStcwDocTypes();

  const actorUserId = await resolveActorUserId();

  const expiringDocs = await prisma.crewDocument.findMany({
    where: {
      isActive: true,
      expiryDate: {
        not: null,
        lte: windowEnd,
      },
      docType: {
        in: stcwDocTypes,
      },
    },
    select: {
      id: true,
      crewId: true,
      docType: true,
      expiryDate: true,
    },
    take: options.limit,
  });

  let processed = 0;
  let createdTasks = 0;
  let createdLogs = 0;

  for (const doc of expiringDocs) {
    if (!doc.expiryDate) {
      continue;
    }
    processed += 1;
    const daysUntilExpiry = calculateDaysUntil(doc.expiryDate, now);
    const severity = daysUntilExpiry <= 7 ? "CRITICAL" : daysUntilExpiry <= 30 ? "WARNING" : "INFO";
    const title = `STCW Revalidation - ${doc.docType}`;

    const existingTask = await prisma.crewTask.findFirst({
      where: {
        crewId: doc.crewId,
        taskType: "TRAINING",
        status: { in: ["TODO", "IN_PROGRESS"] },
        title,
      },
      select: { id: true },
    });

    const startOfDay = toStartOfDay(now);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const existingAudit = await prisma.auditTrail.findFirst({
      where: {
        category: "TRAINING_REQUIREMENT",
        entityType: "CREW_DOCUMENT",
        entityId: doc.id,
        event: "EXPIRY_ALERT",
        createdAt: { gte: startOfDay, lt: endOfDay },
      },
      select: { id: true },
    });

    if (options.dryRun) {
      console.log(
        `[DRY RUN] ${doc.docType} expires in ${daysUntilExpiry} days (crewId=${doc.crewId})`
      );
      continue;
    }

    if (!existingTask) {
      await prisma.crewTask.create({
        data: {
          crewId: doc.crewId,
          taskType: "TRAINING",
          title,
          description: `Revalidate STCW document (${doc.docType}) before expiry.`,
          priority: resolvePriority(daysUntilExpiry),
          dueDate: doc.expiryDate,
        },
      });
      createdTasks += 1;
    }

    if (!existingAudit) {
      await prisma.auditTrail.create({
        data: {
          category: "TRAINING_REQUIREMENT",
          entityType: "CREW_DOCUMENT",
          entityId: doc.id,
          event: "EXPIRY_ALERT",
          description: `${doc.docType} expires in ${daysUntilExpiry} days.`,
          userId: actorUserId,
          severity,
        },
      });
      createdLogs += 1;
    }
  }

  console.log(
    `STCW expiry alerts complete. processed=${processed} tasks=${createdTasks} auditLogs=${createdLogs} dryRun=${options.dryRun}`
  );
}

main()
  .catch((error) => {
    console.error("STCW expiry alert job failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
