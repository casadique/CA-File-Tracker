const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const { getAppState, getAppStateRecord, saveAppState, backupPayload } = require("../services/appStateService");

const router = express.Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const record = await getAppStateRecord();
    res.json({ state: record.state, updatedAt: record.updatedAt, profile: req.profile });
  } catch (error) {
    next(error);
  }
});

router.get("/version", requireAuth, async (_req, res, next) => {
  try {
    const record = await getAppStateRecord();
    res.json({ ok: true, updatedAt: record.updatedAt, updatedBy: record.updatedBy });
  } catch (error) {
    next(error);
  }
});

router.put("/", requireAuth, requireRole("Admin"), async (req, res, next) => {
  try {
    const state = await saveAppState(req.body.state || {}, req.user.id);
    res.json({ ok: true, state });
  } catch (error) {
    next(error);
  }
});

router.get("/backup", requireAuth, requireRole("Admin", "Manager"), async (req, res, next) => {
  try {
    const payload = backupPayload(await getAppState(), req.profile.name);
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

router.get("/diagnostics", requireAuth, requireRole("Admin", "Manager"), async (_req, res, next) => {
  try {
    const record = await getAppStateRecord();
    const state = record.state;
    const assignmentCounts = {};
    for (const file of state.files || []) {
      const key = String(file.assignedStaffEmail || file.assignedStaff || "Not Assigned").trim() || "Not Assigned";
      assignmentCounts[key] = (assignmentCounts[key] || 0) + 1;
    }
    res.json({
      ok: true,
      files: state.files?.length || 0,
      users: state.users?.length || 0,
      notifications: state.fileNotifications?.length || 0,
      auditEvents: state.auditLog?.length || 0,
      assignmentCounts,
      updatedAt: record.updatedAt,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/restore", requireAuth, requireRole("Admin"), async (req, res, next) => {
  try {
    const incoming = req.body.state || req.body;
    const state = await saveAppState(incoming, req.user.id);
    res.json({ ok: true, state });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
