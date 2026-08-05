const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

function block(start, end) {
  const match = source.match(new RegExp(`${start}[\\s\\S]*?(?=${end})`));
  assert.ok(match, `Missing source block: ${start}`);
  return match[0];
}

const table = block("function renderFeeReceivedFileTable", "\\nfunction feeReceiptIdForFile");
for (const heading of ["Client", "Service", "Billing Details", "Receipt Details", "Balance", "Transaction", "Actions"]) {
  assert.match(table, new RegExp(`>${heading}<`), `Fee Received layout must include ${heading}`);
}
assert.doesNotMatch(table.match(/<thead><tr>[\s\S]*?<\/tr><\/thead>/)?.[0] || "", />Account<|>Status</);
assert.match(table, /feeReceiptRecordsForFile\(file\)\.filter/);
assert.match(table, /!receiptWasPushed\(receipt\) \|\| Boolean\(linkedCollectionForFeeReceipt\(receipt\)\)/);
assert.match(table, /file\.feeReceived && !hasReceiptHistory/);

const desktopRow = block("function feeReceivedDesktopRow", "\\nfunction feeReceivedMobileCard");
assert.doesNotMatch(desktopRow, /escapeHtml\(rupee\(/,
  "Fee Received currency values must render the rupee symbol instead of its HTML entity text");
assert.doesNotMatch(desktopRow, /<span>Billed<\/span>|<span>Received<\/span>|<span>Balance<\/span>/,
  "Desktop amount cells must not repeat their column headings");
assert.doesNotMatch(desktopRow, /row\.paymentMode/,
  "Receipt Details must show only the received amount and date");

const expandedDetails = block("function feeReceivedExpandedDetails", "\\nfunction feeReceivedDesktopRow");
assert.match(expandedDetails, /<span>Discount<\/span><strong>\$\{rupee\(row\.discountAmount\)\}<\/strong>/,
  "Expanded Discount must render through the currency formatter");
assert.doesNotMatch(expandedDetails, /escapeHtml\(rupee\(/,
  "Expanded Discount must not double-escape the rupee symbol into visible entity text");

for (const requirement of [
  /function feeReceivedDisplayRow/,
  /function feeReceivedTransactionCell/,
  /function feeReceivedReceiptActions/,
  /fee-received-mobile-card/,
  /data-go-fee-transaction/,
  /data-go-transactions/,
  /data-view-fee-receipt/,
  /data-fee-receipt-not-received/,
  /data-delete-billed/,
  /data-billed-menu-toggle/,
  /document\.querySelectorAll\("\[data-fee-received-row-toggle\]"\)/,
]) assert.match(source, requirement);

for (const selector of [
  ".fee-received-modern-wrap",
  ".fee-received-modern-table",
  ".fee-received-transaction-state",
  ".fee-received-actions-column",
  ".fee-received-mobile-card",
  ".fee-received-expanded-grid",
  "@media (max-width: 760px)",
]) assert.match(styles, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

assert.match(styles, /\.fee-received-modern-table \.fee-received-client\s*\{[\s\S]*?position:\s*sticky/);
assert.match(styles, /\.fee-received-actions-column\s*\{[\s\S]*?position:\s*sticky/);
assert.match(styles, /@media \(max-width: 760px\)[\s\S]*?\.fee-received-modern-table\s*\{\s*display:\s*none[\s\S]*?\.fee-received-mobile-list\s*\{\s*display:\s*grid/);

console.log("Fee Received responsive layout, transaction state, actions and receipt filtering checks passed.");
