const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { queryFinanceTransactions, indiaBusinessDate } = require("../src/services/financeService");

const today = indiaBusinessDate();
const previousDate = new Date(`${today}T00:00:00+05:30`);
previousDate.setDate(previousDate.getDate() - 1);
const yesterday = indiaBusinessDate(previousDate);
const collections = Array.from({ length: 30 }, (_, index) => ({
  id: `collection-${String(index).padStart(2, "0")}`,
  date: today,
  amount: index + 1,
  collectionType: index % 2 ? "fee_collection" : "other_cash_collection",
  receivedFrom: `Client ${index}`,
  particulars: `Service ${index}`,
  voucherNo: `REF-${index}`,
  paymentMethod: index % 3 ? "Cash" : "Bank Transfer",
  accountKey: index % 3 ? "cash" : "federal_bank",
  createdAt: `2026-08-06T10:${String(index).padStart(2, "0")}:00.000Z`,
}));
const state = {
  otherCashCollections: [
    ...collections,
    { id: "historical", date: yesterday, amount: 500, receivedFrom: "Historical Client", accountKey: "cash", paymentMethod: "Cash" },
    { id: "deleted", date: today, amount: 9999, isDeleted: true, accountKey: "cash" },
    { id: "reversed", date: today, amount: 9999, status: "reversed", accountKey: "cash" },
  ],
  expenses: [
    { id: "expense-today", date: today, amount: 125, particulars: "Bank Charges", paidTo: "Federal Bank", paymentMethod: "Bank Transfer", accountKey: "federal_bank" },
    { id: "expense-old", date: yesterday, amount: 75, particulars: "Postage", paidTo: "Courier", paymentMethod: "Cash", accountKey: "cash" },
  ],
};

const todayCollections = queryFinanceTransactions(state, { kind: "collections", view: "today", page: 1, pageSize: 25 });
assert.equal(todayCollections.total, 30);
assert.equal(todayCollections.rows.length, 25);
assert.equal(todayCollections.pageCount, 2);
assert.equal(todayCollections.summary.total, 465);
assert.equal(todayCollections.rows[0].id, "collection-29", "Newest stable transaction should appear first");
assert.ok(!todayCollections.rows.some((row) => row.id === "historical"));

const secondPage = queryFinanceTransactions(state, { kind: "collections", view: "today", page: 2, pageSize: 25 });
assert.equal(secondPage.rows.length, 5);
const allCollections = queryFinanceTransactions(state, { kind: "collections", view: "all", page: 1, pageSize: 100 });
assert.equal(allCollections.total, 31, "Historical rows must remain available in All Transactions");
assert.ok(allCollections.rows.some((row) => row.id === "historical"));
assert.ok(!allCollections.rows.some((row) => row.id === "deleted" || row.id === "reversed"));

const filtered = queryFinanceTransactions(state, { kind: "collections", view: "all", search: "Historical Client", pageSize: 25 });
assert.deepEqual(filtered.rows.map((row) => row.id), ["historical"]);
const expenses = queryFinanceTransactions(state, { kind: "expenses", view: "today", pageSize: 25 });
assert.deepEqual(expenses.rows.map((row) => row.id), ["expense-today"]);

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const routes = fs.readFileSync(path.join(root, "src/routes/financeRoutes.js"), "utf8");
for (const token of ["Today", "Last 7 Days", "This Month", "All Transactions", "Current filtered results", "transaction-detail-modal", "transaction-pagination", "transactionActionsMarkup"]) assert.ok(app.includes(token), `Missing transaction-register token: ${token}`);
for (const selector of [".transaction-ledger-head", ".transaction-ledger-summary", ".transaction-filter-toolbar", ".transaction-detail-modal", ".transaction-pagination"]) assert.ok(styles.includes(`${selector} {`), `Missing transaction-register style: ${selector}`);
for (const marker of ["transaction-menu-toggle", "More actions for this transaction", "aria-label=\"Transaction actions\""]) assert.ok(app.includes(marker), `Missing visible transaction action marker: ${marker}`);
for (const heading of ["<th>Ref No</th>", "<th>Vo. No</th>"]) assert.ok(app.includes(heading), `Missing shortened transaction heading: ${heading}`);
assert.match(styles, /\.transaction-register-modern td\.action-col\s*\{[\s\S]*position:\s*sticky;[\s\S]*right:\s*0;/, "transaction action column must remain visible while scrolling");
assert.match(styles, /\.transaction-row-actions \.transaction-menu-toggle\s*\{[\s\S]*min-width:\s*44px;[\s\S]*border:\s*2px solid/, "transaction overflow button needs a prominent touch target");
assert.ok(routes.includes('router.get("/transactions", requireAuth, requireRole(...financeRoles)'));

console.log("Transaction register date views, pagination, filters, summaries and data-retention checks passed.");
