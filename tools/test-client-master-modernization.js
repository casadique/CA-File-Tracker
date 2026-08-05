const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

const page = source.match(/async function renderClientMasterPage[\s\S]*?(?=\nfunction clientMasterQuery)/)?.[0] || "";
assert.ok(page, "Missing Client Master page renderer");
assert.doesNotMatch(page, /CENTRAL DIRECTORY|<h2>Client Master<\/h2>/,
  "Client Master must not repeat the page title or Central Directory label");
for (const requirement of [
  /Search &amp; Filter Clients/,
  /Global Search/,
  /Client Type/,
  /Status/,
  /More Filters/,
  /Download Sample/,
  /Import Excel/,
  /Export Excel/,
  /Export PDF/,
  /Add Client/,
  /client-master-mobile-list/,
]) assert.match(page, requirement);

const actions = source.match(/function clientMasterActions[\s\S]*?(?=\nfunction clientMasterRow)/)?.[0] || "";
for (const requirement of [
  /View Client/,
  /data-client-edit/,
  /data-client-status/,
  /data-billed-menu-toggle/,
  /aria-haspopup="menu"/,
  /aria-expanded="false"/,
]) assert.match(actions, requirement);

assert.match(source, /function clientMasterMobileCard/);
assert.match(source, /bindBilledActionMenus\(\)/);
assert.match(source, /openBilledActionMenu\(toggle\)/);
assert.match(source, /clientMasterUi\.rows\.map\(clientMasterMobileCard\)/);
assert.match(source, /#clientMoreFiltersButton[\s\S]*?clientMasterUi\.moreFiltersOpen/);

for (const selector of [
  ".client-master-filter-head",
  ".client-master-actionbar",
  ".client-master-client-column",
  ".client-master-actions-column",
  ".client-master-mobile-card",
  "@media (max-width: 760px)",
]) assert.match(styles, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

assert.match(styles, /\.client-master-table \.client-master-client-column\s*\{[\s\S]*?position:\s*sticky/);
assert.match(styles, /\.client-master-actions-column\s*\{[\s\S]*?position:\s*sticky[\s\S]*?right:\s*0/);
assert.match(styles, /@media \(max-width: 760px\)[\s\S]*?\.client-master-table\s*\{\s*display:\s*none[\s\S]*?\.client-master-mobile-list\s*\{\s*display:\s*grid/);

console.log("Client Master filters, toolbar, responsive layout and action menu checks passed.");
