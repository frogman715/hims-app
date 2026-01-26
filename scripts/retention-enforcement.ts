import { PrismaClient, DocumentControlStatus, RetentionPeriod } from "@prisma/client";

const prisma = new PrismaClient();

const RETENTION_MONTHS: Record<RetentionPeriod, number | null> = {
  THREE_MONTHS: 3,
  SIX_MONTHS: 6,
  ONE_YEAR: 12,
  TWO_YEARS: 24,
  THREE_YEARS: 36,
  FIVE_YEARS: 60,
  SEVEN_YEARS: 84,
  TEN_YEARS: 120,
  PERMANENT: null,
};

type RunOptions = {
  dryRun: boolean;
  limit?: number;
};

function parseArgs(argv: string[]): RunOptions {
  const options: RunOptions = { dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      options.dryRun = true;
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

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const year = result.getFullYear();
  const month = result.getMonth();
  const day = result.getDate();
  const nextMonth = month + months;
  result.setFullYear(year, nextMonth, 1);
  const maxDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, maxDay));
  return result;
}

async function resolveActorUserId(): Promise<string> {
  const envActor = process.env.RETENTION_ACTOR_USER_ID;
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

  const actorUserId = await resolveActorUserId();

  const candidates = await prisma.documentControl.findMany({
    where: {
      retentionPeriod: { not: "PERMANENT" },
      status: { not: DocumentControlStatus.OBSOLETE },
    },
    take: options.limit,
  });

  let processed = 0;
  let expired = 0;
  let skipped = 0;

  for (const doc of candidates) {
    processed += 1;
    const months = RETENTION_MONTHS[doc.retentionPeriod];
    if (!months) {
      skipped += 1;
      continue;
    }

    const retentionStart = doc.retentionStartDate ?? doc.effectiveDate;
    if (!retentionStart) {
      skipped += 1;
      continue;
    }

    const disposalDate = addMonths(retentionStart, months);
    if (disposalDate > now) {
      continue;
    }

    expired += 1;

    if (options.dryRun) {
      console.log(`[DRY RUN] Retention expired: ${doc.code} -> ${disposalDate.toISOString()}`);
      continue;
    }

    const updated = await prisma.documentControl.update({
      where: { id: doc.id },
      data: {
        status: DocumentControlStatus.OBSOLETE,
        retentionStartDate: doc.retentionStartDate ?? retentionStart,
        disposalDate: doc.disposalDate ?? disposalDate,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId,
        action: "DOCUMENT_RETENTION_EXPIRED",
        entityType: "DOCUMENT_CONTROL",
        entityId: updated.id,
        metadataJson: {
          code: updated.code,
          retentionPeriod: updated.retentionPeriod,
          retentionStartDate: retentionStart.toISOString(),
          disposalDate: disposalDate.toISOString(),
        },
        oldValuesJson: {
          status: doc.status,
          disposalDate: doc.disposalDate ? doc.disposalDate.toISOString() : null,
        },
        newValuesJson: {
          status: updated.status,
          disposalDate: updated.disposalDate ? updated.disposalDate.toISOString() : null,
        },
      },
    });
  }

  console.log(
    `Retention enforcement complete. processed=${processed} expired=${expired} skipped=${skipped} dryRun=${options.dryRun}`
  );
}

main()
  .catch((error) => {
    console.error("Retention enforcement failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
