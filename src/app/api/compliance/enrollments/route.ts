import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import * as complianceService from '@/lib/compliance/service';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    const enrollment = await complianceService.enrollEmployeeInTraining({
      employeeId: data.employeeId,
      trainingId: data.trainingId,
      enrolledDate: data.enrolledDate ? new Date(data.enrolledDate) : undefined,
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    console.error('Error enrolling employee:', error);
    return NextResponse.json(
      { error: 'Failed to enroll employee' },
      { status: 500 }
    );
  }
}
