const NOTIFICATION_RETENTION_DAYS = 7;
const NOTIFICATION_RETENTION_MS = NOTIFICATION_RETENTION_DAYS * 24 * 60 * 60 * 1000;
const NOTIFICATION_CLEANUP_VERSION = "2026-08-03-notification-cleanup-v1";
const VERIFIED_DUPLICATE_CLEANUP_VERSION = "2026-08-10-notification-dedupe-v3";
const { notificationSemanticKey, NOTIFICATION_DUPLICATE_WINDOW_MS } = require("./notificationEventService");

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

function visibleNotificationRows(rows = [], state = {}, profile = {}, userId = "", now = Date.now()) {
  const active = activeNotificationRows(rows, state, now);
  if (["Admin", "Manager", "Staff Manager"].includes(profile?.role)) return active;

  const profileKeys = new Set([userId, profile?.id, profile?.email, profile?.name]
    .map(identityKey)
    .filter(Boolean));
  const matchedUser = (state.users || []).find((user) =>
    [user.id, user.authUserId, user.auth_user_id, user.email, user.name]
      .map(identityKey)
      .some((key) => key && profileKeys.has(key))
  );
  [matchedUser?.id, matchedUser?.authUserId, matchedUser?.auth_user_id, matchedUser?.email, matchedUser?.name]
    .map(identityKey)
    .filter(Boolean)
    .forEach((key) => profileKeys.add(key));

  return active.filter((notice) =>
    [
      notice.targetUserId,
      notice.target_user_id,
      notice.targetUserAuthId,
      notice.target_user_auth_id,
      notice.targetUserEmail,
      notice.target_user_email,
      notice.targetUserName,
      notice.target_user_name,
      notice.user_id,
      notice.userId,
    ].map(identityKey).some((key) => key && profileKeys.has(key))
  );
}

function identityKey(value) {
  return String(value || "").trim().toLowerCase();
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

function applyVerifiedDuplicateCleanup(state = {}, options = {}) {
  if (state.notificationRetention?.duplicateCleanupVersion === VERIFIED_DUPLICATE_CLEANUP_VERSION) {
    return { state, changed: false, duplicateGroups: 0, archivedRows: 0 };
  }
  const now = options.now || new Date();
  const rows = Array.isArray(state.fileNotifications) ? state.fileNotifications.map((row) => ({ ...row })) : [];
  const exact = new Map();
  const semantic = new Map();
  const parent = new Map();
  const find = (index) => {
    if (parent.get(index) !== index) parent.set(index, find(parent.get(index)));
    return parent.get(index);
  };
  const union = (left, right) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parent.set(rightRoot, leftRoot);
  };
  rows.forEach((row, index) => {
    if (isArchivedNotification(row)) return;
    parent.set(index, index);
    const eventKey = String(row.event_key || row.eventKey || "").trim();
    if (eventKey) {
      if (!exact.has(eventKey)) exact.set(eventKey, []);
      exact.get(eventKey).push(index);
    }
    const base = notificationSemanticKey(row);
    const timestamp = notificationTimestamp(row);
    if (!base || !timestamp) return;
    if (!semantic.has(base)) semantic.set(base, []);
    semantic.get(base).push({ index, timestamp });
  });
  exact.forEach((indexes) => indexes.slice(1).forEach((index) => union(indexes[0], index)));
  semantic.forEach((entries) => {
    entries.sort((a, b) => a.timestamp - b.timestamp);
    let clusterStart = entries[0];
    entries.slice(1).forEach((entry) => {
      if (entry.timestamp - clusterStart.timestamp <= NOTIFICATION_DUPLICATE_WINDOW_MS) union(clusterStart.index, entry.index);
      else clusterStart = entry;
    });
  });
  const components = new Map();
  parent.forEach((_value, index) => {
    const root = find(index);
    if (!components.has(root)) components.set(root, []);
    components.get(root).push(index);
  });
  const groups = [...components.values()].filter((group) => group.length > 1);
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
  visibleNotificationRows,
  archiveExpiredNotificationRows,
  applyInitialNotificationCleanup,
  VERIFIED_DUPLICATE_CLEANUP_VERSION,
  applyVerifiedDuplicateCleanup,
};
