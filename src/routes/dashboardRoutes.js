const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const { getAppStateRecord } = require("../services/appStateService");
const { calculateDashboardCounts } = require("../services/fileViewRules");

const router = express.Router();

router.get("/counts", requireAuth, requireRole("Admin", "Manager"), async (_req, res, next) => {
  try {
    const record = await getAppStateRecord();
    res.json({
      counts: calculateDashboardCounts(record.state.files || []),
      updatedAt: record.updatedAt,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/activity", requireAuth, requireRole("Admin", "Manager"), async (_req, res, next) => {
  try {
    const record = await getAppStateRecord();
    const auditLog = [...(record.state.auditLog || [])]
      .sort((left, right) => (Date.parse(right.at || "") || 0) - (Date.parse(left.at || "") || 0))
      .slice(0, 50);
    res.json({ ok: true, auditLog, updatedAt: record.updatedAt });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
