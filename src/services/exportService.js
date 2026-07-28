const PDFDocument = require("pdfkit");
const XLSX = require("xlsx");

function rowsToXlsxBuffer(rows, sheetName = "Export") {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows || []);
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName.slice(0, 31));
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

function rowsToPdfBuffer(rows, title = "CA File Tracker Export") {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 32, size: "A4", layout: "landscape" });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const headers = [...new Set((rows || []).flatMap((row) => Object.keys(row)))].slice(0, 8);
    doc.fontSize(16).text(title, { underline: true });
    doc.moveDown();
    if (!rows?.length) {
      doc.fontSize(11).text("No data available.");
      doc.end();
      return;
    }
    doc.fontSize(8);
    doc.text(headers.join(" | "));
    doc.moveDown(0.5);
    rows.slice(0, 500).forEach((row) => {
      doc.text(headers.map((header) => String(row[header] ?? "")).join(" | "), {
        lineGap: 2,
      });
    });
    if (rows.length > 500) doc.text(`\nOnly first 500 rows included in PDF. Use Excel export for full data.`);
    doc.end();
  });
}

module.exports = { rowsToXlsxBuffer, rowsToPdfBuffer };
