const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

process.env.FILES_RELATIONAL_READ = "1";
process.env.FILES_RELATIONAL_SHADOW_WRITE = "0";

const calls = [];
const sourceRows = Array.from({ length: 1002 }, (_, index) => ({
  payload: { id: `file-${index + 1}`, name: `Client ${index + 1}` },
}));

function queryBuilder() {
  const filters = [];
  const builder = {
    select(columns) { calls.push(["select", columns]); return this; },
    is(column, value) { filters.push(["is", column, value]); return this; },
    eq(column, value) { filters.push(["eq", column, value]); return this; },
    ilike(column, value) { filters.push(["ilike", column, value]); return this; },
    gte(column, value) { filters.push(["gte", column, value]); return this; },
    lte(column, value) { filters.push(["lte", column, value]); return this; },
    order(column, options) { calls.push(["order", column, options]); return this; },
    async range(from, to) {
      calls.push(["range", from, to, filters]);
      return { data: sourceRows.slice(from, to + 1), error: null };
    },
  };
  return builder;
}

const supabasePath = require.resolve("../src/config/supabase");
require.cache[supabasePath] = {
  id: supabasePath,
  filename: supabasePath,
  loaded: true,
  exports: { supabaseAdmin: { from: () => queryBuilder() } },
};
delete require.cache[require.resolve("../src/config/env")];
delete require.cache[require.resolve("../src/services/fileRecordService")];

const {
  relationalFileCandidates,
  relationalFileSnapshot,
  relationalReadConfigured,
  relationalReadEnabled,
} = require("../src/services/fileRecordService");

(async () => {
  assert.equal(relationalReadConfigured(), true);
  assert.equal(relationalReadEnabled(), false, "Reads must wait for startup reconciliation before activation");
  const rows = await relationalFileCandidates({
    listView: "active",
    serviceType: "ITR Filing",
    priority: "High",
    billingStatus: "Billed",
    receivedFrom: "2026-08-01",
    receivedTo: "2026-08-31",
  });
  assert.equal(rows.length, 1002, "Relational reads must continue after the Supabase 1,000-row page limit");
  assert.deepEqual(calls.filter(([name]) => name === "range").map(([, from, to]) => [from, to]), [
    [0, 999],
    [1000, 1999],
  ]);
  const filters = calls.find(([name]) => name === "range")[3];
  assert.ok(filters.some((entry) => entry.join("|") === "eq|is_removed|false"));
  assert.ok(filters.some((entry) => entry.join("|") === "ilike|service_type|ITR Filing"));
  assert.ok(filters.some((entry) => entry.join("|") === "ilike|priority|High"));
  assert.ok(filters.some((entry) => entry.join("|") === "eq|is_billed|true"));
  assert.ok(filters.some((entry) => entry.join("|") === "gte|file_received_date|2026-08-01"));
  assert.ok(filters.some((entry) => entry.join("|") === "lte|file_received_date|2026-08-31"));
  assert.equal(calls.filter(([name]) => name === "order").length, 2, "Every page must use stable ID ordering");

  calls.length = 0;
  sourceRows.length = 2;
  await relationalFileCandidates({ includeRemoved: true });
  const snapshotFilters = calls.find(([name]) => name === "range")[3];
  assert.equal(
    snapshotFilters.some((entry) => entry[1] === "is_removed"),
    false,
    "Startup snapshots must include active and removed files"
  );

  calls.length = 0;
  const rpcRows = [{ files: sourceRows.map((row) => row.payload), total: sourceRows.length }];
  require.cache[supabasePath].exports.supabaseAdmin.rpc = async (name) => {
    calls.push(["rpc", name]);
    return { data: rpcRows, error: null };
  };
  assert.equal((await relationalFileSnapshot()).length, 2);
  assert.deepEqual(calls[0], ["rpc", "get_file_snapshot"]);

  const routeSource = fs.readFileSync(path.resolve(__dirname, "..", "src", "routes", "fileRoutes.js"), "utf8");
  assert.match(routeSource, /if \(relationalReadEnabled\(\)\)/);
  assert.match(routeSource, /await waitForFileShadowSync\(\)/);
  assert.match(routeSource, /X-File-Read-Source", "relational"/);
  assert.match(routeSource, /central-fallback/);
  assert.match(routeSource, /central-warming/);
  assert.match(routeSource, /router\.get\("\/snapshot"/);
  assert.match(routeSource, /await relationalFileSnapshot\(\)/);

  console.log("Relational file read, paging, filtering and fallback checks passed.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
