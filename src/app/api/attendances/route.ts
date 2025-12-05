import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { checkPermission, PermissionLevel } from '@/lib/permission-middleware';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check HR permission for attendance access
    if (!checkPermission(session, 'crew', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const date = searchParams.get('date');
    const status = searchParams.get('status');

    const where: {
      employeeId?: string;
      date?: Date;
      status?: string;
    } = {};

    if (employeeId) {
      where.employeeId = employeeId; // Keep as string
    }

    if (date) {
      where.date = new Date(date);
    }

    if (status) {
      where.status = status;
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            position: true,
            department: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(attendances);
  } catch (error) {
    console.error('Error fetching attendances:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { employeeId, date, checkIn, checkOut, status } = body;

    if (!employeeId || !date) {
      return NextResponse.json(
        { error: 'Employee ID and date are required' },
        { status: 400 }
      );
    }

    // Check if attendance already exists for this employee on this date
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: new Date(date),
      },
    });

    if (existingAttendance) {
      return NextResponse.json(
        { error: 'Attendance already exists for this employee on this date' },
        { status: 409 }
      );
    }

    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        date: new Date(date),
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        status: status || 'present',
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            position: true,
            department: true,
          },
        },
      },
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error('Error creating attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}