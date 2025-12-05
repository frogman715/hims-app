import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const holiday = await prisma.nationalHoliday.findUnique({
      where: {
        id: id,
      },
    });

    if (!holiday) {
      return NextResponse.json(
        { error: 'National holiday not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(holiday);
  } catch (error) {
    console.error('Error fetching national holiday:', error);
    return NextResponse.json(
      { error: 'Failed to fetch national holiday' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const { id } = await params;

    const holiday = await prisma.nationalHoliday.update({
      where: {
        id: id,
      },
      data: {
        country: body.country,
        holidayName: body.holidayName,
        holidayDate: new Date(body.holidayDate),
        isRecurring: body.isRecurring || false,
        description: body.description || null,
        paidLeave: body.paidLeave !== undefined ? body.paidLeave : true,
      },
    });

    return NextResponse.json(holiday);
  } catch (error) {
    console.error('Error updating national holiday:', error);
    return NextResponse.json(
      { error: 'Failed to update national holiday' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await prisma.nationalHoliday.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({ message: 'National holiday deleted successfully' });
  } catch (error) {
    console.error('Error deleting national holiday:', error);
    return NextResponse.json(
      { error: 'Failed to delete national holiday' },
      { status: 500 }
    );
  }
}