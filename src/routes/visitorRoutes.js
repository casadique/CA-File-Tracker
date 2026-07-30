const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const { getAppState } = require("../services/appStateService");
const { saveVisitors, deleteVisitor } = require("../services/visitorService");

const router = express.Router();
const visitorRoles = ["Admin", "Manager"];

router.get("/", requireAuth, requireRole(...visitorRoles), async (_req, res, next) => {
  try {
    const state = await getAppState();
    res.json({ ok: true, visitors: state.visitors || [] });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, requireRole(...visitorRoles), async (req, res, next) => {
  try {
    const rows = req.body.visitors || req.body.visitor || req.body;
    const state = await saveVisitors(rows, req.user.id, req.profile);
    res.json({ ok: true, visitors: state.visitors || [] });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAuth, requireRole(...visitorRoles), async (req, res, next) => {
  try {
    const state = await deleteVisitor(req.params.id, req.user.id, req.profile);
    res.json({ ok: true, visitors: state.visitors || [] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
