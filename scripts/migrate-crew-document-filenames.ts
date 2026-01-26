import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";
import { promises as fsp } from "fs";
import {
  buildCrewFilePath,
  generateCrewDocumentFilename,
  getAbsolutePath,
  getRelativePath,
} from "../src/lib/upload-path.ts";

const prisma = new PrismaClient();

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

function slugifyCrewName(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function resolveSourcePath(fileUrl: string): string | null {
  if (fileUrl.startsWith("/api/files/")) {
    const relative = fileUrl.replace("/api/files/", "");
    return getAbsolutePath(relative);
  }

  if (fileUrl.startsWith("/uploads/documents/")) {
    const fileName = fileUrl.split("/").pop();
    if (!fileName) {
      return null;
    }
    return path.join(process.cwd(), "public", "uploads", "documents", fileName);
  }

  return null;
}

async function ensureUniquePath(targetPath: string): Promise<string> {
  if (!fs.existsSync(targetPath)) {
    return targetPath;
  }

  const dir = path.dirname(targetPath);
  const ext = path.extname(targetPath);
  const base = path.basename(targetPath, ext);

  let counter = 1;
  while (true) {
    const candidate = path.join(dir, `${base}_v${counter}${ext}`);
    if (!fs.existsSync(candidate)) {
      return candidate;
    }
    counter += 1;
  }
}

async function moveFile(sourcePath: string, targetPath: string): Promise<void> {
  try {
    await fsp.rename(sourcePath, targetPath);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "EXDEV") {
      await fsp.copyFile(sourcePath, targetPath);
      await fsp.unlink(sourcePath);
      return;
    }
    throw error;
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  const documents = await prisma.crewDocument.findMany({
    where: {
      fileUrl: { not: null },
    },
    include: {
      crew: {
        select: { fullName: true, rank: true, slug: true },
      },
    },
    take: options.limit,
  });

  let processed = 0;
  let migrated = 0;
  let skipped = 0;

  for (const doc of documents) {
    processed += 1;
    if (!doc.fileUrl || !doc.crew) {
      skipped += 1;
      continue;
    }

    const sourcePath = resolveSourcePath(doc.fileUrl);
    if (!sourcePath || !fs.existsSync(sourcePath)) {
      skipped += 1;
      continue;
    }

    const crewSlug = doc.crew.slug || slugifyCrewName(doc.crew.fullName);
    const extension = path.extname(sourcePath) || path.extname(doc.fileUrl) || ".bin";

    const fileName = generateCrewDocumentFilename({
      crewName: doc.crew.fullName,
      rank: doc.crew.rank,
      docType: doc.docType,
      docNumber: doc.docNumber,
      extension,
      issuedAt: doc.issueDate ?? doc.createdAt,
    });

    const targetPath = await ensureUniquePath(
      buildCrewFilePath(doc.crewId, crewSlug, fileName)
    );

    if (options.dryRun) {
      console.log(`[DRY RUN] ${doc.id} ${doc.fileUrl} -> ${targetPath}`);
      continue;
    }

    await moveFile(sourcePath, targetPath);

    const relativePath = getRelativePath(targetPath);
    await prisma.crewDocument.update({
      where: { id: doc.id },
      data: {
        fileUrl: `/api/files/${relativePath}`,
      },
    });

    migrated += 1;
  }

  console.log(
    `Migration complete. processed=${processed} migrated=${migrated} skipped=${skipped} dryRun=${options.dryRun}`
  );
}

main()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
