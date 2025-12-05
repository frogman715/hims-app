import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import puppeteer from 'puppeteer';
import { checkPermission, PermissionLevel } from "@/lib/permission-middleware";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check contracts permission for generating RED data documents
    if (!checkPermission(session, 'contracts', PermissionLevel.EDIT_ACCESS)) {
      return NextResponse.json({ error: "Insufficient permissions to generate contracts" }, { status: 403 });
    }

    const { type, id, data } = await request.json();

    let htmlContent = '';
    let filename = '';

    switch (type) {
      case 'pkl_contract':
        const pklData = await generatePKLContract(id);
        htmlContent = pklData.html;
        filename = pklData.filename;
        break;

      case 'sea_agreement':
        const seaData = await generateSEAContract(id);
        htmlContent = seaData.html;
        filename = seaData.filename;
        break;

      case 'crew_certificate':
        const certData = await generateCrewCertificate(id, data);
        htmlContent = certData.html;
        filename = certData.filename;
        break;

      case 'dispatch_letter':
        const dispatchData = await generateDispatchLetter(id);
        htmlContent = dispatchData.html;
        filename = dispatchData.filename;
        break;

      default:
        return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
    }

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    await browser.close();

    // Return PDF as response
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error("Error generating document:", error);
    return NextResponse.json(
      { error: "Failed to generate document" },
      { status: 500 }
    );
  }
}

async function generatePKLContract(pklId: string) {
  const pkl = await prisma.employmentContract.findUnique({
    where: { id: pklId },
    include: {
      crew: true,
      vessel: true,
      principal: true,
    },
  });

  if (!pkl) {
    throw new Error("PKL contract not found");
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>PKL Contract - ${pkl.crew.fullName}</title>
      <style>
        body { font-family: 'Times New Roman', serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
        .contract-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .company-info { font-size: 14px; margin-bottom: 20px; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; text-decoration: underline; }
        .crew-info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .signature-section { margin-top: 50px; display: flex; justify-content: space-between; }
        .signature-box { width: 200px; text-align: center; border-top: 1px solid #000; padding-top: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="contract-title">PERJANJIAN KERJA LAUT (PKL)</div>
        <div class="contract-title">SEA EMPLOYMENT CONTRACT</div>
        <div class="company-info">
          <strong>PT. HANMARINE SHIPPING LINES</strong><br>
          Jl. Tanjung Priok No. 1, Jakarta Utara<br>
          Phone: +62-21-1234567 | Email: info@hanmarine.com
        </div>
      </div>

      <div class="section">
        <div class="section-title">1. PARTIES TO THE AGREEMENT</div>
        <div class="crew-info">
          <strong>Employee (ABK):</strong> ${pkl.crew.fullName}<br>
          <strong>Rank:</strong> ${pkl.crew.rank}<br>
          <strong>Nationality:</strong> ${pkl.crew.nationality || 'Indonesia'}
        </div>

        <div class="crew-info">
          <strong>Employer:</strong> PT. HANMARINE SHIPPING LINES<br>
          <strong>Vessel:</strong> ${pkl.vessel?.name || 'N/A'} (${pkl.vessel?.flag || 'N/A'})<br>
          <strong>Principal:</strong> ${pkl.principal?.name || 'N/A'}<br>
          <strong>IMO Number:</strong> ${pkl.vessel?.imoNumber || 'N/A'}
        </div>
      </div>

      <div class="section">
        <div class="section-title">2. EMPLOYMENT TERMS</div>
        <table>
          <tr><th>Position</th><td>${pkl.rank}</td></tr>
          <tr><th>Basic Salary</th><td>${pkl.currency} ${pkl.basicWage?.toLocaleString() || 'N/A'} per month</td></tr>
          <tr><th>Contract Period</th><td>${pkl.contractStart ? new Date(pkl.contractStart).toLocaleDateString() : 'N/A'} to ${pkl.contractEnd ? new Date(pkl.contractEnd).toLocaleDateString() : 'N/A'}</td></tr>
          <tr><th>Working Hours</th><td>According to vessel requirements and international maritime law</td></tr>
          <tr><th>Leave Entitlement</th><td>30 days per year (pro-rated)</td></tr>
        </table>
      </div>

      <div class="section">
        <div class="section-title">3. RESPONSIBILITIES</div>
        <p>The Employee agrees to:</p>
        <ul>
          <li>Perform all duties assigned by the vessel's officers and management</li>
          <li>Maintain the highest standards of professional conduct</li>
          <li>Comply with all international maritime regulations and company policies</li>
          <li>Participate in safety drills and emergency procedures</li>
          <li>Maintain all required certificates and licenses</li>
        </ul>
      </div>

      <div class="section">
        <div class="section-title">4. TERMINATION</div>
        <p>This agreement may be terminated:</p>
        <ul>
          <li>By mutual agreement of both parties</li>
          <li>Upon completion of the contract period</li>
          <li>For cause, including but not limited to: gross misconduct, incapacity, or violation of company policy</li>
          <li>In accordance with Indonesian labor law and international maritime conventions</li>
        </ul>
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <div>Employee Signature</div>
          <div style="margin-top: 40px;">___________________________</div>
          <div style="margin-top: 5px;">${pkl.crew.fullName}</div>
          <div style="margin-top: 5px;">Date: _______________</div>
        </div>

        <div class="signature-box">
          <div>Employer Representative</div>
          <div style="margin-top: 40px;">___________________________</div>
          <div style="margin-top: 5px;">PT. HANMARINE SHIPPING LINES</div>
          <div style="margin-top: 5px;">Date: _______________</div>
        </div>
      </div>

      <div style="margin-top: 30px; font-size: 12px; text-align: center; color: #666;">
        This contract is made in accordance with Indonesian Law No. 13/2003 concerning Manpower and International Maritime Conventions
      </div>
    </body>
    </html>
  `;

  return {
    html,
    filename: `PKL_Contract_${pkl.crew.fullName.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`
  };
}

async function generateSEAContract(pklId: string) {
  const pkl = await prisma.employmentContract.findUnique({
    where: { id: pklId },
    include: {
      crew: true,
      vessel: true,
      principal: true,
    },
  });

  if (!pkl) {
    throw new Error("SEA contract not found");
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>SEA Agreement - ${pkl.crew.fullName}</title>
      <style>
        body { font-family: 'Times New Roman', serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
        .contract-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .company-info { font-size: 14px; margin-bottom: 20px; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; text-decoration: underline; }
        .crew-info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .signature-section { margin-top: 50px; display: flex; justify-content: space-between; }
        .signature-box { width: 200px; text-align: center; border-top: 1px solid #000; padding-top: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="contract-title">SHIPBOARD EMPLOYMENT AGREEMENT (SEA)</div>
        <div class="contract-title">PERJANJIAN KERJA DI KAPAL</div>
        <div class="company-info">
          <strong>PT. HANMARINE SHIPPING LINES</strong><br>
          Jl. Tanjung Priok No. 1, Jakarta Utara<br>
          Phone: +62-21-1234567 | Email: info@hanmarine.com
        </div>
      </div>

      <div class="section">
        <div class="section-title">SHIPOWNER'S DECLARATION</div>
        <p>In accordance with Standard Terms and Conditions for Employment of Seafarers in the Merchant Navy:</p>

        <div class="crew-info">
          <strong>Shipowner:</strong> PT. HANMARINE SHIPPING LINES<br>
          <strong>Vessel Name:</strong> ${pkl.vessel?.name || 'N/A'}<br>
          <strong>Flag:</strong> ${pkl.vessel?.flag || 'N/A'}<br>
          <strong>IMO Number:</strong> ${pkl.vessel?.imoNumber || 'N/A'}<br>
          <strong>Gross Tonnage:</strong> ${pkl.vessel?.gt || 'N/A'}<br>
          <strong>Principal:</strong> ${pkl.principal?.name || 'N/A'}
        </div>
      </div>

      <div class="section">
        <div class="section-title">SEAFARER'S DECLARATION</div>
        <div class="crew-info">
          <strong>Name:</strong> ${pkl.crew.fullName}<br>
          <strong>Rank:</strong> ${pkl.crew.rank}<br>
          <strong>Nationality:</strong> ${pkl.crew.nationality || 'Indonesia'}
        </div>
      </div>

      <div class="section">
        <div class="section-title">TERMS OF EMPLOYMENT</div>
        <table>
          <tr><th>Capacity</th><td>${pkl.rank}</td></tr>
          <tr><th>Basic Wage</th><td>USD ${pkl.basicWage?.toLocaleString() || 'N/A'} per month</td></tr>
          <tr><th>Currency</th><td>United States Dollars (USD)</td></tr>
          <tr><th>Period of Employment</th><td>${pkl.contractStart ? new Date(pkl.contractStart).toLocaleDateString() : 'N/A'} to ${pkl.contractEnd ? new Date(pkl.contractEnd).toLocaleDateString() : 'N/A'}</td></tr>
          <tr><th>Hours of Work</th><td>As per vessel requirements and MLC 2006</td></tr>
          <tr><th>Annual Leave</th><td>30 days per year (2.5 days per month)</td></tr>
        </table>
      </div>

      <div class="section">
        <div class="section-title">ADDITIONAL BENEFITS</div>
        <ul>
          <li>Medical care and treatment as per MLC 2006 requirements</li>
          <li>Repatriation expenses in case of emergency</li>
          <li>Accident insurance coverage</li>
          <li>Uniform and protective equipment</li>
          <li>Training and certification maintenance</li>
        </ul>
      </div>

      <div class="section">
        <div class="section-title">TERMINATION PROVISIONS</div>
        <p>This agreement may be terminated in accordance with Indonesian labor law and international maritime conventions:</p>
        <ul>
          <li>By mutual consent</li>
          <li>Upon expiration of the agreed period</li>
          <li>For disciplinary reasons</li>
          <li>Due to medical unfitness</li>
          <li>In case of vessel loss or major breakdown</li>
        </ul>
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <div>Seafarer Signature</div>
          <div style="margin-top: 40px;">___________________________</div>
          <div style="margin-top: 5px;">${pkl.crew.fullName}</div>
          <div style="margin-top: 5px;">Date: _______________</div>
        </div>

        <div class="signature-box">
          <div>Shipowner Representative</div>
          <div style="margin-top: 40px;">___________________________</div>
          <div style="margin-top: 5px;">PT. HANMARINE SHIPPING LINES</div>
          <div style="margin-top: 5px;">Date: _______________</div>
        </div>
      </div>

      <div style="margin-top: 30px; font-size: 12px; text-align: center; color: #666;">
        This SEA is made pursuant to the Maritime Labour Convention 2006 and Indonesian Law No. 13/2003
      </div>
    </body>
    </html>
  `;

  return {
    html,
    filename: `SEA_Agreement_${pkl.crew.fullName.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`
  };
}

async function generateCrewCertificate(crewId: string, data: any) {
  const crew = await prisma.crew.findUnique({
    where: { id: crewId },
    include: {
      documents: true,
    },
  });

  if (!crew) {
    throw new Error("Crew not found");
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Certificate - ${crew.fullName}</title>
      <style>
        body { font-family: 'Times New Roman', serif; margin: 40px; line-height: 1.6; text-align: center; }
        .certificate { border: 5px double #000; padding: 40px; max-width: 800px; margin: 0 auto; }
        .header { margin-bottom: 30px; }
        .title { font-size: 28px; font-weight: bold; margin-bottom: 20px; }
        .subtitle { font-size: 18px; margin-bottom: 30px; }
        .content { text-align: left; margin: 30px 0; }
        .crew-info { background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .signature-section { margin-top: 50px; display: flex; justify-content: space-between; }
        .signature-box { width: 200px; text-align: center; }
        .seal { margin-top: 20px; font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="header">
          <div style="font-size: 24px; font-weight: bold;">PT. HANMARINE SHIPPING LINES</div>
          <div style="font-size: 14px; margin-top: 5px;">Jakarta, Indonesia</div>
        </div>

        <div class="title">CERTIFICATE OF COMPETENCY</div>
        <div class="subtitle">${data.certificateType || 'MARINE CERTIFICATE'}</div>

        <div class="content">
          <p>This is to certify that:</p>

          <div class="crew-info">
            <strong>${crew.fullName}</strong><br>
            <strong>Rank:</strong> ${crew.rank}<br>
            <strong>Nationality:</strong> ${crew.nationality || 'Indonesia'}<br>
            <strong>Certificate Number:</strong> ${data.certificateNumber || 'N/A'}<br>
            <strong>Issue Date:</strong> ${data.issueDate ? new Date(data.issueDate).toLocaleDateString() : 'N/A'}<br>
            <strong>Expiry Date:</strong> ${data.expiryDate ? new Date(data.expiryDate).toLocaleDateString() : 'N/A'}
          </div>

          <p>Has successfully completed the required training and assessment for the position of <strong>${crew.rank}</strong> and is certified competent to perform the duties associated with this rank in accordance with international maritime standards and regulations.</p>

          <p>This certificate is issued under the authority of PT. Hanmarine Shipping Lines and is valid until the expiry date shown above, subject to compliance with all applicable regulations and company policies.</p>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div style="border-top: 1px solid #000; padding-top: 10px; margin-top: 40px;">
              <strong>Captain/Training Officer</strong>
            </div>
            <div class="seal">Seal of the Company</div>
          </div>

          <div class="signature-box">
            <div style="border-top: 1px solid #000; padding-top: 10px; margin-top: 40px;">
              <strong>Operations Manager</strong>
            </div>
            <div class="seal">Date: ${new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    html,
    filename: `Certificate_${crew.fullName.replace(/\s+/g, '_')}_${data.certificateType?.replace(/\s+/g, '_') || 'Certificate'}.pdf`
  };
}

async function generateDispatchLetter(dispatchId: string) {
  const dispatch = await prisma.dispatch.findUnique({
    where: { id: dispatchId },
    include: {
      crew: true,
    },
  });

  if (!dispatch) {
    throw new Error("Dispatch not found");
  }

  const html = `<html><body>Test dispatch letter</body></html>`;

  return {
    html,
    filename: `Dispatch_Letter_${dispatch.crew.fullName.replace(/\s+/g, "_")}_${Date.now()}.pdf`
  };
}
