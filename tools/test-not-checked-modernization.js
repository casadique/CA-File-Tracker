const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

const config = source.match(/notChecked:\s*\{[\s\S]*?(?=\n\s*nonBilled:)/)?.[0] || "";
for (const requirement of [
  /Search & Filter Not Checked Files/,
  /Global Search/,
  /Done By/,
  /Checking Eligibility/,
  /Completion Date Range/,
  /Received Date Range/,
  /Correction History/,
]) assert.match(config, requirement);
assert.match(source, /const notCheckedSort = \[[\s\S]*?"Completion Date - Newest First"/);

const matcher = source.match(/if \(listView === "notChecked"\)[\s\S]*?return true;\n\s*}/)?.[0] || "";
assert.match(matcher, /notCheckedDoneBy/);
assert.match(matcher, /notCheckedCompletionFrom/);
assert.match(matcher, /notCheckedReceivedFrom/);
assert.match(matcher, /canCheckFile\(file\)/);
assert.match(matcher, /notCheckedCorrectionHistory/);

const table = source.match(/function notCheckedExpandedDetails[\s\S]*?(?=\nfunction renderFeePendingFileTable)/)?.[0] || "";
for (const requirement of [
  /function notCheckedDesktopRows/,
  /function notCheckedMobileCard/,
  />Client</,
  />Service</,
  />Completion</,
  />Checking</,
  />Priority</,
  />Actions</,
  /data-not-checked-row-toggle/,
  /not-checked-mobile-list/,
]) assert.match(table, requirement);

const actions = source.match(/function notCheckedFileActions[\s\S]*?(?=\nfunction removeBilledFileLocally)/)?.[0] || "";
for (const requirement of [
  /billed-primary-action/,
  /data-billed-menu-toggle/,
  /data-edit/,
  /data-check-file/,
  /data-return-correction/,
  /canCheckFile\(file\)/,
  /aria-haspopup="menu"/,
]) assert.match(actions, requirement);

assert.match(source, /document\.querySelectorAll\("\[data-not-checked-row-toggle\]"\)/);
assert.match(source, /listView === "notChecked" \? renderNotCheckedFileTable\(files\)/,
  "Staff Not Checked Files must use the responsive renderer");

for (const selector of [
  ".not-checked-table-wrap",
  ".not-checked-modern-table",
  ".not-checked-actions-column",
  ".not-checked-mobile-card",
  ".not-checked-expanded-grid",
  "@media (max-width: 760px)",
]) assert.match(styles, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

assert.match(styles, /\.not-checked-modern-table \.not-checked-client\s*\{[\s\S]*?position:\s*sticky/);
assert.match(styles, /\.not-checked-actions-column\s*\{[\s\S]*?position:\s*sticky[\s\S]*?right:\s*0/);
assert.match(styles, /@media \(max-width: 760px\)[\s\S]*?\.not-checked-modern-table\s*\{\s*display:\s*none[\s\S]*?\.not-checked-mobile-list\s*\{\s*display:\s*grid/);

const report = source.match(/function notCheckedCheckedByText[\s\S]*?(?=\nconst BILLED_PDF_DISCOUNT_KEYS)/)?.[0] || "";
for (const requirement of [
  /function notCheckedReportRecords/,
  /function notCheckedReportSummary/,
  /function createNotCheckedFilesPdfDocument/,
  /function exportNotCheckedFilesPdf/,
  /NOT CHECKED FILES REPORT/,
  /header: "Checked By"/,
  /checkedDate \|\| file\.checkedAt \|\| file\.checked_at/,
  /return `\$\{checkedBy\}\\n\$\{checkedDate\}`/,
  /drawBilledPdfCards/,
  /drawBilledPdfFooters/,
]) assert.match(report, requirement);

const excel = source.match(/async function exportNotCheckedFilesExcel[\s\S]*?(?=\nfunction feeReceivedReportPaymentMode)/)?.[0] || "";
for (const requirement of [
  /"Checked By"/,
  /record\.checkedBy/,
  /dd-mm-yyyy/,
  /!autofilter/,
  /!freeze/,
  /cellStyles: true/,
  /NOT CHECKED FILES REPORT/,
]) assert.match(excel, requirement);

assert.match(source, /=== "notChecked"\) \{\s*return exportNotCheckedFilesExcel\(sourceFiles\);/);
assert.match(source, /if \(notCheckedFilesPdf\) \{[\s\S]*?createNotCheckedFilesPdfDocument\(sourceFiles\)/);
assert.match(source, /if \(listView === "notChecked"\) return exportNotCheckedFilesExcel\(reportFiles\);/);
assert.match(source, /if \(listView === "notChecked"\) return exportNotCheckedFilesPdf\(reportFiles\);/);

console.log("Not Checked Files filters, responsive layout, actions, modern PDF and Excel report checks passed.");
