const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const configPath = require.resolve("../src/config/supabase");
const servicePath = require.resolve("../src/services/appStateService");

let selectedColumns = "";
let writtenState = null;
const chain = {
  update(payload) {
    writtenState = payload.state;
    return this;
  },
  eq() {
    return this;
  },
  select(columns) {
    selectedColumns = columns;
    return this;
  },
  async maybeSingle() {
    return { data: { updated_at: "2026-08-15T00:00:00.001Z" }, error: null };
  },
};

require.cache[configPath] = {
  id: configPath,
  filename: configPath,
  loaded: true,
  exports: { supabaseAdmin: { from: () => chain } },
};
delete require.cache[servicePath];

const { saveAppStateIfCurrent } = require(servicePath);

(async () => {
  const saved = await saveAppStateIfCurrent(
    { files: [{ id: "file-1", name: "Performance check" }], fileNotifications: [] },
    "00000000-0000-4000-8000-000000000001",
    "2026-08-15T00:00:00.000Z"
  );

  assert.equal(selectedColumns, "updated_at", "Save must not download the full state after updating it");
  assert.equal(saved.state, writtenState, "The normalized state already sent to the database should be reused");
  assert.equal(saved.state.files[0].id, "file-1");

  const routes = fs.readFileSync(path.resolve(__dirname, "..", "src", "routes", "fileRoutes.js"), "utf8");
  assert.doesNotMatch(routes, /const before = await getAppState\(\)/, "File mutations must not pre-download central state");
  assert.match(routes, /notificationsForFileSince\(/, "New-notification selection should use the mutation boundary");

  const financeRoutes = fs.readFileSync(path.resolve(__dirname, "..", "src", "routes", "financeRoutes.js"), "utf8");
  assert.match(financeRoutes, /res\.json\(\{ ok: true, expense \}\)/, "Expense saves should return only the changed record");
  assert.match(financeRoutes, /deletedExpenseId/, "Expense deletes should return a compact deletion acknowledgement");
  assert.match(financeRoutes, /collection: \(state\.otherCashCollections/, "Collection saves should return only the changed record");

  const stateRoutes = fs.readFileSync(path.resolve(__dirname, "..", "src", "routes", "stateRoutes.js"), "utf8");
  assert.match(stateRoutes, /delete visibleState\.fileDataBackups/, "Server-only embedded backups must not be sent to browsers");

  const browserApp = fs.readFileSync(path.resolve(__dirname, "..", "app.js"), "utf8");
  assert.match(browserApp, /Expense saved and synced"\);\s*renderExpensesPage\(\)/, "Expense saves should rerender only Transactions");
  assert.match(browserApp, /Cash collection saved and synced"\);\s*renderExpensesPage\(\)/, "Collection saves should rerender only Transactions");

  console.log("Save performance regression checks passed.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
