import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadTemplate, fillCommonCrewFields, exportWorkbookAsResponse } from "@/lib/forms/cr-helpers";

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

    // Fetch crew data with related information
    const crew = await prisma.crew.findUnique({
      where: { id: crewId },
      include: {
        applications: {
          orderBy: { applicationDate: "desc" },
          take: 1,
        },
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

    // Load Excel template
    const workbook = await loadTemplate("HGF-CR-09_INTERVIEW_LIST.xlsx");
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      return NextResponse.json({ error: "Invalid Excel template" }, { status: 500 });
    }

    // Fill common crew fields - adjust cell references based on CR-09 template structure
    fillCommonCrewFields(worksheet, crew, {
      familyNameCell: "B7", // Adjust based on actual template
      givenNameCell: "D7",
      birthDateCell: "F7",
      placeOfBirthCell: "H7",
      nationalityCell: "B8",
      addressCell: "B9",
      phoneCell: "D9",
      emailCell: "F9",
      seamanBookNumberCell: "B10",
      seamanBookExpiryCell: "D10",
      passportNumberCell: "F10",
      passportExpiryCell: "H10",
      rankCell: "B11",
    });

    // Add interview-specific fields
    const latestApplication = crew.applications[0];
    const latestContract = crew.contracts[0];

    // Interview date (current date)
    worksheet.getCell("B12").value = new Date().toLocaleDateString();

    // Position applied for
    if (latestApplication?.position) {
      worksheet.getCell("D12").value = latestApplication.position;
    } else if (crew.rank) {
      worksheet.getCell("D12").value = crew.rank;
    }

    // Previous experience/vessel information
    if (latestContract?.vessel?.name) {
      worksheet.getCell("B13").value = latestContract.vessel.name;
    }

    // Principal information
    if (latestContract?.principal?.name) {
      worksheet.getCell("D13").value = latestContract.principal.name;
    }

    // Application date
    if (latestApplication?.applicationDate) {
      worksheet.getCell("F12").value = latestApplication.applicationDate.toLocaleDateString();
    }

    // Interviewer (current user)
    if (session.user.name) {
      worksheet.getCell("B14").value = session.user.name;
    }

    // Interview date/time
    worksheet.getCell("D14").value = new Date().toLocaleString();

    // Generate filename and export
    const filename = `HGF-CR-09_${crew.fullName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`;

    return await exportWorkbookAsResponse(workbook, filename);

  } catch (error) {
    console.error("Error generating HGF-CR-09 form:", error);
    return NextResponse.json(
      { error: "Failed to generate form" },
      { status: 500 }
    );
  }
}