import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";
import { ApiError, handleApiError } from "@/lib/error-handler";
import { createSeaServiceHistorySchema } from "@/types/crewing";

export const POST = withPermission(
  "crew",
  PermissionLevel.EDIT_ACCESS,
  async (req: NextRequest, session, context: { params: Promise<{ id: string }> }) => {
    try {
      const { id: crewId } = await context.params;
      const body = await req.json();
      const validationResult = createSeaServiceHistorySchema.safeParse(body);

      if (!validationResult.success) {
        throw new ApiError(
          400,
          "Invalid sea service history data",
          "VALIDATION_ERROR",
          validationResult.error.format()
        );
      }

      const existingCrew = await prisma.crew.findUnique({
        where: { id: crewId },
        select: { id: true },
      });

      if (!existingCrew) {
        throw new ApiError(404, "Seafarer not found", "NOT_FOUND");
      }

      const data = validationResult.data;
      const record = await prisma.seaServiceHistory.create({
        data: {
          crewId,
          vesselName: data.vesselName,
          companyName: data.companyName || null,
          vesselType: data.vesselType || null,
          grt: data.grt ?? null,
          engineOutput: data.engineOutput || null,
          flag: data.flag || null,
          rank: data.rank,
          signOnDate: new Date(data.signOnDate),
          signOffDate: data.status === "ONGOING" || !data.signOffDate ? null : new Date(data.signOffDate),
          status: data.status,
          sourceDocumentType: data.sourceDocumentType || null,
          remarks: data.remarks || null,
          verificationStatus: "PENDING",
          verifiedBy: null,
          verifiedAt: null,
        },
        include: {
          verifier: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return NextResponse.json(
        {
          ...record,
          verifiedBy: record.verifier,
          createdBy: {
            id: session.user.id,
            name: session.user.name,
          },
        },
        { status: 201 }
      );
    } catch (error) {
      return handleApiError(error);
    }
  }
);
