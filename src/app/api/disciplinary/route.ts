import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, disciplinaryGuard, PermissionLevel } from "@/lib/permission-middleware";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check disciplinary permission
    if (!disciplinaryGuard(session)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    const records = await prisma.disciplinaryRecord.findMany({
      include: {
        crew: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        incidentDate: 'desc',
      },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching disciplinary records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch disciplinary records' },
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

    // Check disciplinary permission for editing
    if (!checkPermission(session, 'disciplinary', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions to create disciplinary records" }, { status: 403 });
    }
    const body = await request.json();

    const record = await prisma.disciplinaryRecord.create({
      data: {
        crewId: body.crewId,
        vesselId: body.vesselId,
        incidentDate: new Date(body.incidentDate),
        reportedBy: body.reportedBy,
        description: body.description,
        action: body.action,
        severity: body.severity || 'MINOR',
        status: body.status || 'OPEN',
      },
      include: {
        crew: {
          select: {
            fullName: true,
          },
        },
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating disciplinary record:', error);
    return NextResponse.json(
      { error: 'Failed to create disciplinary record' },
      { status: 500 }
    );
  }
}