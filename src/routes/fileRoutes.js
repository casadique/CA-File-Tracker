const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const { getAppState } = require("../services/appStateService");
const { listFiles, upsertFile, returnFileForCorrection, deleteFile } = require("../services/fileService");

const router = express.Router();

router.get("/", requireAuth, async (_req, res, next) => {
  try {
    res.json({ files: await listFiles(await getAppState()) });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, requireRole("Admin", "Manager", "Staff Manager", "Staff"), async (req, res, next) => {
  try {
    const state = await upsertFile(req.body.file || req.body, req.user.id);
    res.json({ ok: true, files: state.files || [] });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", requireAuth, requireRole("Admin", "Manager", "Staff Manager", "Staff"), async (req, res, next) => {
  try {
    const state = await upsertFile({ ...(req.body.file || req.body), id: req.params.id }, req.user.id);
    res.json({ ok: true, files: state.files || [] });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/return-correction", requireAuth, requireRole("Admin", "Manager", "Staff Manager"), async (req, res, next) => {
  try {
    const state = await returnFileForCorrection(req.params.id, req.body || {}, req.user.id, req.profile);
    res.json({
      ok: true,
      files: state.files || [],
      correctionHistory: state.correctionHistory || [],
      fileNotifications: state.fileNotifications || [],
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAuth, requireRole("Admin", "Manager"), async (req, res, next) => {
  try {
    const state = await deleteFile(req.params.id, req.user.id);
    res.json({ ok: true, files: state.files || [] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
