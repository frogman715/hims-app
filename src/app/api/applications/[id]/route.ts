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
    const applicationId = id; // Keep as string since id is cuid

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        crew: {
          select: {
            fullName: true,
            nationality: true,
          }
        }
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("Error fetching application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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
    const applicationId = id;

    const body = await request.json();
    const { 
      position, 
      status, 
      vesselType,
      principalId,
      remarks 
    } = body;

    const updateData: any = {};
    
    if (status !== undefined) {
      updateData.status = status;
      if (status !== 'RECEIVED') {
        updateData.reviewedBy = session.user.id;
        updateData.reviewedAt = new Date();
      }
    }
    if (position !== undefined) updateData.position = position;
    if (vesselType !== undefined) updateData.vesselType = vesselType;
    if (principalId !== undefined) updateData.principalId = principalId;
    if (remarks !== undefined) updateData.remarks = remarks;

    const application = await prisma.application.update({
      where: { id: applicationId },
      data: updateData,
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

    // Auto-create PrepareJoining record when application is ACCEPTED
    if (status === 'ACCEPTED') {
      const existingPrepare = await prisma.prepareJoining.findFirst({
        where: {
          crewId: application.crewId,
          status: { in: ['PENDING', 'DOCUMENTS', 'MEDICAL', 'TRAINING', 'TRAVEL', 'READY'] }
        }
      });

      if (!existingPrepare) {
        await prisma.prepareJoining.create({
          data: {
            crewId: application.crewId,
            vesselId: null,
            principalId: application.principalId,
            status: 'PENDING',
            passportValid: false,
            seamanBookValid: false,
            certificatesValid: false,
            medicalValid: false,
            visaValid: false,
            orientationCompleted: false,
            ticketBooked: false,
            hotelBooked: false,
            transportArranged: false,
            remarks: `Auto-created from application ${application.id}`,
          }
        });
      }
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}