const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const dashboardRoutes = fs.readFileSync(path.join(root, "src", "routes", "dashboardRoutes.js"), "utf8");

assert.match(app, /function refreshDashboardActivityFromApi/);
assert.match(app, /lastDashboardActivityRefreshAt < 30000/);
assert.match(app, /id="dashboardRecentActivitiesCard"/);
assert.match(app, /card\.outerHTML = renderRecentActivitiesCard\(\)/);
assert.match(app, /function refreshFinanceSnapshotFromApi/);
assert.match(app, /lastFinanceSnapshotRefreshAt < 60000/);
assert.match(app, /if \(activePage === "expenses"\) refreshFinanceSnapshotFromApi\(\)/);
assert.match(dashboardRoutes, /\.slice\(0, 50\)/);

console.log("Deferred dashboard activity and finance history checks passed.");
