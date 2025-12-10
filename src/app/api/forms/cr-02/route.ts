import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import path from "path";
import ExcelJS from "exceljs";

const CR02_TEMPLATE_PATH = path.join(
  process.cwd(),
  "src/form_reference/CR/HGF-CR-02_APPLICATION_FOR_EMPLOYMENT.xlsx"
);

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

    // Fetch crew data
    const crew = await prisma.crew.findUnique({
      where: { id: crewId },
      include: {
        applications: {
          orderBy: { applicationDate: "desc" },
          take: 1,
        },
      },
    });

    if (!crew) {
      return NextResponse.json({ error: "Crew not found" }, { status: 404 });
    }

    // Load Excel template
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(CR02_TEMPLATE_PATH);

    const worksheet = workbook.getWorksheet(1); // Assuming first worksheet
    if (!worksheet) {
      return NextResponse.json({ error: "Invalid Excel template" }, { status: 500 });
    }

    // Fill cells with crew data based on actual template structure
    // Personal Information Section
    if (crew.fullName) {
      const nameParts = crew.fullName.split(' ');
      const familyName = nameParts.slice(-1)[0] || ''; // Last name
      const givenName = nameParts.slice(0, -1).join(' ') || ''; // First names

      // Family Name cells (A7-F7 area - but these are headers, so we'll use nearby cells)
      worksheet.getCell("G7").value = familyName;
      // Given Name cells (A8-F8 area)
      worksheet.getCell("G8").value = givenName;
    }

    // Birth details (P7-S7)
    if (crew.dateOfBirth) {
      worksheet.getCell("T7").value = crew.dateOfBirth.toLocaleDateString();
    }
    if (crew.placeOfBirth) {
      worksheet.getCell("P14").value = crew.placeOfBirth;
    }

    // Physical details (P8-S9)
    // Height and weight not in our schema, leave empty

    // Address (P12)
    if (crew.address) {
      worksheet.getCell("P12").value = crew.address;
    }

    // Contact details
    if (crew.phone) {
      worksheet.getCell("P13").value = crew.phone;
    }
    if (crew.email) {
      worksheet.getCell("Q13").value = crew.email;
    }

    // Nationality (around A11)
    if (crew.nationality) {
      worksheet.getCell("B11").value = crew.nationality;
    }

    // Seaman Book details (G11-K11 for numbers, L11-O11 for expiry)
    if (crew.seamanBookNumber) {
      worksheet.getCell("G12").value = crew.seamanBookNumber;
    }
    if (crew.seamanBookExpiry) {
      worksheet.getCell("L12").value = crew.seamanBookExpiry.toLocaleDateString();
    }

    // Passport details (similar structure)
    if (crew.passportNumber) {
      worksheet.getCell("G13").value = crew.passportNumber;
    }
    if (crew.passportExpiry) {
      worksheet.getCell("L13").value = crew.passportExpiry.toLocaleDateString();
    }

    // Rank/Position (around P6)
    if (crew.rank) {
      worksheet.getCell("P6").value = crew.rank;
    }

    // Application data (if exists)
    const latestApplication = crew.applications[0];
    if (latestApplication) {
      // Application date (could be in various places)
      if (latestApplication.applicationDate) {
        worksheet.getCell("P20").value = latestApplication.applicationDate.toLocaleDateString();
      }

      // Position applied for
      if (latestApplication.position) {
        worksheet.getCell("Q6").value = latestApplication.position;
      }
    }

    // Current date for form generation
    worksheet.getCell("P21").value = new Date().toLocaleDateString();

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Log activity (optional)
    // await prisma.activityLog.create({
    //   data: {
    //     action: "GENERATE_FORM",
    //     entityType: "HGF-CR-02",
    //     entityId: crewId,
    //     userId: session.user.id,
    //   },
    // });

    // Return file
    const filename = `HGF-CR-02_${crew.fullName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error("Error generating HGF-CR-02 form:", error);
    return NextResponse.json(
      { error: "Failed to generate form" },
      { status: 500 }
    );
  }
}