const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const { rowsToPdfBuffer, rowsToXlsxBuffer } = require("../services/exportService");

const router = express.Router();

router.post("/xlsx", requireAuth, requireRole("Admin", "Manager", "Staff Manager"), async (req, res, next) => {
  try {
    const buffer = rowsToXlsxBuffer(req.body.rows || [], req.body.sheetName || "Export");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName(req.body.filename || "export")}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

router.post("/pdf", requireAuth, requireRole("Admin", "Manager", "Staff Manager"), async (req, res, next) => {
  try {
    const buffer = await rowsToPdfBuffer(req.body.rows || [], req.body.title || "CA File Tracker Export");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName(req.body.filename || "export")}.pdf"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

function safeName(value) {
  return String(value || "export").replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "export";
}

module.exports = router;
