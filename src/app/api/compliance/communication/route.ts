import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";

export const GET = withPermission("compliance", PermissionLevel.VIEW_ACCESS, async (req) => {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");

  const where: Record<string, unknown> = {};
  if (type && type !== "ALL") where.type = type;
  if (status && status !== "ALL") where.status = status;
  if (priority && priority !== "ALL") where.priority = priority;

  const communications = await prisma.communicationLog.findMany({
    where,
    include: {
      crew: {
        select: {
          fullName: true,
          rank: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ communications, total: communications.length });
});

export const POST = withPermission("compliance", PermissionLevel.EDIT_ACCESS, async (req, session) => {
  const body = await req.json();
  const {
    type,
    crewId,
    subject,
    description,
    priority = "MEDIUM",
    attachments = []
  } = body;

  const communication = await prisma.communicationLog.create({
    data: {
      type,
      crewId,
      subject,
      description,
      reporter: session?.user?.id || "system",
      priority,
      status: "PENDING",
      attachments
    }
  });

  return NextResponse.json(communication, { status: 201 });
});
