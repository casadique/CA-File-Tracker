const NOTIFICATION_RETENTION_DAYS = 7;
const NOTIFICATION_RETENTION_MS = NOTIFICATION_RETENTION_DAYS * 24 * 60 * 60 * 1000;
const NOTIFICATION_CLEANUP_VERSION = "2026-08-03-notification-cleanup-v1";

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
  const clearedAt = now.toISOString();
  const actor = String(options.actor || "Admin").trim() || "Admin";
  const notifications = (state.fileNotifications || []).map((notification) => ({
    ...notification,
    isArchived: true,
    archivedAt: clearedAt,
    archiveReason: "initial_admin_cleanup",
  }));
  const auditEntry = {
    id: `audit-notification-cleanup-${now.getTime()}`,
    action: "All existing notifications cleared",
    details: {
      archivedNotifications: notifications.length,
      cleanupVersion: NOTIFICATION_CLEANUP_VERSION,
      clearedBefore: clearedAt,
    },
    user: actor,
    role: "Admin",
    at: clearedAt,
    message: `All existing notifications were cleared by ${actor} on ${clearedAt}.`,
  };

  return {
    changed: true,
    state: {
      ...state,
      fileNotifications: notifications,
      notificationRetention: {
        ...(state.notificationRetention || {}),
        cleanupVersion: NOTIFICATION_CLEANUP_VERSION,
        clearedBefore: clearedAt,
        clearedAt,
        clearedBy: actor,
      },
      auditLog: [...(state.auditLog || []), auditEntry].slice(-1000),
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
};
