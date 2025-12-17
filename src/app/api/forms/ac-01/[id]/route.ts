import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type PrincipalAgreementPayload = Prisma.PrincipalGetPayload<{
  include: {
    vessels: {
      select: {
        id: true;
        name: true;
        type: true;
      };
    };
  };
}>;

// AC-01: Agency Agreement Form Template
function generateAC01HTML(principal: PrincipalAgreementPayload) {
  const agreementDate = principal.agreementDate ? new Date(principal.agreementDate) : new Date();
  const agreementExpiry = principal.agreementExpiry ? new Date(principal.agreementExpiry) : null;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>AC-01 Agency Agreement</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Arial', sans-serif; 
      padding: 40px; 
      font-size: 12px;
      line-height: 1.6;
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
      font-size: 18px;
      font-weight: bold;
      margin: 15px 0;
    }
    .form-code {
      font-size: 14px;
      color: #666;
    }
    .section {
      margin: 25px 0;
    }
    .section-title {
      background: #000;
      color: #fff;
      padding: 10px 15px;
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 20px;
    }
    .clause {
      margin: 15px 0;
      padding-left: 20px;
    }
    .clause-title {
      font-weight: bold;
      margin-bottom: 8px;
    }
    .clause-content {
      text-align: justify;
      margin-left: 15px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    td {
      border: 1px solid #000;
      padding: 10px;
    }
    .label {
      font-weight: bold;
      width: 35%;
      background: #f5f5f5;
    }
    .value {
      width: 65%;
    }
    .signature-section {
      margin-top: 60px;
      page-break-inside: avoid;
    }
    .signature-box {
      display: inline-block;
      width: 45%;
      vertical-align: top;
      padding: 20px 0;
    }
    .signature-line {
      border-top: 2px solid #000;
      margin-top: 80px;
      padding-top: 8px;
      font-weight: bold;
    }
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 100px;
      color: rgba(0, 0, 0, 0.03);
      z-index: -1;
    }
    ul {
      margin: 10px 0 10px 40px;
    }
    li {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="watermark">CONFIDENTIAL</div>
  
  <div class="header">
    <div class="company-name">PT. HANMARINE SHIPPING & MANNING</div>
    <div style="font-size: 11px; color: #666; margin: 5px 0;">
      Manning Agency License No: SIUPAK-123/2020<br>
      Jl. Raya Muara Karang No. 8, Jakarta Utara 14450<br>
      Tel: +62 21 6693 6060 | Email: info@hanmarine.co
    </div>
    <div class="form-title">MANNING AGENCY AGREEMENT</div>
    <div class="form-code">Form Code: AC-01</div>
  </div>

  <div class="section">
    <p style="text-align: justify; margin-bottom: 20px;">
      This Manning Agency Agreement ("Agreement") is entered into on 
      <strong>${agreementDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
    </p>
    
    <p style="text-align: justify; margin-bottom: 10px;"><strong>BETWEEN:</strong></p>
    
    <div style="margin-left: 30px; margin-bottom: 20px;">
      <p><strong>PT. HANMARINE SHIPPING & MANNING</strong></p>
      <p>A company duly registered under Indonesian law</p>
      <p>Having its principal office at Jl. Raya Muara Karang No. 8, Jakarta Utara 14450</p>
      <p>(Hereinafter referred to as <strong>"HANMARINE"</strong> or <strong>"Manning Agent"</strong>)</p>
    </div>
    
    <p style="text-align: center; margin: 15px 0;"><strong>AND</strong></p>
    
    <div style="margin-left: 30px; margin-bottom: 20px;">
      <p><strong>${principal.name}</strong></p>
      <p>A company registered in ${principal.country}</p>
      ${principal.address ? `<p>${principal.address}</p>` : ''}
      ${principal.registrationNumber ? `<p>Registration No: ${principal.registrationNumber}</p>` : ''}
      <p>(Hereinafter referred to as <strong>"PRINCIPAL"</strong> or <strong>"Company"</strong>)</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">1. PRINCIPAL INFORMATION</div>
    <table>
      <tr>
        <td class="label">Company Name</td>
        <td class="value">${principal.name}</td>
      </tr>
      <tr>
        <td class="label">Country of Registration</td>
        <td class="value">${principal.country}</td>
      </tr>
      ${principal.registrationNumber ? `
      <tr>
        <td class="label">Registration Number</td>
        <td class="value">${principal.registrationNumber}</td>
      </tr>` : ''}
      ${principal.taxId ? `
      <tr>
        <td class="label">Tax ID</td>
        <td class="value">${principal.taxId}</td>
      </tr>` : ''}
      ${principal.address ? `
      <tr>
        <td class="label">Address</td>
        <td class="value">${principal.address}</td>
      </tr>` : ''}
      ${principal.contactPerson ? `
      <tr>
        <td class="label">Contact Person</td>
        <td class="value">${principal.contactPerson}</td>
      </tr>` : ''}
      ${principal.email ? `
      <tr>
        <td class="label">Email</td>
        <td class="value">${principal.email}</td>
      </tr>` : ''}
      ${principal.phone ? `
      <tr>
        <td class="label">Phone</td>
        <td class="value">${principal.phone}</td>
      </tr>` : ''}
      <tr>
        <td class="label">Agreement Date</td>
        <td class="value">${agreementDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
      </tr>
      ${agreementExpiry ? `
      <tr>
        <td class="label">Agreement Expiry</td>
        <td class="value">${agreementExpiry.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
      </tr>` : ''}
    </table>
  </div>

  <div class="section">
    <div class="section-title">2. SCOPE OF SERVICES</div>
    <div class="clause">
      <div class="clause-title">2.1 Manning Services</div>
      <div class="clause-content">
        <p>HANMARINE agrees to provide the following manning services to the PRINCIPAL:</p>
        <ul>
          <li>Recruitment and selection of qualified seafarers</li>
          <li>Pre-employment medical examinations coordination</li>
          <li>Documentation processing (certificates, visas, travel documents)</li>
          <li>Travel arrangements (flights, hotels, transportation)</li>
          <li>Crew change coordination</li>
          <li>Crew welfare and family support services</li>
          <li>Contract administration and payroll support</li>
        </ul>
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">2.2 Compliance</div>
      <div class="clause-content">
        <p>HANMARINE shall ensure that all seafarers comply with:</p>
        <ul>
          <li>Maritime Labour Convention (MLC) 2006 requirements</li>
          <li>STCW Convention standards</li>
          <li>Flag state and port state regulations</li>
          <li>PRINCIPAL's company policies and procedures</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">3. PRINCIPAL'S OBLIGATIONS</div>
    <div class="clause">
      <div class="clause-content">
        <ul>
          <li>Provide accurate and timely crew requirements and specifications</li>
          <li>Ensure vessels comply with MLC 2006 and flag state requirements</li>
          <li>Pay agency fees according to agreed schedule</li>
          <li>Provide necessary vessel documentation and certificates</li>
          <li>Notify HANMARINE of any crew performance issues immediately</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">4. AGENCY FEES</div>
    <div class="clause">
      <div class="clause-content">
        <p>Agency fees shall be agreed separately for each crew member based on rank and vessel type. 
        Fees are payable within 30 days of crew joining the vessel.</p>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">5. TERM AND TERMINATION</div>
    <div class="clause">
      <div class="clause-content">
        <p>This Agreement shall commence on ${agreementDate.toLocaleDateString('en-GB')} and 
        ${agreementExpiry ? `shall remain in force until ${agreementExpiry.toLocaleDateString('en-GB')}` : 'shall continue until terminated by either party'}. 
        Either party may terminate this Agreement by giving 90 days written notice.</p>
      </div>
    </div>
  </div>

  <div class="signature-section">
    <table style="border: none;">
      <tr>
        <td style="border: none; width: 50%; vertical-align: top;">
          <div class="signature-box">
            <div style="margin-bottom: 10px; font-weight: bold;">FOR AND ON BEHALF OF:</div>
            <div style="margin-bottom: 5px; font-weight: bold;">PT. HANMARINE SHIPPING & MANNING</div>
            <div class="signature-line">Director</div>
            <div style="margin-top: 10px; font-size: 11px;">
              Name: _______________________<br>
              Date: _______________________
            </div>
          </div>
        </td>
        <td style="border: none; width: 50%; vertical-align: top;">
          <div class="signature-box">
            <div style="margin-bottom: 10px; font-weight: bold;">FOR AND ON BEHALF OF:</div>
            <div style="margin-bottom: 5px; font-weight: bold;">${principal.name}</div>
            <div class="signature-line">Authorized Signatory</div>
            <div style="margin-top: 10px; font-size: 11px;">
              Name: _______________________<br>
              Date: _______________________
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #000; font-size: 10px; color: #666; text-align: center;">
    This document is computer generated and property of PT. Hanmarine Shipping & Manning<br>
    Generated on: ${new Date().toLocaleString('id-ID')}<br>
    Document ID: AC-01-${principal.id}
  </div>
</body>
</html>
  `;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const principal = await prisma.principal.findUnique({
      where: { id },
      include: {
        vessels: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        }
      }
    });

    if (!principal) {
      return NextResponse.json({ error: 'Principal not found' }, { status: 404 });
    }

    const html = generateAC01HTML(principal);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="AC-01_${principal.name.replace(/\s+/g, '_')}_${principal.id}.html"`,
      },
    });

  } catch (error) {
    console.error('Error generating AC-01:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
