import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

// 1. Export CSV
export function exportToCSV(filename, data) {
  if (!data || !data.length) return;

  const headers = Object.keys(data[0]);
  const csvRows = [];
  csvRows.push(headers.join(','));

  data.forEach((row) => {
    const values = headers.map((header) => {
      const escaped = ('' + (row[header] || '')).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 2. Export Excel (.xlsx)
export function exportToExcel(filename, data) {
  if (!data || !data.length) return;

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Report');

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// 3. Export PDF
export function exportToPDF(filename, title, data) {
  if (!data || !data.length) return;

  const doc = new jsPDF('landscape');
  doc.setFontSize(16);
  doc.setTextColor(139, 92, 246);
  doc.text(title || 'IDEALAB SMART ATTENDANCE REPORT', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

  let y = 40;
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  // Table headers
  const headers = Object.keys(data[0]);
  let x = 14;
  headers.forEach((h) => {
    doc.text(h.toUpperCase(), x, y);
    x += 35;
  });

  y += 6;
  doc.line(14, y, 280, y);
  y += 6;

  // Rows
  data.forEach((row) => {
    if (y > 180) {
      doc.addPage();
      y = 20;
    }
    let rx = 14;
    headers.forEach((h) => {
      doc.text(String(row[h] || ''), rx, y);
      rx += 35;
    });
    y += 8;
  });

  doc.save(`${filename}.pdf`);
}
