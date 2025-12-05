import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check national holidays permission
    if (!checkPermission(session, 'nationalHolidays', PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    const holidays = await prisma.nationalHoliday.findMany({
      orderBy: [
        { country: 'asc' },
        { holidayDate: 'asc' },
      ],
    });

    return NextResponse.json(holidays);
  } catch (error) {
    console.error('Error fetching national holidays:', error);
    return NextResponse.json(
      { error: 'Failed to fetch national holidays' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check national holidays permission for editing
    if (!checkPermission(session, 'nationalHolidays', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions to create holidays" }, { status: 403 });
    }
    const body = await request.json();

    const holiday = await prisma.nationalHoliday.create({
      data: {
        country: body.country,
        holidayName: body.holidayName,
        holidayDate: new Date(body.holidayDate),
        isRecurring: body.isRecurring || false,
        description: body.description || null,
        paidLeave: body.paidLeave !== undefined ? body.paidLeave : true,
      },
    });

    return NextResponse.json(holiday, { status: 201 });
  } catch (error) {
    console.error('Error creating national holiday:', error);
    return NextResponse.json(
      { error: 'Failed to create national holiday' },
      { status: 500 }
    );
  }
}