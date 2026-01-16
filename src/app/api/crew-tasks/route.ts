import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/crew-tasks - List tasks based on filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const crewId = searchParams.get('crewId');
    const status = searchParams.get('status');
    const taskType = searchParams.get('taskType');
    const assignedTo = searchParams.get('assignedTo');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (crewId) where.crewId = crewId;
    if (status) where.status = status;
    if (taskType) where.taskType = taskType;
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
    console.error('[crew-tasks] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/crew-tasks - Create a new task
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { crewId, taskType, title, description, assignedTo, dueDate, priority } = body;

    if (!crewId || !taskType || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const task = await prisma.crewTask.create({
      data: {
        crewId,
        taskType,
        title,
        description,
        assignedTo,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'MEDIUM'
      },
      include: {
        crew: true,
        assignedToUser: true
      }
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('[crew-tasks] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
