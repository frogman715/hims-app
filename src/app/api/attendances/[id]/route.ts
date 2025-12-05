import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const attendance = await prisma.attendance.findUnique({
      where: { id },
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

    if (!attendance) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { employeeId, date, checkIn, checkOut, status } = body;

    // Check if attendance exists
    const existingAttendance = await prisma.attendance.findUnique({
      where: { id },
    });

    if (!existingAttendance) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      );
    }

    // If changing employee or date, check for conflicts
    if (employeeId !== existingAttendance.employeeId || date !== existingAttendance.date.toISOString().split('T')[0]) {
      const conflict = await prisma.attendance.findFirst({
        where: {
          employeeId: employeeId || existingAttendance.employeeId,
          date: date ? new Date(date) : existingAttendance.date,
          id: { not: id },
        },
      });

      if (conflict) {
        return NextResponse.json(
          { error: 'Attendance already exists for this employee on this date' },
          { status: 409 }
        );
      }
    }

    const attendance = await prisma.attendance.update({
      where: { id },
      data: {
        employeeId: employeeId || existingAttendance.employeeId,
        date: date ? new Date(date) : existingAttendance.date,
        checkIn: checkIn !== undefined ? (checkIn ? new Date(checkIn) : null) : existingAttendance.checkIn,
        checkOut: checkOut !== undefined ? (checkOut ? new Date(checkOut) : null) : existingAttendance.checkOut,
        status: status || existingAttendance.status,
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

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error updating attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existingAttendance = await prisma.attendance.findUnique({
      where: { id },
    });

    if (!existingAttendance) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      );
    }

    await prisma.attendance.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}