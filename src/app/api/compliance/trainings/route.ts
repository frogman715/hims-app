import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import * as complianceService from '@/lib/compliance/service';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const trainings = await complianceService.listTrainings();
    return NextResponse.json(trainings.slice(offset, offset + limit));
  } catch (error) {
    console.error('Error listing trainings:', error);
    return NextResponse.json(
      { error: 'Failed to list trainings' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    const training = await complianceService.createTraining({
      trainingCode: data.trainingCode,
      title: data.title,
      description: data.description,
      trainingType: data.trainingType,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      duration: data.duration,
      provider: data.provider,
      location: data.location,
    });

    return NextResponse.json(training, { status: 201 });
  } catch (error) {
    console.error('Error creating training:', error);
    return NextResponse.json(
      { error: 'Failed to create training' },
      { status: 500 }
    );
  }
}
