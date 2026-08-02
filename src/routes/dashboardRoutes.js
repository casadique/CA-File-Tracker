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

module.exports = router;
