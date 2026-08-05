const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.resolve(__dirname, "..", "app.js"), "utf8");

function block(start, end) {
  const match = source.match(new RegExp(`${start}[\\s\\S]*?(?=${end})`));
  assert.ok(match, `Missing source block: ${start}`);
  return match[0];
}

const records = block("function feeReceivedPdfRecords", "\\nfunction feeReceivedPdfFilterSummary");
assert.match(records, /billedPdfRecord\(file, index\)/);
assert.match(records, /record\.receivedAmount > 0\.005/,
  "The report must omit reversed or otherwise invalid receipts that produce no active received amount");
assert.match(records, /PAN\/Reg:/);
assert.match(records, /FY:/);

const pdf = block("async function createFeeReceivedFilesPdfDocument", "\\nasync function exportFeeReceivedFilesPdf");
for (const heading of ["SN", "Client Details", "Service / FY", "Billing Details", "Receipt Details", "Balance", "Payment Mode"]) {
  assert.match(pdf, new RegExp(`header: "${heading.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}"`));
}
for (const obsolete of ["Bill No.", "Transaction Status", "Payment Status", "Received By"]) {
  assert.doesNotMatch(pdf, new RegExp(`header: "${obsolete.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}"`));
}
assert.match(pdf, /drawFeeReceivedPdfFirstHeader/);
assert.match(pdf, /drawFeeReceivedPdfCompactHeader/);
assert.match(pdf, /drawFeeReceivedPdfFinalSummary/);
assert.match(pdf, /drawBilledPdfFooters/);
assert.match(source, /FEE RECEIVED FILES REPORT/);
assert.match(source, /PAYMENT MODE SUMMARY/);

const excel = block("async function exportFeeReceivedFilesExcel", "\\nasync function createBilledFilesPdfDocument");
for (const requirement of [
  /XLSX\.utils\.aoa_to_sheet/,
  /worksheet\["!merges"\]/,
  /worksheet\["!autofilter"\]/,
  /worksheet\["!freeze"\]/,
  /cellStyles: true/,
  /COUNTA\(A\$\{dataStartRow\}/,
  /SUM\(E\$\{dataStartRow\}/,
  /SUM\(F\$\{dataStartRow\}/,
  /SUM\(G\$\{dataStartRow\}/,
  /dd-mm-yyyy/,
  /#,##0\.00/,
]) assert.match(excel, requirement);
assert.match(source, /return exportFeeReceivedFilesExcel\(sourceFiles\)/);
assert.match(source, /if \(listView === "feeReceived"\) return exportFeeReceivedFilesPdf\(reportFiles\)/);
assert.match(source, /if \(feeReceivedPdf\)[\s\S]*?createFeeReceivedFilesPdfDocument\(sourceFiles\)/);

console.log("Fee Received PDF and Excel modernization checks passed.");
