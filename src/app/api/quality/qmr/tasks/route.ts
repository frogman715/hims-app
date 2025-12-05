import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { taskType, title, description, priority, dueDate } = body;

    const task = await prisma.qMRTask.create({
      data: {
        taskType,
        title,
        description,
        priority: priority || "MEDIUM",
        assignedTo: session.user.id,
        dueDate: new Date(dueDate),
        status: "PENDING"
      }
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating QMR task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
