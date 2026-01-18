import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";
import { handleApiError, ApiError } from "@/lib/error-handler";
import { EmailService } from "@/lib/email/email-service";
import { getEmailConfig } from "@/lib/email/email-config";
import { documentExpiryReminderTemplate } from "@/lib/email-helpers";

/**
 * POST /api/crewing/documents/remind
 * Send expiry reminders via email to crew members
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

      // Initialize email service
      const emailConfig = getEmailConfig();
      const emailService = new EmailService(emailConfig);

      const reminders = [];
      const errors = [];

      // Send emails for each document
      for (const doc of documents) {
        try {
          if (!doc.crew.email) {
            errors.push({
              documentId: doc.id,
              crewName: doc.crew.fullName,
              error: "No email address on file",
            });
            continue;
          }

          // Calculate days until expiry
          const expiryDate = new Date(doc.expiryDate);
          const today = new Date();
          const daysUntilExpiry = Math.ceil(
            (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Generate email template
          const template = documentExpiryReminderTemplate({
            crewName: doc.crew.fullName,
            documentType: doc.docType || "Document",
            expiryDate: expiryDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            daysUntilExpiry: Math.max(0, daysUntilExpiry),
            dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/crew-portal/documents`,
          });

          // Send email
          const result = await emailService.send({
            to: doc.crew.email,
            subject: template.subject,
            html: template.html,
          });

          if (result.success) {
            reminders.push({
              documentId: doc.id,
              crewName: doc.crew.fullName,
              crewEmail: doc.crew.email,
              docType: doc.docType,
              expiryDate: doc.expiryDate,
              daysUntilExpiry: Math.max(0, daysUntilExpiry),
              status: "sent",
              messageId: result.messageId,
            });

            // Log reminder in database
            await prisma.auditLog.create({
              data: {
                actorUserId: "system-reminder", // System-generated action
                action: "DOCUMENT_REMINDER_SENT",
                entityType: "crew_document",
                entityId: doc.id,
                metadataJson: {
                  crewName: doc.crew.fullName,
                  docType: doc.docType,
                  daysUntilExpiry: Math.max(0, daysUntilExpiry),
                  emailSent: result.success,
                },
              },
            });
          } else {
            errors.push({
              documentId: doc.id,
              crewName: doc.crew.fullName,
              error: result.error || "Unknown error",
            });
          }
        } catch (docError) {
          errors.push({
            documentId: doc.id,
            crewName: doc.crew.fullName,
            error: docError instanceof Error ? docError.message : "Unknown error",
          });
        }
      }

      return NextResponse.json({
        message: `Reminder emails sent for ${reminders.length} document(s)`,
        reminders,
        errors: errors.length > 0 ? errors : undefined,
        summary: {
          total: documents.length,
          sent: reminders.length,
          failed: errors.length,
        },
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);
