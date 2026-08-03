const webPush = require("web-push");
const { env } = require("../config/env");
const { supabaseAdmin } = require("../config/supabase");
const { getAppState } = require("./appStateService");

const DEFAULT_PREFERENCES = Object.freeze({
  desktop_enabled: false,
  assignment_enabled: true,
  correction_enabled: true,
  checking_enabled: true,
  due_enabled: true,
  billing_enabled: true,
  chat_enabled: true,
  announcement_enabled: true,
  sound_enabled: false,
});

if (env.webPushConfigured) {
  webPush.setVapidDetails(env.vapidSubject, env.vapidPublicKey, env.vapidPrivateKey);
}

function isMissingTable(error) {
  return error?.code === "42P01" || /does not exist|schema cache/i.test(error?.message || "");
}

function cleanText(value, max = 180) {
  return String(value || "").replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function safeRoute(value) {
  const route = String(value || "/").trim();
  return route.startsWith("/") && !route.startsWith("//") ? route : "/";
}

function categoryColumn(category) {
  const normalized = String(category || "announcement").toLowerCase();
  if (["assignment", "correction", "checking", "due", "billing", "chat", "announcement"].includes(normalized)) {
    return `${normalized}_enabled`;
  }
  return "announcement_enabled";
}

async function getPreferences(userId) {
  const { data, error } = await supabaseAdmin.from("notification_preferences").select("*").eq("user_id", userId).maybeSingle();
  if (error) {
    if (isMissingTable(error)) return { ...DEFAULT_PREFERENCES, migration_required: true };
    throw error;
  }
  return { ...DEFAULT_PREFERENCES, ...(data || {}), user_id: userId };
}

async function savePreferences(userId, input = {}) {
  const allowed = Object.keys(DEFAULT_PREFERENCES);
  const row = { user_id: userId, updated_at: new Date().toISOString() };
  allowed.forEach((key) => {
    if (typeof input[key] === "boolean") row[key] = input[key];
  });
  const { data, error } = await supabaseAdmin.from("notification_preferences")
    .upsert(row, { onConflict: "user_id" }).select("*").single();
  if (error) throw error;
  return { ...DEFAULT_PREFERENCES, ...data };
}

async function saveSubscription(userId, subscription, metadata = {}) {
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    const error = new Error("A valid browser push subscription is required.");
    error.status = 400;
    throw error;
  }
  const now = new Date().toISOString();
  const row = {
    user_id: userId,
    endpoint: subscription.endpoint,
    subscription,
    device_label: cleanText(metadata.deviceLabel, 80),
    user_agent: cleanText(metadata.userAgent, 240),
    is_active: true,
    last_seen_at: now,
    updated_at: now,
  };
  const { data, error } = await supabaseAdmin.from("push_subscriptions")
    .upsert(row, { onConflict: "endpoint" }).select("id,user_id,endpoint,is_active,device_label,last_seen_at").single();
  if (error) throw error;
  await savePreferences(userId, { desktop_enabled: true });
  return data;
}

async function deactivateSubscription(userId, endpoint) {
  if (!endpoint) return false;
  const { error } = await supabaseAdmin.from("push_subscriptions")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("user_id", userId).eq("endpoint", endpoint);
  if (error && !isMissingTable(error)) throw error;
  if (!error) {
    const { count, error: countError } = await supabaseAdmin.from("push_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId).eq("is_active", true);
    if (countError && !isMissingTable(countError)) throw countError;
    if (!countError && Number(count || 0) === 0) await savePreferences(userId, { desktop_enabled: false });
  }
  return true;
}

async function getActiveDevices(userId) {
  const { data, error } = await supabaseAdmin.from("push_subscriptions")
    .select("id,device_label,user_agent,last_seen_at,created_at")
    .eq("user_id", userId).eq("is_active", true).order("last_seen_at", { ascending: false });
  if (error) {
    if (isMissingTable(error)) return [];
    throw error;
  }
  return data || [];
}

async function getOrganizationSettings() {
  const { data, error } = await supabaseAdmin.from("desktop_notification_settings").select("*").eq("id", "default").maybeSingle();
  if (error) {
    if (isMissingTable(error)) return { organization_enabled: true, migration_required: true };
    throw error;
  }
  return data || { id: "default", organization_enabled: true };
}

async function saveOrganizationSettings(actorId, input = {}) {
  const allowed = ["organization_enabled", "assignment_enabled", "correction_enabled", "checking_enabled", "due_enabled", "billing_enabled", "chat_enabled", "announcement_enabled"];
  const row = { id: "default", updated_by: actorId, updated_at: new Date().toISOString() };
  allowed.forEach((key) => {
    if (typeof input[key] === "boolean") row[key] = input[key];
  });
  if (Array.isArray(input.due_reminder_days)) {
    row.due_reminder_days = [...new Set(input.due_reminder_days.map(Number).filter((day) => Number.isInteger(day) && day >= -30 && day <= 30))];
  }
  const { data, error } = await supabaseAdmin.from("desktop_notification_settings")
    .upsert(row, { onConflict: "id" }).select("*").single();
  if (error) throw error;
  return data;
}

async function sendToUser(userId, notification = {}) {
  if (!env.webPushConfigured || !userId || !notification.id) return { sent: 0, skipped: true };
  const [preferences, settings] = await Promise.all([getPreferences(userId), getOrganizationSettings()]);
  const category = String(notification.category || "announcement").toLowerCase();
  if (!settings.organization_enabled || settings[categoryColumn(category)] === false) return { sent: 0, skipped: true };
  if (!preferences.desktop_enabled || preferences[categoryColumn(category)] === false) return { sent: 0, skipped: true };

  const { data: subscriptions, error } = await supabaseAdmin.from("push_subscriptions")
    .select("id,endpoint,subscription").eq("user_id", userId).eq("is_active", true);
  if (error) {
    if (isMissingTable(error)) return { sent: 0, skipped: true, migrationRequired: true };
    throw error;
  }
  const payload = JSON.stringify({
    id: cleanText(notification.id, 160),
    category,
    title: cleanText(notification.title || "CA File Tracker", 80),
    body: cleanText(notification.body || notification.text || "You have a new update."),
    route: safeRoute(notification.route),
    relatedRecordId: cleanText(notification.relatedRecordId, 160),
    tag: cleanText(notification.tag || notification.id, 120),
    sound: Boolean(preferences.sound_enabled),
  });
  let sent = 0;
  for (const subscription of subscriptions || []) {
    const delivery = {
      user_id: userId,
      subscription_id: subscription.id,
      notification_id: notification.id,
      category,
      delivery_status: "pending",
    };
    const { data: inserted, error: insertError } = await supabaseAdmin.from("notification_deliveries")
      .insert(delivery).select("id").maybeSingle();
    if (insertError?.code === "23505") continue;
    if (insertError) throw insertError;
    try {
      await webPush.sendNotification(subscription.subscription, payload, { TTL: 60 * 60 * 24 });
      sent += 1;
      await supabaseAdmin.from("notification_deliveries").update({ delivery_status: "delivered", delivered_at: new Date().toISOString() }).eq("id", inserted.id);
    } catch (pushError) {
      const expired = [404, 410].includes(pushError.statusCode);
      if (expired) await supabaseAdmin.from("push_subscriptions").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", subscription.id);
      await supabaseAdmin.from("notification_deliveries").update({ delivery_status: expired ? "expired" : "failed", error_message: cleanText(pushError.message, 500) }).eq("id", inserted.id);
    }
  }
  return { sent };
}

async function deliverySummary() {
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data, error } = await supabaseAdmin.from("notification_deliveries").select("delivery_status,created_at,error_message").gte("created_at", since).order("created_at", { ascending: false });
  if (error) {
    if (isMissingTable(error)) return { migrationRequired: true, total: 0 };
    throw error;
  }
  const rows = data || [];
  return {
    total: rows.length,
    delivered: rows.filter((row) => row.delivery_status === "delivered").length,
    failed: rows.filter((row) => ["failed", "expired"].includes(row.delivery_status)).length,
    recentFailures: rows.filter((row) => row.delivery_status === "failed").slice(0, 10),
  };
}

function authUserIdForStateUser(user = {}) {
  return String(user.authUserId || user.auth_user_id || "").trim();
}

function findStateUser(state = {}, ...identities) {
  const values = identities.flat().map((value) => String(value || "").trim().toLowerCase()).filter(Boolean);
  return (state.users || []).find((user) => [user.id, user.authUserId, user.auth_user_id, user.email, user.name]
    .map((value) => String(value || "").trim().toLowerCase()).some((value) => value && values.includes(value)));
}

function notificationCategory(notification = {}) {
  const type = String(notification.notification_type || notification.changeType || notification.type || "").toLowerCase();
  if (/allot|assign/.test(type)) return "assignment";
  if (/correct|return/.test(type)) return "correction";
  if (/check|complet|approv/.test(type)) return "checking";
  if (/due|overdue|priority/.test(type)) return "due";
  if (/bill|fee|payment|receipt/.test(type)) return "billing";
  return "announcement";
}

function fileNotificationRoute(category, recipient = {}) {
  if (category === "assignment") {
    return String(recipient.role || "").toLowerCase() === "staff" ? "my-task" : "active-files";
  }
  if (category === "correction") return "correction-required-files";
  if (category === "checking") {
    return String(recipient.role || "").toLowerCase() === "staff" ? "completed-files" : "not-checked-files";
  }
  if (category === "due") return "active-files";
  if (category === "billing") return "fee-pending";
  return "file-list";
}

async function dispatchFileNotifications(state = {}, notifications = []) {
  const unique = new Map();
  for (const notice of notifications || []) {
    const recipient = findStateUser(state,
      notice.targetUserId, notice.targetUserEmail, notice.targetUserName, notice.user_id, notice.userId);
    const authUserId = authUserIdForStateUser(recipient);
    if (!authUserId || !notice.id) continue;
    const key = `${authUserId}:${notice.id}`;
    if (unique.has(key)) continue;
    const category = notificationCategory(notice);
    const targetPage = fileNotificationRoute(category, recipient);
    const secureBodies = {
      assignment: "A file assignment was updated. Open the app to review it.",
      correction: "A file requires correction attention. Open the app to view the details.",
      checking: "A file completion or checking update is ready for review.",
      due: "A due-date update requires your attention.",
      billing: "A billing or fee update is ready for review.",
      announcement: "A file status was updated. Open the app to review it.",
    };
    unique.set(key, sendToUser(authUserId, {
      id: `file-${notice.id}`,
      category,
      title: cleanText(notice.fileName || "File update", 80),
      body: secureBodies[category] || secureBodies.announcement,
      route: `/?page=${targetPage}&file=${encodeURIComponent(notice.fileId || "")}`,
      relatedRecordId: notice.fileId || "",
      tag: `file-${notice.fileId || notice.id}`,
    }));
  }
  return Promise.allSettled(unique.values());
}

async function dispatchChatNotification(state = {}, message = {}) {
  if (!message.id) return [];
  const sender = findStateUser(state, message.userId, message.authSenderId, message.userEmail, message.user) || {};
  let recipients = [];
  if (message.targetType === "personal") {
    const target = findStateUser(state, message.targetUserId, message.targetUserEmail, message.targetUserName);
    if (target) recipients = [target];
  } else {
    const groupId = message.groupId || message.group_id || "team";
    if (groupId === "team") {
      recipients = state.users || [];
    } else {
      const group = (state.chatGroups || []).find((item) => item.id === groupId);
      recipients = (group?.memberIds || []).map((id) => findStateUser(state, id)).filter(Boolean);
    }
  }
  const senderAuthId = authUserIdForStateUser(sender) || String(message.authSenderId || "");
  const unique = new Map();
  for (const recipient of recipients) {
    const authUserId = authUserIdForStateUser(recipient);
    if (!authUserId || authUserId === senderAuthId || recipient.isActive === false || recipient.is_active === false) continue;
    unique.set(authUserId, sendToUser(authUserId, {
      id: `chat-${message.id}`,
      category: "chat",
      title: message.targetType === "personal" ? "New Chat Message" : "New Group Message",
      body: message.targetType === "personal"
        ? `You received a new message from ${cleanText(sender.name || message.user || "a team member", 60)}.`
        : `You received a new message in ${cleanText(message.groupName || "a group chat", 60)}.`,
      route: `/?page=dashboard&chat=${encodeURIComponent(message.targetType === "personal" ? (message.userId || message.authSenderId || "team") : (message.groupId || "team"))}`,
      tag: `chat-${message.targetType === "personal" ? (message.userId || message.authSenderId) : (message.groupId || "team")}`,
    }));
  }
  return Promise.allSettled(unique.values());
}

function indiaDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function daysBetweenIndia(todayKey, dueValue) {
  const match = String(dueValue || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const due = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const today = Date.parse(`${todayKey}T00:00:00Z`);
  return Math.round((due - today) / 86400000);
}

function fileIsComplete(file = {}) {
  return Boolean(file.filed || file.completed || file.checkedBy || file.checkedDate || file.stages?.Completed);
}

async function dispatchDueReminders() {
  if (!env.webPushConfigured) return { sent: 0, skipped: true };
  const [state, settings] = await Promise.all([getAppState(), getOrganizationSettings()]);
  if (!settings.organization_enabled || settings.due_enabled === false) return { sent: 0, skipped: true };
  const today = indiaDateKey();
  const reminderDays = new Set((settings.due_reminder_days || [1, 0, -1]).map(Number));
  const jobs = [];
  for (const file of state.files || []) {
    if (fileIsComplete(file) || file.isDeleted || file.deleted || file.removed) continue;
    const days = daysBetweenIndia(today, file.dueDate || file.due_date);
    if (days === null || !reminderDays.has(days)) continue;
    const assignee = findStateUser(state,
      file.reAssignedStaffId, file.reAssignedStaffEmail, file.reAssignedStaff,
      file.assignedStaffId, file.assignedStaffEmail, file.assignedStaff);
    const authUserId = authUserIdForStateUser(assignee);
    if (!authUserId) continue;
    const when = days === 0
      ? "due today"
      : days < 0
        ? `overdue by ${Math.abs(days)} day${days === -1 ? "" : "s"}`
        : `due in ${days} day${days === 1 ? "" : "s"}`;
    jobs.push(sendToUser(authUserId, {
      id: `due-${file.id}-${today}-${days}`,
      category: "due",
      title: cleanText(file.name || "File due reminder", 80),
      body: `${cleanText(file.serviceType || "File", 80)} is ${when}.`,
      route: `/?page=active-files&file=${encodeURIComponent(file.id || "")}`,
      tag: `due-${file.id}`,
    }));
  }
  const results = await Promise.allSettled(jobs);
  return { attempted: jobs.length, sent: results.filter((row) => row.status === "fulfilled").reduce((sum, row) => sum + (row.value.sent || 0), 0) };
}

module.exports = {
  DEFAULT_PREFERENCES,
  getPreferences,
  savePreferences,
  saveSubscription,
  deactivateSubscription,
  getActiveDevices,
  getOrganizationSettings,
  saveOrganizationSettings,
  sendToUser,
  dispatchFileNotifications,
  dispatchChatNotification,
  dispatchDueReminders,
  deliverySummary,
};
