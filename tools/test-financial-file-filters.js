const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

function functionSource(name, nextName) {
  const end = nextName ? `(?=\\nfunction ${nextName})` : "(?=\\nfunction )";
  return source.match(new RegExp(`function ${name}[\\s\\S]*?${end}`))?.[0] || "";
}

const countLabel = Function(`return (${functionSource("billedFilesShownLabel", "billedFilterSessionValue")})`)();
assert.equal(countLabel(1), "1 File Shown");
assert.equal(countLabel(47), "47 Files Shown");

const isNonBilled = Function("isBillingReadyFile", `return (${functionSource("isNonBilledFile", "completedFileBillingCategory")})`)(
  (file) => Boolean(file.ready),
);
assert.equal(isNonBilled({ billed: false, billingType: "Non-Billable" }), true);
assert.equal(isNonBilled({ billed: false, billingType: "Billable", ready: true }), true);
assert.equal(isNonBilled({ billed: true, billingType: "Non-Billable", ready: true }), false);

const configBlock = source.match(/function configuredFinancialFilterConfigs[\s\S]*?(?=\nfunction configuredFinancialRange)/)?.[0] || "";
for (const required of [
  "Search & Filter Not Checked Files", "Search & Filter Non-Billed Files", "Search & Filter Fee Pending", "Search & Filter Fee Received",
  "Billable - Not Yet Billed", "Billing Decision Pending", "Completion Date - Newest First", "Oldest Unbilled First",
  "Not Received", "Partially Received", "Above 90 Days", "Outstanding - Highest First",
  "Cash", "Federal Bank", "TMB", "Not Recorded", "Receipt Date - Newest First", "Received Amount - Highest First",
]) assert.match(configBlock, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Missing configured filter: ${required}`);

for (const irrelevant of ["Overdue Files", "Generic Workflow", "Generic Billing"]) {
  assert.doesNotMatch(configBlock, new RegExp(irrelevant), `Configured financial panels must not include ${irrelevant}`);
}

const renderBlock = functionSource("renderConfiguredFinancialFilterPanel", "configuredFinancialFacts");
assert.match(renderBlock, /configuredFinancialActiveFilterChips/);
assert.match(renderBlock, /configuredMobileFiltersToggle/);
assert.match(renderBlock, /configuredMoreToggle/);
assert.match(renderBlock, /billedFilesShownLabel/);

const bindingBlock = functionSource("bindConfiguredFinancialFilters", "refreshFileResults");
assert.match(bindingBlock, /control\.oninput = \(\) => update\(350\)/, "Global search must use a 350ms debounce");
assert.match(bindingBlock, /Fewer Filters/, "More Filters must toggle to Fewer Filters");
assert.match(bindingBlock, /aria-expanded/);

assert.match(source, /persistConfiguredFinancialFilterValues\(state\.filters\.listView\)/,
  "Page-specific filters must be preserved before navigation");
assert.match(source, /restoreConfiguredFinancialFilterValues\(state\.filters\.listView\)/,
  "Page-specific filters must be restored after navigation");
assert.match(source, /function renderConfiguredStaffFinancialFilesPage/,
  "Staff financial pages must reuse the configured filter panel");
assert.match(source, /isStaffLogin\(\) \? renderStaffFileTable/,
  "Staff filtering must preserve the existing Staff table renderer");
assert.match(source, /return financial\.balanceAmount > 0/,
  "Fee Pending must retain the mandatory positive-balance condition");
assert.match(source, /const financial = facts\.pdfRecord/,
  "Financial filters must use the shared discount-aware financial record");

assert.match(styles, /\.configured-filter-card \.configured-more-filters\.is-open\s*\{[\s\S]*?max-height:\s*650px/);
assert.match(styles, /@media \(max-width: 760px\)[\s\S]*?\.configured-filter-card \.configured-filter-secondary,[\s\S]*?grid-template-columns:\s*1fr/);
assert.match(styles, /\.configured-filter-range input:focus[\s\S]*?outline:\s*3px solid rgba\(37, 99, 235, 0\.2\)/);

console.log("Configured financial file filter tests passed.");
