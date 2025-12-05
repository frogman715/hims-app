import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const recruitmentId = id;

    const recruitment = await prisma.recruitment.findUnique({
      where: { id: recruitmentId },
    });

    if (!recruitment) {
      return NextResponse.json({ error: "Recruitment not found" }, { status: 404 });
    }

    return NextResponse.json(recruitment);
  } catch (error) {
    console.error("Error fetching recruitment:", error);
    return NextResponse.json(
      { error: "Failed to fetch recruitment" },
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const recruitmentId = id;

    const body = await request.json();
    const { crewId, recruiterId, recruitmentDate, remarks } = body;

    if (!crewId || !recruiterId) {
      return NextResponse.json({ error: "Crew ID and recruiter ID are required" }, { status: 400 });
    }

    // Check if recruitment exists
    const existingRecruitment = await prisma.recruitment.findUnique({
      where: { id: recruitmentId },
    });

    if (!existingRecruitment) {
      return NextResponse.json({ error: "Recruitment not found" }, { status: 404 });
    }

    // Update recruitment
    const recruitment = await prisma.recruitment.update({
      where: { id: recruitmentId },
      data: {
        crewId,
        recruiterId,
        recruitmentDate: recruitmentDate ? new Date(recruitmentDate) : existingRecruitment.recruitmentDate,
        remarks,
      },
    });

    return NextResponse.json(recruitment);
  } catch (error) {
    console.error("Error updating recruitment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const recruitmentId = id;

    // Check if recruitment exists
    const existingRecruitment = await prisma.recruitment.findUnique({
      where: { id: recruitmentId },
    });

    if (!existingRecruitment) {
      return NextResponse.json({ error: "Recruitment not found" }, { status: 404 });
    }

    // Delete recruitment
    await prisma.recruitment.delete({
      where: { id: recruitmentId },
    });

    return NextResponse.json({ message: "Recruitment deleted successfully" });
  } catch (error) {
    console.error("Error deleting recruitment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}