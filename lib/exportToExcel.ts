import * as XLSX from 'xlsx';
import fs from 'fs';

export interface ExportColumn {
  key: string;
  label: string;
  width?: number;
}

export function exportToExcel(
  data: Record<string, any>[],
  columns: ExportColumn[],
  filename: string
) {
  // Create worksheet with styled header
  const worksheet = XLSX.utils.json_to_sheet(
    data.map(row => {
      const mappedRow: Record<string, any> = {};
      columns.forEach(col => {
        mappedRow[col.label] = row[col.key] ?? '';
      });
      return mappedRow;
    }),
    { header: columns.map(c => c.label) }
  );

  // Style the header row
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = {
        fill: { fgColor: { rgb: "E5262C" } },
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center" }
      };
    }
  }

  // Calculate column widths based on content
  const colWidths = columns.map(col => {
    const headerWidth = col.label.length;
    const maxWidth = data.reduce((max, row) => {
      const value = String(row[col.key] ?? '');
      return Math.max(max, value.length);
    }, headerWidth);
    
    // Set reasonable width (min 10, max 50)
    return Math.min(Math.max(maxWidth + 2, 10), 50);
  });

  worksheet['!cols'] = colWidths.map(w => ({ wch: w }));

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  // Generate filename with date
  const date = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}-${date}.xlsx`;

  // Generate buffer and write with Node.js fs to avoid XLSX bundler detection issues
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  fs.writeFileSync(fullFilename, buffer);
}
