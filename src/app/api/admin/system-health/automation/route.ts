import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureOfficeApiPathAccess } from "@/lib/office-api-access";
import { handleApiError } from "@/lib/error-handler";
import { hasValidInternalJobToken } from "@/lib/internal-job-auth";
import { prisma } from "@/lib/prisma";
import { runOfficeAutomation } from "@/lib/office-automation";

async function executeOfficeAutomation(actorUserId?: string) {
  const result = await runOfficeAutomation();

  if (actorUserId) {
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action: "OFFICE_AUTOMATION_EXECUTED",
        entityType: "SystemHealthAutomation",
        entityId: "office-hardening",
        metadataJson: {
          generatedAt: result.generatedAt,
          summary: result.summary,
          notificationsDispatched: result.notificationSummary?.results?.length ?? 0,
        },
      },
    });
  }

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  try {
    if (hasValidInternalJobToken(req)) {
      return executeOfficeAutomation();
    }

    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(
      session,
      "/api/admin/system-health",
      "POST",
      "Insufficient permissions to run office automation"
    );
    if (authError) return authError;

    return executeOfficeAutomation(session?.user?.id);
  } catch (error) {
    return handleApiError(error);
  }
}
