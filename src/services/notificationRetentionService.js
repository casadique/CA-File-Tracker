const NOTIFICATION_RETENTION_DAYS = 7;
const NOTIFICATION_RETENTION_MS = NOTIFICATION_RETENTION_DAYS * 24 * 60 * 60 * 1000;
const NOTIFICATION_CLEANUP_VERSION = "2026-08-03-notification-cleanup-v1";
const VERIFIED_DUPLICATE_CLEANUP_VERSION = "2026-08-05-notification-dedupe-v2";

function notificationTimestamp(notification = {}) {
  const value = notification.createdAt
    || notification.created_at
    || notification.notification_created_at
    || notification.at
    || notification.date;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = value ? Date.parse(String(value)) : NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

function notificationCutoffTime(state = {}, now = Date.now()) {
  const rollingCutoff = now - NOTIFICATION_RETENTION_MS;
  const cleanupCutoff = Date.parse(state.notificationRetention?.clearedBefore || "") || 0;
  return Math.max(rollingCutoff, cleanupCutoff);
}

function isArchivedNotification(notification = {}) {
  return notification.isArchived === true || notification.is_archived === true;
}

function activeNotificationRows(rows = [], state = {}, now = Date.now()) {
  const cutoff = notificationCutoffTime(state, now);
  return (Array.isArray(rows) ? rows : [])
    .filter((notification) => !isArchivedNotification(notification))
    .filter((notification) => notificationTimestamp(notification) >= cutoff)
    .sort((left, right) => notificationTimestamp(right) - notificationTimestamp(left));
}

function archiveExpiredNotificationRows(rows = [], state = {}, now = Date.now()) {
  const cutoff = notificationCutoffTime(state, now);
  const archivedAt = new Date(now).toISOString();
  return (Array.isArray(rows) ? rows : []).map((notification) => {
    if (isArchivedNotification(notification)) return notification;
    const createdAt = notificationTimestamp(notification);
    if (createdAt && createdAt >= cutoff) return notification;
    return {
      ...notification,
      isArchived: true,
      archivedAt,
      archiveReason: "older_than_7_days",
    };
  });
}

function applyInitialNotificationCleanup(state = {}, options = {}) {
  if (state.notificationRetention?.cleanupVersion === NOTIFICATION_CLEANUP_VERSION) {
    return { state, changed: false };
  }

  const now = options.now || new Date();
  const enabledAt = now.toISOString();
  const actor = String(options.actor || "Admin").trim() || "Admin";
  const notifications = archiveExpiredNotificationRows(state.fileNotifications || [], state, now.getTime());
  const archivedNotifications = notifications.filter((notification) => notification.archiveReason === "older_than_7_days").length;
  const auditEntry = {
    id: `audit-notification-cleanup-${now.getTime()}`,
    action: "Notification retention enabled",
    details: {
      archivedNotifications,
      cleanupVersion: NOTIFICATION_CLEANUP_VERSION,
    },
    user: actor,
    role: "Admin",
    at: enabledAt,
    message: `Seven-day notification retention was enabled by ${actor} on ${enabledAt}.`,
  };

  return {
    changed: true,
    state: {
      ...state,
      fileNotifications: notifications,
      notificationRetention: {
        ...(state.notificationRetention || {}),
        cleanupVersion: NOTIFICATION_CLEANUP_VERSION,
        retentionEnabledAt: enabledAt,
        retentionEnabledBy: actor,
      },
      auditLog: [...(state.auditLog || []), auditEntry].slice(-1000),
    },
  };
}

function notificationCompleteness(row = {}) {
  return [row.event_key, row.eventKey, row.event_id, row.eventId, row.id, row.changeText, row.targetUserId, row.targetUserEmail, row.targetUserName, row.created_at, row.createdAt]
    .filter(Boolean).length;
}

function legacyDuplicateBase(row = {}) {
  const recipient = String(row.targetUserId || row.targetUserEmail || row.targetUserName || row.user_id || "").trim().toLowerCase();
  const file = String(row.fileId || row.file_id || row.related_record_id || "").trim().toLowerCase();
  const type = String(row.notification_type || row.changeType || row.type || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  if (!recipient || !file || !type || !/(allot|assign|reassign|due|correct|check|status)/.test(type)) return "";
  return `${recipient}|${file}|${type}`;
}

function applyVerifiedDuplicateCleanup(state = {}, options = {}) {
  if (state.notificationRetention?.duplicateCleanupVersion === VERIFIED_DUPLICATE_CLEANUP_VERSION) {
    return { state, changed: false, duplicateGroups: 0, archivedRows: 0 };
  }
  const now = options.now || new Date();
  const rows = Array.isArray(state.fileNotifications) ? state.fileNotifications.map((row) => ({ ...row })) : [];
  const exact = new Map();
  const legacy = new Map();
  rows.forEach((row, index) => {
    if (isArchivedNotification(row)) return;
    const eventKey = String(row.event_key || row.eventKey || "").trim();
    if (eventKey) {
      if (!exact.has(eventKey)) exact.set(eventKey, []);
      exact.get(eventKey).push(index);
      return;
    }
    const base = legacyDuplicateBase(row);
    const timestamp = notificationTimestamp(row);
    if (!base || !timestamp) return;
    if (!legacy.has(base)) legacy.set(base, []);
    legacy.get(base).push({ index, timestamp });
  });
  const groups = [...exact.values()].filter((group) => group.length > 1);
  legacy.forEach((entries) => {
    entries.sort((a, b) => a.timestamp - b.timestamp);
    let cluster = [];
    entries.forEach((entry) => {
      if (!cluster.length || entry.timestamp - cluster[cluster.length - 1].timestamp <= 90000) cluster.push(entry);
      else {
        if (cluster.length > 1) groups.push(cluster.map((item) => item.index));
        cluster = [entry];
      }
    });
    if (cluster.length > 1) groups.push(cluster.map((item) => item.index));
  });
  const read = new Set(state.readNotifications || []);
  let archivedRows = 0;
  groups.forEach((indexes) => {
    const canonicalIndex = [...indexes].sort((left, right) => notificationCompleteness(rows[right]) - notificationCompleteness(rows[left]) || notificationTimestamp(rows[left]) - notificationTimestamp(rows[right]))[0];
    const canonical = rows[canonicalIndex];
    const anyRead = indexes.some((index) => read.has(rows[index].id) || read.has(rows[index].event_id) || read.has(rows[index].eventId));
    indexes.filter((index) => index !== canonicalIndex).forEach((index) => {
      const duplicate = rows[index];
      rows[index] = { ...duplicate, isArchived: true, archivedAt: now.toISOString(), archiveReason: "verified_duplicate", canonicalNotificationId: canonical.event_id || canonical.eventId || canonical.id };
      archivedRows += 1;
    });
    if (anyRead) read.add(canonical.event_id || canonical.eventId || canonical.id);
  });
  const audit = {
    id: `audit-${VERIFIED_DUPLICATE_CLEANUP_VERSION}`,
    action: "Verified duplicate notifications archived",
    details: { cleanupVersion: VERIFIED_DUPLICATE_CLEANUP_VERSION, duplicateGroups: groups.length, archivedRows },
    user: String(options.actor || "System"), role: "System", at: now.toISOString(),
  };
  return {
    changed: true,
    duplicateGroups: groups.length,
    archivedRows,
    state: {
      ...state,
      fileNotifications: rows,
      readNotifications: [...read],
      notificationRetention: { ...(state.notificationRetention || {}), duplicateCleanupVersion: VERIFIED_DUPLICATE_CLEANUP_VERSION, duplicateCleanupAt: now.toISOString(), duplicateGroups: groups.length, duplicateRowsArchived: archivedRows },
      auditLog: [...(state.auditLog || []), audit].slice(-1000),
    },
  };
}

module.exports = {
  NOTIFICATION_RETENTION_DAYS,
  NOTIFICATION_RETENTION_MS,
  NOTIFICATION_CLEANUP_VERSION,
  notificationTimestamp,
  notificationCutoffTime,
  activeNotificationRows,
  archiveExpiredNotificationRows,
  applyInitialNotificationCleanup,
  VERIFIED_DUPLICATE_CLEANUP_VERSION,
  applyVerifiedDuplicateCleanup,
};
