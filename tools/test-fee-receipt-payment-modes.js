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
  }],
  feeReceipts: [],
  otherCashCollections: [],
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
  },
};

const { saveFeeReceipt } = require(path.join(root, "src/services/financeService.js"));
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

  const browserAppSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
  const pendingAmountBody = browserAppSource.match(/function filePendingAmount\(file\) \{([\s\S]*?)\n\}/)?.[1] || "";
  assert.match(pendingAmountBody, /feeReceiptSummaryForFile\(file\)\.outstandingAmount/,
    "Fee Pending must use the receipt summary, including discounts");
  console.log("Fee receipt payment mode and account tests passed.");
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
