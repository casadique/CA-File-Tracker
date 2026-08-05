const webPush = require("web-push");
const { env } = require("../config/env");
const { supabaseAdmin } = require("../config/supabase");
const { getAppState, patchAppState } = require("./appStateService");
const { appendNotificationEvents, createNotificationEvent, deterministicNotificationId, notificationLog } = require("./notificationEventService");

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
  const deviceId = cleanText(metadata.deviceId || metadata.deviceLabel, 120);
  if (deviceId) {
    const { error: retireError } = await supabaseAdmin.from("push_subscriptions")
      .update({ is_active: false, updated_at: now }).eq("user_id", userId).eq("device_id", deviceId).neq("endpoint", subscription.endpoint);
    if (retireError && !isMissingTable(retireError)) throw retireError;
  }
  const row = {
    user_id: userId,
    endpoint: subscription.endpoint,
    subscription,
    device_label: cleanText(metadata.deviceLabel, 80),
    device_id: deviceId,
    browser_name: cleanText(metadata.browserName || browserFromUserAgent(metadata.userAgent), 80),
    user_agent: cleanText(metadata.userAgent, 240),
    is_active: true,
    last_seen_at: now,
    updated_at: now,
  };
  const { data, error } = await supabaseAdmin.from("push_subscriptions")
    .upsert(row, { onConflict: "endpoint" }).select("id,user_id,is_active,device_label,device_id,browser_name,last_seen_at,last_successful_delivery_at").single();
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
    .select("id,device_label,device_id,browser_name,last_seen_at,last_successful_delivery_at,created_at")
    .eq("user_id", userId).eq("is_active", true).order("last_seen_at", { ascending: false });
  if (error) {
    if (isMissingTable(error)) return [];
    throw error;
  }
  return data || [];
}

async function getDeviceDiagnostics(userId, endpoint = "") {
  const diagnostics = {
    serverConfigured: env.webPushConfigured,
    currentDeviceRegistered: false,
    pushSubscriptionActive: false,
    lastSuccessfulPush: null,
    browserName: "",
    deviceName: "",
    lastFailure: "",
  };
  if (!endpoint) return diagnostics;
  const { data: device, error } = await supabaseAdmin.from("push_subscriptions")
    .select("id,is_active,device_label,browser_name,last_successful_delivery_at")
    .eq("user_id", userId).eq("endpoint", endpoint).maybeSingle();
  if (error) {
    if (isMissingTable(error)) return { ...diagnostics, migrationRequired: true };
    throw error;
  }
  if (!device) return diagnostics;
  diagnostics.currentDeviceRegistered = true;
  diagnostics.pushSubscriptionActive = device.is_active === true;
  diagnostics.lastSuccessfulPush = device.last_successful_delivery_at || null;
  diagnostics.browserName = device.browser_name || "Browser";
  diagnostics.deviceName = device.device_label || "Browser device";
  const { data: failure, error: failureError } = await supabaseAdmin.from("notification_deliveries")
    .select("error_message,created_at").eq("user_id", userId).eq("subscription_id", device.id)
    .in("delivery_status", ["failed", "expired"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!failureError && failure) diagnostics.lastFailure = failure.error_message || "Push delivery failed";
  return diagnostics;
}

async function markNotificationEvent(userId, eventId, state = "read") {
  if (!eventId) return false;
  const now = new Date().toISOString();
  const updates = state === "opened"
    ? { desktop_status: "opened", opened_at: now, read_at: now, updated_at: now }
    : { read_at: now, updated_at: now };
  const { data, error } = await supabaseAdmin.from("notification_events")
    .update(updates).eq("recipient_user_id", userId).eq("event_id", eventId).select("event_id").maybeSingle();
  if (error) {
    if (isMissingTable(error)) return false;
    throw error;
  }
  if (data) notificationLog("notification_opened", { event_id: eventId, targetUserAuthId: userId }, { channel: state === "opened" ? "desktop" : "in_app", result: state });
  return Boolean(data);
}

function browserFromUserAgent(userAgent = "") {
  const value = String(userAgent || "");
  if (/Edg\//.test(value)) return "Microsoft Edge";
  if (/Chrome\//.test(value)) return "Google Chrome";
  if (/Firefox\//.test(value)) return "Mozilla Firefox";
  if (/Safari\//.test(value)) return "Safari";
  return "Browser";
}

async function ensureNotificationEvent(userId, notification = {}) {
  const eventKey = String(notification.eventKey || notification.event_key || `${notification.category || "announcement"}:${notification.id}:${userId}`);
  const eventId = String(notification.id || deterministicNotificationId(eventKey));
  const row = {
    event_id: eventId,
    event_key: eventKey,
    recipient_user_id: userId,
    event_type: String(notification.eventType || notification.category || "announcement"),
    file_id: String(notification.relatedRecordId || ""),
    payload: {
      title: cleanText(notification.title || "CA File Tracker", 80),
      body: cleanText(notification.body || notification.text || "You have a new update."),
      route: safeRoute(notification.route),
      category: String(notification.category || "announcement"),
    },
    in_app_created_at: notification.inAppCreatedAt || new Date().toISOString(),
    desktop_status: notification.scheduledFor ? "scheduled" : "queued",
    scheduled_for: notification.scheduledFor || null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabaseAdmin.from("notification_events")
    .upsert(row, { onConflict: "event_key", ignoreDuplicates: true }).select("*").maybeSingle();
  if (error) {
    if (isMissingTable(error)) return { ...row, migrationRequired: true };
    throw error;
  }
  if (data) {
    notificationLog("notification_event_created", { ...notification, event_id: eventId, event_key: eventKey }, { result: "created" });
    return data;
  }
  const { data: existing, error: lookupError } = await supabaseAdmin.from("notification_events").select("*").eq("event_key", eventKey).single();
  if (lookupError) throw lookupError;
  notificationLog("duplicate_event_blocked", { ...notification, event_id: existing.event_id, event_key: eventKey }, { result: "reused" });
  return existing;
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
  if (!env.webPushConfigured) return { sent: 0, skipped: true, reason: "push_not_configured" };
  if (!userId || !notification.id) return { sent: 0, skipped: true, reason: "invalid_recipient_or_event" };
  const event = await ensureNotificationEvent(userId, notification);
  const eventId = event.event_id || notification.id;
  const eventKey = event.event_key || notification.eventKey || notification.event_key || "";
  const [preferences, settings] = await Promise.all([getPreferences(userId), getOrganizationSettings()]);
  const category = String(notification.category || "announcement").toLowerCase();
  if (!settings.organization_enabled || settings[categoryColumn(category)] === false) return { sent: 0, skipped: true, reason: "organization_preference_disabled", eventId };
  if (!preferences.desktop_enabled || preferences[categoryColumn(category)] === false) return { sent: 0, skipped: true, reason: "user_preference_disabled", eventId };

  let subscriptionsQuery = supabaseAdmin.from("push_subscriptions")
    .select("id,endpoint,subscription").eq("user_id", userId).eq("is_active", true);
  if (notification.endpoint) subscriptionsQuery = subscriptionsQuery.eq("endpoint", notification.endpoint);
  const { data: subscriptions, error } = await subscriptionsQuery;
  if (error) {
    if (isMissingTable(error)) return { sent: 0, skipped: true, migrationRequired: true, reason: "migration_required", eventId };
    throw error;
  }
  const payload = JSON.stringify({
    id: cleanText(eventId, 160),
    eventId: cleanText(eventId, 160),
    eventKey: cleanText(eventKey, 240),
    category,
    title: cleanText(notification.title || "CA File Tracker", 80),
    body: cleanText(notification.body || notification.text || "You have a new update."),
    route: safeRoute(notification.route),
    relatedRecordId: cleanText(notification.relatedRecordId, 160),
    tag: cleanText(notification.tag || eventId, 120),
    sound: Boolean(preferences.sound_enabled),
  });
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  for (const subscription of subscriptions || []) {
    const { data: existingDelivery, error: existingError } = await supabaseAdmin.from("notification_deliveries")
      .select("id,delivery_status,attempted_at,created_at").eq("user_id", userId).eq("subscription_id", subscription.id).eq("notification_id", eventId).maybeSingle();
    if (existingError && !isMissingTable(existingError)) throw existingError;
    if (["delivered", "opened"].includes(existingDelivery?.delivery_status)) {
      skipped += 1;
      notificationLog("duplicate_delivery_blocked", { ...notification, event_id: eventId, event_key: eventKey }, { channel: "desktop", result: "already_delivered" });
      continue;
    }
    const pendingAttempt = Date.parse(existingDelivery?.attempted_at || existingDelivery?.created_at || "");
    if (existingDelivery?.delivery_status === "pending" && Number.isFinite(pendingAttempt) && Date.now() - pendingAttempt < 5 * 60 * 1000) {
      skipped += 1;
      notificationLog("duplicate_delivery_blocked", { ...notification, event_id: eventId, event_key: eventKey }, { channel: "desktop", result: "delivery_in_progress" });
      continue;
    }
    let deliveryId = existingDelivery?.id;
    if (deliveryId) {
      const { error: retryError } = await supabaseAdmin.from("notification_deliveries")
        .update({ delivery_status: "pending", error_message: "", event_key: eventKey, attempted_at: new Date().toISOString() }).eq("id", deliveryId);
      if (retryError) throw retryError;
    } else {
      const { data: inserted, error: insertError } = await supabaseAdmin.from("notification_deliveries")
        .insert({ user_id: userId, subscription_id: subscription.id, notification_id: eventId, event_key: eventKey, category, delivery_status: "pending", attempted_at: new Date().toISOString() })
        .select("id").maybeSingle();
      if (insertError?.code === "23505") {
        skipped += 1;
        notificationLog("duplicate_delivery_blocked", { ...notification, event_id: eventId, event_key: eventKey }, { channel: "desktop", result: "concurrent_worker" });
        continue;
      }
      if (insertError) throw insertError;
      deliveryId = inserted.id;
    }
    notificationLog("push_queued", { ...notification, event_id: eventId, event_key: eventKey }, { channel: "desktop", result: "queued" });
    try {
      await webPush.sendNotification(subscription.subscription, payload, { TTL: 60 * 60 * 24 });
      sent += 1;
      const deliveredAt = new Date().toISOString();
      await Promise.all([
        supabaseAdmin.from("notification_deliveries").update({ delivery_status: "delivered", delivered_at: deliveredAt }).eq("id", deliveryId),
        supabaseAdmin.from("push_subscriptions").update({ last_successful_delivery_at: deliveredAt, last_seen_at: deliveredAt, updated_at: deliveredAt }).eq("id", subscription.id),
        event.migrationRequired ? Promise.resolve() : supabaseAdmin.from("notification_events").update({ desktop_status: "sent", sent_at: deliveredAt, error_code: "", updated_at: deliveredAt }).eq("event_id", eventId),
      ]);
      notificationLog("push_delivered", { ...notification, event_id: eventId, event_key: eventKey }, { channel: "desktop", result: "delivered" });
    } catch (pushError) {
      failed += 1;
      const expired = [404, 410].includes(pushError.statusCode);
      if (expired) await supabaseAdmin.from("push_subscriptions").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", subscription.id);
      const failedAt = new Date().toISOString();
      await Promise.all([
        supabaseAdmin.from("notification_deliveries").update({ delivery_status: expired ? "expired" : "failed", error_message: cleanText(pushError.message, 500) }).eq("id", deliveryId),
        event.migrationRequired ? Promise.resolve() : supabaseAdmin.from("notification_events").update({ desktop_status: "failed", failed_at: failedAt, error_code: String(pushError.statusCode || "push_failed"), updated_at: failedAt }).eq("event_id", eventId),
      ]);
      notificationLog(expired ? "subscription_expired" : "push_failed", { ...notification, event_id: eventId, event_key: eventKey }, { channel: "desktop", result: "failed", errorCode: pushError.statusCode || "push_failed" });
    }
  }
  if (!(subscriptions || []).length) return { sent: 0, failed: 0, skipped: true, reason: notification.endpoint ? "current_device_not_registered" : "no_active_subscription", eventId };
  return { sent, failed, skipped, eventId };
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

function authUserIdFromProfiles(profiles = [], ...identities) {
  const values = identities.flat().map((value) => String(value || "").trim().toLowerCase()).filter(Boolean);
  for (const identity of values) {
    const profile = (profiles || []).find((row) => row.is_active !== false && [row.id, row.auth_user_id, row.email, row.name]
      .map((value) => String(value || "").trim().toLowerCase())
      .includes(identity));
    if (profile?.auth_user_id) return String(profile.auth_user_id).trim();
  }
  return "";
}

async function getNotificationAuthProfiles() {
  const { data, error } = await supabaseAdmin.from("app_users")
    .select("id,auth_user_id,name,email,role,is_active")
    .eq("is_active", true);
  if (error) throw error;
  return data || [];
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
  const authProfiles = await getNotificationAuthProfiles();
  const unique = new Map();
  for (const notice of notifications || []) {
    const recipient = findStateUser(state,
      notice.targetUserId, notice.targetUserEmail, notice.targetUserName, notice.user_id, notice.userId);
    const authUserId = authUserIdForStateUser(recipient) || authUserIdFromProfiles(authProfiles,
      notice.targetUserId, notice.targetUserEmail, notice.targetUserName,
      recipient?.id, recipient?.email, recipient?.name);
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
      id: notice.event_id || notice.eventId || notice.id,
      eventKey: notice.event_key || notice.eventKey || notice.dedupeKey,
      eventType: notice.notification_type || notice.changeType,
      category,
      title: category === "assignment" ? "File Allotted" : cleanText(notice.fileName || "File update", 80),
      body: category === "assignment" ? cleanText(notice.changeText, 180) : (secureBodies[category] || secureBodies.announcement),
      route: `/?page=${targetPage}&file=${encodeURIComponent(notice.fileId || "")}`,
      relatedRecordId: notice.fileId || "",
      tag: notice.event_id || notice.eventId || notice.id,
    }));
  }
  return Promise.allSettled(unique.values());
}

async function dispatchChatNotification(state = {}, message = {}) {
  if (!message.id) return [];
  const authProfiles = await getNotificationAuthProfiles();
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
  const senderAuthId = authUserIdForStateUser(sender) || authUserIdFromProfiles(authProfiles,
    message.authSenderId, message.userId, message.userEmail, message.user,
    sender.id, sender.email, sender.name);
  const unique = new Map();
  for (const recipient of recipients) {
    const authUserId = authUserIdForStateUser(recipient) || authUserIdFromProfiles(authProfiles,
      recipient.id, recipient.email, recipient.name);
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
  const [settings, authProfiles, previewState] = await Promise.all([getOrganizationSettings(), getNotificationAuthProfiles(), getAppState()]);
  if (!settings.organization_enabled || settings.due_enabled === false) return { sent: 0, skipped: true };
  const now = new Date();
  const today = indiaDateKey(now);
  const reminderDays = new Set((settings.due_reminder_days || [1, 0, -1]).map(Number));
  const existingKeys = new Set((previewState.fileNotifications || []).map((row) => row.event_key || row.eventKey || row.dedupeKey).filter(Boolean));
  const hasUnsentCandidate = (previewState.files || []).some((file) => {
    if (fileIsComplete(file) || file.isDeleted || file.deleted || file.removed || file.stages?.["Correction Required"]) return false;
    const dueDate = file.dueDate || file.due_date;
    const days = daysBetweenIndia(today, dueDate);
    const firstReminderAt = file.first_due_reminder_at || file.firstDueReminderAt || "";
    const sameDayThreeHour = Boolean(firstReminderAt && days === 0);
    if (sameDayThreeHour && Date.parse(firstReminderAt) > now.getTime()) return false;
    if (!sameDayThreeHour && (days === null || !reminderDays.has(days))) return false;
    const assignee = findStateUser(previewState,
      file.reAssignedStaffId, file.reAssignedStaffEmail, file.reAssignedStaff,
      file.assignedStaffId, file.assignedStaffEmail, file.assignedStaff);
    const authUserId = authUserIdForStateUser(assignee) || authUserIdFromProfiles(authProfiles,
      file.reAssignedStaffId, file.reAssignedStaffEmail, file.reAssignedStaff,
      file.assignedStaffId, file.assignedStaffEmail, file.assignedStaff,
      assignee?.id, assignee?.email, assignee?.name);
    if (!authUserId) return false;
    const dueVersion = file.due_date_version || file.dueDateVersion || dueDate;
    const stage = sameDayThreeHour ? "same_day_3h" : days === 0 ? "due_today" : days < 0 ? `overdue_${Math.abs(days)}` : `due_in_${days}`;
    return !existingKeys.has(`due_reminder:${file.id}:${dueVersion}:${authUserId}:${stage}`);
  });
  if (!hasUnsentCandidate) return { attempted: 0, cancellations: 0, sent: 0 };
  const dueEvents = [];
  let cancellations = 0;
  const state = await patchAppState((current) => {
    for (const file of current.files || []) {
      if (fileIsComplete(file) || file.isDeleted || file.deleted || file.removed || file.stages?.["Correction Required"]) {
        if (file.first_due_reminder_at || file.firstDueReminderAt) {
          cancellations += 1;
          notificationLog("reminder_cancelled", { fileId: file.id, notification_type: "Due Reminder" }, { result: "file_ineligible" });
        }
        continue;
      }
      const dueDate = file.dueDate || file.due_date;
      const days = daysBetweenIndia(today, dueDate);
      const firstReminderAt = file.first_due_reminder_at || file.firstDueReminderAt || "";
      const sameDayThreeHour = Boolean(firstReminderAt && days === 0);
      if (sameDayThreeHour && Date.parse(firstReminderAt) > now.getTime()) {
        notificationLog("reminder_scheduled", { fileId: file.id, notification_type: "Due Reminder", scheduled_for: firstReminderAt }, { result: "waiting" });
        continue;
      }
      if (!sameDayThreeHour && (days === null || !reminderDays.has(days))) continue;
      const assignee = findStateUser(current,
        file.reAssignedStaffId, file.reAssignedStaffEmail, file.reAssignedStaff,
        file.assignedStaffId, file.assignedStaffEmail, file.assignedStaff);
      const authUserId = authUserIdForStateUser(assignee) || authUserIdFromProfiles(authProfiles,
        file.reAssignedStaffId, file.reAssignedStaffEmail, file.reAssignedStaff,
        file.assignedStaffId, file.assignedStaffEmail, file.assignedStaff,
        assignee?.id, assignee?.email, assignee?.name);
      if (!authUserId) continue;
      const dueVersion = file.due_date_version || file.dueDateVersion || dueDate;
      const stage = sameDayThreeHour ? "same_day_3h" : days === 0 ? "due_today" : days < 0 ? `overdue_${Math.abs(days)}` : `due_in_${days}`;
      const eventKey = `due_reminder:${file.id}:${dueVersion}:${authUserId}:${stage}`;
      const when = days === 0 ? "due today" : days < 0
        ? `overdue by ${Math.abs(days)} day${days === -1 ? "" : "s"}`
        : `due in ${days} day${days === 1 ? "" : "s"}`;
      const event = createNotificationEvent({
        eventKey,
        eventType: "Due Reminder",
        changeType: "Due Reminder",
        fileId: file.id,
        sourceEventId: `${dueVersion}:${stage}`,
        fileName: file.name || "File due reminder",
        changeText: `${file.serviceType || "File"} is ${when}.`,
        changedBy: "System",
        recipient: { ...assignee, authUserId },
        category: "due",
        route: `/?page=active-files&file=${encodeURIComponent(file.id || "")}`,
        tone: days < 0 ? "overdue" : "pending",
        createdAt: now,
      });
      const added = appendNotificationEvents(current, [event], { limit: 800 }).created;
      if (added.length) dueEvents.push({ event, authUserId, file, when });
    }
    return current;
  });
  void state;
  const jobs = dueEvents.map(({ event, authUserId, file, when }) => sendToUser(authUserId, {
    id: event.event_id,
    eventKey: event.event_key,
    eventType: "Due Reminder",
    inAppCreatedAt: event.created_at,
    category: "due",
    title: cleanText(file.name || "File due reminder", 80),
    body: `${cleanText(file.serviceType || "File", 80)} is ${when}.`,
    route: `/?page=active-files&file=${encodeURIComponent(file.id || "")}`,
    relatedRecordId: file.id || "",
    tag: event.event_id,
  }));
  const results = await Promise.allSettled(jobs);
  dueEvents.forEach(({ event }) => notificationLog("reminder_sent", event, { channel: "desktop", result: "dispatched" }));
  return { attempted: jobs.length, cancellations, sent: results.filter((row) => row.status === "fulfilled").reduce((sum, row) => sum + (row.value.sent || 0), 0) };
}

module.exports = {
  DEFAULT_PREFERENCES,
  getPreferences,
  savePreferences,
  saveSubscription,
  deactivateSubscription,
  getActiveDevices,
  getDeviceDiagnostics,
  markNotificationEvent,
  getOrganizationSettings,
  saveOrganizationSettings,
  sendToUser,
  dispatchFileNotifications,
  dispatchChatNotification,
  dispatchDueReminders,
  deliverySummary,
  authUserIdFromProfiles,
};
