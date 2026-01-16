import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/crew-tasks/[id] - Get specific task
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
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
    console.error('[crew-tasks] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

// PATCH /api/crew-tasks/[id] - Update task
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { status, assignedTo, dueDate, remarks, completedAt, completedBy } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    if (status) updateData.status = status;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (remarks !== undefined) updateData.remarks = remarks;
    if (completedAt !== undefined) {
      updateData.completedAt = completedAt ? new Date(completedAt) : null;
    }
    if (completedBy !== undefined) updateData.completedBy = completedBy;

    // If marking as completed, set completedAt automatically
    if (status === 'COMPLETED' && !completedAt) {
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

    return NextResponse.json(task);
  } catch (error) {
    console.error('[crew-tasks] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE /api/crew-tasks/[id] - Delete task
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await prisma.crewTask.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Task deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[crew-tasks] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
