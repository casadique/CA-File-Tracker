const express = require("express");
const rateLimit = require("express-rate-limit");
const { requireAuth, requireRole } = require("../middleware/auth");
const {
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
  deliverySummary,
} = require("../services/pushNotificationService");
const { env } = require("../config/env");
const { patchAppState, getNotificationSnapshotRecord } = require("../services/appStateService");
const { visibleNotificationRows } = require("../services/notificationRetentionService");

const router = express.Router();
const announcementLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many announcements. Please try again later." },
});

router.get("/history", requireAuth, async (req, res, next) => {
  try {
    const record = await getNotificationSnapshotRecord();
    const stateContext = {
      notificationRetention: record.notificationRetention,
      users: record.users,
    };
    res.json({
      ok: true,
      notifications: visibleNotificationRows(record.notifications, stateContext, req.profile, req.user.id),
      updatedAt: record.updatedAt,
    });
  } catch (error) { next(error); }
});

router.get("/config", requireAuth, async (req, res, next) => {
  try {
    const [preferences, organization, devices] = await Promise.all([getPreferences(req.user.id), getOrganizationSettings(), getActiveDevices(req.user.id)]);
    res.json({ ok: true, supported: env.webPushConfigured, publicKey: env.vapidPublicKey, preferences, organization, devices });
  } catch (error) { next(error); }
});

router.put("/preferences", requireAuth, async (req, res, next) => {
  try { res.json({ ok: true, preferences: await savePreferences(req.user.id, req.body || {}) }); }
  catch (error) { next(error); }
});

router.post("/subscribe", requireAuth, async (req, res, next) => {
  try {
    if (!env.webPushConfigured) return res.status(503).json({ error: "Desktop push is not configured on the server." });
    const body = req.body || {};
    const subscription = await saveSubscription(req.user.id, body.subscription, {
      deviceLabel: body.deviceLabel,
      deviceId: body.deviceId,
      browserName: body.browserName,
      userAgent: req.get("user-agent"),
    });
    res.json({ ok: true, subscription });
  } catch (error) { next(error); }
});

router.delete("/subscribe", requireAuth, async (req, res, next) => {
  try { await deactivateSubscription(req.user.id, req.body?.endpoint); res.json({ ok: true }); }
  catch (error) { next(error); }
});

router.post("/test", requireAuth, async (req, res, next) => {
  try {
    const endpoint = String(req.body?.endpoint || "");
    if (!endpoint) return res.status(400).json({ error: "The current device does not have an active push subscription." });
    const testEventId = `test-${req.user.id}-${Date.now()}`;
    const result = await sendToUser(req.user.id, {
      id: testEventId,
      eventKey: `test:${testEventId}:${req.user.id}`,
      category: "announcement",
      title: "Desktop notifications enabled",
      body: "CA File Tracker can now send updates to this device.",
      route: "/?page=dashboard",
      endpoint,
    });
    if (!result.sent) return res.status(409).json({ error: `Test push failed: ${result.reason || "delivery_not_confirmed"}.`, diagnostics: result });
    res.json({ ok: true, accepted: true, ...result });
  } catch (error) { next(error); }
});

router.post("/diagnostics", requireAuth, async (req, res, next) => {
  try { res.json({ ok: true, diagnostics: await getDeviceDiagnostics(req.user.id, String(req.body?.endpoint || "")) }); }
  catch (error) { next(error); }
});

router.post("/events/:eventId/open", requireAuth, async (req, res, next) => {
  try { res.json({ ok: true, updated: await markNotificationEvent(req.user.id, req.params.eventId, "opened") }); }
  catch (error) { next(error); }
});

router.post("/events/:eventId/read", requireAuth, async (req, res, next) => {
  try { res.json({ ok: true, updated: await markNotificationEvent(req.user.id, req.params.eventId, "read") }); }
  catch (error) { next(error); }
});

router.get("/admin/status", requireAuth, requireRole("Admin"), async (_req, res, next) => {
  try { res.json({ ok: true, summary: await deliverySummary(), organization: await getOrganizationSettings() }); }
  catch (error) { next(error); }
});

router.put("/admin/settings", requireAuth, requireRole("Admin"), async (req, res, next) => {
  try { res.json({ ok: true, organization: await saveOrganizationSettings(req.user.id, req.body || {}) }); }
  catch (error) { next(error); }
});

router.post("/admin/announcement", requireAuth, requireRole("Admin"), announcementLimiter, async (req, res, next) => {
  try {
    const body = req.body || {};
    const userIds = [...new Set((Array.isArray(body.userIds) ? body.userIds : []).filter(Boolean))];
    const title = String(body.title || "Office announcement").trim().slice(0, 80);
    const message = String(body.message || "").trim().slice(0, 180);
    if (!message) return res.status(400).json({ error: "Announcement message is required." });
    const id = `announcement-${req.user.id}-${Date.now()}`;
    await patchAppState((state) => {
      const recipients = (state.users || []).filter((user) => userIds.includes(user.authUserId || user.auth_user_id));
      const notices = recipients.map((user) => ({
        id: `${id}-${user.authUserId || user.auth_user_id}`,
        fileId: "",
        fileName: title,
        changeType: "System Announcement",
        changeText: message,
        changedBy: req.profile?.name || req.profile?.email || "Admin",
        targetUserId: user.id || "",
        targetUserEmail: user.email || "",
        targetUserName: user.name || "",
        createdAt: Date.now(),
      }));
      state.fileNotifications = [...notices, ...(state.fileNotifications || [])];
      state.auditLog = [...(state.auditLog || []), {
        id: `audit-${id}`,
        action: "Desktop announcement sent",
        details: { title, recipientCount: recipients.length },
        user: req.profile?.name || req.profile?.email || "Admin",
        role: "Admin",
        at: new Date().toISOString(),
      }].slice(-1000);
      return state;
    }, req.user.id);
    const results = await Promise.all(userIds.map((userId) => sendToUser(userId, {
      id: `${id}-${userId}`,
      category: "announcement",
      title,
      body: message,
      route: "/?page=dashboard",
    })));
    res.json({ ok: true, recipients: userIds.length, sent: results.reduce((sum, row) => sum + (row.sent || 0), 0) });
  } catch (error) { next(error); }
});

module.exports = router;
