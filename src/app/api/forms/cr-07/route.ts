import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadDocxTemplate, getCommonCrewData, exportDocxAsResponse } from "@/lib/forms/cr-helpers";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions: only DIRECTOR, CDMO, ACCOUNTING can generate this AMBER form
    const allowedRoles = ["DIRECTOR", "CDMO", "ACCOUNTING"];
    const userRoles = session.user.roles || [];
    if (!userRoles.some(role => allowedRoles.includes(role))) {
      return NextResponse.json(
        { error: "Insufficient permissions. Only DIRECTOR, CDMO, and ACCOUNTING can generate this form." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { crewId } = body;

    if (!crewId) {
      return NextResponse.json({ error: "crewId is required" }, { status: 400 });
    }

    // Fetch crew data with contract information
    const crew = await prisma.crew.findUnique({
      where: { id: crewId },
      include: {
        contracts: {
          where: { status: "ACTIVE" },
          orderBy: { contractStart: "desc" },
          take: 1,
          include: {
            vessel: true,
            principal: true,
          },
        },
      },
    });

    if (!crew) {
      return NextResponse.json({ error: "Crew not found" }, { status: 404 });
    }

    // Load DOCX template
    const doc = await loadDocxTemplate("HGF-CR-07_CREW_VACATION_PLAN.docx");

    // Get latest active contract
    const latestContract = crew.contracts[0];

    // Prepare vacation plan data
    const vacationData = getCommonCrewData(crew, {
      // Contract information
      vesselName: latestContract?.vessel?.name || '',
      principalName: latestContract?.principal?.name || '',
      contractStart: latestContract?.contractStart?.toLocaleDateString() || '',
      contractEnd: latestContract?.contractEnd?.toLocaleDateString() || '',

      // Vacation planning fields (these would typically be calculated or user-provided)
      plannedVacationStart: '', // To be filled by user
      plannedVacationEnd: '',   // To be filled by user
      vacationDuration: '',     // To be calculated
      replacementRequired: 'Yes', // Default assumption

      // Sign-off fields
      preparedBy: session.user.name || '',
      preparedDate: new Date().toLocaleDateString(),
      approvedBy: '', // To be filled by approver
      approvedDate: '',

      // Additional vacation details
      vacationType: 'Annual Leave', // Default
      destination: '', // To be filled
      contactDuringVacation: crew.phone || crew.email || '',
    });

    // Set the template variables
    doc.setData(vacationData);

    // Render the document
    try {
      doc.render();
    } catch (error) {
      console.error("Error rendering DOCX template:", error);
      return NextResponse.json(
        { error: "Failed to render document template" },
        { status: 500 }
      );
    }

    // Generate filename and export
    const filename = `HGF-CR-07_${crew.fullName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.docx`;

    return exportDocxAsResponse(doc, filename);

  } catch (error) {
    console.error("Error generating HGF-CR-07 form:", error);
    return NextResponse.json(
      { error: "Failed to generate form" },
      { status: 500 }
    );
  }
}