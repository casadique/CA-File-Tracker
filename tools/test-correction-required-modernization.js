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
assert.match(styles, /\.correction-required-modern-table :is\(th, td\)\.correction-required-client\s*\{[\s\S]*?position:\s*sticky/);
assert.match(styles, /\.correction-required-modern-table :is\(th, td\)\.correction-required-client\s*\{[\s\S]*?left:\s*55px[\s\S]*?width:\s*270px[\s\S]*?padding:\s*10px 12px !important/,
  "The Client column should provide sufficient usable width and balanced padding");
assert.match(styles, /\.correction-required-modern-table :is\(th, td\)\.correction-required-sn\s*\{[\s\S]*?width:\s*55px[\s\S]*?min-width:\s*55px[\s\S]*?max-width:\s*55px/,
  "SN must remain fixed within its own column");
assert.match(styles, /\.correction-required-service\s*\{[^}]*width:\s*220px[^}]*min-width:\s*220px/,
  "Service must retain a readable width after the Client column");
assert.match(styles, /\.correction-required-modern-table\s*\{[\s\S]*?width:\s*max-content[\s\S]*?min-width:\s*100%/,
  "The desktop table should preserve explicit column geometry while filling the available width");
assert.match(styles, /\.correction-required-client-line\s*\{[\s\S]*?display:\s*grid[\s\S]*?grid-template-columns:\s*auto minmax\(0, 1fr\)[\s\S]*?gap:\s*10px/,
  "The expand control and client details must share a wrapping grid inside Client");
assert.match(styles, /\.correction-required-client-content \.client-name\s*\{[\s\S]*?white-space:\s*normal[\s\S]*?overflow-wrap:\s*anywhere[\s\S]*?word-break:\s*normal/,
  "Long client names should wrap naturally without entering the Service column");
assert.match(styles, /\.correction-required-row-toggle\s*\{[\s\S]*?position:\s*static/,
  "The row expand control must remain in normal Client-cell flow");
assert.doesNotMatch(styles, /\.correction-required-row-toggle\s*\{[\s\S]*?right:\s*-19px/,
  "The row expand control must not overlap the SN or Client boundary");
assert.match(table, /<td class="correction-required-sn"><span>[\s\S]*?<td class="correction-required-client"><div class="correction-required-client-line"><button[\s\S]*?correction-required-client-content/,
  "The expand control must be the first element inside the Client cell");
assert.match(table, /<th class="correction-required-service">Service<\/th>/,
  "Header and body must share the Service column width class");
assert.match(table, /correction-required-details-row" hidden><td colspan="7">/,
  "Expanded details must preserve the seven-column table geometry");
const desktopRows = source.match(/function correctionRequiredDesktopRows[\s\S]*?(?=\nfunction correctionRequiredMobileCard)/)?.[0] || "";
assert.doesNotMatch(desktopRows, /priority-/,
  "The Correction Required results table must not display the priority badge");
assert.doesNotMatch(desktopRows, /correctionRequiredAgeLabel/,
  "The Correction Required results table must not display correction aging");
const mobileCard = source.match(/function correctionRequiredMobileCard[\s\S]*?(?=\nfunction renderCorrectionRequiredTable)/)?.[0] || "";
assert.doesNotMatch(mobileCard, />Aging</,
  "The Correction Required mobile card must not display correction aging");
assert.doesNotMatch(mobileCard, /correctionRequiredAgeLabel/,
  "The Correction Required mobile card must not render an aging value");
assert.match(styles, /\.correction-required-mobile-head > div\s*\{\s*min-width:\s*0/,
  "Mobile client content must be allowed to wrap inside the card");
assert.match(styles, /\.correction-required-mobile-head h3\s*\{[^}]*overflow-wrap:\s*anywhere[^}]*word-break:\s*normal/,
  "Long mobile client names must wrap without break-all");
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
assert.match(report, /aging:\s*correctionRequiredAgeLabel\(file\)/,
  "Correction aging must remain available in exported reports");
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
