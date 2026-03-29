import { NextResponse } from "next/server";
import { PriorityLevel, QMRTaskType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureOfficeApiPathAccess } from "@/lib/office-api-access";

const ALLOWED_QMR_PRIORITIES = new Set<PriorityLevel>(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

function parseTaskPayload(payload: unknown) {
  if (typeof payload !== "object" || payload === null) {
    return { error: "Invalid QMR task payload" };
  }

  const body = payload as Record<string, unknown>;
  const taskType =
    typeof body.taskType === "string" && body.taskType.trim().length > 0
      ? body.taskType.trim().toUpperCase()
      : null;
  const title =
    typeof body.title === "string" && body.title.trim().length > 0
      ? body.title.trim()
      : null;
  const description =
    typeof body.description === "string" && body.description.trim().length > 0
      ? body.description.trim()
      : null;
  const priority =
    typeof body.priority === "string" && body.priority.trim().length > 0
      ? body.priority.trim().toUpperCase()
      : "MEDIUM";
  const dueDate =
    typeof body.dueDate === "string" || typeof body.dueDate === "number"
      ? new Date(body.dueDate)
      : body.dueDate instanceof Date
        ? body.dueDate
        : null;

  if (!taskType) {
    return { error: "Task type is required" };
  }
  if (!title) {
    return { error: "Task title is required" };
  }
  if (!description) {
    return { error: "Task description is required" };
  }
  if (!Object.values(QMRTaskType).includes(taskType as QMRTaskType)) {
    return { error: "Invalid QMR task type" };
  }
  if (!ALLOWED_QMR_PRIORITIES.has(priority as PriorityLevel)) {
    return { error: "Invalid task priority" };
  }
  if (!dueDate || Number.isNaN(dueDate.getTime())) {
    return { error: "Valid due date is required" };
  }

  return {
    data: {
      taskType,
      title,
      description,
      priority: priority as PriorityLevel,
      dueDate,
    },
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(
      session,
      "/api/quality/qmr/tasks",
      "GET",
      "Insufficient permissions to view QMR tasks"
    );
    if (authError) {
      return authError;
    }

    const tasks = await prisma.qMRTask.findMany({
      where: {
        assignedTo: session.user.id,
        status: { not: "COMPLETED" }
      },
      orderBy: [
        { priority: "desc" },
        { dueDate: "asc" }
      ],
      take: 20
    });

    return NextResponse.json({ tasks, total: tasks.length });
  } catch (error) {
    console.error("Error fetching QMR tasks:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(
      session,
      "/api/quality/qmr/tasks",
      "POST",
      "Insufficient permissions to create QMR tasks"
    );
    if (authError) {
      return authError;
    }

    const parsedPayload = parseTaskPayload(await req.json());
    if ("error" in parsedPayload) {
      return NextResponse.json({ error: parsedPayload.error }, { status: 400 });
    }

    const task = await prisma.qMRTask.create({
      data: {
        taskType: parsedPayload.data.taskType as QMRTaskType,
        title: parsedPayload.data.title,
        description: parsedPayload.data.description,
        priority: parsedPayload.data.priority as PriorityLevel,
        assignedTo: session.user.id,
        dueDate: parsedPayload.data.dueDate,
        status: "PENDING"
      }
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "QMR_TASK_CREATED",
        entityType: "QMRTask",
        entityId: task.id,
        metadataJson: {
          taskType: task.taskType,
          priority: task.priority,
          dueDate: task.dueDate,
          assignedTo: task.assignedTo,
        },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating QMR task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
