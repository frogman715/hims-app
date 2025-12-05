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

    // Fetch crew data with contract and performance information
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
        attendances: {
          orderBy: { date: "desc" },
          take: 30, // Last 30 days for performance metrics
        },
      },
    });

    if (!crew) {
      return NextResponse.json({ error: "Crew not found" }, { status: 404 });
    }

    // Load DOCX template
    const doc = await loadDocxTemplate("HGF-CR-08_CREW_EVALUATION_REPORT.docx");

    // Get latest active contract
    const latestContract = crew.contracts[0];

    // Calculate performance metrics from attendance
    const totalDays = crew.attendances.length;
    const presentDays = crew.attendances.filter(a => a.status === 'PRESENT').length;
    const attendanceRate = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : '0.0';

    // Prepare evaluation data
    const evaluationData = getCommonCrewData(crew, {
      // Contract information
      vesselName: latestContract?.vessel?.name || '',
      principalName: latestContract?.principal?.name || '',
      contractStart: latestContract?.contractStart?.toLocaleDateString() || '',
      contractEnd: latestContract?.contractEnd?.toLocaleDateString() || '',
      contractDuration: latestContract ?
        `${Math.ceil((new Date(latestContract.contractEnd).getTime() - new Date(latestContract.contractStart).getTime()) / (1000 * 60 * 60 * 24))} days` : '',

      // Evaluation period
      evaluationPeriod: latestContract ?
        `${latestContract.contractStart.toLocaleDateString()} - ${new Date().toLocaleDateString()}` : '',

      // Performance metrics
      attendanceRate: `${attendanceRate}%`,
      totalWorkingDays: totalDays.toString(),
      daysPresent: presentDays.toString(),

      // Evaluation fields (these would typically be filled by evaluator)
      performanceRating: '', // To be filled: Excellent/Good/Satisfactory/Needs Improvement
      technicalSkills: '',   // To be filled
      workAttitude: '',      // To be filled
      reliability: '',       // To be filled
      teamwork: '',          // To be filled
      communication: '',     // To be filled

      // Comments and recommendations
      strengths: '',         // To be filled
      areasForImprovement: '', // To be filled
      recommendations: '',   // To be filled
      nextAssignment: '',    // To be filled

      // Sign-off
      evaluatedBy: session.user.name || '',
      evaluationDate: new Date().toLocaleDateString(),
      reviewedBy: '',        // To be filled by supervisor
      reviewDate: '',        // To be filled

      // Additional evaluation criteria
      safetyCompliance: '',  // To be filled
      punctuality: '',       // To be filled
      initiative: '',        // To be filled
      problemSolving: '',    // To be filled
    });

    // Set the template variables
    doc.setData(evaluationData);

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
    const filename = `HGF-CR-08_${crew.fullName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.docx`;

    return exportDocxAsResponse(doc, filename);

  } catch (error) {
    console.error("Error generating HGF-CR-08 form:", error);
    return NextResponse.json(
      { error: "Failed to generate form" },
      { status: 500 }
    );
  }
}