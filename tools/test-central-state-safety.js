const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { assertSafeStateReplacement } = require("../src/services/appStateService");

assert.doesNotThrow(() => assertSafeStateReplacement(
  { files: [], staffDetails: [] },
  { files: [], staffDetails: [] }
));
assert.doesNotThrow(() => assertSafeStateReplacement(
  { files: [{ id: "1" }], staffDetails: [{ id: "staff-1" }] },
  { files: [{ id: "1" }], staffDetails: [{ id: "staff-1" }] }
));
assert.throws(
  () => assertSafeStateReplacement(
    { files: [{ id: "1" }], staffDetails: [{ id: "staff-1" }] },
    { files: [], staffDetails: [] }
  ),
  (error) => error.status === 409 && /files/.test(error.message) && /staffDetails/.test(error.message)
);

const appSource = fs.readFileSync(path.resolve(__dirname, "..", "app.js"), "utf8");
const routeSource = fs.readFileSync(path.resolve(__dirname, "..", "src", "routes", "stateRoutes.js"), "utf8");
const staffPage = appSource.match(/function renderStaffDetailsPage\(\)[\s\S]*?(?=\nfunction staffDetailsActions)/)?.[0] || "";
assert.ok(staffPage, "Staff Details render function is missing");
assert.doesNotMatch(staffPage, /applyStaffDateCorrection|fullRemote/);
assert.match(appSource, /body: JSON\.stringify\(\{ state: shared, expectedUpdatedAt: lastCentralVersion \}\)/);
assert.match(routeSource, /assertSafeStateReplacement\(record\.state, incoming\)/);
assert.match(routeSource, /saveAppStateIfCurrent\(incoming, req\.user\.id, req\.body\.expectedUpdatedAt\)/);

console.log("Central state version and destructive-overwrite safeguards passed.");
