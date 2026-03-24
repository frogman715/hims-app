import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureOfficeApiPathAccess } from '@/lib/office-api-access';
import { crewTaskAutoCreateSchema } from '@/lib/crewing-ops-schemas';
import { handleApiError, ApiError } from '@/lib/error-handler';

type TaskTypeValue = 'MCU' | 'TRAINING' | 'VISA' | 'CONTRACT' | 'BRIEFING';

// POST /api/crew-tasks/auto-create - Auto-generate tasks when crew approved
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

    const parsedBody = crewTaskAutoCreateSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid auto-create payload', details: parsedBody.error.flatten() },
        { status: 400 }
      );
    }

    const { crewId } = parsedBody.data;
    // Get the crew and their prepare-joining record
    const crew = await prisma.crew.findUnique({
      where: { id: crewId },
      include: {
        prepareJoinings: true
      }
    });

    if (!crew || !crew.prepareJoinings || crew.prepareJoinings.length === 0) {
      return NextResponse.json(
        { error: 'Crew or prepare-joining record not found' },
        { status: 404 }
      );
    }

    const prepareJoiningRecord = crew.prepareJoinings[0];

    // Define task templates for each division
    const taskTemplates = [
      {
        taskType: 'MCU',
        title: `MCU - ${crew.fullName}`,
        description: 'Schedule and complete Medical Check-Up (MCU) examination'
      },
      {
        taskType: 'TRAINING',
        title: `Training - ${crew.fullName}`,
        description: 'Arrange training and orientation sessions'
      },
      {
        taskType: 'VISA',
        title: `Visa - ${crew.fullName}`,
        description: 'Process visa application and documentation'
      },
      {
        taskType: 'CONTRACT',
        title: `Contract - ${crew.fullName}`,
        description: 'Prepare and obtain signed employment contract'
      },
      {
        taskType: 'BRIEFING',
        title: `Briefing - ${crew.fullName}`,
        description: 'Schedule vessel briefing and orientation'
      }
    ];

    // Create tasks for each template
    const createdTasks = await Promise.all(
      taskTemplates.map(template =>
        prisma.crewTask.create({
          data: {
            crewId: crewId,
            prepareJoiningId: prepareJoiningRecord.id,
            taskType: template.taskType as TaskTypeValue,
            title: template.title,
            description: template.description,
            status: 'TODO',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
          }
        })
      )
    );

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: 'CREW_TASKS_AUTO_CREATED',
        entityType: 'Crew',
        entityId: crewId,
        metadataJson: {
          prepareJoiningId: prepareJoiningRecord.id,
          createdTaskCount: createdTasks.length,
          taskTypes: createdTasks.map((task) => task.taskType),
        },
      },
    });

    return NextResponse.json({
      message: `Created ${createdTasks.length} tasks for crew ${crew.fullName}`,
      tasks: createdTasks
    });
  } catch (error) {
    return handleApiError(error);
  }
}
