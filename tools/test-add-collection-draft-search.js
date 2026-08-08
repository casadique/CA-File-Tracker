const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const financeSource = fs.readFileSync(path.join(root, "src/services/financeService.js"), "utf8");

for (const token of [
  "ADD_COLLECTION_DRAFT_VERSION",
  "ADD_COLLECTION_DRAFT_DEBOUNCE_MS = 400",
  "sessionStorage.setItem(addCollectionDraftStorageKey()",
  "window.addEventListener(\"beforeunload\"",
  "Unsaved collection restored",
  "Continue Draft",
  "Discard Draft",
  "role=\"combobox\"",
  "aria-controls=\"cashReceivedFromResults\"",
  "normalizeCollectionSearch",
  "collectionSearchRank",
  "addCollectionSourceSearchController?.abort()",
  "api/clients/search",
  "Search or enter client/source name",
  "document.querySelector(\"#cashReceivedFromSearch\")?.value.trim()",
  "sourceType: selectedFileId ? \"billed_file\" : selectedClientId ? \"client\" : \"manual_source\"",
  "saveLinkedFeeReceiptToApi(selectedFileId",
  "addCollectionSaveInFlight",
]) assert.ok(app.includes(token), `Missing Add Collection safeguard: ${token}`);

assert.ok(app.includes("if (suppressAddCollectionDraftCapture) suppressAddCollectionDraftCapture = false;"), "successful saves must not recreate a cleared draft during rerender");
assert.match(app, /clearAddCollectionDraft\(\);[\s\S]{0,180}renderAll\(\)/, "successful or explicit reset flows must clear the draft before rerender");
assert.match(app, /outstandingAmount <= 0[\s\S]{0,500}disabled aria-disabled/, "fully received billed files must be disabled");
assert.match(app, /ArrowDown[\s\S]*ArrowUp[\s\S]*Enter[\s\S]*Escape/, "combobox must support keyboard navigation");
assert.ok(styles.includes(".collection-source-results"), "search result dropdown styling is required");
assert.ok(styles.includes("z-index:1200"), "search results must appear above the transaction layout");
assert.ok(styles.includes("@media (max-width:700px)"), "mobile combobox treatment is required");
assert.ok(financeSource.includes("clientId: payload.clientId || payload.client_id"), "collection normalization must preserve the permanent client ID");
assert.ok(financeSource.includes("billingRecordId: payload.billingRecordId || payload.billing_record_id"), "collection normalization must preserve the billing record ID");

let capturedState = { files: [], otherCashCollections: [], auditLog: [] };
const appStatePath = require.resolve(path.join(root, "src/services/appStateService.js"));
require.cache[appStatePath] = {
  id: appStatePath, filename: appStatePath, loaded: true,
  exports: {
    patchAppState: async (mutator) => { capturedState = await mutator(structuredClone(capturedState)); return capturedState; },
    sortFilesNewestFirst: (rows) => rows,
    normalizeFileNotifications: (rows) => rows,
  },
};

async function main() {
  const finance = require(path.join(root, "src/services/financeService.js"));
  await finance.saveCollection({
    id: "collection-linked-1", date: "2026-08-07", amount: 500,
    paymentMethod: "Bank Transfer", accountKey: "federal_bank",
    receivedFrom: "Linked Client", particulars: "Fee Collection",
    clientId: "client-permanent-1", fileId: "file-permanent-1", billingRecordId: "bill-permanent-1",
  }, "admin-1", { id: "admin-1", name: "Admin", email: "admin@example.com", role: "Admin" });
  const saved = capturedState.otherCashCollections[0];
  assert.equal(saved.clientId, "client-permanent-1");
  assert.equal(saved.fileId, "file-permanent-1");
  assert.equal(saved.billingRecordId, "bill-permanent-1");
  console.log("Add Collection draft persistence, linked source search, accessibility and atomic fee-save checks passed.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
