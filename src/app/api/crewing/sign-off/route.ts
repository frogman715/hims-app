import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";

export const GET = withPermission("crew", PermissionLevel.VIEW_ACCESS, async (req) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status && status !== "ALL") where.status = status;

  const signOffs = await prisma.crewSignOff.findMany({
    where,
    include: {
      crew: {
        select: {
          fullName: true,
          rank: true,
          phone: true
        }
      },
      assignment: {
        select: {
          vessel: {
            select: {
              name: true
            }
          }
        }
      }
    },
    orderBy: { signOffDate: "desc" }
  });

  return NextResponse.json({ signOffs, total: signOffs.length });
});

export const POST = withPermission("crew", PermissionLevel.EDIT_ACCESS, async (req) => {
  const body = await req.json();
  const {
    crewId,
    assignmentId,
    signOffDate,
    arrivalDate,
    passportReceived = false,
    seamanBookReceived = false
  } = body;

  const signOff = await prisma.crewSignOff.create({
    data: {
      crewId,
      assignmentId,
      signOffDate: new Date(signOffDate),
      arrivalDate: arrivalDate ? new Date(arrivalDate) : null,
      passportReceived,
      seamanBookReceived,
      status: "PENDING"
    }
  });

  // Update crew status to OFF_SIGNED
  await prisma.crew.update({
    where: { id: crewId },
    data: { status: "OFF_SIGNED" }
  });

  return NextResponse.json(signOff, { status: 201 });
});
