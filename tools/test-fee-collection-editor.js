const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
let centralState = {
  files: [{
    id: "file-1", name: "Editor Test Client", pan: "ABCDE1234F", serviceType: "ITR Filing", fy: "2025-26",
    careOf: "Direct", assignedStaff: "Rabiyath", billed: true, billingType: "Billable", billNo: "INV-1",
    billDate: "2026-08-01", billedAmount: 1000, stages: { Completed: true, Billed: true },
  }, {
    id: "file-2", name: "Receipt Only Client", pan: "ABCDE5678F", serviceType: "GST Notice", fy: "2025-26",
    careOf: "Direct", assignedStaff: "Munazza", billed: true, billingType: "Billable", billNo: "INV-2",
    billDate: "2026-08-02", billedAmount: 500, stages: { Completed: true, Billed: true },
  }, {
    id: "file-3", name: "Multiple Receipt Client", pan: "ABCDE9012F", serviceType: "Audit", fy: "2025-26",
    careOf: "Direct", assignedStaff: "Althaf", billed: true, billingType: "Billable", billNo: "INV-3",
    billDate: "2026-08-03", billedAmount: 1000, stages: { Completed: true, Billed: true },
  }],
  feeReceipts: [{
    id: "receipt-1", fileId: "file-1", receiptDate: "2026-08-04", amount: 1000,
    paymentMode: "Cash", accountKey: "cash", discountAmount: 0, status: "active",
    pushStatus: "pushed", transactionId: "transaction-1", remarks: "Original receipt",
  }, {
    id: "receipt-2", fileId: "file-2", receiptDate: "2026-08-04", amount: 500,
    paymentMode: "Cash", accountKey: "cash", discountAmount: 0, status: "active",
    pushStatus: "not_pushed", transactionId: "", remarks: "Receipt only",
  }, {
    id: "receipt-3a", fileId: "file-3", receiptDate: "2026-08-03", amount: 400,
    paymentMode: "Cash", accountKey: "cash", discountAmount: 0, status: "active",
    pushStatus: "not_pushed", transactionId: "", remarks: "First instalment",
  }, {
    id: "receipt-3b", fileId: "file-3", receiptDate: "2026-08-04", amount: 600,
    paymentMode: "UPI", accountKey: "federal_bank", discountAmount: 0, status: "active",
    pushStatus: "not_pushed", transactionId: "", remarks: "Second instalment",
  }],
  otherCashCollections: [{
    id: "transaction-1", fileId: "file-1", feeReceiptId: "receipt-1", sourceId: "receipt-1",
    sourceType: "fee_receipt", date: "2026-08-04", amount: 1000, paymentMethod: "Cash",
    accountKey: "cash", accountName: "Cash in Hand", status: "active", createdAt: "2026-08-04T10:00:00.000Z",
  }],
  openingBalances: [{ id: "opening-cash", date: "2026-08-01", accountKey: "cash", amount: 0 }],
  expenses: [], cashReconciliations: [], accountTransfers: [], auditLog: [],
};

const appStatePath = require.resolve(path.join(root, "src/services/appStateService.js"));
require.cache[appStatePath] = {
  id: appStatePath,
  filename: appStatePath,
  loaded: true,
  exports: {
    getAppState: async () => structuredClone(centralState),
    patchAppState: async (mutator) => {
      const next = await mutator(structuredClone(centralState));
      centralState = next;
      return structuredClone(centralState);
    },
  },
};

const finance = require(path.join(root, "src/services/financeService.js"));
const profile = { id: "admin-1", name: "Test Admin", email: "admin@example.com", role: "Admin" };

async function main() {
  const editor = await finance.getFeeCollectionEditor("receipt-1");
  assert.equal(editor.receipt.id, "receipt-1");
  assert.equal(editor.transaction.id, "transaction-1");
  assert.equal(editor.file.name, "Editor Test Client");
  assert.equal(editor.otherReceipts.totalReceived, 0);

  const receiptOnlyEditor = await finance.getFeeCollectionEditor("receipt-2");
  assert.equal(receiptOnlyEditor.receipt.id, "receipt-2");
  assert.equal(receiptOnlyEditor.transaction, null, "Receipt-only records must load without inventing a transaction");

  const partial = await finance.editFeeCollection("receipt-1", {
    billNo: "INV-1", billDate: "2026-08-02", grossBillAmount: 1000,
    discountType: "Fixed Amount", discountAmount: 50, discountReason: "Approved adjustment",
    discountRemarks: "Manager approved", receivedDate: "2026-08-05", receivedAmount: 800,
    paymentMode: "UPI", accountKey: "federal_bank", referenceNumber: "UTR-100",
    receiptRemarks: "Updated receipt", generalRemarks: "Customer confirmed",
  }, profile.id, profile);
  const partialFile = partial.files.find((item) => item.id === "file-1");
  const partialReceipt = partial.feeReceipts.find((item) => item.id === "receipt-1");
  const partialTransaction = partial.otherCashCollections.find((item) => item.id === "transaction-1");
  assert.equal(partialFile.balanceAmount, 150);
  assert.equal(partialFile.feeReceived, false);
  assert.equal(partialFile.paymentStatus, "Partly Received");
  assert.equal(partialReceipt.amount, 800);
  assert.equal(partialReceipt.discountAmount, 50);
  assert.equal(partialReceipt.referenceNumber, "UTR-100");
  assert.equal(partialTransaction.id, "transaction-1", "The linked transaction ID must be preserved");
  assert.equal(partialTransaction.amount, 800);
  assert.equal(partialTransaction.accountKey, "federal_bank");
  assert.equal(partial.otherCashCollections.filter((item) => item.feeReceiptId === "receipt-1").length, 1,
    "Editing must not create a duplicate transaction");
  assert.ok(partial.auditLog.some((entry) => entry.details?.previousValue?.field === "Received Amount"));
  assert.ok(partial.auditLog.some((entry) => entry.details?.previousValue?.field === "Payment Account"));
  assert.ok(partial.auditLog.some((entry) => entry.details?.changeReason === "Approved adjustment"));

  const settled = await finance.editFeeCollection("receipt-1", {
    billNo: "INV-1", billDate: "2026-08-02", grossBillAmount: 1000,
    discountType: "Fixed Amount", discountAmount: 50, discountReason: "Approved adjustment",
    receivedDate: "2026-08-05", receivedAmount: 950,
    paymentMode: "Bank Transfer", accountKey: "tmb", referenceNumber: "TMB-200",
    receiptRemarks: "Fully settled", generalRemarks: "",
  }, profile.id, profile);
  const settledFile = settled.files.find((item) => item.id === "file-1");
  const settledTransaction = settled.otherCashCollections.find((item) => item.id === "transaction-1");
  assert.equal(settledFile.feeReceived, true);
  assert.equal(settledFile.balanceAmount, 0);
  assert.equal(settledTransaction.accountKey, "tmb");
  assert.equal(settledTransaction.amount, 950);
  assert.equal(settled.otherCashCollections.filter((item) => item.id === "transaction-1").length, 1);

  const transactionsBeforeReceiptOnlyEdit = centralState.otherCashCollections.length;
  const receiptOnly = await finance.editFeeCollection("receipt-2", {
    billNo: "INV-2", billDate: "2026-08-02", grossBillAmount: 500,
    discountType: "No Discount", discountAmount: 0,
    receivedDate: "2026-08-05", receivedAmount: 450,
    paymentMode: "Cash", accountKey: "cash", referenceNumber: "CASH-ONLY",
    receiptRemarks: "Adjusted receipt only record", generalRemarks: "",
  }, profile.id, profile);
  assert.equal(receiptOnly.files.find((item) => item.id === "file-2").balanceAmount, 50);
  assert.equal(receiptOnly.feeReceipts.find((item) => item.id === "receipt-2").amount, 450);
  assert.equal(receiptOnly.otherCashCollections.length, transactionsBeforeReceiptOnlyEdit,
    "Editing a receipt-only record must not create a transaction");

  const multiple = await finance.editFeeCollection("receipt-3b", {
    billNo: "INV-3", billDate: "2026-08-03", grossBillAmount: 1000,
    discountType: "No Discount", discountAmount: 0,
    receivedDate: "2026-08-05", receivedAmount: 500,
    paymentMode: "UPI", accountKey: "federal_bank", referenceNumber: "MULTI-2",
    receiptRemarks: "Second instalment corrected", generalRemarks: "",
  }, profile.id, profile);
  assert.equal(multiple.feeReceipts.find((item) => item.id === "receipt-3a").amount, 400,
    "Editing one receipt must preserve the file's other receipt");
  assert.equal(multiple.feeReceipts.find((item) => item.id === "receipt-3b").amount, 500);
  assert.equal(multiple.files.find((item) => item.id === "file-3").amountReceived, 900);
  assert.equal(multiple.files.find((item) => item.id === "file-3").balanceAmount, 100);
  assert.equal(multiple.feeReceipts.filter((item) => item.fileId === "file-3").length, 2);

  const stateBeforeFailure = structuredClone(centralState);
  await assert.rejects(() => finance.editFeeCollection("receipt-1", {
    billNo: "INV-1", billDate: "2026-08-02", grossBillAmount: 1000,
    discountType: "Fixed Amount", discountAmount: 50, discountReason: "Approved adjustment",
    receivedDate: "2026-08-05", receivedAmount: 951,
    paymentMode: "Cash", accountKey: "cash",
  }, profile.id, profile), /cannot exceed the Net Bill Amount/);
  assert.deepEqual(centralState, stateBeforeFailure, "A failed edit must leave central state unchanged");

  await assert.rejects(() => finance.editFeeCollection("receipt-1", {
    billNo: "INV-1", billDate: "2026-08-02", grossBillAmount: 1000,
    discountType: "Fixed Amount", discountAmount: 100,
    receivedDate: "2026-08-05", receivedAmount: 900,
    paymentMode: "Cash", accountKey: "cash",
  }, profile.id, profile), /Discount Reason is required/);

  const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
  const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const routes = fs.readFileSync(path.join(root, "src/routes/financeRoutes.js"), "utf8");
  const actions = appSource.match(/function feeReceivedReceiptActions[\s\S]*?(?=\nfunction feeReceivedExpandedDetails)/)?.[0] || "";
  assert.match(actions, /data-edit-fee-collection/);
  assert.doesNotMatch(actions, /data-edit="/);
  for (const text of ["Edit Fee Collection", "Client & File Details", "Invoice Details", "Discount Details", "Receipt Details", "Transaction Details", "Calculation Summary", "Remarks and Audit Information", "Confirm and Save"]) assert.match(appSource, new RegExp(text));
  assert.match(appSource, /loadFeeCollectionEditorFromApi/);
  assert.match(appSource, /updateFeeCollectionInApi/);
  assert.match(appSource, /const transaction = data\.transaction \|\| \{\}/,
    "The browser editor must safely normalize a null linked transaction");
  assert.match(routes, /router\.get\("\/fee-receipts\/receipt\/:receiptId\/editor"[\s\S]*?requireRole\(\.\.\.financeRoles\)/);
  assert.match(routes, /router\.patch\("\/fee-receipts\/receipt\/:receiptId"[\s\S]*?requireRole\(\.\.\.financeRoles\)/);
  assert.match(styles, /\.fee-collection-modal-card[\s\S]*?width:\s*min\(1180px, 100%\)/);
  assert.match(styles, /@media \(max-width: 560px\)[\s\S]*?height:\s*100vh/);
  console.log("Edit Fee Collection atomic receipt, linked transaction, calculations, audit, permissions and responsive UI checks passed.");
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
