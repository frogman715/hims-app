import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";
import { ApiError, handleApiError } from "@/lib/error-handler";
import { prisma } from "@/lib/prisma";
import { getRestHourRegisterData } from "@/lib/compliance-rest-hours";

function parseNumeric(value: unknown, fieldName: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new ApiError(400, `${fieldName} must be a valid number`, "VALIDATION_ERROR");
  }

  return parsed;
}

export const GET = withPermission(
  "compliance",
  PermissionLevel.VIEW_ACCESS,
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const vesselId = searchParams.get("vesselId");
      const crewId = searchParams.get("crewId");

      const data = await getRestHourRegisterData({ vesselId, crewId });
      return NextResponse.json(data);
    } catch (error) {
      return handleApiError(error);
    }
  }
);

export const POST = withPermission(
  "compliance",
  PermissionLevel.EDIT_ACCESS,
  async (req, session) => {
    try {
      const body = (await req.json()) as Record<string, unknown>;
      const crewId = typeof body.crewId === "string" ? body.crewId : "";
      const vesselId = typeof body.vesselId === "string" ? body.vesselId : "";
      const logDate = typeof body.logDate === "string" ? body.logDate : "";
      const remarks = typeof body.remarks === "string" ? body.remarks.trim() : null;

      if (!crewId || !vesselId || !logDate) {
        throw new ApiError(400, "crewId, vesselId, and logDate are required", "VALIDATION_ERROR");
      }

      const parsedDate = new Date(`${logDate}T00:00:00.000Z`);
      if (Number.isNaN(parsedDate.getTime())) {
        throw new ApiError(400, "logDate must use YYYY-MM-DD format", "VALIDATION_ERROR");
      }

      const workHours = parseNumeric(body.workHours, "workHours");
      const restHours = parseNumeric(body.restHours, "restHours");
      const minimumRestHours =
        body.minimumRestHours === undefined ? 10 : parseNumeric(body.minimumRestHours, "minimumRestHours");

      if (workHours < 0 || restHours < 0 || minimumRestHours < 0) {
        throw new ApiError(400, "Hour values must be zero or greater", "VALIDATION_ERROR");
      }

      if (workHours > 24 || restHours > 24) {
        throw new ApiError(400, "workHours and restHours must not exceed 24", "VALIDATION_ERROR");
      }

      const [crew, vessel] = await Promise.all([
        prisma.crew.findUnique({ where: { id: crewId }, select: { id: true } }),
        prisma.vessel.findUnique({ where: { id: vesselId }, select: { id: true } }),
      ]);

      if (!crew || !vessel) {
        throw new ApiError(404, "Crew or vessel not found", "NOT_FOUND");
      }

      const entry = await prisma.restHourRegister.upsert({
        where: {
          crewId_vesselId_logDate: {
            crewId,
            vesselId,
            logDate: parsedDate,
          },
        },
        create: {
          crewId,
          vesselId,
          logDate: parsedDate,
          workHours,
          restHours,
          minimumRestHours,
          isCompliant: restHours >= minimumRestHours,
          remarks,
          recordedByUserId: session.user.id,
          recordedByName: session.user.name ?? session.user.email ?? "System",
        },
        update: {
          workHours,
          restHours,
          minimumRestHours,
          isCompliant: restHours >= minimumRestHours,
          remarks,
          recordedByUserId: session.user.id,
          recordedByName: session.user.name ?? session.user.email ?? "System",
        },
        include: {
          crew: {
            select: {
              id: true,
              fullName: true,
              rank: true,
            },
          },
          vessel: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return NextResponse.json({
        id: entry.id,
        crewId: entry.crewId,
        crewName: entry.crew.fullName,
        rank: entry.crew.rank,
        vesselId: entry.vesselId,
        vesselName: entry.vessel.name,
        logDate: entry.logDate.toISOString(),
        workHours: entry.workHours,
        restHours: entry.restHours,
        minimumRestHours: entry.minimumRestHours,
        isCompliant: entry.isCompliant,
        remarks: entry.remarks,
        recordedByName: entry.recordedByName,
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);
