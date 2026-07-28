const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const { getAppState, saveAppState, backupPayload } = require("../services/appStateService");

const router = express.Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    res.json({ state: await getAppState(), profile: req.profile });
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
