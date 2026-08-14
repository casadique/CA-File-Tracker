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

  console.log("Save performance regression checks passed.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
