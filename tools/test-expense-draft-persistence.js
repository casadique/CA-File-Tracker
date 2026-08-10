const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");

for (const token of [
  "EXPENSE_DRAFT_VERSION = 1",
  "EXPENSE_DRAFT_TTL_MS",
  "EXPENSE_DRAFT_DEBOUNCE_MS = 400",
  "sessionStorage.setItem(expenseDraftStorageKey()",
  "function expenseDraftValuesFromForm()",
  "function expenseDraftIsMeaningful",
  "function persistExpenseDraft",
  "function applyExpenseDraft",
  "function bindExpenseDraft",
  "Unsaved expense restored",
  "Continue Draft",
  "Discard Draft",
  "window.addEventListener(\"pagehide\", persistTransactionEntryDrafts)",
  "document.addEventListener(\"visibilitychange\"",
]) assert.ok(app.includes(token), `Missing Expense draft safeguard: ${token}`);

assert.match(app, /window\.addEventListener\("focus",[\s\S]{0,160}persistTransactionEntryDrafts\(\)/, "switching back to the app must preserve entry drafts before refresh");
assert.match(app, /async function refreshCentralState[\s\S]{0,650}persistTransactionEntryDrafts\(\)/, "central refresh must capture drafts before rerendering");
assert.match(app, /function bindExpenseDraft[\s\S]{0,600}form\.addEventListener\("input", scheduleExpenseDraftSave\)[\s\S]{0,160}form\.addEventListener\("change", scheduleExpenseDraftSave\)/, "expense fields must save drafts while being edited");
assert.match(app, /await saveExpenseToApi\(record\)[\s\S]{0,220}clearExpenseDraft\(\)/, "synced expense saves must clear the completed draft");
assert.match(app, /state\.expenses = existing[\s\S]{0,260}clearExpenseDraft\(\)/, "local expense saves must clear the completed draft");
assert.match(app, /resetExpenseForm[\s\S]{0,420}Clear this Add Expense draft[\s\S]{0,140}clearExpenseDraft\(\)/, "reset must confirm before discarding an unfinished expense");
assert.ok(app.includes("expenseDraftAttachment = selectedFile"), "the selected attachment must survive same-page rerenders");

console.log("Expense draft persistence across window switching, refreshes and transaction navigation passed.");
