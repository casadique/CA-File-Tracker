const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

function block(start, end) {
  const match = source.match(new RegExp(`${start}[\\s\\S]*?(?=${end})`));
  assert.ok(match, `Missing source block: ${start}`);
  return match[0];
}

const configs = block("function configuredFinancialFilterConfigs", "\\nfunction configuredFinancialRange");
for (const label of [
  "Search & Filter Completed Files", "Done By", "Checking Status", "Completion Date Range",
  "Checked Date Range", "Billing Status", "Checked Date - Oldest First", "Has Remarks",
]) assert.match(configs, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

const matcher = block("function configuredFinancialFileMatches", "\\nfunction renderFilesPage");
assert.match(matcher, /listView === "completed"/);
assert.match(matcher, /completedFileBillingCategory/);
assert.match(matcher, /configuredFinancialDateInRange\(facts\.completionDate/);

const table = block("function renderCompletedFileTable", "\\nfunction renderFileTable");
for (const heading of ["Client", "Service", "Completion", "C/o", "Checking", "Billing Status", "Actions"]) {
  assert.match(table, new RegExp(`>${heading}<`));
}
assert.match(source, /function completedFileActions/);
assert.match(source, /data-billed-menu-toggle/);
assert.match(source, /data-mark-billed/);
assert.match(source, /primary = `<button type="button" class="billed-primary-action mark-received" data-mark-billed=/,
  "eligible completed files should expose Mark Billed as the primary action");
assert.match(source, /data-non-billable/);
assert.match(source, /data-delete/);
assert.match(source, /data-completed-row-toggle/);
assert.match(source, /if \(event\.target\.closest\("\[data-billed-menu-toggle\]"\)\) return;/,
  "The outside-click listener must not immediately close the menu toggle click");
assert.match(source, /function bindFileActions\(\) \{\s*bindBilledActionMenus\(\);/,
  "Completed Files must bind the delegated portal menu listener");
assert.match(source, /activeBilledActionToggle === toggle && activeBilledActionMenu/,
  "The same toggle must be able to close its menu after the menu moves to the body portal");
assert.match(source, /document\.querySelectorAll\("\[data-billed-menu-toggle\]"\)[\s\S]*?openBilledActionMenu\(toggle\);/,
  "Each rendered three-dot button must directly open its portal menu");

const reportRows = block("function fileListReportRows", "\\nconst BILLED_PDF_DISCOUNT_KEYS");
for (const heading of ["PAN / Reg No.", "Completion Date", "Done By", "Checking Status", "Billing Status", "Remarks"]) {
  assert.match(reportRows, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

assert.match(source, /async function createCompletedFilesPdfDocument/);
assert.match(source, /COMPLETED FILES REPORT/);
assert.match(source, /orientation: "landscape"/);
assert.match(source, /showHead: "everyPage"/);
assert.match(source, /rowPageBreak: "avoid"/);
assert.match(source, /if \(completedFilesPdf\) \{[\s\S]*createCompletedFilesPdfDocument\(sourceFiles\)/);
assert.match(source, /completedFilesReportHeading\(sourceFiles\)/);

for (const css of [
  ".completed-table-wrap", ".completed-modern-table", ".completed-actions-column",
  ".completed-mobile-card", ".completed-billing-badge", "@media (max-width: 760px)",
]) assert.match(styles, new RegExp(css.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

console.log("Completed Files filters, table, actions, PDF and Excel export checks passed.");
