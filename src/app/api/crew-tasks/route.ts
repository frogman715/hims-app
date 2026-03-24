import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CrewTaskStatus, CrewTaskType } from '@prisma/client';
import { ensureOfficeApiPathAccess } from '@/lib/office-api-access';
import { crewTaskCreateSchema } from '@/lib/crewing-ops-schemas';
import { handleApiError, ApiError } from '@/lib/error-handler';

// GET /api/crew-tasks - List tasks based on filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(session, '/api/crew-tasks', 'GET');
    if (authError) {
      return authError;
    }

    const { searchParams } = new URL(req.url);
    const crewId = searchParams.get('crewId');
    const status = searchParams.get('status');
    const taskType = searchParams.get('taskType');
    const assignedTo = searchParams.get('assignedTo');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (crewId) where.crewId = crewId;
    if (status) {
      if (!Object.values(CrewTaskStatus).includes(status as CrewTaskStatus)) {
        return NextResponse.json({ error: 'Invalid task status filter' }, { status: 400 });
      }
      where.status = status;
    }
    if (taskType) {
      if (!Object.values(CrewTaskType).includes(taskType as CrewTaskType)) {
        return NextResponse.json({ error: 'Invalid task type filter' }, { status: 400 });
      }
      where.taskType = taskType;
    }
    if (assignedTo) where.assignedTo = assignedTo;

    const tasks = await prisma.crewTask.findMany({
      where,
      include: {
        crew: {
          select: { id: true, fullName: true, rank: true }
        },
        prepareJoining: true,
        assignedToUser: {
          select: { id: true, name: true, email: true }
        },
        completedByUser: {
          select: { id: true, name: true }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    return NextResponse.json(tasks);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/crew-tasks - Create a new task
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(session, '/api/crew-tasks', 'POST');
    if (authError) {
      return authError;
    }

    if (!session.user?.id) {
      throw new ApiError(401, 'Unauthorized', 'AUTHENTICATION_ERROR');
    }

    const parsedBody = crewTaskCreateSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid crew task payload', details: parsedBody.error.flatten() },
        { status: 400 }
      );
    }

    const { crewId, taskType, title, description, assignedTo, dueDate, priority } = parsedBody.data;
    const task = await prisma.crewTask.create({
      data: {
        crewId,
        taskType,
        title,
        description,
        assignedTo,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority
      },
      include: {
        crew: true,
        assignedToUser: true
      }
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: 'CREW_TASK_CREATED',
        entityType: 'CrewTask',
        entityId: task.id,
        metadataJson: {
          crewId: task.crewId,
          taskType: task.taskType,
          status: task.status,
          assignedTo: task.assignedTo,
        },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
