const assert = require("assert");
const { prepareFileDataReset } = require("../src/services/fileDataResetService");

const input = {
  files: [{ id: "file-1", name: "Client A", attachments: [{ path: "files/a.pdf" }], feeReceiptId: "receipt-1" }],
  deletedFileIds: ["old-file"],
  correctionHistory: [{ id: "correction-1", fileId: "file-1" }],
  users: [{ id: "user-1", name: "Admin" }],
  services: ["Tax Audit"],
  staffMaster: ["Staff A"],
  chatMessages: [{ id: "chat-1", text: "Keep me" }],
  visitors: [{ id: "visitor-1" }],
  expenses: [{ id: "expense-1", amount: 50 }],
  openingBalances: [{ id: "opening-1", amount: 1000 }],
  cashReconciliations: [{ id: "recon-1" }],
  otherCashCollections: [
    { id: "linked-1", fileId: "file-1", sourceType: "fee_receipt", amount: 500 },
    { id: "manual-1", collectionType: "other_cash_collection", amount: 200 },
  ],
  fileNotifications: [
    { id: "notice-1", fileId: "file-1", changeType: "File Allotted" },
    { id: "notice-2", changeType: "Administrative Announcement" },
  ],
  auditLog: [
    { id: "audit-1", action: "File created", details: { fileId: "file-1", fileName: "Client A" } },
    { id: "audit-2", action: "Visitor added", details: { visitorId: "visitor-1" } },
  ],
};

const result = prepareFileDataReset(input, { name: "CA Sadique", role: "Admin" });
assert.deepStrictEqual(result.state.files, []);
assert.deepStrictEqual(result.state.deletedFileIds, []);
assert.deepStrictEqual(result.state.correctionHistory, []);
assert.deepStrictEqual(result.state.otherCashCollections.map((row) => row.id), ["manual-1"]);
assert.deepStrictEqual(result.state.fileNotifications.map((row) => row.id), ["notice-2"]);
assert(result.state.auditLog.some((row) => row.id === "audit-2"));
assert(result.state.auditLog.some((row) => row.action === "All file records cleared"));
assert.deepStrictEqual(result.state.users, input.users);
assert.deepStrictEqual(result.state.chatMessages, input.chatMessages);
assert.deepStrictEqual(result.state.visitors, input.visitors);
assert.deepStrictEqual(result.state.expenses, input.expenses);
assert.deepStrictEqual(result.state.openingBalances, input.openingBalances);
assert.deepStrictEqual(result.state.cashReconciliations, input.cashReconciliations);
assert.strictEqual(result.backup.summary.files, 1);
assert.strictEqual(result.backup.summary.linkedCollections, 1);
assert.strictEqual(result.backup.summary.attachmentReferences, 1);
assert.strictEqual(result.archive.backup.backupId, result.backup.backupId);
assert.strictEqual(Object.prototype.hasOwnProperty.call(result.state, "fileDataBackups"), false);
console.log("File-data reset tests passed.");
