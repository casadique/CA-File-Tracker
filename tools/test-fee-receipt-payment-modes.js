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
    id: "fee-partial-test-file",
    name: "Partial payment client",
    serviceType: "ITR Filing",
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

  const firstPartial = await saveFeeReceipt("fee-partial-test-file", {
    feeReceiptId: "fee-partial-receipt-1",
    receivedDate: "2026-08-04",
    receivedAmount: 400,
    discountAmount: 0,
    paymentMode: "Cash",
    accountKey: "cash",
    pushToTransactions: true,
  }, {
    id: "fee-partial-collection-1",
    paymentMethod: "Cash",
    accountKey: "cash",
    receivedFrom: "Partial payment client",
    particulars: "Fee Collection",
    amount: 400,
  }, profile.id, profile);
  const partialFile = firstPartial.files.find((file) => file.id === "fee-partial-test-file");
  assert.equal(partialFile.feeReceived, false);
  assert.equal(partialFile.balanceAmount, 600);
  assert.equal(partialFile.paymentStatus, "Partly Received");
  await assert.rejects(
    () => saveFeeReceipt("fee-partial-test-file", {
      feeReceiptId: "fee-partial-overpayment",
      receivedDate: "2026-08-04",
      receivedAmount: 601,
      paymentMode: "UPI",
      accountKey: "federal_bank",
      pushToTransactions: true,
    }, {}, profile.id, profile),
    /cannot exceed the outstanding balance of 600\.00/,
  );
  const fullyPaid = await saveFeeReceipt("fee-partial-test-file", {
    feeReceiptId: "fee-partial-receipt-2",
    receivedDate: "2026-08-05",
    receivedAmount: 600,
    discountAmount: 0,
    paymentMode: "UPI",
    accountKey: "federal_bank",
    pushToTransactions: true,
  }, {
    id: "fee-partial-collection-2",
    paymentMethod: "UPI",
    accountKey: "federal_bank",
    receivedFrom: "Partial payment client",
    particulars: "Fee Collection",
    amount: 600,
  }, profile.id, profile);
  const fullyPaidFile = fullyPaid.files.find((file) => file.id === "fee-partial-test-file");
  assert.equal(fullyPaidFile.feeReceived, true);
  assert.equal(fullyPaidFile.balanceAmount, 0);
  assert.equal(fullyPaid.feeReceipts.filter((receipt) => receipt.fileId === "fee-partial-test-file").length, 2);
  assert.equal(fullyPaid.otherCashCollections.filter((item) => item.fileId === "fee-partial-test-file" && item.isDeleted !== true).length, 2);
  const partialAudit = fullyPaid.auditLog.filter((entry) => entry.details?.fileId === "fee-partial-test-file").at(-1);
  assert.equal(partialAudit.details.clientName, "Partial payment client");
  assert.equal(partialAudit.details.paymentMode, "UPI");
  assert.equal(partialAudit.details.account, "Federal Bank");
  assert.equal(partialAudit.details.previousValue.outstandingBalance, 600);
  assert.equal(partialAudit.details.newValue.outstandingBalance, 0);

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
  const ownNumberSource = browserAppSource.match(
    /function billedPdfOwnNumber[\s\S]*?(?=\nfunction billedPdfPaymentStatus)/,
  )?.[0] || "";
  const billedPdfOwnNumber = Function(`return (${ownNumberSource})`)();
  assert.equal(billedPdfOwnNumber({ netBillAmount: null }, ["netBillAmount"]), null,
    "Null financial fields must not be treated as an explicit zero payable amount");
  assert.equal(billedPdfOwnNumber({ netBillAmount: "" }, ["netBillAmount"]), null,
    "Blank financial fields must not be treated as an explicit zero payable amount");
  assert.match(browserAppSource, /savedApprovedPayableAmount > 0 \|\| approvedDiscountAmount >= summary\.billedAmount/,
    "Default zero payable fields must be ignored unless the bill is fully discounted");
  const paymentStatusSource = browserAppSource.match(
    /function billedPdfPaymentStatus[\s\S]*?(?=\nfunction billedPdfFinancialValues)/,
  )?.[0] || "";
  const financialValuesSource = browserAppSource.match(
    /function billedPdfFinancialValues[\s\S]*?(?=\nfunction billedPdfReceiptMode)/,
  )?.[0] || "";
  const billedPdfPaymentStatus = Function(`return (${paymentStatusSource})`)();
  const billedPdfFinancialValues = Function("billedPdfPaymentStatus", `return (${financialValuesSource})`)(billedPdfPaymentStatus);
  assert.deepEqual(billedPdfFinancialValues({
    grossBilledAmount: 1000,
    approvedDiscountAmount: 50,
    totalReceivedAmount: 950,
  }), {
    grossBilledAmount: 1000,
    discountAmount: 50,
    netBillAmount: 950,
    receivedAmount: 950,
    balanceAmount: 0,
    paymentStatus: "Received",
  }, "A fully settled discounted bill must have zero balance and Received status");
  assert.equal(billedPdfFinancialValues({ grossBilledAmount: 1000, approvedDiscountAmount: 50, totalReceivedAmount: 400 }).paymentStatus, "Partially Received");
  assert.equal(billedPdfFinancialValues({ grossBilledAmount: 1000, approvedDiscountAmount: 1000, totalReceivedAmount: 0 }).paymentStatus, "Fully Discounted");
  assert.equal(billedPdfFinancialValues({ grossBilledAmount: 1000, approvedDiscountAmount: 0, totalReceivedAmount: 0 }).paymentStatus, "Not Received");
  assert.equal(billedPdfFinancialValues({
    grossBilledAmount: 1000,
    approvedDiscountAmount: 50,
    totalReceivedAmount: 950,
    approvedPayableAmount: null,
  }).netBillAmount, 950, "A null approved payable amount must use gross less approved discount");
  const legacySettledPdfValues = billedPdfFinancialValues({
    grossBilledAmount: 1000,
    approvedDiscountAmount: 0,
    totalReceivedAmount: 950,
    savedBalanceAmount: 0,
    preserveLegacyBalance: true,
  });
  assert.equal(legacySettledPdfValues.netBillAmount, 950);
  assert.equal(legacySettledPdfValues.balanceAmount, 0);
  assert.equal(legacySettledPdfValues.paymentStatus, "Received");
  const unpaidWithEmptySavedBalance = billedPdfFinancialValues({
    grossBilledAmount: 5000,
    approvedDiscountAmount: 0,
    totalReceivedAmount: 0,
    savedBalanceAmount: 0,
    preserveLegacyBalance: false,
  });
  assert.equal(unpaidWithEmptySavedBalance.netBillAmount, 5000);
  assert.equal(unpaidWithEmptySavedBalance.balanceAmount, 5000);
  assert.equal(unpaidWithEmptySavedBalance.paymentStatus, "Not Received");
  const billedPdfDocumentBody = browserAppSource.match(
    /async function createBilledFilesPdfDocument[\s\S]*?(?=\nasync function exportFilteredFilesPdf)/,
  )?.[0] || "";
  for (const requiredPattern of [
    /orientation: "landscape"/,
    /format: "a4"/,
    /rowPageBreak: "avoid"/,
    /showHead: "everyPage"/,
    /drawBilledPdfGrandTotals/,
    /drawBilledPdfFooters/,
  ]) assert.match(billedPdfDocumentBody, requiredPattern, `Billed Files PDF must include ${requiredPattern}`);
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
  const billedReportBody = browserAppSource.match(
    /function billedFilesReportFields[\s\S]*?(?=\nfunction feeReceivedFilesReportRow)/,
  )?.[0] || "";
  for (const column of ["Bill Date", "Billed Amount", "Received Amount", "Balance Amount", "Received Date", "Payment Mode"]) {
    assert.match(billedReportBody, new RegExp(`"${column}"|${column}:`),
      `Billed Files report must include ${column}`);
  }
  assert.doesNotMatch(billedReportBody, /"Bill No\."|"Transaction Status"|"Payment Status"/,
    "Billed Files report must exclude obsolete columns");
  const billedFilterPanelBody = browserAppSource.match(
    /function renderBilledFilesFilterPanel[\s\S]*?(?=\nfunction billedFilesActionToolbar)/,
  )?.[0] || "";
  for (const requiredText of ["Search &amp; Filter Billed Files", "Global Search", "More Filters", "billedActiveFilterChips", "billedFilesShownLabel"]) {
    assert.match(billedFilterPanelBody, new RegExp(requiredText),
      `Billed Files compact filter panel must include ${requiredText}`);
  }
  const billedFilterBindingBody = browserAppSource.match(
    /function bindBilledFilesFilters[\s\S]*?(?=\nfunction refreshFileResults)/,
  )?.[0] || "";
  assert.match(billedFilterBindingBody, /control\.oninput = \(\) => update\(350\)/,
    "Billed Files global search must use the 350ms debounce");
  assert.match(billedFilterBindingBody, /setBilledFilterSessionValue\("collapsed"/,
    "Billed Files filter collapse state must be remembered for the session");
  const billedChipBindingBody = browserAppSource.match(
    /function bindBilledFilterChips[\s\S]*?(?=\nfunction updateBilledFilterChrome)/,
  )?.[0] || "";
  assert.match(billedChipBindingBody, /data-remove-billed-filter[\s\S]*removeBilledFileFilter/,
    "Billed Files active filter chips must remove one filter at a time");
  const receivedTableBody = browserAppSource.match(
    /function renderFeeReceivedFileTable[\s\S]*?(?=\nfunction feeReceiptIdForFile)/,
  )?.[0] || "";
  const receivedTableHeader = receivedTableBody.match(/<thead><tr>([\s\S]*?)<\/tr><\/thead>/)?.[1] || "";
  assert.doesNotMatch(receivedTableHeader, /<th>Account<\/th>|<th>Status<\/th>/,
    "Fee Received display must not show Account or Status columns");
  assert.match(receivedTableBody, /feeReceiptRecordsForFile\(file\)\.filter/,
    "Fee Received display must use active receipt records only");
  assert.match(receivedTableBody, /!receiptWasPushed\(receipt\) \|\| Boolean\(linkedCollectionForFeeReceipt\(receipt\)\)/,
    "Fee Received display must exclude receipts whose linked transaction was reversed");
  assert.match(receivedTableBody, /file\.feeReceived && !hasReceiptHistory/,
    "Legacy Fee Received rows may be shown only when no receipt history exists");
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
  for (const label of ["Mark Received", "Received", "Go to Transactions", "View Transaction", "Mark Non-Billable", "Mark Not Received", "Delete"]) {
    assert.match(billedActionsBody, new RegExp(label), `Billed actions must include ${label}`);
  }
  assert.match(billedActionsBody, /rolePerm\(\)\.delete/,
    "Billed Delete must follow role permissions");
  assert.match(browserAppSource, /function bindBilledActionMenus/,
    "Billed action menus must have dedicated interaction bindings");
  assert.match(browserAppSource, /document\.body\.appendChild\(menu\)/,
    "Billed action dropdown must portal to the document body");
  assert.match(browserAppSource, /event\.target\.closest\("\[data-billed-menu-toggle\]"\)/,
    "Billed action trigger must use delegated click handling across table rerenders");
  assert.match(browserAppSource, /toggle && event\.key === "ArrowDown"/,
    "Billed action trigger must support keyboard menu navigation without overriding native Enter and Space clicks");
  assert.match(browserAppSource, /document\.addEventListener\("scroll", scheduleBilledActionMenuPosition, true\)/,
    "Billed action dropdown must reposition for nested table and page scrolling");
  assert.match(browserAppSource, /window\.addEventListener\("resize", scheduleBilledActionMenuPosition\)/,
    "Billed action dropdown must reposition when the viewport changes");
  assert.match(browserAppSource, /data-go-transactions/,
    "Fee Pending actions must navigate to the existing Transactions screen");
  const feePendingTableBody = browserAppSource.match(
    /function renderFeePendingFileTable[\s\S]*?(?=\nfunction renderReAssignedFileTable)/,
  )?.[0] || "";
  assert.match(feePendingTableBody, /billedFileActions\(file, \{ context: "feePending" \}\)/,
    "Fee Pending must reuse the working Billed Files actions component");
  assert.match(billedActionsBody, /Receive Balance/,
    "Partially received Fee Pending records must offer Receive Balance");
  const receiptModalBody = browserAppSource.match(
    /function openMarkReceivedModal[\s\S]*?(?=\nfunction closeMarkReceivedModal)/,
  )?.[0] || "";
  assert.match(receiptModalBody, /receiptSummary\.outstandingAmount/,
    "Fee receipt modal must prefill and cap the amount using the outstanding balance");
  const collectionSaveBody = browserAppSource.match(
    /async function saveFeeReceiptCollection[\s\S]*?(?=\nfunction feeReceiptFromModal)/,
  )?.[0] || "";
  assert.match(collectionSaveBody, /item\.feeReceiptId === receipt\.feeReceiptId/,
    "Partial receipt transaction lookup must match the exact receipt");
  assert.doesNotMatch(collectionSaveBody, /linkedFeeReceiptCollection/,
    "Partial receipts must not reuse an unrelated earlier transaction for the file");
  const billedLayoutBody = browserAppSource.match(
    /let billedTableSort[\s\S]*?(?=\nfunction renderFileTable)/,
  )?.[0] || "";
  for (const heading of ["Client", "Service", "Work Timeline", "C/o", "Billing Details", "Payment", "Assigned Staff", "Actions"]) {
    assert.match(billedLayoutBody, new RegExp(heading), `Billed Files layout must include ${heading}`);
  }
  for (const paymentStatus of ["Payment Pending", "Partially Received", "Received", "Not Received", "Non-Billable", "Transaction Linked"]) {
    assert.match(billedLayoutBody, new RegExp(paymentStatus), `Billed Files layout must include ${paymentStatus} styling`);
  }
  assert.match(billedLayoutBody, /fileActualCompletionDate\(file\)/,
    "Billed Files timeline must use the completed date instead of the due date");
  assert.match(billedLayoutBody, /data-billed-row-toggle/,
    "Billed Files client must provide expandable row details");
  const billedExpandedBody = billedLayoutBody.match(/function billedExpandedDetails[\s\S]*?(?=\nfunction billedDesktopRow)/)?.[0] || "";
  for (const heading of ["Bill History", "Receipt History", "Remarks"]) {
    assert.match(billedExpandedBody, new RegExp(heading), `Billed Files expanded view must include ${heading}`);
  }
  assert.doesNotMatch(billedExpandedBody, /Workflow history|Work dates/,
    "Billed Files expanded view must exclude workflow and work-date history");
  assert.match(appStyles, /\.billed-expanded-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/,
    "Bill history, receipt history and remarks must stay in one desktop row");
  assert.match(billedLayoutBody, /billedMobileCard/,
    "Billed Files must render a dedicated mobile card layout");
  assert.match(billedLayoutBody, /billedFileActions\(file\)/,
    "Billed Files desktop and mobile layouts must preserve the functional action controls");
  const fileTableBody = browserAppSource.match(/function renderFileTable[\s\S]*?(?=\nfunction renderNotCheckedFileTable)/)?.[0] || "";
  assert.match(fileTableBody, /const receiptInfo = isBilledView \? "" : receiptSummary\(file\)/,
    "Billed Files Final Status must show only the status badge, without receipt amount details");
  assert.match(appStyles, /\.billed-action-menu\s*\{[\s\S]*?position:\s*fixed/,
    "Billed dropdown must render above the table without clipping");
  assert.match(appStyles, /\.billed-menu-toggle\s*\{[\s\S]*?width:\s*40px[\s\S]*?min-height:\s*40px[\s\S]*?cursor:\s*pointer/,
    "Billed action trigger must provide a pointer-enabled 40 by 40 pixel target");
  assert.match(appStyles, /@media \(max-width: 680px\)[\s\S]*?\.billed-action-menu/,
    "Billed actions must provide a mobile bottom-sheet layout");
  assert.match(appStyles, /\.fee-pending-report-table \.fee-pending-actions-column\s*\{[\s\S]*?min-width:\s*194px/,
    "Fee Pending actions must use the compact Billed Files action width");
  assert.match(appStyles, /\.billed-files-table th\s*\{[\s\S]*?position:\s*sticky[\s\S]*?background:\s*#e8eef7/i,
    "Billed Files must have a sticky pale blue header");
  assert.match(appStyles, /\.billed-files-table th\.billed-client-cell,[\s\S]*?position:\s*sticky[\s\S]*?left:\s*52px/,
    "Billed Files client column must remain sticky on horizontal scroll");
  assert.match(appStyles, /\.billed-files-table \.billed-actions-column\s*\{[\s\S]*?position:\s*sticky[\s\S]*?right:\s*0/,
    "Billed Files actions must remain sticky on the right");
  assert.match(appStyles, /@media \(max-width: 680px\)[\s\S]*?\.billed-files-table\s*\{\s*display:\s*none[\s\S]*?\.billed-mobile-list\s*\{\s*display:\s*grid/,
    "Billed Files must switch from the table to cards on mobile");
  console.log("Fee receipt payment mode and account tests passed.");
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
