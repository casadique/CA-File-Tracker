const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const stateRouteSource = fs.readFileSync(path.join(root, "src", "routes", "stateRoutes.js"), "utf8");
const fileRouteSource = fs.readFileSync(path.join(root, "src", "routes", "fileRoutes.js"), "utf8");
const stateServiceSource = fs.readFileSync(path.join(root, "src", "services", "appStateService.js"), "utf8");
const migrationSource = fs.readFileSync(path.join(root, "database", "migrations", "20260830_split_file_startup.sql"), "utf8");

assert.match(appSource, /Promise\.all\(\[\s*apiJson\("\/api\/state\?excludeFiles=1"\),\s*apiJson\("\/api\/files\/snapshot"\)/);
assert.match(appSource, /Split central load failed; retrying the full compatible state/);
assert.match(appSource, /return apiJson\("\/api\/state"\)/, "The original full-state request must remain as fallback");
assert.equal(
  (appSource.match(/const payload = await loadSplitCentralStateFromApi\(\);/g) || []).length,
  2,
  "Both login/startup and background refresh must use the split loader"
);

assert.match(stateRouteSource, /excludeFiles/);
assert.match(stateRouteSource, /excludeFiles \? await getAppStateWithoutFilesRecord\(\) : await getAppStateRecord\(\)/);
assert.match(stateRouteSource, /filesExcluded: excludeFiles/);
assert.match(fileRouteSource, /router\.get\("\/snapshot", requireAuth/);
assert.match(fileRouteSource, /source: "relational"/);
assert.match(fileRouteSource, /source = relationalReadConfigured\(\) \? "central-fallback" : "central"/);
assert.match(stateServiceSource, /rpc\("get_app_state_without_files"\)/);
assert.match(migrationSource, /coalesce\(app_state\.state, '\{\}'::jsonb\) - 'files'/);
assert.match(migrationSource, /jsonb_agg\(file_records\.payload order by file_records\.id\)/);
assert.match(migrationSource, /revoke all on function public\.get_file_snapshot\(\) from authenticated/);
assert.match(migrationSource, /grant execute on function public\.get_file_snapshot\(\) to service_role/);

console.log("Split startup state and compatibility fallback checks passed.");
