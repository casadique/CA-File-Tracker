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
  "Search & Filter Active Files", "Workflow Status", "Received Date Range", "Due Date Range",
  "Assignment", "Approval", "Overdue", "Received Date - Newest First", "Assigned Staff",
]) assert.match(configs, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

const matcher = block("function configuredFinancialFileMatches", "\\nfunction renderFilesPage");
assert.match(matcher, /listView === "active"/);
assert.match(matcher, /configuredFinancialDateInRange\(facts\.receivedDate/);
assert.match(matcher, /configuredFinancialDateInRange\(facts\.dueDate/);
assert.match(matcher, /isReassignedFile/);
assert.match(matcher, /pendingApproval/);

const sorter = block("function sortConfiguredFinancialFiles", "\\nfunction sortFilesForDisplay");
for (const sort of ["Received Date - Newest First", "Due Date - Earliest First", "Priority", "Workflow Status"]) {
  assert.match(sorter, new RegExp(sort.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

const table = block("function renderActiveFileTable", "\\nfunction completedBillingBadge");
for (const heading of ["Client", "Service", "Work Timeline", "C/o", "Status", "Assigned Staff", "Actions"]) {
  assert.match(table, new RegExp(`>${heading}<`));
}
for (const requirement of [
  /function activeFileActions/,
  /data-billed-menu-toggle/,
  /data-edit/,
  /data-delete/,
  /data-active-row-toggle/,
  /active-mobile-card/,
  /active-expanded-grid/,
]) assert.match(source, requirement);

assert.match(source, /listView === "active" \? renderActiveFileTable\(files\)/,
  "Staff Active Files must use the modern renderer");
assert.match(source, /state\.filters\.listView === "active"[\s\S]*?renderActiveFileTable\(files\)/,
  "Live filter refresh must preserve the modern Active Files renderer");
assert.match(source, /document\.querySelectorAll\("\[data-active-row-toggle\]"\)/,
  "Expanded details must be interactive");
assert.match(source, /if \(f\.listView === "active" && !isDashboardActiveFile\(file\)\) return false;/,
  "Active eligibility rules must remain intact");

const expandedDetails = block("function activeExpandedDetails", "\\nfunction activeDesktopRows");
assert.doesNotMatch(expandedDetails, /<span>DP<\/span>|<span>SP<\/span>/,
  "Active Files expanded details must not show DP or SP");

for (const css of [
  ".active-table-wrap", ".active-modern-table", ".active-actions-column", ".active-mobile-card",
  ".active-expanded-grid", "@media (max-width: 760px)",
]) assert.match(styles, new RegExp(css.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

console.log("Active Files filters, responsive layout, actions and expanded details checks passed.");
