const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function extractFunction(name, nextName) {
  const match = source.match(new RegExp(`function ${name}[\\s\\S]*?(?=\\nfunction ${nextName})`));
  assert.ok(match, `${name} must exist`);
  return match[0].trim();
}

const numberSource = extractFunction("dailyReportPdfNumber", "dailyReportPdfSection");
const sectionSource = extractFunction("dailyReportPdfSection", "dailyReportPdfSummary");
const summarySource = extractFunction("dailyReportPdfSummary", "dailyReportPdfCardItems");
const dailyReportPdfNumber = Function(`return (${numberSource})`)();
const dailyReportPdfSection = Function(`return (${sectionSource})`)();
const dailyReportPdfSummary = Function(
  "dailyReportPdfSection", "dailyReportPdfNumber", `return (${summarySource})`,
)(dailyReportPdfSection, dailyReportPdfNumber);

const summary = dailyReportPdfSummary([
  { title: "Balance Summary", rows: [
    { Account: "Cash Balance", "Closing Balance": "₹ 26,000.00" },
    { Account: "Total Balance", "Closing Balance": "₹ 2,51,494.10" },
  ] },
  { title: "Completed Files", rows: [{}, {}, {}, {}] },
  { title: "New Work Came", rows: [{}, {}, {}] },
  { title: "Visitors List", rows: [] },
  { title: "Expense Report", rows: [{ Amount: "Rs. 50,000.00" }] },
  { title: "Collections", rows: [{ Amount: "1,000.00" }, { Amount: "500.00" }] },
]);

assert.deepEqual(summary, {
  totalBalance: 251494.1,
  completedFiles: 4,
  newWorkFiles: 3,
  visitors: 0,
  expenses: 50000,
  collections: 1500,
  netCashFlow: -48500,
});
assert.equal(dailyReportPdfNumber("₹3,60,410.00"), 360410);
assert.equal(dailyReportPdfNumber(""), 0);

assert.match(source, /new jsPDF\(\{ orientation: "portrait", unit: "pt", format: "a4"/);
assert.match(source, /registerBilledPdfFonts\(doc, assets\)/);
assert.match(source, /DAILY ACTIVITY REPORT/);
assert.match(source, /drawDailyReportPdfFirstHeader/);
assert.match(source, /drawDailyReportPdfCompactHeader/);
assert.match(source, /dailyReportPdfCardItems/);
assert.match(source, /function drawDailyReportPdfCompactCards/);
assert.match(source, /const cardHeight = 20/);
assert.match(source, /let y = 180/);
assert.match(source, /function dailyReportPdfTotalLabel/);
assert.match(source, /New Work Received/);
[
  "Client Name", "Service Type", "C/o", "Done By", "Checked By", "Billed Status",
  "Assigned To", "Status", "Completion On", "Visitor Name", "Mobile No", "Company",
  "Purpose", "Time", "Met", "Expense Item", "Paid To", "Method", "Account", "Voucher No.",
].forEach((header) => assert.match(source, new RegExp(`header: "${header.replace(".", "\\.")}"`), `${header} PDF column must exist`));
assert.match(source, /"Billed Status": isBilledFile\(file\) \? "Billed" : "Not Billed"/);
assert.match(source, /"Completion On": displayDate/);
assert.match(source, /rowPageBreak: "avoid"/);
assert.match(source, /showHead: "everyPage"/);
assert.match(source, /No records found for the selected date/);
assert.match(source, /drawBilledPdfFooters\(doc\)/);

console.log("Daily Report portrait PDF layout and summary checks passed.");
