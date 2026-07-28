import * as XLSX from 'xlsx';

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
  // Create worksheet
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

  // Download
  XLSX.writeFile(workbook, fullFilename);
}
