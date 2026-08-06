const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { mergeStaffDetailsImport } = require("../src/services/staffDetailsService");

const original = {
  files: [{ id: "file-1", clientName: "Preserved" }],
  staffDetails: [{ id: "staff-1", staffCode: "EMP-01", staffName: "Existing Staff", mobile: "111", remarks: "Keep" }],
  auditLog: [],
};
const result = mergeStaffDetailsImport(original, [
  { id: "staff-1", staffCode: "EMP-01", staffName: "Existing Staff", mobile: "222", remarks: "Keep" },
  { id: "staff-2", staffCode: "EMP-02", staffName: "New Staff", department: "Accounts" },
  { id: "staff-invalid", staffCode: "", staffName: "Missing ID" },
], { id: "admin-1", name: "Admin User", role: "Admin" });

assert.equal(result.created, 1);
assert.equal(result.updated, 1);
assert.equal(result.state.files[0].clientName, "Preserved");
assert.equal(result.state.staffDetails.find((row) => row.id === "staff-1").mobile, "222");
assert.equal(result.state.staffDetails.find((row) => row.id === "staff-2").department, "Accounts");
assert.equal(result.state.auditLog.at(-1).action, "Staff Excel import completed");
assert.equal(result.rejected.length, 1);
assert.equal(result.rejected[0].id, "staff-invalid");
assert.throws(
  () => mergeStaffDetailsImport(original, [{ staffCode: "", staffName: "Missing ID" }], { name: "Admin" }),
  /No valid staff records/
);

const appSource = fs.readFileSync(path.resolve(__dirname, "..", "app.js"), "utf8");
const routeSource = fs.readFileSync(path.resolve(__dirname, "..", "src", "routes", "stateRoutes.js"), "utf8");
assert.match(appSource, /apiJson\("\/api\/state\/staff-details\/import"/);
assert.match(appSource, /if \(apiToken\(\)\)/);
assert.match(appSource, /"EMP ID", "Staff ID", "Staff Code"/);
assert.match(appSource, /headerRowIndex = previewRows\.slice\(0, 10\)\.findIndex/);
assert.match(routeSource, /router\.post\("\/staff-details\/import"/);
assert.doesNotMatch(appSource.match(/async function persistStaffDetailsImportToApi[\s\S]*?\n}/)?.[0] || "", /expectedUpdatedAt/);

console.log("Staff Details import persistence tests passed.");
