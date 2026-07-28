const express = require("express");
const XLSX = require("xlsx");
const { requireAuth, requireRole } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const { getAppState, saveAppState, backupPayload } = require("../services/appStateService");

const router = express.Router();

router.get("/site-data", requireAuth, async (req, res, next) => {
  try {
    const state = await getAppState();
    res.json(backupPayload(state, req.profile.name));
  } catch (error) {
    next(error);
  }
});

router.post("/site-data", requireAuth, requireRole("Admin"), async (req, res, next) => {
  try {
    const incoming = req.body.state || {};
    const state = await saveAppState(incoming, req.user.id);
    res.json({
      ok: true,
      syncedAt: new Date().toISOString(),
      files: state.files?.length || 0,
      users: state.users?.length || 0,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/backup", requireAuth, requireRole("Admin", "Manager"), async (req, res, next) => {
  try {
    const state = req.body.state || await getAppState();
    res.json({
      ok: true,
      filename: `ca-file-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`,
      summary: backupPayload(state, req.profile.name).backupSummary,
      backedUpAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/import-xlsx", requireAuth, upload.single("file"), async (req, res, next) => {
  try {
    const buffer = req.file?.buffer || Buffer.from(await requestArrayBuffer(req));
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(firstSheet, {
      header: 1,
      raw: false,
      defval: "",
      dateNF: "yyyy-mm-dd",
    });
    res.json({ rows });
  } catch (error) {
    next(error);
  }
});

function requestArrayBuffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

module.exports = router;
