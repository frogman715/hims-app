import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, applicationsGuard, PermissionLevel } from "@/lib/permission-middleware";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check applications permission
    if (!applicationsGuard(session)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const crewId = searchParams.get('crewId');
    const principalId = searchParams.get('principalId');

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (crewId) {
      where.crewId = crewId;
    }
    if (principalId) {
      where.principalId = principalId;
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
            nationality: true,
            rank: true,
            phone: true,
            email: true,
          }
        },
        principal: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        applicationDate: 'desc'
      }
    });

    return NextResponse.json({
      data: applications,
      total: applications.length
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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

    // Check applications permission for editing
    if (!checkPermission(session, 'applications', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions to create applications" }, { status: 403 });
    }

    const body = await request.json();
    const { 
      crewId, 
      position, 
      vesselType,
      principalId,
      applicationDate,
      remarks 
    } = body;

    if (!crewId || !position) {
      return NextResponse.json({ error: "Crew ID and position are required" }, { status: 400 });
    }

    const application = await prisma.application.create({
      data: {
        crewId,
        position,
        vesselType,
        principalId,
        applicationDate: applicationDate ? new Date(applicationDate) : new Date(),
        status: 'RECEIVED',
        remarks,
      },
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
            nationality: true,
            rank: true,
            phone: true,
            email: true,
          }
        },
        principal: {
          select: {
            id: true,
            name: true,
          }
        }
      },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error("Error creating application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}