import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";

interface LetterGuaranteeHandlingAgent {
  name: string;
  address: string;
  contact: string;
  email: string;
}

interface LetterGuaranteeCrewRow {
  no: number;
  name: string;
  dateOfBirth: string;
  rank: string;
  passportNo: string;
  seamanBookNo: string;
}

interface LetterGuaranteeData {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  date: string;
  letterNumber: string;
  recipients: string[];
  principalName: string;
  principalCompanyCode: string;
  vesselName: string;
  vesselImoNumber: string;
  vesselFlag: string;
  joinDate: string;
  joinPort: string;
  handlingAgent: LetterGuaranteeHandlingAgent;
  crewTable: LetterGuaranteeCrewRow[];
  purpose: string;
  signedBy: string;
  signedName: string;
  signedDate: string;
}

// GET /api/forms/letter-guarantee/[prepareJoiningId] - Generate Letter Guarantee HTML
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ prepareJoiningId: string }> }
) {
  const { prepareJoiningId } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!checkPermission(session, "crew", PermissionLevel.VIEW_ACCESS)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const prepareJoining = await prisma.prepareJoining.findUnique({
      where: { id: prepareJoiningId },
      include: {
        crew: {
          select: {
            id: true,
            fullName: true,
            rank: true,
            dateOfBirth: true,
            passportNumber: true,
            seamanBookNumber: true,
          },
        },
        principal: {
          select: {
            id: true,
            name: true,
            registrationNumber: true,
            address: true,
            contactPerson: true,
            email: true,
            phone: true,
          },
        },
        forms: {
          select: {
            id: true,
            status: true,
          },
          take: 1,
        },
      },
    });

    if (!prepareJoining) {
      return NextResponse.json(
        { error: "Prepare joining record not found" },
        { status: 404 }
      );
    }

    if (!prepareJoining.crew) {
      return NextResponse.json(
        { error: "Crew data missing for prepare joining" },
        { status: 404 }
      );
    }

    // Generate auto-filled data
    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const crew = prepareJoining.crew;
    const principal = prepareJoining.principal;

    const letterData: LetterGuaranteeData = {
      // Company info (PT HANMARINE)
      companyName: "PT HANMARINE INTERNATIONAL MARITIME SERVICE",
      companyAddress: "Jalan Raya New No. 123, Jakarta Pusat 10110, Indonesia",
      companyPhone: "+62 21 1234 5678",
      companyEmail: "office@hanmarine.com",

      // Editable fields
      date: formattedDate,
      letterNumber: `LG/${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, "0")}/${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`,
      
      // Recipients (editable)
      recipients: [
        "To: Airlines (Check-in Counter)",
        "To: Immigration Department, Republic of Indonesia",
        "To: Immigration Department, [Destination Country]",
        "To: Local Handling Agent, [Port Name]",
      ],

      // Principal info (auto-filled)
      principalName: principal?.name || "N/A",
      principalCompanyCode: principal?.registrationNumber || "N/A",

      // Vessel info (auto-filled) - prepareJoining has vesselId, so fetch it if needed
      vesselName: "N/A",
      vesselImoNumber: "N/A",
      vesselFlag: "N/A",

      // Join details (auto-filled)
      joinDate: prepareJoining.departureDate
        ? new Date(prepareJoining.departureDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "N/A",
      joinPort: prepareJoining.departurePort || "N/A",

      // Handling agent (editable)
      handlingAgent: {
        name: "[Agent Name]",
        address: "[Agent Address]",
        contact: "[Agent Contact]",
        email: "[Agent Email]",
      },

      // Crew table (auto-filled)
      crewTable: [
        {
          no: 1,
          name: crew.fullName || "N/A",
          dateOfBirth: crew.dateOfBirth
            ? new Date(crew.dateOfBirth).toLocaleDateString("en-GB")
            : "N/A",
          rank: crew.rank || "N/A",
          passportNo: crew.passportNumber || "N/A",
          seamanBookNo: crew.seamanBookNumber || "N/A",
        },
      ],

      // Purpose statement
      purpose:
        "This letter serves as a guarantee that the above-mentioned seafarer is proceeding to join the vessel for employment. " +
        "This document is provided for airline check-in procedures, immigration clearance at the Republic of Indonesia and the destination country, " +
        "and notification to the local handling agent at the port of embarkation.",

      // Signature
      signedBy: "Director",
      signedName: "[Director Name]",
      signedDate: formattedDate,
    };

    // Generate HTML
    const html = generateLetterGuaranteeHTML(letterData);

    return NextResponse.json({
      data: letterData,
      html,
    });
  } catch (error) {
    console.error("Error generating Letter Guarantee:", error);
    return NextResponse.json(
      { error: "Failed to generate Letter Guarantee" },
      { status: 500 }
    );
  }
}

function generateLetterGuaranteeHTML(data: LetterGuaranteeData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #333;
      padding-bottom: 15px;
    }
    .header h1 {
      margin: 0;
      font-size: 18px;
      font-weight: bold;
    }
    .header p {
      margin: 5px 0;
      font-size: 12px;
    }
    .letter-info {
      margin-bottom: 20px;
    }
    .recipients {
      margin-bottom: 20px;
    }
    .recipients p {
      margin: 5px 0;
    }
    .subject {
      font-weight: bold;
      text-decoration: underline;
      margin: 20px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    table, th, td {
      border: 1px solid #333;
    }
    th, td {
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    .signature {
      margin-top: 40px;
      text-align: right;
    }
    .signature-line {
      margin-top: 60px;
      border-top: 1px solid #333;
      display: inline-block;
      padding-top: 5px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${data.companyName}</h1>
    <p>${data.companyAddress}</p>
    <p>Phone: ${data.companyPhone} | Email: ${data.companyEmail}</p>
  </div>

  <div class="letter-info">
    <p><strong>Date:</strong> ${data.date}</p>
    <p><strong>Letter No:</strong> ${data.letterNumber}</p>
  </div>

  <div class="recipients">
    ${data.recipients.map((r) => `<p>${r}</p>`).join("")}
  </div>

  <p class="subject">Subject: Letter of Guarantee for Seafarer Joining Vessel</p>

  <p>Dear Sir/Madam,</p>

  <p>We hereby guarantee that the following seafarer is proceeding to join the vessel <strong>${data.vesselName}</strong> 
  (IMO: ${data.vesselImoNumber}, Flag: ${data.vesselFlag}) owned/managed by <strong>${data.principalName}</strong> 
  (Company Code: ${data.principalCompanyCode}).</p>

  <p><strong>Vessel Details:</strong></p>
  <ul>
    <li>Vessel Name: ${data.vesselName}</li>
    <li>IMO Number: ${data.vesselImoNumber}</li>
    <li>Flag: ${data.vesselFlag}</li>
    <li>Expected Join Date: ${data.joinDate}</li>
    <li>Port of Joining: ${data.joinPort}</li>
  </ul>

  <p><strong>Seafarer Details:</strong></p>
  
  <table>
    <thead>
      <tr>
        <th>No</th>
        <th>Full Name</th>
        <th>Date of Birth</th>
        <th>Rank</th>
        <th>Passport No</th>
        <th>Seaman Book No</th>
      </tr>
    </thead>
    <tbody>
      ${data.crewTable
        .map(
          (crew: LetterGuaranteeCrewRow) => `
        <tr>
          <td>${crew.no}</td>
          <td>${crew.name}</td>
          <td>${crew.dateOfBirth}</td>
          <td>${crew.rank}</td>
          <td>${crew.passportNo}</td>
          <td>${crew.seamanBookNo}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <p><strong>Handling Agent Details:</strong></p>
  <ul>
    <li>Agent Name: ${data.handlingAgent.name}</li>
    <li>Address: ${data.handlingAgent.address}</li>
    <li>Contact: ${data.handlingAgent.contact}</li>
    <li>Email: ${data.handlingAgent.email}</li>
  </ul>

  <p>${data.purpose}</p>

  <p>Should you require any further information, please do not hesitate to contact us.</p>

  <p>Thank you for your cooperation.</p>

  <div class="signature">
    <p>Yours faithfully,</p>
    <div class="signature-line">
      <p><strong>${data.signedName}</strong></p>
      <p>${data.signedBy}</p>
      <p>${data.companyName}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// POST /api/forms/letter-guarantee/[prepareJoiningId] - Save Letter Guarantee as form submission
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ prepareJoiningId: string }> }
) {
  try {
    const { prepareJoiningId } = await context.params;
    const session = await getServerSession(authOptions);
    if (!checkPermission(session, "crew", PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { formData } = body as { formData?: unknown };

    if (formData === undefined) {
      return NextResponse.json(
        { error: "Form data is required" },
        { status: 400 }
      );
    }

    const prepareJoining = await prisma.prepareJoining.findUnique({
      where: { id: prepareJoiningId },
      select: {
        principalId: true,
      },
    });

    if (!prepareJoining) {
      return NextResponse.json(
        { error: "Prepare joining record not found" },
        { status: 404 }
      );
    }

    let template = await prisma.principalFormTemplate.findFirst({
      where: {
        principalId: prepareJoining.principalId,
        formName: "Letter of Guarantee",
      },
    });

    if (!template) {
      template = await prisma.principalFormTemplate.create({
        data: {
          principalId: prepareJoining.principalId,
          formName: "Letter of Guarantee",
          formCategory: "DECLARATION",
          templatePath: "src/form_reference/LETTER GUARANTE PREJOINING.docx",
          isRequired: true,
          displayOrder: 0,
          description: "Letter of guarantee for airline check-in, immigration, and local agent",
        },
      });
    }

    const form = await prisma.prepareJoiningForm.create({
      data: {
        prepareJoiningId,
        templateId: template.id,
        formData,
        status: "DRAFT",
        version: 1,
      },
      include: {
        template: true,
        prepareJoining: {
          include: {
            crew: true,
            principal: true,
          },
        },
      },
    });

    return NextResponse.json(form, { status: 201 });
  } catch (error) {
    console.error("Error saving Letter Guarantee:", error);
    return NextResponse.json(
      { error: "Failed to save Letter Guarantee" },
      { status: 500 }
    );
  }
}
