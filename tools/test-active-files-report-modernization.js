const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.resolve(__dirname, "..", "app.js"), "utf8");

function block(start, end) {
  const match = source.match(new RegExp(`${start}[\\s\\S]*?(?=${end})`));
  assert.ok(match, `Missing source block: ${start}`);
  return match[0];
}

const record = block("function activeReportRecord", "\\nfunction activeReportRecords");
assert.match(record, /workAllotmentDate \|\| file\.fileReceivedDate/);
assert.match(record, /remarks: filePdfText\(file\.remarks/);
assert.doesNotMatch(record, /fileDpName|fileSpName|\bDP\b|\bSP\b/);

const pdf = block("async function createActiveFilesPdfDocument", "\\nasync function exportActiveFilesModernPdf");
const expected = ["SN", "Client Details", "Service / FY", "C/o", "Received Date", "Allotted Date", "Due Date", "Assigned Staff", "Status", "Priority", "Remarks"];
expected.forEach((heading) => assert.match(pdf, new RegExp(`header: "${heading.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}"`)));
assert.doesNotMatch(pdf, /header: "(?:SP|DP)"/);
assert.ok(pdf.indexOf('header: "Remarks"') > pdf.indexOf('header: "Priority"'), "Remarks must be the final report column");
assert.match(pdf, /drawActiveReportFirstHeader/);
assert.match(pdf, /drawActiveReportCompactHeader/);
assert.match(pdf, /drawActiveReportFinalSummary/);
assert.match(pdf, /drawBilledPdfFooters/);

const excel = block("async function exportActiveFilesModernExcel", "\\nfunction feeReceivedReportPaymentMode");
assert.match(excel, /"Allotted Date"/);
assert.match(excel, /"Remarks"\]/);
assert.doesNotMatch(excel, /"SP"|"DP"/);
for (const requirement of [
  /XLSX\.utils\.aoa_to_sheet/,
  /worksheet\["!merges"\]/,
  /worksheet\["!autofilter"\]/,
  /worksheet\["!freeze"\]/,
  /cellStyles: true/,
  /COUNTA\(A\$\{dataStartRow\}/,
  /COUNTIFS\(G\$\{dataStartRow\}/,
  /COUNTIF\(J\$\{dataStartRow\}/,
  /dd-mm-yyyy/,
]) assert.match(excel, requirement);

assert.match(source, /return exportActiveFilesModernExcel\(sourceFiles\)/);
assert.match(source, /if \(listView === "active"\) return exportActiveFilesModernPdf\(reportFiles\)/);
assert.match(source, /if \(activeFilesPdf\)[\s\S]*?createActiveFilesPdfDocument\(sourceFiles\)/);

console.log("Active Files PDF and Excel modernization checks passed.");
