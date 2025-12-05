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

    // Fetch crew data with documents
    const crew = await prisma.crew.findUnique({
      where: { id: crewId },
      include: {
        documents: {
          orderBy: { expiryDate: "desc" },
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
    const workbook = await loadTemplate("HGF-CR-01_DOCUMENT_CHECK_LIST.xlsx");
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      return NextResponse.json({ error: "Invalid Excel template" }, { status: 500 });
    }

    // Fill common crew fields - adjust cell references based on CR-01 template structure
    fillCommonCrewFields(worksheet, crew, {
      familyNameCell: "B7", // Adjust based on actual template
      givenNameCell: "D7",
      birthDateCell: "F7",
      nationalityCell: "H7",
      passportNumberCell: "B8",
      passportExpiryCell: "D8",
      seamanBookNumberCell: "F8",
      seamanBookExpiryCell: "H8",
      rankCell: "B9",
    });

    // Document check list specific fields
    const latestContract = crew.contracts[0];

    // Vessel information
    if (latestContract?.vessel?.name) {
      worksheet.getCell("B10").value = latestContract.vessel.name;
    }

    // Principal information
    if (latestContract?.principal?.name) {
      worksheet.getCell("D10").value = latestContract.principal.name;
    }

    // Contract period
    if (latestContract) {
      worksheet.getCell("F10").value = `${latestContract.contractStart.toLocaleDateString()} - ${latestContract.contractEnd.toLocaleDateString()}`;
    }

    // Check date
    worksheet.getCell("B11").value = new Date().toLocaleDateString();

    // Checked by
    if (session.user.name) {
      worksheet.getCell("D11").value = session.user.name;
    }

    // Document status section - populate based on available documents
    // This assumes the template has a table structure for documents
    let rowOffset = 13; // Starting row for document list

    // Essential documents to check
    const essentialDocuments = [
      { name: "Passport", required: true },
      { name: "Seaman's Book", required: true },
      { name: "Medical Certificate", required: true },
      { name: "STCW Certificates", required: true },
      { name: "Visa", required: false },
      { name: "Yellow Fever Vaccination", required: false },
      { name: "Drug Test Certificate", required: false },
      { name: "Training Certificates", required: false },
    ];

    essentialDocuments.forEach((doc, index) => {
      const row = rowOffset + index;

      // Document name
      worksheet.getCell(`A${row}`).value = doc.name;

      // Check if document exists and is valid
      const existingDoc = crew.documents.find(d =>
        d.docType.toLowerCase().includes(doc.name.toLowerCase().replace(/\s+/g, '_'))
      );

      if (existingDoc) {
        worksheet.getCell(`B${row}`).value = "✓"; // Present
        worksheet.getCell(`C${row}`).value = existingDoc.expiryDate?.toLocaleDateString() || "N/A";

        // Check if expired
        if (existingDoc.expiryDate && existingDoc.expiryDate < new Date()) {
          worksheet.getCell(`D${row}`).value = "EXPIRED";
        } else {
          worksheet.getCell(`D${row}`).value = "VALID";
        }
      } else {
        worksheet.getCell(`B${row}`).value = doc.required ? "✗" : "N/A"; // Missing or N/A
        worksheet.getCell(`C${row}`).value = "N/A";
        worksheet.getCell(`D${row}`).value = doc.required ? "MISSING" : "N/A";
      }
    });

    // Generate filename and export
    const filename = `HGF-CR-01_${crew.fullName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`;

    return await exportWorkbookAsResponse(workbook, filename);

  } catch (error) {
    console.error("Error generating HGF-CR-01 form:", error);
    return NextResponse.json(
      { error: "Failed to generate form" },
      { status: 500 }
    );
  }
}