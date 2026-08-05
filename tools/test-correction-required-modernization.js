const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

assert.match(source, /titles\.files\[0\] = "Correction Required Files"/,
  "Correction Required Files must use its own page heading");

const config = source.match(/correctionRequired:\s*\{[\s\S]*?(?=\n\s*nonBilled:)/)?.[0] || "";
for (const requirement of [
  /Search & Filter Correction Required Files/,
  /common\.search/,
  /common\.staff/,
  /Priority/,
  /Returned Date Range/,
  /Completion Date Range/,
  /Correction Aging/,
  /Returned By/,
  /Expected Date/,
]) assert.match(config, requirement);
assert.match(source, /const correctionRequiredSort = \[[\s\S]*?"Returned Date - Newest First"/);

const matcher = source.match(/if \(listView === "correctionRequired"\)[\s\S]*?return hasOpenCorrection\(file\);\n\s*}/)?.[0] || "";
for (const requirement of [
  /filters\.priority/,
  /correctionReturnedFrom/,
  /correctionCompletedFrom/,
  /correctionReturnedBy/,
  /correctionExpectedDate/,
  /correctionAging/,
  /hasOpenCorrection\(file\)/,
]) assert.match(matcher, requirement);
assert.match(source, /facts\.correctionReason, facts\.correctionReturnedBy, facts\.correctionExpectedDate/,
  "Correction details must be searchable");

const table = source.match(/function correctionRequiredDetails[\s\S]*?(?=\nfunction openMarkReceivedModal)/)?.[0] || "";
for (const requirement of [
  /function correctionRequiredDesktopRows/,
  /function correctionRequiredMobileCard/,
  />Client</,
  />Service</,
  />Correction Details</,
  />Assigned Staff</,
  />Status</,
  />Actions</,
  /data-correction-row-toggle/,
  /correction-required-expanded-grid/,
  /correction-required-mobile-list/,
]) assert.match(table, requirement);

const actions = source.match(/function correctionRequiredFileActions[\s\S]*?(?=\nfunction correctionRequiredExpandedDetails)/)?.[0] || "";
for (const requirement of [
  /billed-primary-action/,
  /data-billed-menu-toggle/,
  /data-edit/,
  /data-view-correction-details/,
  /data-delete/,
  /aria-haspopup="menu"/,
]) assert.match(actions, requirement);
assert.match(source, /document\.querySelectorAll\("\[data-correction-row-toggle\]"\)/);
assert.match(source, /document\.querySelectorAll\("\[data-view-correction-details\]"\)/);
assert.match(source, /listView === "correctionRequired" \? renderCorrectionRequiredTable\(files\)/);

for (const selector of [
  ".correction-required-table-wrap",
  ".correction-required-modern-table",
  ".correction-required-actions-column",
  ".correction-required-expanded-grid",
  ".correction-required-mobile-card",
  "@media (max-width: 760px)",
]) assert.match(styles, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
assert.match(styles, /\.correction-required-client\s*\{[\s\S]*?position:\s*sticky/);
assert.match(styles, /\.correction-required-client\s*\{[\s\S]*?width:\s*195px/,
  "The Client column should use compact width");
assert.match(styles, /\.correction-required-row-toggle\s*\{[\s\S]*?position:\s*absolute[\s\S]*?right:\s*-19px/,
  "The row expand control should sit on the left Client-column border");
assert.match(table, /correction-required-sn-cell[\s\S]*?data-correction-row-toggle[\s\S]*?<td class="correction-required-client">/,
  "The desktop expand control should be anchored from the SN side of the Client border");
assert.match(styles, /\.correction-required-actions-column\s*\{[\s\S]*?position:\s*sticky[\s\S]*?right:\s*0/);
assert.match(styles, /@media \(max-width: 760px\)[\s\S]*?\.correction-required-modern-table\s*\{\s*display:\s*none[\s\S]*?\.correction-required-mobile-list\s*\{\s*display:\s*grid/);

const report = source.match(/function correctionRequiredPdfFilterSummary[\s\S]*?(?=\nconst BILLED_PDF_DISCOUNT_KEYS)/)?.[0] || "";
for (const requirement of [
  /function correctionRequiredReportRecords/,
  /function correctionRequiredReportSummary/,
  /function createCorrectionRequiredFilesPdfDocument/,
  /function exportCorrectionRequiredFilesPdf/,
  /CORRECTION REQUIRED FILES REPORT/,
  /drawBilledPdfCards/,
  /drawBilledPdfFooters/,
  /dataKey: "correction"/,
  /dataKey: "aging"/,
  /dataKey: "remarks"/,
]) assert.match(report, requirement);
assert.match(report, /record\.ageDays >= 8 && record\.ageDays <= 15/,
  "Missing returned dates must not enter an aging group");

const excel = source.match(/async function exportCorrectionRequiredFilesExcel[\s\S]*?(?=\nfunction feeReceivedReportPaymentMode)/)?.[0] || "";
for (const requirement of [
  /"Correction Required"/,
  /"Expected Date"/,
  /"Aging"/,
  /"Status \/ Priority"/,
  /dd-mm-yyyy/,
  /!autofilter/,
  /!freeze/,
  /cellStyles: true/,
  /CORRECTION REQUIRED FILES REPORT/,
  /COUNTIFS\(J\$\{dataStartRow\}:J\$\{lastDataRow\},">=0"/,
]) assert.match(excel, requirement);

assert.match(source, /=== "correctionRequired"\) \{\s*return exportCorrectionRequiredFilesExcel\(sourceFiles\);/);
assert.match(source, /if \(correctionRequiredFilesPdf\) \{[\s\S]*?createCorrectionRequiredFilesPdfDocument\(sourceFiles\)/);
assert.match(source, /if \(listView === "correctionRequired"\) return exportCorrectionRequiredFilesExcel\(reportFiles\);/);
assert.match(source, /if \(listView === "correctionRequired"\) return exportCorrectionRequiredFilesPdf\(reportFiles\);/);

console.log("Correction Required Files heading, filters, responsive layout, actions, PDF and Excel checks passed.");
