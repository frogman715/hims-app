import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

type ApplicationWithRelations = Prisma.ApplicationGetPayload<{
  include: {
    crew: true;
    principal: true;
  };
}>;

type HydratedApplication = ApplicationWithRelations & {
  crew: NonNullable<ApplicationWithRelations['crew']>;
};

// CR-02: Application Form Template
function generateCR02HTML(application: HydratedApplication) {
  const { crew, position, principal, status } = application;
  const applicationDate = application.applicationDate
    ? new Date(application.applicationDate)
    : new Date();
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>CR-02 Employment Application Form</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Arial', sans-serif; 
      padding: 40px; 
      font-size: 12px;
      line-height: 1.4;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #000;
      padding-bottom: 20px;
    }
    .company-name {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .form-title {
      font-size: 16px;
      font-weight: bold;
      margin: 10px 0;
    }
    .form-code {
      font-size: 14px;
      color: #666;
    }
    .section {
      margin: 20px 0;
    }
    .section-title {
      background: #000;
      color: #fff;
      padding: 8px 12px;
      font-weight: bold;
      margin-bottom: 15px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    td {
      border: 1px solid #000;
      padding: 8px;
    }
    .label {
      font-weight: bold;
      width: 35%;
      background: #f5f5f5;
    }
    .value {
      width: 65%;
    }
    .footer {
      margin-top: 50px;
      page-break-inside: avoid;
    }
    .signature-box {
      display: inline-block;
      width: 45%;
      text-align: center;
      vertical-align: top;
    }
    .signature-line {
      border-top: 1px solid #000;
      margin-top: 60px;
      padding-top: 5px;
    }
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 80px;
      color: rgba(0, 0, 0, 0.05);
      z-index: -1;
    }
  </style>
</head>
<body>
  <div class="watermark">HANMARINE</div>
  
  <div class="header">
    <div class="company-name">PT. HANMARINE SHIPPING & MANNING</div>
    <div style="font-size: 11px; color: #666; margin: 5px 0;">
      Jl. Raya Muara Karang No. 8, Jakarta Utara 14450<br>
      Tel: +62 21 6693 6060 | Email: info@hanmarine.co
    </div>
    <div class="form-title">EMPLOYMENT APPLICATION FORM</div>
    <div class="form-code">Form Code: CR-02</div>
  </div>

  <div class="section">
    <div class="section-title">I. APPLICATION INFORMATION</div>
    <table>
      <tr>
        <td class="label">Application Date</td>
        <td class="value">${applicationDate.toLocaleDateString('id-ID', { 
          day: '2-digit', month: 'long', year: 'numeric' 
        })}</td>
      </tr>
      <tr>
        <td class="label">Applied Position</td>
        <td class="value">${position}</td>
      </tr>
      <tr>
        <td class="label">Target Principal</td>
        <td class="value">${principal?.name || 'Any Principal'}</td>
      </tr>
      <tr>
        <td class="label">Application Status</td>
        <td class="value">${status}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">II. PERSONAL INFORMATION</div>
    <table>
      <tr>
        <td class="label">Full Name</td>
        <td class="value">${crew.fullName}</td>
      </tr>
      <tr>
        <td class="label">Date of Birth</td>
        <td class="value">${crew.dateOfBirth ? new Date(crew.dateOfBirth).toLocaleDateString('id-ID') : '-'}</td>
      </tr>
      <tr>
        <td class="label">Place of Birth</td>
        <td class="value">${crew.placeOfBirth || '-'}</td>
      </tr>
      <tr>
        <td class="label">Nationality</td>
        <td class="value">${crew.nationality || '-'}</td>
      </tr>
      <tr>
        <td class="label">Current Rank</td>
        <td class="value">${crew.rank}</td>
      </tr>
      <tr>
        <td class="label">Phone Number</td>
        <td class="value">${crew.phone || '-'}</td>
      </tr>
      <tr>
        <td class="label">Email Address</td>
        <td class="value">${crew.email || '-'}</td>
      </tr>
      <tr>
        <td class="label">Address</td>
        <td class="value">${crew.address || '-'}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">III. SEAMAN DOCUMENTS</div>
    <table>
      <tr>
        <td class="label">Passport Number</td>
        <td class="value">${crew.passportNumber || '-'}</td>
      </tr>
      <tr>
        <td class="label">Passport Expiry</td>
        <td class="value">${crew.passportExpiry ? new Date(crew.passportExpiry).toLocaleDateString('id-ID') : '-'}</td>
      </tr>
      <tr>
        <td class="label">Seaman Book Number</td>
        <td class="value">${crew.seamanBookNumber || '-'}</td>
      </tr>
      <tr>
        <td class="label">Seaman Book Expiry</td>
        <td class="value">${crew.seamanBookExpiry ? new Date(crew.seamanBookExpiry).toLocaleDateString('id-ID') : '-'}</td>
      </tr>
    </table>
  </div>

  ${application.remarks ? `
  <div class="section">
    <div class="section-title">IV. REMARKS</div>
    <table>
      <tr>
        <td style="padding: 15px;">${application.remarks}</td>
      </tr>
    </table>
  </div>
  ` : ''}

  <div class="footer">
    <table style="border: none;">
      <tr>
        <td style="border: none; width: 50%; vertical-align: top;">
          <div class="signature-box">
            <div style="margin-bottom: 5px;">Applicant</div>
            <div class="signature-line">${crew.fullName}</div>
            <div style="margin-top: 5px; font-size: 10px;">Date: _____________</div>
          </div>
        </td>
        <td style="border: none; width: 50%; vertical-align: top;">
          <div class="signature-box">
            <div style="margin-bottom: 5px;">HR Department</div>
            <div class="signature-line">_______________________</div>
            <div style="margin-top: 5px; font-size: 10px;">Date: _____________</div>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #000; font-size: 10px; color: #666; text-align: center;">
    This document is computer generated and property of PT. Hanmarine Shipping & Manning<br>
    Generated on: ${new Date().toLocaleString('id-ID')}
  </div>
</body>
</html>
  `;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: {
        crew: true,
        principal: true
      }
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (!application.crew) {
      return NextResponse.json({ error: 'Crew data missing for application' }, { status: 404 });
    }

    const html = generateCR02HTML({ ...application, crew: application.crew });

    const crewNameSlug = application.crew.fullName
      ? application.crew.fullName.replace(/\s+/g, '_')
      : 'crew';

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="CR-02_${crewNameSlug}_${application.id}.html"`,
      },
    });

  } catch (error) {
    console.error('Error generating CR-02:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
