const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  appendNotificationEvents,
  createNotificationEvent,
  deterministicNotificationId,
} = require("../src/services/notificationEventService");
const { applyDueReminderMetadata } = require("../src/services/fileService");
const { applyVerifiedDuplicateCleanup } = require("../src/services/notificationRetentionService");

const recipient = { id: "staff-1", authUserId: "00000000-0000-4000-8000-000000000001", name: "Rabiyath" };
const eventKey = "allotment:file-1:assignment-1:00000000-0000-4000-8000-000000000001";
const first = createNotificationEvent({ eventKey, eventType: "File Allotted", fileId: "file-1", recipient, createdAt: "2026-08-05T04:30:00.000Z" });
const second = createNotificationEvent({ eventKey, eventType: "File Allotted", fileId: "file-1", recipient, createdAt: "2026-08-05T04:30:01.000Z" });
assert.equal(first.id, second.id, "the same business event must have a deterministic ID");
assert.equal(first.id, deterministicNotificationId(eventKey));
const state = { fileNotifications: [] };
assert.equal(appendNotificationEvents(state, [first, second]).created.length, 1);
assert.equal(state.fileNotifications.length, 1, "duplicate in-app events must be blocked");

const sameDay = {
  id: "file-1",
  dueDate: "2026-08-05",
  assignedStaff: "Rabiyath",
  assignedStaffId: "staff-1",
  task_activity_at: "2026-08-05T04:30:00.000Z", // 10:00 Asia/Kolkata
};
applyDueReminderMetadata(sameDay, null, "2026-08-05T04:30:00.000Z");
assert.equal(sameDay.first_due_reminder_at, "2026-08-05T07:30:00.000Z", "same-day reminder must be exactly three hours after allotment");
const repeatedSave = { ...sameDay, remarks: "updated only" };
applyDueReminderMetadata(repeatedSave, sameDay, "2026-08-05T05:00:00.000Z");
assert.equal(repeatedSave.first_due_reminder_at, sameDay.first_due_reminder_at, "unrelated saves must not reschedule the reminder");
assert.equal(repeatedSave.due_date_version, sameDay.due_date_version, "unrelated saves must not change the due-date version");
const reassigned = { ...sameDay, assignedStaff: "Naveen", assignedStaffId: "staff-2", task_activity_at: "2026-08-05T06:00:00.000Z" };
applyDueReminderMetadata(reassigned, sameDay, "2026-08-05T06:00:00.000Z");
assert.equal(reassigned.first_due_reminder_at, "2026-08-05T09:00:00.000Z", "reassignment must replace the old recipient schedule");

const legacyState = {
  fileNotifications: [
    { id: "old-a", fileId: "file-2", changeType: "File Allotted", targetUserId: "staff-1", createdAt: 100000 },
    { id: "old-b", fileId: "file-2", changeType: "File Allotted", targetUserId: "staff-1", createdAt: 120000, changeText: "duplicate" },
    { id: "valid", fileId: "file-2", changeType: "File Allotted", targetUserId: "staff-1", createdAt: 500000 },
  ],
  readNotifications: ["old-a"], notificationRetention: {}, auditLog: [],
};
const cleanup = applyVerifiedDuplicateCleanup(legacyState, { now: new Date("2026-08-05T12:00:00Z") });
assert.equal(cleanup.archivedRows, 1, "only the verified near-time duplicate must be archived");
assert.equal(cleanup.state.fileNotifications.filter((row) => row.isArchived).length, 1);
assert(cleanup.state.readNotifications.includes("old-b"), "canonical event must preserve read state");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const workerSource = fs.readFileSync(path.join(__dirname, "..", "service-worker.js"), "utf8");
const pushSource = fs.readFileSync(path.join(__dirname, "..", "src/services/pushNotificationService.js"), "utf8");
const sql = fs.readFileSync(path.join(__dirname, "..", "database/20260805_notification_pipeline_v2.sql"), "utf8");
assert(!appSource.includes("new Notification("), "webpage must not create desktop system notifications");
assert(appSource.includes("if (isSupabaseMode()) return;"), "frontend producers must be disabled in central mode");
assert(appSource.includes("Test notification sent successfully."));
[
  "Browser Permission:", "Service Worker:", "Push Subscription:", "Desktop Notifications:",
  "Last Successful Push:", "Current Device Registered:", "Browser/Device Name:",
  "Enable Desktop Notifications", "Send Test Notification", "Reconnect Notifications", "Remove This Device",
].forEach((label) => assert(appSource.includes(label), `missing diagnostics UI: ${label}`));
assert(workerSource.includes("registration.showNotification"), "service worker must own desktop display");
assert(workerSource.includes('searchParams.set("notificationEvent"'), "notification click must carry the stable event ID");
assert(pushSource.includes("already_delivered"), "per-device delivery must block replay");
assert(pushSource.includes("subscription_expired"), "expired subscriptions must be logged and deactivated");
assert(pushSource.includes("isPendingNotificationMigration"), "older notification schemas must use the compatibility path instead of returning a server error");
assert(pushSource.includes("legacy_schema: true"), "legacy device registration must be normalized for the diagnostics UI");
assert(pushSource.includes("updateSubscriptionDeliveryTime"), "successful delivery timestamps must support both current and legacy schemas");
assert(pushSource.includes('eq("endpoint", notification.endpoint)'), "test push must target the current physical subscription");
assert(pushSource.includes("same_day_3h"), "same-day three-hour reminder stage must exist");
assert(pushSource.includes("fileIsComplete(file)"), "completed files must be revalidated before reminders");
assert(sql.includes("event_key text not null unique"), "database uniqueness must protect the business event key");
assert(sql.includes("unique (user_id, subscription_id, notification_id)" ) || fs.readFileSync(path.join(__dirname, "..", "database/20260803_desktop_notifications.sql"), "utf8").includes("unique (user_id, subscription_id, notification_id)"));

console.log("Notification pipeline tests passed.");
