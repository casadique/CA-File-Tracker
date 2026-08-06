const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { expenseItemIsUsed } = require("../src/services/financeService");

assert.equal(expenseItemIsUsed([{ particulars: "Electricity Charges" }], "electricity charges"), true);
assert.equal(expenseItemIsUsed([{ expense_item: "  Office   Expense " }], "Office Expense"), true);
assert.equal(expenseItemIsUsed([{ particulars: "Rent" }], "Telephone Charges"), false);
assert.equal(expenseItemIsUsed([], "Rent"), false);

const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const styles = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");
const routes = fs.readFileSync(path.join(__dirname, "..", "src/routes/financeRoutes.js"), "utf8");
const service = fs.readFileSync(path.join(__dirname, "..", "src/services/financeService.js"), "utf8");

assert(app.includes('value="__add_expense_item__">+ Add New Expense</option>'));
assert(app.includes('value="__remove_expense_item__">- Remove Expense Item</option>'));
assert(app.includes('addEventListener("change", handleExpenseItemDropdownChange)'));
assert(app.includes('id="expenseItemManagerModal"'));
assert(app.includes('role="dialog" aria-modal="true"'));
assert(app.includes('data-close-expense-item-manager'));
assert(app.includes('event.key === "Escape"'));
assert(app.includes('actionButton.textContent = "Adding..."'));
assert(app.includes('actionButton.textContent = "Removing..."'));
assert(styles.includes(".expense-item-manager {"));
assert(styles.includes("width: min(680px, calc(100vw - 40px));"));
assert(styles.includes("z-index: 13000;"));
assert(styles.includes("@media (max-width: 640px)"));
assert(app.includes('apiJson("/api/finance/expense-items"'));
assert(routes.includes('router.post("/expense-items", requireAuth, requireRole(...financeRoles)'));
assert(routes.includes('router.delete("/expense-items", requireAuth, requireRole(...financeRoles)'));
assert(service.includes("has corresponding expense entries and cannot be removed"));
assert(service.includes('appendAudit(state, "Expense item added"'));
assert(service.includes('appendAudit(state, "Expense item removed"'));

console.log("Expense item dropdown add/remove and usage guard tests passed.");
