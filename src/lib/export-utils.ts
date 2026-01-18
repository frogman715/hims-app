/**
 * Data Export Utilities
 * Export data to CSV, Excel, and PDF formats
 */

type DataRecord = Record<string, string | number | boolean | null | undefined>;

/**
 * Export data to CSV
 */
export function exportToCSV(
  data: DataRecord[],
  filename: string = 'export.csv'
): void {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  let csv = headers.join(',') + '\n';
  
  data.forEach((row) => {
    const values = headers.map((header) => {
      let value = row[header];
      
      // Handle different data types
      if (value === null || value === undefined) {
        return '';
      }
      
      // Quote strings containing commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    });
    
    csv += values.join(',') + '\n';
  });

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, filename);
}

/**
 * Export data to Excel (XLSX format)
 * Requires: npm install xlsx
 */
export async function exportToExcel(
  data: DataRecord[],
  filename: string = 'export.xlsx',
  sheetName: string = 'Data'
): Promise<void> {
  try {
    const XLSX = await import('xlsx');
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    XLSX.writeFile(workbook, filename);
  } catch (err) {
    console.error('Failed to export to Excel:', err);
    // Fallback to CSV if XLSX not available
    exportToCSV(data, filename.replace('.xlsx', '.csv'));
  }
}

/**
 * Export table as PDF
 * Note: Client-side only, requires browser environment
 */
export async function exportTableToPDF(
  tableElement: HTMLTableElement,
  filename: string = 'export.pdf'
): Promise<void> {
  // Only runs in browser, not during build
  if (typeof window === 'undefined') {
    console.error('PDF export only available in browser');
    return;
  }

  try {
    // Dynamic import to avoid build-time errors
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const html2pdfModule = await (eval('import("html2pdf.js")') as Promise<any>);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const html2pdf = html2pdfModule.default as any;
    
    if (typeof html2pdf === 'function') {
      const opt = {
        margin: 10,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' },
      };

      html2pdf().set(opt).from(tableElement).save();
    }
  } catch (err) {
    console.error('Failed to export to PDF:', err);
    alert('PDF export failed. Please use browser print function instead.');
  }
}

/**
 * Print document
 */
export function printDocument(elementId: string, title: string = 'Document'): void {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with ID "${elementId}" not found`);
    return;
  }

  const printWindow = window.open('', '', 'height=600,width=800');
  if (!printWindow) {
    alert('Please allow pop-ups for printing');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      ${element.innerHTML}
      <script>
        window.print();
        window.close();
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * Generic file download helper
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Export table as text format
 */
export function exportTableToText(
  data: DataRecord[],
  filename: string = 'export.txt'
): void {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const columnWidths = headers.map((h) => Math.max(h.length, 20));

  // Create formatted text
  let text = '';
  
  // Headers
  text += headers.map((h, i) => h.padEnd(columnWidths[i])).join(' | ') + '\n';
  text += headers.map((_, i) => '-'.repeat(columnWidths[i])).join('-+-') + '\n';

  // Data rows
  data.forEach((row) => {
    const values = headers.map((header, i) => {
      const value = String(row[header] || '');
      return value.padEnd(columnWidths[i]);
    });
    text += values.join(' | ') + '\n';
  });

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
  downloadFile(blob, filename);
}
