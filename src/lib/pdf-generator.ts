import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Generate PDF from HTML content
 * Used for form approvals, certifications, and official documents
 */
export async function generatePDF(
  htmlContent: string,
  filename: string,
  options: {
    format?: 'A4' | 'Letter';
    margin?: { top?: string; right?: string; bottom?: string; left?: string };
  } = {}
): Promise<{ success: boolean; path?: string; error?: string }> {
  let browser;
  try {
    // Launch browser in headless mode
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'pdfs');
    await fs.mkdir(uploadsDir, { recursive: true });

    const filepath = path.join(uploadsDir, filename);

    await page.pdf({
      path: filepath,
      format: options.format || 'A4',
      margin: options.margin || {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
      printBackground: true,
    });

    return { success: true, path: `/uploads/pdfs/${filename}` };
  } catch (error) {
    console.error('PDF generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Generate Form Submission PDF with styled HTML
 */
export function generateFormSubmissionHTML(formData: {
  crewName: string;
  rank: string;
  vessel: string;
  principal: string;
  department: string;
  joinDate: string;
  contractEndDate: string;
  formContent: Record<string, unknown>;
  approvedBy: string;
  approvedAt: Date;
}): string {
  const approveDate = new Date(formData.approvedAt).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Form Persiapan Pemberangkatan</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          color: #333;
          line-height: 1.6;
        }
        
        .container {
          max-width: 8.5in;
          margin: 0 auto;
          padding: 40px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #1e40af;
          padding-bottom: 20px;
        }
        
        .header h1 {
          font-size: 24px;
          color: #1e40af;
          margin-bottom: 5px;
        }
        
        .header p {
          font-size: 12px;
          color: #666;
        }
        
        .section {
          margin-bottom: 25px;
        }
        
        .section-title {
          font-size: 14px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 12px;
          padding-bottom: 5px;
          border-bottom: 1px solid #e0e7ff;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 15px;
        }
        
        .info-item {
          background: #f8fafc;
          padding: 10px;
          border-radius: 4px;
          border-left: 3px solid #3b82f6;
        }
        
        .info-label {
          font-size: 12px;
          color: #666;
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 3px;
        }
        
        .info-value {
          font-size: 13px;
          color: #333;
        }
        
        .checklist {
          background: #f8fafc;
          padding: 15px;
          border-radius: 4px;
          border-left: 3px solid #10b981;
        }
        
        .checklist-item {
          display: flex;
          margin-bottom: 8px;
          font-size: 13px;
        }
        
        .checklist-item::before {
          content: '✓';
          color: #10b981;
          font-weight: bold;
          margin-right: 8px;
          min-width: 20px;
        }
        
        .signature-section {
          margin-top: 40px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }
        
        .signature-block {
          text-align: center;
        }
        
        .signature-line {
          border-top: 1px solid #333;
          margin-top: 30px;
          padding-top: 5px;
          font-size: 12px;
          color: #666;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e0e7ff;
          text-align: center;
          font-size: 10px;
          color: #999;
        }
        
        .approved-badge {
          display: inline-block;
          background: #10b981;
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 12px;
          margin-bottom: 20px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>FORM PERSIAPAN PEMBERANGKATAN</h1>
          <p>Prepare Joining Form - Seafarer Embarkation Checklist</p>
        </div>
        
        <!-- Approval Badge -->
        <div style="text-align: center;">
          <div class="approved-badge">✓ APPROVED</div>
        </div>
        
        <!-- Crew Information -->
        <div class="section">
          <div class="section-title">INFORMASI CREW</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Nama Crew</div>
              <div class="info-value">${formData.crewName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Jabatan</div>
              <div class="info-value">${formData.rank}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Kapal</div>
              <div class="info-value">${formData.vessel}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Principal</div>
              <div class="info-value">${formData.principal}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Departemen</div>
              <div class="info-value">${formData.department}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Tanggal Join</div>
              <div class="info-value">${new Date(formData.joinDate).toLocaleDateString('id-ID')}</div>
            </div>
          </div>
        </div>
        
        <!-- Contract Information -->
        <div class="section">
          <div class="section-title">INFORMASI KONTRAK</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Tanggal Mulai</div>
              <div class="info-value">${new Date(formData.joinDate).toLocaleDateString('id-ID')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Tanggal Berakhir</div>
              <div class="info-value">${new Date(formData.contractEndDate).toLocaleDateString('id-ID')}</div>
            </div>
          </div>
        </div>
        
        <!-- Checklist -->
        <div class="section">
          <div class="section-title">CHECKLIST PEMBERANGKATAN</div>
          <div class="checklist">
            <div class="checklist-item">Medical clearance / Sertifikat Kesehatan</div>
            <div class="checklist-item">Passport & Visa dokumentasi lengkap</div>
            <div class="checklist-item">STCW Certificate & Seafaring book</div>
            <div class="checklist-item">Asuransi kesehatan seafarer</div>
            <div class="checklist-item">Pelatihan STCW terkini (Safety briefing)</div>
            <div class="checklist-item">Dokumen kontrak ditandatangani</div>
            <div class="checklist-item">Equipment & Personal gear ready</div>
            <div class="checklist-item">Air ticket & travel documentation</div>
          </div>
        </div>
        
        <!-- Approval Information -->
        <div class="section">
          <div class="section-title">INFORMASI PERSETUJUAN</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Disetujui Oleh</div>
              <div class="info-value">${formData.approvedBy}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Tanggal Persetujuan</div>
              <div class="info-value">${approveDate}</div>
            </div>
          </div>
        </div>
        
        <!-- Signatures -->
        <div class="signature-section">
          <div class="signature-block">
            <p style="font-weight: bold;">Disetujui oleh:</p>
            <div class="signature-line">Koordinator Crew / CDMO</div>
          </div>
          <div class="signature-block">
            <p style="font-weight: bold;">Diketahui oleh:</p>
            <div class="signature-line">Direktur / Manager</div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p>Dokumen ini dihasilkan secara otomatis oleh Sistem HIMS</p>
          <p>Generated: ${new Date().toLocaleString('id-ID')}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
