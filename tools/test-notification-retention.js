const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  activeNotificationRows,
  applyInitialNotificationCleanup,
  archiveExpiredNotificationRows,
  NOTIFICATION_CLEANUP_VERSION,
} = require("../src/services/notificationRetentionService");

const now = new Date("2026-08-03T12:00:00.000Z");
const oldNotice = { id: "old", createdAt: "2026-07-20T12:00:00.000Z" };
const recentNotice = { id: "recent", createdAt: "2026-08-02T12:00:00.000Z" };

const archived = archiveExpiredNotificationRows([oldNotice, recentNotice], {}, now.getTime());
assert.equal(archived.find((row) => row.id === "old").isArchived, true);
assert.equal(archived.find((row) => row.id === "recent").isArchived, undefined);
assert.deepEqual(activeNotificationRows(archived, {}, now.getTime()).map((row) => row.id), ["recent"]);

const cleanup = applyInitialNotificationCleanup({
  fileNotifications: [oldNotice, recentNotice],
  auditLog: [],
}, { now, actor: "Admin" });

assert.equal(cleanup.changed, true);
assert.equal(cleanup.state.notificationRetention.cleanupVersion, NOTIFICATION_CLEANUP_VERSION);
assert.equal(cleanup.state.fileNotifications.every((row) => row.isArchived), true);
assert.equal(cleanup.state.fileNotifications.every((row) => row.archiveReason === "initial_admin_cleanup"), true);
assert.match(cleanup.state.auditLog.at(-1).message, /cleared by Admin/);
assert.deepEqual(activeNotificationRows(cleanup.state.fileNotifications, cleanup.state, now.getTime()), []);

const newNotice = { id: "new", createdAt: "2026-08-03T12:01:00.000Z" };
assert.deepEqual(
  activeNotificationRows([...cleanup.state.fileNotifications, newNotice], cleanup.state, now.getTime() + 60_000)
    .map((row) => row.id),
  ["new"]
);

const repeatedCleanup = applyInitialNotificationCleanup(cleanup.state, {
  now: new Date("2026-08-04T12:00:00.000Z"),
  actor: "Admin",
});
assert.equal(repeatedCleanup.changed, false);
assert.equal(repeatedCleanup.state.auditLog.length, cleanup.state.auditLog.length);

const browserAppSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const localDesktopGate = browserAppSource.match(/function localDesktopAlertsEnabled\(\) \{([\s\S]*?)\n\}/)?.[1] || "";
assert.match(localDesktopGate, /!currentDeviceSubscribed/, "Local desktop alerts must be disabled when Web Push is subscribed");
assert.doesNotMatch(localDesktopGate, /&&\s*currentDeviceSubscribed\s*;/, "Subscribed devices must not use the local duplicate path");

console.log("Notification cleanup and retention tests passed.");
