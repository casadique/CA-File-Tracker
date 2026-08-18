const assert = require("node:assert/strict");

const configPath = require.resolve("../src/config/supabase");
const servicePath = require.resolve("../src/services/appStateService");
process.env.APP_STATE_CACHE_TTL_MS = "5";

let readCount = 0;
let versionReadCount = 0;
let lastRpcArgs = null;
let serverRecord = {
  state: { files: [{ id: "file-1", name: "Original" }], fileNotifications: [], auditLog: [] },
  updated_at: "2026-08-18T00:00:00.000Z",
  updated_by: "user-1",
};

function query() {
  let operation = "read";
  let selectedColumns = "";
  let updatePayload = null;
  let expectedVersion = null;
  return {
    select(columns) { selectedColumns = columns; return this; },
    update(payload) { operation = "update"; updatePayload = payload; return this; },
    eq(column, value) { if (column === "updated_at") expectedVersion = value; return this; },
    async maybeSingle() {
      if (operation === "read") {
        if (selectedColumns.includes("state")) readCount += 1;
        else versionReadCount += 1;
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
  exports: { supabaseAdmin: {
    from: () => query(),
    async rpc(name, args) {
      assert.equal(name, "apply_app_state_operations");
      lastRpcArgs = args;
      const nextVersion = new Date(Date.parse(args.p_expected_updated_at) + 1).toISOString();
      serverRecord.updated_at = nextVersion;
      return { data: [{ updated_at: nextVersion }], error: null };
    },
  } },
};
delete require.cache[servicePath];

const { getAppState, saveAppStateIfCurrent, saveAppStateOperationsIfCurrent, buildStateOperations } = require(servicePath);

(async () => {
  const first = await getAppState();
  first.files[0].name = "Browser mutation must not alter cache";
  const second = await getAppState();
  assert.equal(readCount, 1, "Repeated reads inside the cache window should use one database request");
  assert.equal(second.files[0].name, "Original", "Cached state must be returned as an isolated clone");

  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal((await getAppState()).files[0].name, "Original");
  assert.equal(versionReadCount, 1, "An expired cache should check only the lightweight database version");
  assert.equal(readCount, 1, "An unchanged version must not redownload the state document");

  const saved = await saveAppStateIfCurrent(
    { files: [{ id: "file-1", name: "Saved" }], fileNotifications: [] },
    "user-2",
    serverRecord.updated_at,
  );
  assert.equal((await getAppState()).files[0].name, "Saved", "A successful save must refresh the cache");
  assert.equal(readCount, 1, "Reading immediately after a save must not redownload the state");

  serverRecord = {
    ...serverRecord,
    state: { files: [{ id: "file-1", name: "Concurrent update" }], fileNotifications: [], auditLog: [] },
    updated_at: "2026-08-18T00:00:05.000Z",
  };
  await assert.rejects(
    saveAppStateIfCurrent(saved.state, "user-2", saved.updatedAt),
    (error) => error.status === 409,
    "A concurrent database update must still produce a version conflict",
  );
  assert.equal((await getAppState()).files[0].name, "Concurrent update", "A conflict must invalidate the cache and force a fresh read");
  assert.equal(readCount, 2);

  const previous = await getAppState();
  const next = structuredClone(previous);
  next.files[0] = { ...next.files[0], name: "Granular save" };
  next.auditLog = [{ id: "audit-1", action: "Changed" }];
  const operations = buildStateOperations(previous, next);
  assert.ok(operations.some((item) => item.op === "upsert" && item.key === "files" && item.value.id === "file-1"));
  assert.ok(operations.some((item) => item.op === "upsert" && item.key === "auditLog" && item.value.id === "audit-1"));
  assert.ok(!operations.some((item) => item.op === "replace" && item.key === "files"), "A single file edit must not replace the complete file array");

  const granular = await saveAppStateOperationsIfCurrent(previous, next, "user-2", serverRecord.updated_at);
  assert.equal(granular.state.files[0].name, "Granular save");
  assert.ok(lastRpcArgs.p_operations.length < 5, "A small mutation should produce a small operation envelope");
  assert.equal((await getAppState()).files[0].name, "Granular save", "Granular saves must refresh the isolated cache");

  console.log("State cache speed, isolation and conflict-invalidation checks passed.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
