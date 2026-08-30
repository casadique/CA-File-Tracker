const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const stateRouteSource = fs.readFileSync(path.join(root, "src", "routes", "stateRoutes.js"), "utf8");
const fileRouteSource = fs.readFileSync(path.join(root, "src", "routes", "fileRoutes.js"), "utf8");
const stateServiceSource = fs.readFileSync(path.join(root, "src", "services", "appStateService.js"), "utf8");
const migrationSource = fs.readFileSync(path.join(root, "database", "migrations", "20260830_split_file_startup.sql"), "utf8");
const notificationMigrationSource = fs.readFileSync(path.join(root, "database", "migrations", "20260830_split_notification_startup.sql"), "utf8");
const notificationRouteSource = fs.readFileSync(path.join(root, "src", "routes", "notificationRoutes.js"), "utf8");
const notificationServiceSource = fs.readFileSync(path.join(root, "src", "services", "notificationRetentionService.js"), "utf8");

assert.match(appSource, /apiJson\("\/api\/state\?excludeFiles=1"\)/);
assert.match(appSource, /apiJson\("\/api\/files\/snapshot\/version"\)/);
assert.match(appSource, /source: "browser-cache"/);
assert.match(appSource, /FILE_SNAPSHOT_USER_KEY/);
assert.match(appSource, /localStorage\.getItem\(FILE_SNAPSHOT_USER_KEY\) === fileUserKey/);
assert.match(appSource, /localStorage\.setItem\(FILE_SNAPSHOT_USER_KEY, fileUserKey\)/);
assert.match(appSource, /cachedFiles\.length === Number\(versionPayload\.total \|\| 0\)/);
assert.match(appSource, /Split central load failed; retrying the full compatible state/);
assert.match(appSource, /statePayload\.notificationsExcluded !== true/);
assert.match(appSource, /fileNotifications: cachedNotifications/);
assert.match(appSource, /NOTIFICATION_SNAPSHOT_USER_KEY/);
assert.match(appSource, /localStorage\.getItem\(NOTIFICATION_SNAPSHOT_USER_KEY\) === notificationUserKey/);
assert.match(appSource, /requestUserKey !== notificationSnapshotUserKey\(\)/);
assert.match(appSource, /centralStateLoading = user\.source === "supabase-auth" && !reusableFileSnapshot/);
assert.match(appSource, /apiJson\("\/api\/notifications\/history"\)/);
assert.match(appSource, /notificationHistoryRefreshInFlight/);
assert.match(appSource, /return apiJson\("\/api\/state"\)/, "The original full-state request must remain as fallback");
assert.equal(
  (appSource.match(/const payload = await loadSplitCentralStateFromApi\(\);/g) || []).length,
  2,
  "Both login/startup and background refresh must use the split loader"
);

assert.match(stateRouteSource, /excludeFiles/);
assert.match(stateRouteSource, /excludeFiles \? await getAppStateWithoutFilesRecord\(\) : await getAppStateRecord\(\)/);
assert.match(stateRouteSource, /filesExcluded: excludeFiles/);
assert.match(stateRouteSource, /notificationsExcluded: excludeFiles/);
assert.match(notificationRouteSource, /router\.get\("\/history", requireAuth/);
assert.match(notificationRouteSource, /visibleNotificationRows\(record\.notifications/);
assert.match(notificationServiceSource, /function visibleNotificationRows/);
assert.match(notificationServiceSource, /\["Admin", "Manager", "Staff Manager"\]\.includes/);
assert.match(fileRouteSource, /router\.get\("\/snapshot", requireAuth/);
assert.match(fileRouteSource, /router\.get\("\/snapshot\/version", requireAuth/);
assert.match(fileRouteSource, /source: "relational"/);
assert.match(fileRouteSource, /source = relationalReadConfigured\(\) \? "central-fallback" : "central"/);
assert.match(stateServiceSource, /rpc\("get_app_state_without_files"\)/);
assert.match(migrationSource, /coalesce\(app_state\.state, '\{\}'::jsonb\) - 'files'/);
assert.match(migrationSource, /jsonb_agg\(file_records\.payload order by file_records\.id\)/);
assert.match(migrationSource, /revoke all on function public\.get_file_snapshot\(\) from authenticated/);
assert.match(migrationSource, /grant execute on function public\.get_file_snapshot\(\) to service_role/);
assert.match(notificationMigrationSource, /- 'files' - 'fileNotifications'/);
assert.match(notificationMigrationSource, /create or replace function public\.get_notification_snapshot\(\)/);
assert.match(notificationMigrationSource, /revoke all on function public\.get_notification_snapshot\(\) from authenticated/);
assert.match(notificationMigrationSource, /grant execute on function public\.get_notification_snapshot\(\) to service_role/);

console.log("Split startup state and compatibility fallback checks passed.");
