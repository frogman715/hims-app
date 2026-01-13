# 📋 FEATURE SPEC 1: PDF GENERATION
**Priority:** 🔴 CRITICAL  
**Timeline:** 3-4 days (Week 1)  
**Dev:** Dev A  
**Status:** Ready to implement  

---

## 🎯 OBJECTIVE
Enable users to download forms, documents, and crew lists as PDF files for printing, archiving, and sharing.

---

## 📋 REQUIREMENTS

### **Functional Requirements**
```
FR-1: Download form as PDF
  - User clicks "Download PDF" button
  - System generates PDF with form data
  - PDF downloads to user's device
  - File named: [form-type]_[crew-id]_[date].pdf

FR-2: Download crew list as PDF
  - From crew management page
  - Shows rank, vessel, documents status
  - Formatted for printing

FR-3: Download document as PDF
  - From document management
  - Preserve original formatting
  - Add watermark if draft

FR-4: Batch PDF download
  - Select multiple forms
  - Generate ZIP file
  - Contains all PDFs

FR-5: Email PDF attachment
  - Auto-attach PDF when emailing
  - PDF included in email body
  - Also available as download
```

### **Non-Functional Requirements**
```
NFR-1: Performance
  - PDF generation < 5 seconds
  - No blocking (use background jobs for large batches)
  - Caching for frequently generated PDFs

NFR-2: File Size
  - Single PDF < 5MB
  - Batch ZIP < 50MB

NFR-3: Security
  - Only authenticated users can download
  - Role-based access (can't download others' data)
  - Watermark for draft documents
  - No sensitive info in filename

NFR-4: Reliability
  - Retry on failure
  - Graceful degradation
  - Error notification
```

---

## 🏗️ TECHNICAL DESIGN

### **Technology Stack**
```
Library: Puppeteer (browser automation)
Alternative: html2pdf (if issues with puppeteer)
Font: Arial, Times New Roman (system fonts)
Size: A4 landscape for crew lists, A4 portrait for forms
Color: Black & white optimized, color if logo
```

### **Architecture**

```
User clicks "Download PDF"
  ↓
API Route: /api/forms/[id]/pdf
  ↓
PDF Service: /src/lib/pdf/generator.ts
  ↓
Render HTML Template: /src/lib/pdf/templates/*.html
  ↓
Launch Puppeteer → Generate PDF
  ↓
Stream to client OR save to storage
  ↓
User downloads file
```

### **File Structure**
```
src/
  lib/
    pdf/
      generator.ts           # Main PDF generation
      templates/
        form.html            # Form template
        crew-list.html       # Crew list template
        document.html        # Document template
  app/api/
    forms/
      [id]/
        pdf/
          route.ts           # Form PDF endpoint
    crew/
      [id]/
        pdf/
          route.ts           # Crew PDF endpoint
    documents/
      [id]/
        pdf/
          route.ts           # Document PDF endpoint
```

---

## 💻 CODE TEMPLATES

### **1. PDF Generator Service**

```typescript
// src/lib/pdf/generator.ts

import puppeteer, { Browser, Page } from 'puppeteer';
import { readFile } from 'fs/promises';
import path from 'path';

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browserInstance;
}

interface PDFOptions {
  filename: string;
  title?: string;
  createdAt?: Date;
  data: Record<string, any>;
}

export async function generatePDF(
  templateName: string,
  options: PDFOptions
): Promise<Buffer> {
  const browser = await getBrowser();
  let page: Page | null = null;

  try {
    page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1200, height: 1600 });

    // Load template
    const templatePath = path.join(
      process.cwd(),
      'src/lib/pdf/templates',
      `${templateName}.html`
    );
    const htmlContent = await readFile(templatePath, 'utf-8');

    // Inject data into template
    const html = injectData(htmlContent, options.data);

    // Set content
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: '<div style="font-size: 10px; margin: 0 10mm; width: 100%; text-align: center; color: #999;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    });

    return pdf;
  } finally {
    if (page) await page.close();
  }
}

function injectData(html: string, data: Record<string, any>): string {
  let result = html;
  
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    result = result.replaceAll(placeholder, String(value || ''));
  });

  return result;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
```

### **2. Form PDF Route**

```typescript
// src/app/api/forms/[id]/pdf/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/db';
import { generatePDF } from '@/lib/pdf/generator';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch form data
    const form = await prisma.form.findUnique({
      where: { id: params.id },
      include: {
        seafarer: true,
        formType: true,
      },
    });

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      );
    }

    // Check authorization
    const isAuthorized = 
      session.user.id === form.seafarerId ||
      session.user.role === 'ADMIN' ||
      session.user.role === 'CDMO';

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Prepare data for PDF
    const pdfData = {
      formType: form.formType.name,
      seafarerName: form.seafarer.fullName,
      seafarerId: form.seafarer.id,
      date: new Date(form.createdAt).toLocaleDateString('id-ID'),
      status: form.status,
      // ... other form data
    };

    // Generate PDF
    const pdf = await generatePDF('form', {
      filename: `${form.formType.slug}_${form.seafarerId}_${new Date().toISOString().split('T')[0]}.pdf`,
      data: pdfData,
    });

    // Return PDF
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${pdfData.filename}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
```

### **3. Form HTML Template**

```html
<!-- src/lib/pdf/templates/form.html -->

<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #333;
    }

    .container {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20px;
    }

    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }

    .header h1 {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .header p {
      font-size: 10px;
      color: #666;
    }

    .form-section {
      margin-bottom: 15px;
    }

    .section-title {
      background-color: #f0f0f0;
      padding: 5px 10px;
      font-weight: bold;
      font-size: 12px;
      margin-bottom: 10px;
      border-left: 3px solid #003d5c;
    }

    .form-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 10px;
    }

    .form-group.full {
      grid-template-columns: 1fr;
    }

    .form-field {
      display: flex;
      flex-direction: column;
    }

    .form-field label {
      font-weight: bold;
      font-size: 10px;
      margin-bottom: 3px;
      color: #003d5c;
    }

    .form-field input,
    .form-field textarea,
    .form-field select {
      border: none;
      border-bottom: 1px solid #000;
      padding: 3px 0;
      font-size: 11px;
      background-color: transparent;
    }

    .form-field input:disabled,
    .form-field textarea:disabled,
    .form-field select:disabled {
      color: #333;
    }

    .form-field textarea {
      min-height: 40px;
      resize: vertical;
    }

    .signature-section {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-top: 30px;
    }

    .signature-line {
      text-align: center;
      border-top: 1px solid #000;
      padding-top: 5px;
      font-size: 10px;
    }

    .signature-line div:first-child {
      height: 40px;
      margin-bottom: 5px;
    }

    .footer {
      text-align: center;
      font-size: 9px;
      color: #999;
      margin-top: 20px;
      border-top: 1px solid #ddd;
      padding-top: 10px;
    }

    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .container {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{formType}}</h1>
      <p>Generated on {{date}}</p>
    </div>

    <div class="form-section">
      <div class="section-title">Seafarer Information</div>
      
      <div class="form-group">
        <div class="form-field">
          <label>Full Name</label>
          <input type="text" value="{{seafarerName}}" disabled>
        </div>
        <div class="form-field">
          <label>ID Number</label>
          <input type="text" value="{{seafarerId}}" disabled>
        </div>
      </div>

      <div class="form-group">
        <div class="form-field">
          <label>Status</label>
          <input type="text" value="{{status}}" disabled>
        </div>
      </div>
    </div>

    <!-- Additional form sections here -->

    <div class="signature-section">
      <div class="signature-line">
        <div></div>
        <span>Seafarer Signature</span>
      </div>
      <div class="signature-line">
        <div></div>
        <span>Officer Signature</span>
      </div>
      <div class="signature-line">
        <div></div>
        <span>Date</span>
      </div>
    </div>

    <div class="footer">
      <p>This is an electronically generated document. It is valid without signature.</p>
      <p>HANMARINE HIMS v2 | {{date}}</p>
    </div>
  </div>
</body>
</html>
```

### **4. React Download Button**

```typescript
// src/components/forms/DownloadPDFButton.tsx

'use client';

import { useState } from 'react';
import { Download, Loader } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DownloadPDFButtonProps {
  formId: string;
  formType: string;
}

export function DownloadPDFButton({ formId, formType }: DownloadPDFButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/forms/${formId}/pdf`);
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formType}_${formId}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('PDF download error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleDownload}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        {isLoading ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        Download PDF
      </Button>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
```

---

## 🧪 TESTING CHECKLIST

### **Unit Tests**
```
[ ] PDF generator initializes correctly
[ ] Template injection works with all data types
[ ] HTML escaping prevents XSS
[ ] File naming follows pattern
[ ] Error handling on browser crash
[ ] Error handling on template not found
```

### **Integration Tests**
```
[ ] API route returns PDF successfully
[ ] PDF file is readable
[ ] Authentication required
[ ] Authorization checked
[ ] PDF contains correct data
[ ] File download works
```

### **Functional Tests**
```
[ ] User can download form PDF
[ ] User can download crew list PDF
[ ] User can download document PDF
[ ] User cannot download without auth
[ ] User cannot download others' forms (non-ADMIN)
[ ] Admin can download any PDF
[ ] PDF looks correct when printed
[ ] Special characters handled correctly
[ ] Large forms generate within 5 seconds
```

### **Performance Tests**
```
[ ] Single PDF < 5 seconds
[ ] API latency < 100ms (excluding generation)
[ ] Concurrent requests don't block
[ ] Memory usage reasonable
[ ] No memory leaks
```

---

## 📦 DEPENDENCIES

```bash
npm install puppeteer
# Optional alternative:
npm install html2pdf
```

### **Package Details**
```
puppeteer: ^21.0.0 (headless browser automation)
Alternative: html2pdf: ^0.10.0 (lighter weight)
```

---

## ⚠️ KNOWN ISSUES & SOLUTIONS

### **Issue 1: Puppeteer Memory Usage**
```
Problem: Each PDF uses significant memory
Solution: Close browser connections, use connection pooling
```

### **Issue 2: Fonts Not Rendering**
```
Problem: Custom fonts don't appear in PDF
Solution: Use system fonts only (Arial, Times New Roman)
```

### **Issue 3: Images Not Showing**
```
Problem: Images not rendered in puppeteer
Solution: Use base64-encoded images or data URIs
```

### **Issue 4: Styling Issues**
```
Problem: CSS not applying correctly
Solution: Inline styles instead of external CSS
```

---

## 📋 TASKS BREAKDOWN

**Day 1 (3 hours):**
- [ ] Install puppeteer
- [ ] Create PDF generator service
- [ ] Test basic generation

**Day 2 (4 hours):**
- [ ] Create HTML templates
- [ ] Create API routes
- [ ] Test with real data

**Day 3 (3 hours):**
- [ ] Create React button component
- [ ] Add to form page
- [ ] Test download flow

**Day 4 (2 hours):**
- [ ] Performance optimization
- [ ] Error handling
- [ ] Create PR & code review

---

## ✅ ACCEPTANCE CRITERIA

- ✅ Users can download forms as PDF
- ✅ PDFs generated in < 5 seconds
- ✅ PDFs look good when printed
- ✅ Only authorized users can download
- ✅ Error messages clear
- ✅ No memory leaks
- ✅ Code reviewed and tested

---

**Status: Ready to implement 🚀**
**Start: Jan 15, 2026**
**End: Jan 17, 2026**
