import * as path from "path";
import * as ExcelJS from "exceljs";
import Docxtemplater from "docxtemplater";
import Pizzip from "pizzip";
import { NextResponse } from "next/server";
import * as fs from "fs";

/**
 * Load Excel template from the form_reference directory
 */
export async function loadTemplate(templateName: string): Promise<ExcelJS.Workbook> {
  const templatePath = path.join(
    process.cwd(),
    "src/form_reference/CR",
    templateName
  );

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(templatePath);
  return workbook;
}

/**
 * Load DOCX template from the form_reference directory
 */
export async function loadDocxTemplate(templateName: string): Promise<Docxtemplater> {
  const templatePath = path.join(
    process.cwd(),
    "src/form_reference/CR",
    templateName
  );

  const content = fs.readFileSync(templatePath, "binary");
  const zip = new Pizzip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  return doc;
}

/**
 * Fill common crew fields across CR forms
 */
export function fillCommonCrewFields(
  worksheet: ExcelJS.Worksheet,
  crew: {
    fullName: string;
    dateOfBirth?: Date | null;
    placeOfBirth?: string | null;
    nationality?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    seamanBookNumber?: string | null;
    seamanBookExpiry?: Date | null;
    passportNumber?: string | null;
    passportExpiry?: Date | null;
    rank?: string | null;
  },
  options?: {
    nameCell?: string;
    familyNameCell?: string;
    givenNameCell?: string;
    birthDateCell?: string;
    placeOfBirthCell?: string;
    nationalityCell?: string;
    addressCell?: string;
    phoneCell?: string;
    emailCell?: string;
    seamanBookNumberCell?: string;
    seamanBookExpiryCell?: string;
    passportNumberCell?: string;
    passportExpiryCell?: string;
    rankCell?: string;
  }
): void {
  // Personal Information Section
  if (crew.fullName && (options?.familyNameCell || options?.givenNameCell)) {
    const nameParts = crew.fullName.split(' ');
    const familyName = nameParts.slice(-1)[0] || ''; // Last name
    const givenName = nameParts.slice(0, -1).join(' ') || ''; // First names

    if (options.familyNameCell) {
      worksheet.getCell(options.familyNameCell).value = familyName;
    }
    if (options.givenNameCell) {
      worksheet.getCell(options.givenNameCell).value = givenName;
    }
  }

  // Birth details
  if (crew.dateOfBirth && options?.birthDateCell) {
    worksheet.getCell(options.birthDateCell).value = crew.dateOfBirth.toLocaleDateString();
  }
  if (crew.placeOfBirth && options?.placeOfBirthCell) {
    worksheet.getCell(options.placeOfBirthCell).value = crew.placeOfBirth;
  }

  // Address
  if (crew.address && options?.addressCell) {
    worksheet.getCell(options.addressCell).value = crew.address;
  }

  // Contact details
  if (crew.phone && options?.phoneCell) {
    worksheet.getCell(options.phoneCell).value = crew.phone;
  }
  if (crew.email && options?.emailCell) {
    worksheet.getCell(options.emailCell).value = crew.email;
  }

  // Nationality
  if (crew.nationality && options?.nationalityCell) {
    worksheet.getCell(options.nationalityCell).value = crew.nationality;
  }

  // Seaman Book details
  if (crew.seamanBookNumber && options?.seamanBookNumberCell) {
    worksheet.getCell(options.seamanBookNumberCell).value = crew.seamanBookNumber;
  }
  if (crew.seamanBookExpiry && options?.seamanBookExpiryCell) {
    worksheet.getCell(options.seamanBookExpiryCell).value = crew.seamanBookExpiry.toLocaleDateString();
  }

  // Passport details
  if (crew.passportNumber && options?.passportNumberCell) {
    worksheet.getCell(options.passportNumberCell).value = crew.passportNumber;
  }
  if (crew.passportExpiry && options?.passportExpiryCell) {
    worksheet.getCell(options.passportExpiryCell).value = crew.passportExpiry.toLocaleDateString();
  }

  // Rank/Position
  if (crew.rank && options?.rankCell) {
    worksheet.getCell(options.rankCell).value = crew.rank;
  }
}

/**
 * Export workbook as response with proper headers
 */
export function exportWorkbookAsResponse(
  workbook: ExcelJS.Workbook,
  filename: string
): Promise<NextResponse> {
  return new Promise(async (resolve, reject) => {
    try {
      const buffer = await workbook.xlsx.writeBuffer();

      const response = new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });

      resolve(response);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Export docx document as response with proper headers
 */
export function exportDocxAsResponse(
  doc: Docxtemplater,
  filename: string
): NextResponse {
  const buf = doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

/**
 * Generate common crew data object for docx templating
 */
export function getCommonCrewData(
  crew: {
    fullName: string;
    dateOfBirth?: Date | null;
    placeOfBirth?: string | null;
    nationality?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    seamanBookNumber?: string | null;
    seamanBookExpiry?: Date | null;
    passportNumber?: string | null;
    passportExpiry?: Date | null;
    rank?: string | null;
  },
  additionalData?: Record<string, unknown>
): Record<string, unknown> {
  // Split full name into components
  const nameParts = crew.fullName.split(' ');
  const familyName = nameParts.slice(-1)[0] || '';
  const givenName = nameParts.slice(0, -1).join(' ') || '';

  const data = {
    // Personal Information
    fullName: crew.fullName,
    familyName: familyName,
    givenName: givenName,
    dateOfBirth: crew.dateOfBirth?.toLocaleDateString() || '',
    placeOfBirth: crew.placeOfBirth || '',
    nationality: crew.nationality || '',

    // Contact Information
    address: crew.address || '',
    phone: crew.phone || '',
    email: crew.email || '',

    // Documents
    seamanBookNumber: crew.seamanBookNumber || '',
    seamanBookExpiry: crew.seamanBookExpiry?.toLocaleDateString() || '',
    passportNumber: crew.passportNumber || '',
    passportExpiry: crew.passportExpiry?.toLocaleDateString() || '',

    // Professional
    rank: crew.rank || '',

    // Current date
    currentDate: new Date().toLocaleDateString(),
    currentDateTime: new Date().toLocaleString(),

    ...additionalData,
  };

  return data;
}