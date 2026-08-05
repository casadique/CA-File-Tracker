const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const {
  ACTIVE_SERVICE_TYPES,
  canonicalServiceType,
  isRetiredServiceType,
} = require(path.join(root, "src/constants/serviceTypes.js"));

assert.ok(ACTIVE_SERVICE_TYPES.includes("Trade Mark hearing"));
for (const removed of ["Trade Mark", "NSS Certification", "Deed Drafting", "Deed Preparation", "KGST Audit"]) {
  assert.ok(!ACTIVE_SERVICE_TYPES.includes(removed), `${removed} must not remain in the active Service Type list`);
}
assert.equal(canonicalServiceType("Trade Mark"), "Trade Mark hearing");
assert.equal(canonicalServiceType("trade mark hearing"), "Trade Mark hearing");
for (const retired of ["NSS Certification", "Deed Drafting", "Deed preparation", "KGST Audit"]) {
  assert.equal(isRetiredServiceType(retired), true, `${retired} must be retired`);
}

const browserSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const browserDefaults = browserSource.match(/const defaultServices = sortList\(\[[\s\S]*?\]\);/)?.[0] || "";
assert.match(browserDefaults, /"Trade Mark hearing"/);
assert.doesNotMatch(browserDefaults, /"Trade Mark"|"NSS Certification"|"Deed Drafting"|"KGST Audit"/);
assert.match(browserSource, /function isRetiredServiceType/);
assert.match(browserSource, /serviceDropdownOptions\(\)[\s\S]*?!isRetiredServiceType\(serviceType\)/);
assert.match(browserSource, /serviceFilterOptions\(\)[\s\S]*?!isRetiredServiceType\(serviceType\)/);
assert.match(browserSource, /isRetiredServiceType\(serviceType\)[\s\S]*?has been removed from Service Type/);

const stateService = fs.readFileSync(path.join(root, "src/services/appStateService.js"), "utf8");
assert.match(stateService, /!isRetiredServiceType\(serviceType\)/);
assert.match(stateService, /canonicalServiceType\(file\.serviceType \|\| file\.service_type\)/);

console.log("Service Type removals, Trade Mark rename and retired-service validation checks passed.");
