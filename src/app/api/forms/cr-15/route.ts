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

    // Fetch crew data with medical information
    const crew = await prisma.crew.findUnique({
      where: { id: crewId },
      include: {
        medicalChecks: {
          orderBy: { checkDate: "desc" },
          take: 1, // Latest medical check
        },
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
    const doc = await loadDocxTemplate("HGF-CR-15_Result_of_Medical_Advice.docx");

    // Get latest medical check and contract
    const latestMedicalCheck = crew.medicalChecks[0];
    const latestContract = crew.contracts[0];

    // Prepare medical advice result data
    const medicalData = getCommonCrewData(crew, {
      // Medical examination details
      examinationDate: latestMedicalCheck?.checkDate?.toLocaleDateString() || '',
      clinicName: latestMedicalCheck?.clinicName || '',
      doctorName: latestMedicalCheck?.doctorName || '',
      medicalResult: latestMedicalCheck?.result || '',

      // Vessel information
      vesselName: latestContract?.vessel?.name || '',
      onboardDate: latestContract?.contractStart?.toLocaleDateString() || '',

      // Medical advice fields (these would typically be filled by medical officer)
      medicalAdvice: '',           // To be filled by doctor
      fitnessStatus: '',           // Fit/Unfit/Restricted duties
      restrictions: '',            // Any medical restrictions
      medications: '',             // Prescribed medications
      followUpRequired: '',        // Yes/No
      followUpDate: '',            // If follow-up required
      returnToWorkDate: '',        // When can return to work

      // Medical history summary
      medicalHistory: latestMedicalCheck?.remarks || '',

      // Sign-off
      medicalOfficer: session.user.name || '',
      adviceDate: new Date().toLocaleDateString(),
      reviewedBy: '',              // To be filled by supervisor
      reviewDate: '',              // To be filled

      // Additional medical details
      bloodType: crew.bloodType || '',
      allergies: '',               // To be filled if known
      emergencyContact: crew.emergencyContact || '',
      specialNotes: '',            // Any special medical notes
    });

    // Set the template variables
    doc.setData(medicalData);

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
    const filename = `HGF-CR-15_${crew.fullName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.docx`;

    return exportDocxAsResponse(doc, filename);

  } catch (error) {
    console.error("Error generating HGF-CR-15 form:", error);
    return NextResponse.json(
      { error: "Failed to generate form" },
      { status: 500 }
    );
  }
}