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
  "Search & Filter File List", "File Status", "Received Date Range", "Due Date Range",
  "Billing Status", "Workflow Stage", "Assignment", "Approval", "Has Remarks",
  "Completion Date - Newest First",
]) assert.match(configs, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

assert.match(source, /configuredFinancialFilterConfigs\(\)\[listView \|\| "fileList"\]/,
  "The empty File List view must resolve to its modern filter configuration");
assert.match(source, /\["", "active", "completed", "notChecked", "nonBilled", "feePending", "feeReceived"\]\.includes\(f\.listView \|\| ""\)/,
  "File List filtering must use the configured search haystack");

const matcher = block("function configuredFinancialFileMatches", "\\nfunction renderFilesPage");
assert.match(matcher, /listView === ""/);
assert.match(matcher, /configuredFinancialDateInRange\(facts\.receivedDate, filters\.fileListReceivedFrom/);
assert.match(matcher, /configuredFinancialDateInRange\(facts\.dueDate, filters\.fileListDueFrom/);
assert.match(matcher, /fileListBillingStatus\(file\)/);
assert.match(matcher, /fileListAssignment === "Reassigned"/);
assert.match(matcher, /fileListApproval === "Pending"/);

const sorter = block("function sortConfiguredFinancialFiles", "\\nfunction sortFilesForDisplay");
assert.match(sorter, /listView \? `\$\{listView\}Sort` : "fileListSort"/);
assert.match(source, /\["", "active", "completed", "notChecked", "nonBilled", "feePending", "feeReceived"\][\s\S]*?sortConfiguredFinancialFiles/);

const table = block("function masterFileActions", "\\nfunction activeFileActions");
for (const heading of ["Client", "Service", "Work Timeline", "C/o", "Status", "Billing", "Assigned Staff", "Actions"]) {
  assert.match(table, new RegExp(`>${heading}<`));
}
for (const requirement of [
  /function masterFileActions/,
  /data-billed-menu-toggle/,
  /data-edit/,
  /data-delete/,
  /data-master-file-toggle/,
  /master-file-mobile-card/,
  /master-file-expanded-grid/,
]) assert.match(source, requirement);

assert.match(source, /if \(!state\.filters\.listView\) return renderMasterFileTable\(files\)/);
assert.match(source, /listView === "" \? renderMasterFileTable\(files\)/,
  "Staff File List must use the modern renderer");
assert.match(source, /state\.filters\.listView === ""[\s\S]*?renderMasterFileTable\(files\)/,
  "Live filter refresh must preserve the modern File List renderer");
assert.match(source, /document\.querySelectorAll\("\[data-master-file-toggle\]"\)/,
  "Expanded File List details must be interactive");
assert.match(source, /exportFilteredPdf\.onclick = \(\) => exportFilteredFilesPdf/,
  "Existing File List PDF export must remain connected");

const expandedDetails = block("function masterFileExpandedDetails", "\\nfunction masterFileDesktopRows");
for (const label of ["Checked By", "Checked Date", "Comment", "Bill No.", "Amount", "Date", "Contact No.", "Email", "Received / Balance"]) {
  assert.match(expandedDetails, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}
for (const removedLabel of ["Work Started", "Assignment", "<span>Mode</span>"]) {
  assert.doesNotMatch(expandedDetails, new RegExp(removedLabel));
}
assert.match(expandedDetails, /money\(payment\.totalReceived \|\| 0\)/);
assert.match(expandedDetails, /money\(payment\.outstandingAmount \|\| 0\)/);
assert.doesNotMatch(expandedDetails, /escapeHtml\(rupee/,
  "Expanded receipt and balance amounts must not expose the encoded rupee entity");

for (const css of [
  ".master-file-table-wrap", ".master-file-table", ".master-file-actions-column",
  ".master-file-mobile-card", ".master-billing-badge", ".master-file-expanded-grid",
  "@media (max-width: 760px)",
]) assert.match(styles, new RegExp(css.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

console.log("File List filters, responsive layout, actions and expanded details checks passed.");
