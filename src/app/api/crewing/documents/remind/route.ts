import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";
import { handleApiError, ApiError } from "@/lib/error-handler";

/**
 * POST /api/crewing/documents/remind
 * Send expiry reminders (placeholder for email integration)
 */
export const POST = withPermission(
  "crew",
  PermissionLevel.EDIT_ACCESS,
  async (req: NextRequest) => {
    try {
      const body = await req.json();
      const { documentIds } = body;

      if (!Array.isArray(documentIds) || documentIds.length === 0) {
        throw new ApiError(400, "documentIds array is required", "VALIDATION_ERROR");
      }

      // Get documents with crew info
      const documents = await prisma.crewDocument.findMany({
        where: {
          id: { in: documentIds },
          isActive: true,
        },
        include: {
          crew: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      if (documents.length === 0) {
        throw new ApiError(404, "No valid documents found", "NOT_FOUND");
      }

      // TODO: Implement email sending logic here
      // For now, we'll just return a summary
      const reminders = documents.map((doc) => ({
        documentId: doc.id,
        crewName: doc.crew.fullName,
        crewEmail: doc.crew.email,
        docType: doc.docType,
        expiryDate: doc.expiryDate,
        status: "pending", // Would be "sent" after email implementation
      }));

      return NextResponse.json({
        message: `Reminder preparation completed for ${documents.length} document(s)`,
        reminders,
        note: "Email sending functionality to be implemented",
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);
