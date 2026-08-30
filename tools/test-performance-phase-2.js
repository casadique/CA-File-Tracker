const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { queryFiles } = require("../src/services/fileService");
const { activeNotificationRows } = require("../src/services/notificationRetentionService");

function sampleFile(index) {
  const completed = index % 5 === 0;
  return {
    id: `file-${index}`,
    name: index % 20 === 0 ? `Muhammad Client ${index}` : `Client ${index}`,
    pan: `ABCDE${String(index).padStart(4, "0")}F`,
    serviceType: index % 2 ? "ITR Filing" : "GST Filing",
    assignedStaff: index % 3 ? "Althaf" : "Najma",
    priority: index % 4 ? "Medium" : "High",
    fileReceivedDate: `2026-08-${String((index % 28) + 1).padStart(2, "0")}`,
    stages: { Received: true, Allotted: true, Completed: completed },
    filed: completed,
  };
}

const files = Array.from({ length: 25000 }, (_, index) => sampleFile(index + 1));
const startedAt = performance.now();
const result = queryFiles({ files }, { search: "muhammad", service: "GST Filing", page: 2, pageSize: 50, sort: "file_received_date" });
const durationMs = performance.now() - startedAt;
assert.equal(result.pageSize, 50);
assert.equal(result.page, 2);
assert.ok(result.total > 0);
assert.ok(result.files.length <= 50);
assert.ok(result.files.every((file) => file.name.toLowerCase().includes("muhammad") && file.serviceType === "GST Filing"));
assert.ok(durationMs < 1500, `25,000-row filtered pagination exceeded the regression budget: ${Math.round(durationMs)}ms`);
assert.equal(queryFiles({ files }, { pageSize: 1000 }).pageSize, 100, "The server must cap file pages at 100 rows");
assert.equal(queryFiles({ files: files.slice(0, 80) }, {}).files.length, 50, "The default server page must contain 50 rows");

const now = Date.now();
const notifications = [
  { id: "active", createdAt: now },
  { id: "archived", createdAt: now, isArchived: true },
  { id: "expired", createdAt: now - 8 * 24 * 60 * 60 * 1000 },
];
assert.deepEqual(activeNotificationRows(notifications, {}, now).map((row) => row.id), ["active"]);

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const stateRoutes = fs.readFileSync(path.join(root, "src", "routes", "stateRoutes.js"), "utf8");
const financeRoutes = fs.readFileSync(path.join(root, "src", "routes", "financeRoutes.js"), "utf8");
const userService = fs.readFileSync(path.join(root, "src", "services", "userService.js"), "utf8");
assert.match(app, /window\.addEventListener\("focus",[\s\S]*checkCentralStateVersion\(\{ force: true \}\)/);
assert.match(app, /centralStateLoading = user\.source === "supabase-auth" && !reusableFileSnapshot;\s*mount\(\);\s*if \(!\(await loadStateFromApi\(\)\)\)/);
assert.match(app, /else if \(result\?\.receipt\) state\.feeReceipts = mergeById/);
assert.match(stateRoutes, /activeNotificationRows\(visibleState\.fileNotifications/);
assert.match(financeRoutes, /receipt: issuedReceipt,[\s\S]*file: \(state\.files[\s\S]*collection: linkedCollection/);
assert.doesNotMatch(financeRoutes.match(/router\.post\("\/fee-receipts\/:fileId"[\s\S]*?\n\}\);/)?.[0] || "", /files: state\.files|feeReceipts: state\.feeReceipts|otherCashCollections:/);
assert.match(userService, /\.select\(PROFILE_COLUMNS\)\s*\.eq\("auth_user_id"/);
console.log(`Performance phase 2 checks passed; 25,000-row query completed in ${Math.round(durationMs)}ms.`);
