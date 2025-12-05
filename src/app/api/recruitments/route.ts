import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check crewing permission for recruitments access
    if (!checkPermission(session, 'crewing', PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const recruitments = await prisma.recruitment.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(recruitments);
  } catch (error) {
    console.error("Error fetching recruitments:", error);
    return NextResponse.json(
      { error: "Failed to fetch recruitments" },
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

    // Check crewing permission for recruitments editing
    if (!checkPermission(session, 'crewing', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const { crewId, recruiterId, recruitmentDate, remarks } = body;

    if (!crewId || !recruiterId) {
      return NextResponse.json({ error: "Crew ID and recruiter ID are required" }, { status: 400 });
    }

    const recruitment = await prisma.recruitment.create({
      data: {
        crewId,
        recruiterId,
        recruitmentDate: recruitmentDate ? new Date(recruitmentDate) : new Date(),
        remarks,
      },
    });

    return NextResponse.json(recruitment, { status: 201 });
  } catch (error) {
    console.error("Error creating recruitment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}