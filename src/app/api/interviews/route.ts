import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";

// GET /api/interviews - Get all interviews with optional filtering
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!checkPermission(session, "crew", PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const applicationId = searchParams.get("applicationId");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (applicationId) {
      where.applicationId = applicationId;
    }

    const interviews = await prisma.interview.findMany({
      where,
      include: {
        application: {
          include: {
            crew: {
              select: {
                id: true,
                fullName: true,
                rank: true,
                nationality: true,
                phone: true,
              },
            },
            principal: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { scheduledDate: "desc" },
    });

    return NextResponse.json({ data: interviews, total: interviews.length });
  } catch (error) {
    console.error("Error fetching interviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch interviews" },
      { status: 500 }
    );
  }
}

// POST /api/interviews - Create new interview
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!checkPermission(session, "crew", PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      applicationId,
      scheduledDate,
      interviewerName,
      notes,
    } = body;

    if (!applicationId) {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      );
    }

    const interview = await prisma.interview.create({
      data: {
        applicationId,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        conductedDate: null,
        status: "SCHEDULED",
        interviewerName,
        technicalScore: null,
        attitudeScore: null,
        englishScore: null,
        recommendation: null,
        notes,
      },
      include: {
        application: {
          include: {
            crew: {
              select: {
                id: true,
                fullName: true,
                rank: true,
              },
            },
          },
        },
      },
    });

    // Update application status to INTERVIEW
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: "INTERVIEW" },
    });

    return NextResponse.json(interview, { status: 201 });
  } catch (error) {
    console.error("Error creating interview:", error);
    return NextResponse.json(
      { error: "Failed to create interview" },
      { status: 500 }
    );
  }
}
