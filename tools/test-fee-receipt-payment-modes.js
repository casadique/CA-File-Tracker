const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
let capturedState = {
  files: [{
    id: "fee-mode-test-file",
    name: "Fee mode test client",
    billedAmount: 1000,
    stages: { Billed: true },
  }, {
    id: "fee-discount-test-file",
    name: "TEST ABCD EVE 2",
    billedAmount: 1000,
    stages: { Billed: true },
  }, {
    id: "billed-delete-test-file",
    name: "Billed delete test client",
    serviceType: "ITR Filing",
    billed: true,
    feeReceived: true,
    billedAmount: 500,
    stages: { Completed: true, Billed: true },
  }],
  feeReceipts: [{
    id: "billed-delete-receipt",
    fileId: "billed-delete-test-file",
    amount: 500,
    status: "active",
    transactionId: "billed-delete-transaction",
  }],
  otherCashCollections: [{
    id: "billed-delete-transaction",
    fileId: "billed-delete-test-file",
    feeReceiptId: "billed-delete-receipt",
    sourceType: "fee_receipt",
    amount: 500,
    status: "active",
  }],
  auditLog: [],
};

const appStatePath = require.resolve(path.join(root, "src/services/appStateService.js"));
require.cache[appStatePath] = {
  id: appStatePath,
  filename: appStatePath,
  loaded: true,
  exports: {
    patchAppState: async (mutator) => {
      capturedState = await mutator(structuredClone(capturedState));
      return capturedState;
    },
    sortFilesNewestFirst: (rows) => rows,
    normalizeFileNotifications: (rows) => rows,
  },
};

const { saveFeeReceipt } = require(path.join(root, "src/services/financeService.js"));
const { removeBilledFileSafely, upsertFile } = require(path.join(root, "src/services/fileService.js"));
const profile = { id: "admin-id", name: "Test Admin", email: "admin@example.com", role: "Admin" };

async function saveMode(paymentMode, accountKey, index) {
  const feeReceiptId = `fee-receipt-${index}`;
  const collection = {
    id: `fee-collection-${index}`,
    date: "2026-08-04",
    collectionType: "fee_collection",
    paymentMethod: paymentMode,
    mode: paymentMode,
    accountKey,
    accountName: accountKey === "cash" ? "Cash in Hand" : accountKey === "tmb" ? "TMB" : "Federal Bank",
    receivedFrom: "Fee mode test client",
    particulars: "Fee Collection",
    amount: 100,
  };
  const result = await saveFeeReceipt("fee-mode-test-file", {
    feeReceiptId,
    receivedDate: "2026-08-04",
    receivedAmount: 100,
    discountAmount: 0,
    paymentMode,
    accountKey,
    pushToTransactions: true,
  }, collection, profile.id, profile);
  const receipt = result.feeReceipts.find((item) => item.id === feeReceiptId);
  const linked = result.otherCashCollections.find((item) => item.feeReceiptId === feeReceiptId);
  assert.equal(receipt.paymentMode, paymentMode);
  assert.equal(receipt.accountKey, accountKey);
  assert.equal(linked.paymentMethod, paymentMode);
  assert.equal(linked.accountKey, accountKey);
}

async function main() {
  const cases = [
    ["Cash", "cash"],
    ["Bank Transfer", "federal_bank"],
    ["UPI", "federal_bank"],
    ["Cheque", "tmb"],
    ["Card", "tmb"],
    ["Other", "federal_bank"],
  ];
  for (let index = 0; index < cases.length; index += 1) {
    await saveMode(cases[index][0], cases[index][1], index);
  }
  const settled = await saveFeeReceipt("fee-discount-test-file", {
    feeReceiptId: "fee-discount-settlement",
    receivedDate: "2026-08-04",
    receivedAmount: 950,
    discountAmount: 50,
    paymentMode: "UPI",
    accountKey: "federal_bank",
    pushToTransactions: false,
  }, {}, profile.id, profile);
  const settledFile = settled.files.find((file) => file.id === "fee-discount-test-file");
  assert.equal(settledFile.feeReceived, true);
  assert.equal(settledFile.balanceAmount, 0);
  assert.equal(settledFile.paymentStatus, "Fee Received");

  await removeBilledFileSafely("billed-delete-test-file", { removalReason: "Test safe removal" }, profile.id, profile);
  const removedFile = capturedState.files.find((file) => file.id === "billed-delete-test-file");
  const reversedReceipt = capturedState.feeReceipts.find((receipt) => receipt.id === "billed-delete-receipt");
  const reversedTransaction = capturedState.otherCashCollections.find((item) => item.id === "billed-delete-transaction");
  assert.equal(removedFile.status, "Removed");
  assert.equal(removedFile.isRemoved, true);
  assert.equal(reversedReceipt.status, "not_received");
  assert.equal(reversedReceipt.isReversed, true);
  assert.equal(reversedTransaction.status, "reversed");
  assert.equal(reversedTransaction.isReversed, true);
  assert.match(capturedState.auditLog.at(-1).action, /Billed file safely removed/);
  await assert.rejects(
    () => upsertFile({ ...capturedState.files.find((file) => file.id === "fee-mode-test-file"), billingType: "Non-Billable" }, "staff-id", { id: "staff-id", name: "Test Staff", role: "Staff" }),
    /Only Admin or Manager can change billing or payment details/,
  );

  const browserAppSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
  const pendingAmountBody = browserAppSource.match(/function filePendingAmount\(file\) \{([\s\S]*?)\n\}/)?.[1] || "";
  assert.match(pendingAmountBody, /feeReceiptSummaryForFile\(file\)\.outstandingAmount/,
    "Fee Pending must use the receipt summary, including discounts");
  const receivedReportBody = browserAppSource.match(
    /function feeReceivedFilesReportRow[\s\S]*?(?=\nfunction feePendingReportRow)/,
  )?.[0] || "";
  for (const column of ["Client Name", "Service Type", "Billed Amount", "Received Amount", "Balance", "Payment Mode"]) {
    assert.match(receivedReportBody, new RegExp(`"${column}"|${column}:`),
      `Fee Received report must include ${column}`);
  }
  assert.doesNotMatch(receivedReportBody, /"Bill No\."|"Transaction Status"|"Payment Status"|"Received By"/,
    "Fee Received report must exclude obsolete columns");
  const receivedTableBody = browserAppSource.match(
    /function renderFeeReceivedFileTable[\s\S]*?(?=\nfunction feeReceiptIdForFile)/,
  )?.[0] || "";
  const receivedTableHeader = receivedTableBody.match(/<thead><tr>([\s\S]*?)<\/tr><\/thead>/)?.[1] || "";
  assert.doesNotMatch(receivedTableHeader, /<th>Account<\/th>|<th>Status<\/th>/,
    "Fee Received display must not show Account or Status columns");
  const appStyles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const pendingTableStyles = appStyles.match(
    /\.fee-pending-report-table \{[\s\S]*?(?=\n\.fee-pending-report-table tfoot td)/,
  )?.[0] || "";
  assert.match(pendingTableStyles, /width:\s*max-content/,
    "Fee Pending table must size columns from their content");
  assert.match(pendingTableStyles, /table-layout:\s*auto/,
    "Fee Pending table must use automatic column layout");
  assert.doesNotMatch(pendingTableStyles, /min-width:\s*1180px|table-layout:\s*fixed/,
    "Fee Pending table must not retain its old fixed-width layout");
  const billedActionsBody = browserAppSource.match(
    /function billedFileActions[\s\S]*?(?=\nlet activeBilledActionToggle)/,
  )?.[0] || "";
  for (const label of ["Mark Received", "Received", "View Transaction", "Mark Non-Billable", "Mark Not Received", "Delete"]) {
    assert.match(billedActionsBody, new RegExp(label), `Billed actions must include ${label}`);
  }
  assert.match(billedActionsBody, /rolePerm\(\)\.delete/,
    "Billed Delete must follow role permissions");
  assert.match(browserAppSource, /function bindBilledActionMenus/,
    "Billed action menus must have dedicated interaction bindings");
  assert.match(appStyles, /\.billed-action-menu\s*\{[\s\S]*?position:\s*fixed/,
    "Billed dropdown must render above the table without clipping");
  assert.match(appStyles, /@media \(max-width: 680px\)[\s\S]*?\.billed-action-menu/,
    "Billed actions must provide a mobile bottom-sheet layout");
  console.log("Fee receipt payment mode and account tests passed.");
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
