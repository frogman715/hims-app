import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type TaskTypeValue = 'MCU' | 'TRAINING' | 'VISA' | 'CONTRACT' | 'BRIEFING';

// POST /api/crew-tasks/auto-create - Auto-generate tasks when crew approved
export async function POST(req: NextRequest) {
  try {
    const { crewId } = await req.json();

    if (!crewId) {
      return NextResponse.json(
        { error: 'crewId is required' },
        { status: 400 }
      );
    }

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

    return NextResponse.json({
      message: `Created ${createdTasks.length} tasks for crew ${crew.fullName}`,
      tasks: createdTasks
    });
  } catch (error) {
    console.error('[crew-tasks/auto-create] error:', error);
    return NextResponse.json(
      { error: 'Failed to create tasks' },
      { status: 500 }
    );
  }
}
