const crypto = require("crypto");

function cleanPart(value = "") {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9@._:-]+/g, "-");
}

function recipientIdentity(recipient = {}) {
  return cleanPart(recipient.authUserId || recipient.auth_user_id || recipient.id || recipient.email || recipient.name || "unknown");
}

function notificationEventKey(type, fileId, sourceEventId, recipient = {}) {
  return [cleanPart(type || "notification"), cleanPart(fileId || "none"), cleanPart(sourceEventId || "event"), recipientIdentity(recipient)].join(":");
}

function deterministicNotificationId(eventKey = "") {
  return `notification-${crypto.createHash("sha256").update(String(eventKey)).digest("hex").slice(0, 32)}`;
}

function createNotificationEvent(input = {}) {
  const recipient = input.recipient || {};
  const eventKey = input.eventKey || notificationEventKey(input.eventType, input.fileId, input.sourceEventId, recipient);
  const id = deterministicNotificationId(eventKey);
  const createdAt = input.createdAt instanceof Date ? input.createdAt.toISOString() : (input.createdAt || new Date().toISOString());
  return {
    id,
    event_id: id,
    eventId: id,
    event_key: eventKey,
    eventKey,
    dedupeKey: eventKey,
    notification_type: input.changeType || input.eventType || "Notification",
    changeType: input.changeType || input.eventType || "Notification",
    fileId: input.fileId || "",
    related_record_id: input.fileId || "",
    fileName: input.fileName || "",
    changeText: input.changeText || "",
    changedBy: input.changedBy || "System",
    changedByRole: input.changedByRole || "",
    targetUserId: recipient.id || input.targetUserId || "",
    targetUserAuthId: recipient.authUserId || recipient.auth_user_id || input.targetUserAuthId || "",
    targetUserEmail: recipient.email || input.targetUserEmail || "",
    targetUserName: recipient.name || input.targetUserName || "",
    category: input.category || "announcement",
    route: input.route || "",
    tone: input.tone || "progress",
    scheduled_for: input.scheduledFor || null,
    delivery: {
      in_app: "created",
      desktop: input.scheduledFor ? "scheduled" : "queued",
    },
    createdAt: Date.parse(createdAt) || Date.now(),
    created_at: createdAt,
  };
}

function appendNotificationEvents(state = {}, events = [], options = {}) {
  const rows = Array.isArray(state.fileNotifications) ? state.fileNotifications : [];
  const byKey = new Map(rows.map((row) => [row.event_key || row.eventKey || row.dedupeKey || row.id, row]));
  const created = [];
  const duplicates = [];
  for (const event of events.filter(Boolean)) {
    const key = event.event_key || event.eventKey || event.dedupeKey || event.id;
    if (byKey.has(key)) {
      duplicates.push(byKey.get(key));
      notificationLog("duplicate_event_blocked", event, { result: "reused" });
      continue;
    }
    byKey.set(key, event);
    created.push(event);
    notificationLog("notification_event_created", event, { result: "created" });
  }
  state.fileNotifications = [...byKey.values()]
    .sort((a, b) => notificationTime(b) - notificationTime(a))
    .slice(0, Number(options.limit || 800));
  return { created, duplicates, rows: state.fileNotifications };
}

function notificationTime(row = {}) {
  return Number(row.createdAt || 0) || Date.parse(row.created_at || row.at || "") || 0;
}

function notificationLog(action, event = {}, details = {}) {
  const entry = {
    component: "notification_service",
    action,
    eventId: event.event_id || event.eventId || event.id || "",
    eventType: event.notification_type || event.changeType || event.category || "",
    fileId: event.fileId || event.related_record_id || "",
    recipientUserId: event.targetUserAuthId || event.targetUserId || "",
    idempotencyKey: event.event_key || event.eventKey || event.dedupeKey || "",
    scheduledTime: event.scheduled_for || null,
    channel: details.channel || "in_app",
    result: details.result || "",
    errorCode: details.errorCode || "",
    timestamp: new Date().toISOString(),
  };
  console.info(JSON.stringify(entry));
  return entry;
}

module.exports = {
  appendNotificationEvents,
  createNotificationEvent,
  deterministicNotificationId,
  notificationEventKey,
  notificationLog,
  recipientIdentity,
};
