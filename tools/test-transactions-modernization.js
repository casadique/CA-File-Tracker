const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

for (const token of ["Account Overview", "Unclassified legacy bank entries", "Set Opening Balances", "Account balances", "Combined opening balance", "Previous balances will not be overwritten.", "Cash Reconciliation History", "Expected Closing Cash", "Physical Cash Counted", "Collection Details", "Payment &amp; Reference", "Find Collection Transactions", "collection-register-modern"]) {
  assert.ok(app.includes(token), `Missing modern Transactions UI token: ${token}`);
}
assert.doesNotMatch(app.slice(app.indexOf("function expenseOverviewCard"), app.indexOf("function normalizeCollectionType")), /transactionSparkline\(/,
  "Balance cards must not render decorative sparklines");
assert.match(styles, /\.expense-overview-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4/);
assert.match(styles, /@media \(max-width: 700px\)[\s\S]*?\.reconciliation-mobile-list\s*\{\s*display:\s*grid/);
for (const selector of [".collection-form-modern", ".collection-filter-grid", ".collection-register-table", ".collection-type-badge"]) {
  assert.ok(styles.includes(`${selector} {`), `Missing modern Collections style: ${selector}`);
}
for (const selector of [".opening-balance-effective-card", ".opening-balance-modal-account", ".opening-balance-input-wrap", ".opening-balance-modal-total", ".opening-balance-modal-footer"]) {
  assert.ok(styles.includes(`${selector} {`), `Missing polished Opening Balances modal style: ${selector}`);
}
assert.match(styles, /\.opening-balance-modal-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3/,
  "Opening Balance account cards should use a three-column desktop layout");
assert.match(styles, /@media \(max-width: 700px\)[\s\S]*?\.opening-balance-modal-grid,[\s\S]*?grid-template-columns:\s*1fr/,
  "Opening Balance account cards should stack on mobile");
const collectionFormSource = app.slice(app.indexOf("function renderCashCollectionsTab"), app.indexOf("function renderAccountTransfersTab"));
assert.doesNotMatch(collectionFormSource, /collectionTypeSelect\("cashCollectionType"/,
  "Add Collection must not show a Collection Type option");
assert.match(app, /const collectionType = normalizeCollectionType\(existing\?\.collectionType \|\| existing\?\.collection_type \|\| "other_cash_collection"\)/,
  "manual collections should retain an existing internal type or use the safe default");

let state = { files: [], expenses: [], otherCashCollections: [], openingBalances: [], accountTransfers: [], cashReconciliations: [], auditLog: [] };
const appStatePath = require.resolve(path.join(root, "src/services/appStateService.js"));
require.cache[appStatePath] = {
  id: appStatePath, filename: appStatePath, loaded: true,
  exports: {
    patchAppState: async (mutator) => { state = await mutator(structuredClone(state)); return state; },
    sortFilesNewestFirst: (rows) => rows,
    normalizeFileNotifications: (rows) => rows,
  },
};

const finance = require(path.join(root, "src/services/financeService.js"));
const admin = { id: "admin-1", name: "Finance Admin", email: "admin@example.com", role: "Admin" };

async function main() {
  await finance.saveOpeningBalances([
    { date: "2026-08-01", accountKey: "cash", amount: 1000 },
    { date: "2026-08-01", accountKey: "federal_bank", amount: 500 },
    { date: "2026-08-01", accountKey: "tmb", amount: 200 },
  ], admin.id, admin, "Initial verified balances");
  assert.equal(state.openingBalances.length, 3);
  assert.equal(state.auditLog.filter((entry) => entry.action === "Opening balance version saved").length, 3);
  await assert.rejects(() => finance.saveOpeningBalances([
    { date: "2026-08-01", accountKey: "cash", amount: 1 },
    { date: "2026-08-01", accountKey: "federal_bank", amount: 1 },
    { date: "2026-08-01", accountKey: "tmb", amount: 1 },
  ], admin.id, admin, "Duplicate"), /already has an opening balance/);

  await finance.saveCollection({ id: "cash-in", date: "2026-08-02", amount: 200, paymentMethod: "Cash", accountKey: "cash", receivedFrom: "Client", particulars: "Collection" }, admin.id, admin);
  state.otherCashCollections.push({ id: "legacy", date: "2026-08-02", amount: 999, paymentMethod: "Bank Transfer", accountKey: "unclassified_bank", receivedFrom: "Legacy", particulars: "Legacy", status: "active" });
  await finance.saveExpense({ id: "cash-out", date: "2026-08-02", amount: 100, paymentMethod: "Cash", accountKey: "cash", particulars: "Office Expense" }, admin.id, admin);
  await finance.saveAccountTransfer({ id: "transfer-1", date: "2026-08-02", amount: 50, fromAccountKey: "federal_bank", toAccountKey: "cash", reference: "TR-1" }, admin.id, admin);

  let summary = finance.accountSummary(state, "2026-08-02");
  assert.equal(summary.cashBalance, 1150);
  assert.equal(summary.federalBankBalance, 450);
  assert.equal(summary.tmbBalance, 200);
  assert.equal(summary.unclassifiedBankBalance, 999);
  assert.equal(summary.totalBalance, 1800, "Total must exclude unclassified legacy entries");

  await finance.submitCashReconciliation({ from: "2026-08-01", to: "2026-08-02", physicalCashCount: 1160, remarks: "Counted" }, admin.id, admin);
  const reconciliation = state.cashReconciliations[0];
  assert.equal(reconciliation.expectedCash, 1150);
  assert.equal(reconciliation.adjustmentAmount, 10);
  assert.equal(reconciliation.approvalStatus, "submitted");
  await assert.rejects(() => finance.decideCashReconciliation(reconciliation.id, "approve", {}, admin.id, admin), /remarks are required/i);
  await finance.decideCashReconciliation(reconciliation.id, "approve", { approvalRemarks: "Count verified" }, admin.id, admin);
  const auditCount = state.auditLog.length;
  await finance.decideCashReconciliation(reconciliation.id, "approve", { approvalRemarks: "Duplicate click" }, admin.id, admin);
  assert.equal(state.auditLog.length, auditCount, "Approval must be applied exactly once");
  summary = finance.accountSummary(state, "2026-08-02");
  assert.equal(summary.cashBalance, 1160);
  assert.equal(summary.totalBalance, 1810);

  console.log("Transactions modernization, balance integrity and reconciliation workflow checks passed.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
