import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";

export const GET = withPermission("compliance", PermissionLevel.VIEW_ACCESS, async (req, session, { params }) => {
  const { id } = params;

  const communication = await prisma.communicationLog.findUnique({
    where: { id },
    include: {
      crew: {
        select: {
          fullName: true,
          rank: true,
          phone: true,
          email: true
        }
      }
    }
  });

  if (!communication) {
    return NextResponse.json({ error: "Communication not found" }, { status: 404 });
  }

  return NextResponse.json(communication);
});

export const PUT = withPermission("compliance", PermissionLevel.EDIT_ACCESS, async (req, session, { params }) => {
  const { id } = params;
  const body = await req.json();

  const communication = await prisma.communicationLog.update({
    where: { id },
    data: {
      ...body,
      handledBy: session?.user?.id,
      resolutionDate: body.status === "RESOLVED" ? new Date() : undefined
    }
  });

  return NextResponse.json(communication);
});
