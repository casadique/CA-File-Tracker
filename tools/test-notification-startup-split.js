const assert = require("node:assert/strict");
const { visibleNotificationRows } = require("../src/services/notificationRetentionService");

const now = Date.parse("2026-08-30T12:00:00Z");
const rows = [
  { id: "admin-event", createdAt: now - 1000, targetUserEmail: "admin@example.com" },
  { id: "staff-event", createdAt: now - 2000, targetUserId: "staff-local" },
  { id: "other-event", createdAt: now - 3000, targetUserName: "Other Staff" },
  { id: "expired-event", createdAt: now - (8 * 24 * 60 * 60 * 1000), targetUserId: "staff-local" },
  { id: "archived-event", createdAt: now - 4000, targetUserId: "staff-local", isArchived: true },
];
const state = {
  users: [{ id: "staff-local", authUserId: "staff-auth", email: "staff@example.com", name: "Staff User" }],
  notificationRetention: {},
};

assert.deepEqual(
  visibleNotificationRows(rows, state, { role: "Staff", email: "staff@example.com" }, "staff-auth", now).map((row) => row.id),
  ["staff-event"],
  "Staff must receive only their own active notification history"
);
assert.deepEqual(
  visibleNotificationRows(rows, state, { role: "Admin" }, "admin-auth", now).map((row) => row.id),
  ["admin-event", "staff-event", "other-event"],
  "Admin must receive all active notification history"
);

console.log("Notification startup split visibility checks passed.");
