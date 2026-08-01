const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const { getAppState } = require("../services/appStateService");
const { listFiles, upsertFile, markFileChecked, returnFileForCorrection, deleteFile } = require("../services/fileService");

const router = express.Router();

router.get("/", requireAuth, async (_req, res, next) => {
  try {
    res.json({ files: await listFiles(await getAppState(), _req.query || {}) });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, requireRole("Admin", "Manager", "Staff Manager", "Staff"), async (req, res, next) => {
  try {
    const state = await upsertFile(req.body.file || req.body, req.user.id, req.profile);
    const savedId = (req.body.file || req.body)?.id;
    const savedFile = (state.files || []).find((file) => file.id === savedId) || (state.files || [])[0] || null;
    res.json({ ok: true, file: savedFile, fileNotifications: notificationsForFile(state, savedFile?.id || savedId) });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", requireAuth, requireRole("Admin", "Manager", "Staff Manager", "Staff"), async (req, res, next) => {
  try {
    const state = await upsertFile({ ...(req.body.file || req.body), id: req.params.id }, req.user.id, req.profile);
    const savedFile = (state.files || []).find((file) => file.id === req.params.id) || null;
    res.json({ ok: true, file: savedFile, fileNotifications: notificationsForFile(state, req.params.id) });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/check", requireAuth, requireRole("Admin", "Manager", "Staff Manager", "Staff"), async (req, res, next) => {
  try {
    const state = await markFileChecked(req.params.id, req.body || {}, req.user.id, req.profile);
    const savedFile = (state.files || []).find((file) => file.id === req.params.id) || null;
    res.json({ ok: true, file: savedFile, fileNotifications: notificationsForFile(state, req.params.id) });
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
    const state = await deleteFile(req.params.id, req.user.id, req.profile);
    res.json({ ok: true, files: state.files || [], fileNotifications: state.fileNotifications || [] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

function notificationsForFile(state, fileId) {
  const id = String(fileId || "");
  return (state.fileNotifications || [])
    .filter((notice) => {
      const noticeFileId = String(notice.fileId || notice.file_id || notice.relatedRecordId || notice.related_record_id || "");
      return !id || noticeFileId === id;
    })
    .slice(0, 50);
}
