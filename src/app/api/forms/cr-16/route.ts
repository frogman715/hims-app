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
          },
        },
      },
    });

    if (!crew) {
      return NextResponse.json({ error: "Crew not found" }, { status: 404 });
    }

    // Load DOCX template
    const doc = await loadDocxTemplate("HGF-CR-16_Medical_Treatment_Request.docx");

    // Get latest contract
    const latestContract = crew.contracts[0];

    // Prepare medical treatment request data
    const treatmentData = getCommonCrewData(crew, {
      // Vessel information
      vesselName: latestContract?.vessel?.name || '',
      onboardDate: latestContract?.contractStart?.toLocaleDateString() || '',

      // Treatment request details (these would typically be filled by crew member or medical officer)
      requestDate: new Date().toLocaleDateString(),
      symptoms: '',                // To be filled: Description of symptoms
      painLevel: '',               // To be filled: Mild/Moderate/Severe
      painLocation: '',            // To be filled: Where is the pain
      duration: '',                // To be filled: How long has this been going on
      previousTreatment: '',       // To be filled: Any previous treatment received
      allergies: '',               // To be filled: Known allergies
      currentMedications: '',      // To be filled: Currently taking medications

      // Medical assessment (to be filled by medical officer)
      diagnosis: '',               // To be filled by doctor
      treatment: '',               // To be filled: Recommended treatment
      medications: '',             // To be filled: Prescribed medications
      dosage: '',                  // To be filled: Dosage instructions
      followUp: '',                // To be filled: Follow-up instructions
      workRestriction: '',         // To be filled: Any work restrictions
      returnToWorkDate: '',        // To be filled: When can return to work

      // Emergency information
      emergencyContact: crew.emergencyContact || '',
      bloodType: crew.bloodType || '',

      // Sign-off
      requestedBy: crew.fullName,  // Crew member requesting treatment
      requestDateTime: new Date().toLocaleString(),
      assessedBy: '',              // To be filled by medical officer
      assessmentDate: '',          // To be filled
      approvedBy: '',              // To be filled by supervisor
      approvalDate: '',            // To be filled

      // Additional notes
      specialNotes: '',            // Any additional medical notes
      urgency: 'Routine',          // Routine/Urgent/Emergency
    });

    // Set the template variables
    doc.setData(treatmentData);

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
    const filename = `HGF-CR-16_${crew.fullName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.docx`;

    return exportDocxAsResponse(doc, filename);

  } catch (error) {
    console.error("Error generating HGF-CR-16 form:", error);
    return NextResponse.json(
      { error: "Failed to generate form" },
      { status: 500 }
    );
  }
}