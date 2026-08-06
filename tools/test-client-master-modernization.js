const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const service = fs.readFileSync(path.join(root, "src", "services", "clientService.js"), "utf8");
const routes = fs.readFileSync(path.join(root, "src", "routes", "clientRoutes.js"), "utf8");

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

assert.match(source, /"GST No\.": "", "GST User": "", "GST PW": ""/,
  "The Client Master sample must place GST User immediately after GST No.");
assert.match(source, /"GST No\.": client\.gst_no \|\| "",\s*"GST User": client\.gst_user/,
  "The Client Master Excel export must place GST User immediately after GST No.");
assert.match(source, /gstUser: value\(row, "GST User", "GST Username", "GST Login"\)/,
  "Client Master import must accept GST User and supported aliases.");
assert.match(service, /GST_CREDENTIAL_BUNDLE_PREFIX[\s\S]*?packGstCredentials[\s\S]*?unpackGstCredentials/,
  "GST User must share the existing encrypted GST credential record.");
assert.match(service, /if \(!decrypted\.startsWith\(GST_CREDENTIAL_BUNDLE_PREFIX\)\) return \{ user: "", password: decrypted \}/,
  "Existing GST passwords must remain readable after adding GST User.");
assert.match(routes, /clientsForExport\(req\.query, canUseCredentials\(req, "view_client_credentials"\)\)/,
  "GST User export must remain protected by credential-view permission.");

assert.match(page, /Promise\.allSettled\(\[[\s\S]*?loadClientMasters\(\)[\s\S]*?apiJson\(`\/api\/clients\?\$\{clientMasterQuery\(\)\}`\)/,
  "Client rows and filter masters must load in parallel.");
assert.match(page, /renderRequestId[\s\S]*?alreadyRendered[\s\S]*?activePage !== "clientMaster" \|\| requestId !== clientMasterUi\.renderRequestId/,
  "Client Master rendering must ignore stale async responses and preserve an already-rendered page.");
assert.match(source, /preserveIndependentPage = activePage === "clientMaster"[\s\S]*?rerender: !chatOpen && !userIsScrollingDashboard && !preserveIndependentPage/,
  "Background central-state refreshes must not rebuild and blink the independent Client Master page.");
assert.match(service, /CLIENT_MASTER_CACHE_TTL_MS[\s\S]*?clientMastersInflight[\s\S]*?state->careOfList/,
  "Client master filters must reuse a short cache and fetch only the required care-of state field.");
assert.match(service, /prepareImportedClientTypes\(preparedRows\)[\s\S]*?skipDuplicateChecks:\s*true[\s\S]*?skipTypeAssignment:\s*true[\s\S]*?assignImportedClientTypes\(created, typeIdCache\)/,
  "Excel import must prepare master values once and batch client-type assignments.");
assert.match(source, /showClientImportProgress\(clients\.length\)[\s\S]*?Importing Client Master/,
  "Longer Client Master imports must show a clear in-progress state.");
assert.match(service, /function prepareTolerantImportRow[\s\S]*?Client Name was missing[\s\S]*?Other Client[\s\S]*?Invalid Email was retained in Remarks[\s\S]*?Invalid Contact Number was retained in Remarks/,
  "Client import must repair missing required values and retain invalid optional contact details without rejecting the row.");
assert.match(service, /IMPORT_REGISTRATION_RULES[\s\S]*?Duplicate.*retained in Remarks[\s\S]*?existingImportRegistrations/,
  "Client import must preserve malformed or duplicate registration values in Remarks and continue importing the row.");
assert.match(source, /Imported with fixes[\s\S]*?Import Notes/,
  "Client import results must distinguish repaired rows from skipped rows.");

console.log("Client Master filters, toolbar, tolerant import, GST User import/export, performance, responsive layout and action menu checks passed.");
