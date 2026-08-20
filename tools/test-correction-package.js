const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { UNASSIGNED, UNASSIGNED_LABEL, isUnassignedAssignment, normalizeFileAssignment } = require("../src/constants/assignmentStatus");
const { BACKUP_VERSION, checksumFor, collectionManifest, stateForMode, createCompleteBackup } = require("../src/services/completeBackupService");
const { verifyCompleteBackup, mergeRows, mergeState } = require("../src/services/completeRestoreService");

for (const value of ["", "Not Assigned", "Not Allotted", "Unassigned", "UNASSIGNED", null]) assert.equal(isUnassignedAssignment(value), true);
assert.equal(normalizeFileAssignment({ id: "f1", assignedStaff: "Not Assigned" }).assignedStaff, UNASSIGNED_LABEL);
assert.equal(normalizeFileAssignment({ id: "f1", assignedStaff: "" }).assignmentStatus, UNASSIGNED);
assert.equal(normalizeFileAssignment({ id: "f2", assignedStaff: "Althaf" }).assignmentStatus, "ALLOTTED");

assert.deepEqual(mergeRows([{ id: "1", value: "old" }], [{ id: "1", value: "new" }, { id: "2" }]), [{ id: "1", value: "new" }, { id: "2" }]);
const merged = mergeState({ files: [{ id: "1" }], settings: { a: 1 } }, { files: [{ id: "1", name: "A" }, { id: "2" }], settings: { b: 2 } });
assert.equal(merged.files.length, 2);
assert.deepEqual(merged.settings, { a: 1, b: 2 });

const core = { app: "CA File Tracker", version: BACKUP_VERSION, mode: "full", manifest: { stateCollections: {}, databaseTables: {}, storage: { fileCount: 0 } }, state: { files: [] }, relationalData: {}, storageFiles: [] };
const backup = { ...core, integrity: { algorithm: "sha256", checksum: checksumFor(core) } };
assert.equal(verifyCompleteBackup(backup), backup.integrity.checksum);
assert.throws(() => verifyCompleteBackup({ ...backup, state: { files: [{ id: "tampered" }] } }), /checksum/i);
assert.equal(collectionManifest({ files: [{ id: 1 }], settings: { a: 1 } }).files.count, 1);
assert.deepEqual(Object.keys(stateForMode({ files: [], expenses: [1], openingBalances: [2] }, "transactions")).sort(), ["expenses", "openingBalances"]);

const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
assert.match(app, /data-decimal-input/);
assert.match(app, /No transactions found for the selected period/);
assert.match(app, /function accountOverviewData\(/);
assert.match(app, /account-overview-\$\{todayDate\(\)\}\.xlsx/);
assert.match(app, /bookType:\s*"xlsx"/);
assert.match(app, /worksheet\[address\]\.t = "n"/);
assert.match(app, /worksheet\[address\]\.z = "#,##0\.00"/);
assert.match(app, /\["Muhammad & Associates,", "Chartered Accountants,", "Account Overview", `Account: \$\{report\.accountLabel\}`, `Period: \$\{report\.periodLabel\}`/);
assert.match(app, /const accountLabel = selectedAccount \? \(accounts\[0\]\?\.label \|\| financeAccountLabel\(selectedAccount\)\) : "All Accounts"/);
assert.match(app, /const periodLabel = `\$\{from \? displayDate\(from\) : "Beginning"\} to \$\{to \? displayDate\(to\) : "Current"\}`/);
assert.match(app, /function renderSpecialStatusFilter\(/);
assert.match(app, /selected\.some\(\(status\) => statuses\.has\(status\)\)/);

(async () => {
  const sampleState = { files: [{ id: "file-1", assignedStaff: "Not Assigned" }], expenses: [{ id: "expense-1", amount: 20.5 }], otherCashCollections: [{ id: "income-1", amount: 100.75 }], feeReceipts: [{ id: "receipt-1", amount: 50 }], openingBalances: [{ id: "opening-1", amount: 500 }], accountTransfers: [], settings: { theme: "professional" } };
  const full = await createCompleteBackup("Automated Test", { state: sampleState, clientMaster: [{ id: "client-1" }], relationalData: { clients: [{ id: "client-1" }] }, authenticationUsers: [], storageFiles: [{ path: "attachments/sample.txt", size: 4, sha256: "test", contentBase64: "dGVzdA==" }] });
  assert.equal(full.version, BACKUP_VERSION);
  assert.equal(full.manifest.stateCollections.expenses.count, 1);
  assert.equal(full.manifest.databaseTables.clients.count, 1);
  assert.equal(full.manifest.storage.fileCount, 1);
  verifyCompleteBackup(full);
  const restored = mergeState({}, full.state);
  assert.equal(restored.expenses.reduce((sum, row) => sum + row.amount, 0), 20.5);
  assert.equal(restored.otherCashCollections.reduce((sum, row) => sum + row.amount, 0), 100.75);
  console.log("Correction package regression tests passed.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
