const express = require("express");
const XLSX = require("xlsx");
const { requireAuth, requireRole } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const { getAppState, saveAppState, backupPayload } = require("../services/appStateService");
const { createCompleteBackup, archiveCompleteBackup } = require("../services/completeBackupService");

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
    const payload = await createCompleteBackup(req.profile.name, { mode: req.body.mode });
    let archive = null;
    let archiveWarning = "";
    try {
      archive = await archiveCompleteBackup(payload, req.body.reason || "manual");
    } catch (error) {
      archiveWarning = error.message || "The server-side archive could not be stored.";
    }
    res.json({
      ok: true,
      filename: `ca-file-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`,
      summary: payload.backupSummary,
      backedUpAt: payload.exportedAt,
      complete: payload.complete,
      warnings: payload.warnings,
      archive,
      archiveWarning,
      payload: req.body.includePayload ? payload : undefined,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/backup/download", requireAuth, requireRole("Admin", "Manager"), async (req, res, next) => {
  try {
    const payload = await createCompleteBackup(req.profile.name, { mode: req.body.mode });
    let archiveWarning = "";
    try {
      await archiveCompleteBackup(payload, req.body.reason || "manual");
    } catch (error) {
      archiveWarning = error.message || "The server-side archive could not be stored.";
    }
    const filename = `ca-file-tracker-complete-backup-${payload.exportedAt.slice(0, 10)}.json`;
    res.set("Cache-Control", "no-store");
    res.set("Content-Type", "application/json; charset=utf-8");
    res.set("Content-Disposition", `attachment; filename="${filename}"`);
    res.set("X-Backup-Archive-Warning", encodeURIComponent(archiveWarning));
    res.send(JSON.stringify(payload));
  } catch (error) {
    next(error);
  }
});

router.post("/import-xlsx", requireAuth, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ error: "No Excel workbook was uploaded." });
    }
    const buffer = req.file.buffer;
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    if (!workbook.SheetNames?.length) {
      return res.status(400).json({ error: "The workbook does not contain a worksheet." });
    }
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    trimWorksheetToUsedRange(firstSheet);
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

function trimWorksheetToUsedRange(sheet) {
  if (!sheet?.["!ref"]) return;
  const declaredRange = XLSX.utils.decode_range(sheet["!ref"]);
  const populatedCells = Object.keys(sheet)
    .filter((address) => !address.startsWith("!"))
    .map((address) => ({ position: XLSX.utils.decode_cell(address), cell: sheet[address] }))
    .filter(({ cell }) => String(cell?.v ?? "").trim());
  let lastHeaderColumn = -1;
  populatedCells.forEach(({ position }) => {
    if (position.r === declaredRange.s.r) lastHeaderColumn = Math.max(lastHeaderColumn, position.c);
  });
  if (lastHeaderColumn < declaredRange.s.c) return;
  const lastRow = populatedCells.reduce((maximum, { position }) => (
    position.c >= declaredRange.s.c && position.c <= lastHeaderColumn
      ? Math.max(maximum, position.r)
      : maximum
  ), declaredRange.s.r);
  sheet["!ref"] = XLSX.utils.encode_range({
    s: declaredRange.s,
    e: { r: lastRow, c: lastHeaderColumn },
  });
}

module.exports = router;
