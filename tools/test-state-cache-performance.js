const assert = require("node:assert/strict");

const configPath = require.resolve("../src/config/supabase");
const servicePath = require.resolve("../src/services/appStateService");

let readCount = 0;
let serverRecord = {
  state: { files: [{ id: "file-1", name: "Original" }], fileNotifications: [] },
  updated_at: "2026-08-18T00:00:00.000Z",
  updated_by: "user-1",
};

function query() {
  let operation = "read";
  let updatePayload = null;
  let expectedVersion = null;
  return {
    select() { return this; },
    update(payload) { operation = "update"; updatePayload = payload; return this; },
    eq(column, value) { if (column === "updated_at") expectedVersion = value; return this; },
    async maybeSingle() {
      if (operation === "read") {
        readCount += 1;
        return { data: structuredClone(serverRecord), error: null };
      }
      if (expectedVersion !== serverRecord.updated_at) return { data: null, error: null };
      serverRecord = {
        state: structuredClone(updatePayload.state),
        updated_at: updatePayload.updated_at,
        updated_by: updatePayload.updated_by,
      };
      return { data: { updated_at: serverRecord.updated_at }, error: null };
    },
  };
}

require.cache[configPath] = {
  id: configPath,
  filename: configPath,
  loaded: true,
  exports: { supabaseAdmin: { from: () => query() } },
};
delete require.cache[servicePath];

const { getAppState, saveAppStateIfCurrent } = require(servicePath);

(async () => {
  const first = await getAppState();
  first.files[0].name = "Browser mutation must not alter cache";
  const second = await getAppState();
  assert.equal(readCount, 1, "Repeated reads inside the cache window should use one database request");
  assert.equal(second.files[0].name, "Original", "Cached state must be returned as an isolated clone");

  const saved = await saveAppStateIfCurrent(
    { files: [{ id: "file-1", name: "Saved" }], fileNotifications: [] },
    "user-2",
    serverRecord.updated_at,
  );
  assert.equal((await getAppState()).files[0].name, "Saved", "A successful save must refresh the cache");
  assert.equal(readCount, 1, "Reading immediately after a save must not redownload the state");

  serverRecord = {
    ...serverRecord,
    state: { files: [{ id: "file-1", name: "Concurrent update" }], fileNotifications: [] },
    updated_at: "2026-08-18T00:00:05.000Z",
  };
  await assert.rejects(
    saveAppStateIfCurrent(saved.state, "user-2", saved.updatedAt),
    (error) => error.status === 409,
    "A concurrent database update must still produce a version conflict",
  );
  assert.equal((await getAppState()).files[0].name, "Concurrent update", "A conflict must invalidate the cache and force a fresh read");
  assert.equal(readCount, 2);

  console.log("State cache speed, isolation and conflict-invalidation checks passed.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
