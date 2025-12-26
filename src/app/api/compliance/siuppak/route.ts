import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api-middleware";
import { PermissionLevel } from "@/lib/permission-middleware";
import ExcelJS from "exceljs";
import { decrypt } from "@/lib/crypto";

/**
 * GET /api/compliance/siuppak
 * Generate SIUPPAK Report Excel for Perhubungan Audit
 * 
 * Query params:
 * - type: 'bulanan' | 'semester' | 'tahunan'
 * - year: YYYY
 * - period: MM (bulanan) | 1/2 (semester)
 */
export const GET = withPermission("compliance", PermissionLevel.VIEW_ACCESS, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'semester';
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
  const period = searchParams.get('period') || '';

  // Calculate date range
  let startDate: Date;
  let endDate: Date;

  if (type === 'bulanan') {
    if (!period) {
      return NextResponse.json({ error: "Period (month) required for monthly report" }, { status: 400 });
    }
    const month = parseInt(period);
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 0, 23, 59, 59);
  } else if (type === 'semester') {
    if (!period) {
      return NextResponse.json({ error: "Period (semester) required for semester report" }, { status: 400 });
    }
    const semester = parseInt(period);
    if (semester === 1) {
      startDate = new Date(year, 0, 1); // Jan 1
      endDate = new Date(year, 5, 30, 23, 59, 59); // Jun 30
    } else {
      startDate = new Date(year, 6, 1); // Jul 1
      endDate = new Date(year, 11, 31, 23, 59, 59); // Dec 31
    }
  } else {
    // Yearan
    startDate = new Date(year, 0, 1);
    endDate = new Date(year, 11, 31, 23, 59, 59);
  }

  // Fetch data from database
  const assignments = await prisma.assignment.findMany({
    where: {
      OR: [
        {
          startDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        {
          endDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      ],
    },
    include: {
      crew: {
        include: {
          documents: true,
          contracts: true,
        },
      },
      vessel: {
        include: {
          principal: true,
        },
      },
    },
    orderBy: {
      startDate: 'asc',
    },
  });

  // Company info (PT HANMARINE GLOBAL INDONESIA)
  const companyInfo = {
    type: 'PUSAT',
    name: 'PT. HANMARINE GLOBAL INDONESIA',
    licenseType: 'SIUKAK',
    licenseNumber: '281.40',
    licenseYear: '2023',
    pic: 'MOCHAMAD RINALDY',
    address: 'RUKAN GRAHA CEMPAKA MAS BLOK E.05',
    phone: '0812 1270 3647',
    email: 'hgi@hanmarine.co',
    lastAudit: '2024-11-04',
  };

  // Create Excel workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HIMS - HANMARINE';
  workbook.created = new Date();

  // SHEET 1: Main Report
  const sheet1 = workbook.addWorksheet(`lap ${type}`);

  // Title
  sheet1.mergeCells('A1:AN1');
  const titleCell = sheet1.getCell('A1');
  titleCell.value = `LAPORAN ${type.toUpperCase()} KEGIATAN PEREKRUTAN DAN PENEMPATAN`;
  titleCell.font = { size: 14, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Year/Period info
  if (type === 'tahunan') {
    sheet1.mergeCells('A2:AN2');
    const yearCell = sheet1.getCell('A2');
    yearCell.value = `TAHUN ${year}`;
    yearCell.font = { size: 12, bold: true };
    yearCell.alignment = { horizontal: 'center' };
  }

  // Headers (Row 3-4)
  const headers = [
    { col: 1, text: 'NO', span: 1 },
    { col: 2, text: 'TANGGAL', span: 1 },
    { col: 3, text: 'JENIS PERUSAHAAN (PUSAT/CABANG)', span: 1 },
    { col: 4, text: 'NAMA PERUSAHAAN', span: 1 },
    { col: 5, text: 'IZIN USAHA ANGKUTAN LAUT/ IZIN USAHA KEAGENAN AWAK KAPAL/ IZIN USAHA  PENGELOLAAN KAPAL', span: 3, sub: ['JENIS PERIZINAN', 'NOMOR', 'TANGGAL'] },
    { col: 8, text: 'NAMA PENANGGUNG JAWAB', span: 1 },
    { col: 9, text: 'ALAMAT PERUSAHAAN ', span: 1 },
    { col: 10, text: 'NOMOR TELEPON PENANGGUNG JAWAB', span: 1 },
    { col: 11, text: 'EMAIL PERUSAHAAN', span: 1 },
    { col: 12, text: 'TANGGAL VERIFIKASI/AUDIT TERAKHIR', span: 1 },
    { col: 13, text: 'NAMA PELAUT', span: 1 },
    { col: 14, text: 'KEWARGANEGARAAN', span: 1 },
    { col: 15, text: 'KODE PELAUT', span: 1 },
    { col: 16, text: 'NO. BUKU PELAUT', span: 1 },
    { col: 17, text: 'NO. PKL', span: 1 },
    { col: 18, text: 'SYAHBANDAR PENYIJIL', span: 1 },
    { col: 19, text: 'NO. PASPOR', span: 1 },
    { col: 20, text: 'JABATAN', span: 1 },
    { col: 21, text: 'NOMOR CBA', span: 1 },
    { col: 22, text: 'NAMA KAPAL', span: 1 },
    { col: 23, text: 'NOMOR IMO / MMSI', span: 1 },
    { col: 24, text: 'BENDERA KAPAL', span: 1 },
    { col: 25, text: 'JENIS KAPAL', span: 1 },
    { col: 26, text: 'PEMILIK KAPAL', span: 1 },
    { col: 27, text: 'OPERATOR / PRINCIPAL KAPAL', span: 1 },
    { col: 28, text: 'NAMA OPERATOR / PRINCIPAL KAPAL', span: 1 },
    { col: 29, text: 'JENIS ASURANSI/JAMINAN SOSIAL', span: 1 },
    { col: 30, text: 'DAERAH PELAYARAN', span: 1 },
    { col: 31, text: 'TANGGAL SIGN ON', span: 1 },
    { col: 32, text: 'PELABUHAN SIGN ON', span: 1 },
    { col: 33, text: 'TANGGAL SIGN OFF', span: 1 },
    { col: 34, text: 'PELABUHAN SIGN OFF', span: 1 },
    { col: 35, text: 'PENEMPATAN DN / LN', span: 1 },
    { col: 36, text: 'JENIS KELAMIN', span: 1 },
    { col: 37, text: 'NAMA KELUARGA TERDEKAT', span: 1 },
    { col: 38, text: 'NOMOR TELEPON KELUARGA TERDEKAT', span: 1 },
    { col: 39, text: ' KATEGORI SIGN OFF', span: 1 },
    { col: 40, text: 'KETERANGAN', span: 1 },
  ];

  // Set headers
  headers.forEach((h) => {
    const cell = sheet1.getCell(3, h.col);
    cell.value = h.text;
    cell.font = { bold: true, size: 9 };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };

    if (h.span && h.span > 1 && h.sub) {
      // Merge row 3 for sub-headers
      sheet1.mergeCells(3, h.col, 3, h.col + h.span - 1);
      
      // Add sub-headers in row 4
      h.sub.forEach((subText, idx) => {
        const subCell = sheet1.getCell(4, h.col + idx);
        subCell.value = subText;
        subCell.font = { bold: true, size: 8 };
        subCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
        subCell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    } else {
      // Merge rows 3-4 for single headers
      sheet1.mergeCells(3, h.col, 4, h.col);
    }
  });

  // Column widths
  sheet1.getColumn(1).width = 5;   // NO
  sheet1.getColumn(2).width = 12;  // TANGGAL
  sheet1.getColumn(3).width = 10;  // JENIS PERUSAHAAN
  sheet1.getColumn(4).width = 25;  // NAMA PERUSAHAAN
  sheet1.getColumn(13).width = 20; // NAMA PELAUT
  sheet1.getColumn(15).width = 12; // KODE PELAUT
  sheet1.getColumn(16).width = 12; // BUKU PELAUT
  sheet1.getColumn(17).width = 20; // NO PKL
  sheet1.getColumn(19).width = 12; // PASPOR
  sheet1.getColumn(20).width = 10; // JABATAN
  sheet1.getColumn(22).width = 20; // NAMA KAPAL
  sheet1.getColumn(28).width = 25; // PRINCIPAL
  sheet1.getColumn(37).width = 20; // KELUARGA
  sheet1.getColumn(38).width = 15; // TELP KELUARGA

  // Data rows (starting from row 5 for non-tahunan, row 6 for tahunan)
  const dataStartRow = type === 'tahunan' ? 6 : 5;
  let rowNum = dataStartRow;

  for (const assignment of assignments) {
    const crew = assignment.crew;
    const vessel = assignment.vessel;
    const principal = vessel?.principal;

    // Find seaman book and passport
    const seamanBook = crew.documents?.find((d) => d.docType === 'SEAMAN_BOOK');
    const passport = crew.documents?.find((d) => d.docType === 'PASSPORT');
    const pklContract = crew.contracts?.find((c) => c.contractKind === 'OFFICE_PKL');

    // Decrypt sensitive data if encrypted
    let passportNumber = '';
    try {
      if (passport?.docNumber) {
        passportNumber = decrypt(passport.docNumber);
      }
    } catch {
      passportNumber = passport?.docNumber || '';
    }

    let seamanCode = '';
    try {
      if (crew.seamanBookNumber) {
        seamanCode = decrypt(crew.seamanBookNumber);
      }
    } catch {
      seamanCode = crew.seamanBookNumber || '';
    }

    const row = sheet1.getRow(rowNum);
    const values = [
      rowNum - dataStartRow + 1, // NO
      new Date().toLocaleDateString('id-ID'), // TANGGAL
      companyInfo.type, // JENIS PERUSAHAAN
      companyInfo.name, // NAMA PERUSAHAAN
      companyInfo.licenseType, // JENIS PERIZINAN
      companyInfo.licenseNumber, // NOMOR
      companyInfo.licenseYear, // TANGGAL
      companyInfo.pic, // PIC
      companyInfo.address, // ALAMAT
      companyInfo.phone, // TELEPON
      companyInfo.email, // EMAIL
      companyInfo.lastAudit, // AUDIT TERAKHIR
      crew.fullName, // NAMA PELAUT
      crew.nationality || 'INA', // KEWARGANEGARAAN
      seamanCode, // KODE PELAUT
      seamanBook?.docNumber || '', // BUKU PELAUT
      pklContract?.contractNumber || '', // NO PKL
      'Tanjung Priok', // SYAHBANDAR
      passportNumber, // PASPOR
      assignment.rank || '', // JABATAN
      principal?.registrationNumber || '', // NOMOR CBA
      vessel?.name || '', // NAMA KAPAL
      vessel?.imoNumber || '', // IMO/MMSI
      vessel?.flag || '', // BENDERA
      vessel?.type || '', // JENIS KAPAL
      principal?.name || '', // PEMILIK KAPAL
      principal?.name || '', // OPERATOR
      principal?.name || '', // NAMA OPERATOR
      '', // ASURANSI
      'ASIA', // DAERAH PELAYARAN
      assignment.startDate ? new Date(assignment.startDate).toLocaleDateString('id-ID') : '', // SIGN ON
      assignment.remarks || '', // PELABUHAN SIGN ON
      assignment.endDate ? new Date(assignment.endDate).toLocaleDateString('id-ID') : '', // SIGN OFF
      '', // PELABUHAN SIGN OFF
      'LN', // DN/LN
      'N/A', // JENIS KELAMIN
      crew.emergencyContactName || '', // KELUARGA
      crew.emergencyContactPhone || '', // TELP KELUARGA
      '', // KATEGORI SIGN OFF
      '', // KETERANGAN
    ];

    row.values = values;
    row.font = { size: 9 };
    row.alignment = { vertical: 'middle', wrapText: false };

    // Borders
    for (let col = 1; col <= 40; col++) {
      const cell = row.getCell(col);
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    }

    rowNum++;
  }

  // Generate Excel buffer
  const buffer = await workbook.xlsx.writeBuffer();

  // Return as downloadable file
  const filename = `LAPORAN_${type.toUpperCase()}_SIUPPAK_${year}${period ? '_' + period : ''}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
});
