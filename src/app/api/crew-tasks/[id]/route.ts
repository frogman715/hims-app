import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CrewTaskStatus } from '@prisma/client';
import { ensureOfficeApiPathAccess } from '@/lib/office-api-access';
import { crewTaskUpdateSchema } from '@/lib/crewing-ops-schemas';
import { handleApiError, ApiError } from '@/lib/error-handler';

// GET /api/crew-tasks/[id] - Get specific task
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(session, '/api/crew-tasks', 'GET');
    if (authError) {
      return authError;
    }

    const { id } = await context.params;
    const task = await prisma.crewTask.findUnique({
      where: { id },
      include: {
        crew: true,
        prepareJoining: true,
        assignedToUser: true,
        completedByUser: true
      }
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/crew-tasks/[id] - Update task
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(session, '/api/crew-tasks', 'PATCH');
    if (authError) {
      return authError;
    }

    const { id } = await context.params;
    if (!session.user?.id) {
      throw new ApiError(401, 'Unauthorized', 'AUTHENTICATION_ERROR');
    }

    const parsedBody = crewTaskUpdateSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid crew task update payload', details: parsedBody.error.flatten() },
        { status: 400 }
      );
    }

    const { status, assignedTo, dueDate, remarks, completedAt, completedBy } = parsedBody.data;
    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (remarks !== undefined) updateData.remarks = remarks;
    if (completedAt !== undefined) {
      updateData.completedAt = completedAt ? new Date(completedAt) : null;
    }
    if (completedBy !== undefined) updateData.completedBy = completedBy;

    // If marking as completed, set completedAt automatically
    if (status === CrewTaskStatus.COMPLETED && !completedAt) {
      updateData.completedAt = new Date();
    }

    const task = await prisma.crewTask.update({
      where: { id },
      data: updateData,
      include: {
        crew: true,
        assignedToUser: true,
        completedByUser: true
      }
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: 'CREW_TASK_UPDATED',
        entityType: 'CrewTask',
        entityId: task.id,
        metadataJson: {
          status: task.status,
          assignedTo: task.assignedTo,
          dueDate: task.dueDate?.toISOString() ?? null,
          completedBy: task.completedBy,
        },
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/crew-tasks/[id] - Delete task
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const authError = ensureOfficeApiPathAccess(session, '/api/crew-tasks', 'DELETE');
    if (authError) {
      return authError;
    }

    const { id } = await context.params;
    if (!session.user?.id) {
      throw new ApiError(401, 'Unauthorized', 'AUTHENTICATION_ERROR');
    }

    const task = await prisma.crewTask.findUnique({
      where: { id },
      select: { id: true, crewId: true, taskType: true, status: true },
    });

    if (!task) {
      throw new ApiError(404, 'Task not found', 'NOT_FOUND');
    }

    await prisma.crewTask.delete({
      where: { id }
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: 'CREW_TASK_DELETED',
        entityType: 'CrewTask',
        entityId: task.id,
        metadataJson: {
          crewId: task.crewId,
          taskType: task.taskType,
          status: task.status,
        },
      },
    });

    return NextResponse.json(
      { message: 'Task deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
