const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

const config = source.match(/reAssigned:\s*\{[\s\S]*?(?=\n\s*completed:)/)?.[0] || "";
for (const requirement of [
  /Search & Filter Re Assigned Files/, /common\.search/, /common\.client/, /common\.careOf/, /common\.service/,
  /Re Allot Date Range/, /First Allotted To/, /Reassigned By/, /reAssignedSort/, /common\.hasRemarks/,
]) assert.match(config, requirement);

assert.match(source, /if \(listView === "reAssigned"\)[\s\S]*?reAssignedFileDetails\(file\)[\s\S]*?return true;/,
  "Re Assigned Files must apply its dedicated filters");
assert.match(source, /Re Allot Date - Newest First/);
assert.match(source, /Re Allot Date - Oldest First/);

const table = source.match(/function reAssignedFileDetails[\s\S]*?(?=\nfunction feeReceivedDisplayRow)/)?.[0] || "";
for (const requirement of [
  /function reAssignedExpandedDetails/, /function reAssignedDesktopRows/, /function reAssignedMobileCard/,
  /data-reassigned-row-toggle/, /Assignment Timeline/, /reassigned-actions-column/, /masterFileActions\(file\)/,
  /sharedTableScrollRegion\("reAssigned"/, /reassigned-mobile-list/,
]) assert.match(table, requirement);
assert.match(source, /document\.querySelectorAll\("\[data-reassigned-row-toggle\]"\)/);

for (const selector of [
  ".reassigned-table-wrap", ".reassigned-modern-table", ".reassigned-client", ".reassigned-actions-column",
  ".reassigned-expanded-grid", ".reassigned-mobile-list", "@media (max-width: 760px)",
]) assert.match(styles, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
assert.match(styles, /\.reassigned-modern-table :is\(th,td\)\.reassigned-client\s*\{[\s\S]*?position:\s*sticky[\s\S]*?left:\s*48px/);
assert.match(styles, /\.reassigned-modern-table :is\(th,td\)\.reassigned-actions-column\s*\{[\s\S]*?position:\s*sticky[\s\S]*?right:\s*0/);
assert.match(styles, /@media \(max-width: 760px\)[\s\S]*?\.reassigned-modern-table\s*\{\s*display:\s*none[\s\S]*?\.reassigned-mobile-list\s*\{\s*display:\s*grid/);

const report = source.match(/function reAssignedReportRecords[\s\S]*?(?=\nasync function exportFilteredFilesPdf)/)?.[0] || "";
for (const requirement of [
  /RE ASSIGNED FILES REPORT/, /function reAssignedReportSummary/, /function reAssignedPdfFilterSummary/,
  /function drawReAssignedPdfHeader/, /function createReAssignedFilesPdfDocument/, /function exportReAssignedFilesExcel/,
  /First Allotted Date/, /Re Allot Date/, /Reassigned By/, /Remarks/, /!autofilter/, /!freeze/, /cellStyles: true/,
]) assert.match(report, requirement);
assert.match(source, /=== "reAssigned"\)\s*\{\s*return exportReAssignedFilesExcel\(sourceFiles\);/);
assert.match(source, /if \(reAssignedFilesPdf\)[\s\S]*?createReAssignedFilesPdfDocument\(sourceFiles\)/);

console.log("Re Assigned Files filters, responsive table, actions, PDF and Excel checks passed.");
