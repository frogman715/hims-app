import { NextResponse } from "next/server";
import { CommunicationType, PriorityLevel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";

const ALLOWED_PRIORITIES = new Set<PriorityLevel>(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

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

  const normalizedType = typeof type === "string" ? type.trim().toUpperCase() : "";
  const normalizedSubject = typeof subject === "string" ? subject.trim() : "";
  const normalizedDescription = typeof description === "string" ? description.trim() : "";
  const normalizedPriority = typeof priority === "string" ? priority.trim().toUpperCase() : "MEDIUM";
  const normalizedAttachments = Array.isArray(attachments)
    ? attachments.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

  if (!session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!normalizedType) {
    return NextResponse.json({ error: "Communication type is required" }, { status: 400 });
  }
  if (!Object.values(CommunicationType).includes(normalizedType as CommunicationType)) {
    return NextResponse.json({ error: "Invalid communication type" }, { status: 400 });
  }
  if (!normalizedSubject) {
    return NextResponse.json({ error: "Subject is required" }, { status: 400 });
  }
  if (!normalizedDescription) {
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  }
  if (!ALLOWED_PRIORITIES.has(normalizedPriority as PriorityLevel)) {
    return NextResponse.json({ error: "Invalid communication priority" }, { status: 400 });
  }

  const communication = await prisma.communicationLog.create({
    data: {
      type: normalizedType as CommunicationType,
      crewId,
      subject: normalizedSubject,
      description: normalizedDescription,
      reporter: session.user.id,
      priority: normalizedPriority as PriorityLevel,
      status: "PENDING",
      attachments: normalizedAttachments
    }
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: "COMPLIANCE_COMMUNICATION_CREATED",
      entityType: "CommunicationLog",
      entityId: communication.id,
      metadataJson: {
        type: communication.type,
        priority: communication.priority,
        crewId: communication.crewId,
      },
    },
  });

  return NextResponse.json(communication, { status: 201 });
});
