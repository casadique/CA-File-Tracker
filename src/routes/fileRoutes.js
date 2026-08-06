const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const { getAppState } = require("../services/appStateService");
const {
  listFiles,
  upsertFile,
  markFileChecked,
  returnFileForCorrection,
  removeFile,
  removeBilledFileSafely,
  restoreRemovedFile,
  deleteFile,
} = require("../services/fileService");

const router = express.Router();
const { dispatchFileNotifications } = require("../services/pushNotificationService");

function sendDesktopUpdates(state, notices) {
  dispatchFileNotifications(state, notices).catch((error) => console.error("Desktop file notification failed:", error.message));
}

router.get("/", requireAuth, async (_req, res, next) => {
  try {
    res.json({ files: await listFiles(await getAppState(), _req.query || {}) });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, requireRole("Admin", "Manager", "Staff Manager", "Staff"), async (req, res, next) => {
  try {
    const before = await getAppState();
    const state = await upsertFile(req.body.file || req.body, req.user.id, req.profile);
    const savedId = (req.body.file || req.body)?.id;
    const savedFile = (state.files || []).find((file) => file.id === savedId) || (state.files || [])[0] || null;
    const fileNotifications = notificationsForFile(state, savedFile?.id || savedId, notificationIds(before));
    res.json({ ok: true, file: savedFile, fileNotifications });
    sendDesktopUpdates(state, fileNotifications);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", requireAuth, requireRole("Admin", "Manager", "Staff Manager", "Staff"), async (req, res, next) => {
  try {
    const before = await getAppState();
    const state = await upsertFile({ ...(req.body.file || req.body), id: req.params.id }, req.user.id, req.profile);
    const savedFile = (state.files || []).find((file) => file.id === req.params.id) || null;
    const fileNotifications = notificationsForFile(state, req.params.id, notificationIds(before));
    res.json({ ok: true, file: savedFile, fileNotifications });
    sendDesktopUpdates(state, fileNotifications);
  } catch (error) {
    next(error);
  }
});

// Checking permission is intentionally enforced inside markFileChecked. Keeping
// one domain-level gate avoids role-label mismatches between the profile table,
// browser session and this route while preserving the named-checker safeguard.
router.post("/:id/check", requireAuth, async (req, res, next) => {
  try {
    const before = await getAppState();
    const state = await markFileChecked(req.params.id, req.body || {}, req.user.id, req.profile);
    const savedFile = (state.files || []).find((file) => file.id === req.params.id) || null;
    const fileNotifications = notificationsForFile(state, req.params.id, notificationIds(before));
    res.json({ ok: true, file: savedFile, fileNotifications });
    sendDesktopUpdates(state, fileNotifications);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/return-correction", requireAuth, requireRole("Admin", "Manager", "Staff Manager"), async (req, res, next) => {
  try {
    const before = await getAppState();
    const state = await returnFileForCorrection(req.params.id, req.body || {}, req.user.id, req.profile);
    const fileNotifications = notificationsForFile(state, req.params.id, notificationIds(before));
    res.json({
      ok: true,
      files: state.files || [],
      correctionHistory: state.correctionHistory || [],
      fileNotifications,
    });
    sendDesktopUpdates(state, fileNotifications);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/remove", requireAuth, requireRole("Admin", "Manager"), async (req, res, next) => {
  try {
    const state = await removeFile(req.params.id, req.body || {}, req.user.id, req.profile);
    const savedFile = (state.files || []).find((file) => file.id === req.params.id) || null;
    res.json({ ok: true, file: savedFile });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/remove-billed", requireAuth, requireRole("Admin", "Manager"), async (req, res, next) => {
  try {
    const state = await removeBilledFileSafely(req.params.id, req.body || {}, req.user.id, req.profile);
    res.json({
      ok: true,
      files: state.files || [],
      feeReceipts: state.feeReceipts || [],
      otherCashCollections: (state.otherCashCollections || []).filter((item) => item.isDeleted !== true && item.is_deleted !== true),
      auditLog: state.auditLog || [],
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/restore", requireAuth, requireRole("Admin", "Manager"), async (req, res, next) => {
  try {
    const state = await restoreRemovedFile(req.params.id, req.user.id, req.profile);
    const savedFile = (state.files || []).find((file) => file.id === req.params.id) || null;
    res.json({ ok: true, file: savedFile });
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

function notificationIds(state = {}) {
  return new Set((state.fileNotifications || []).map((notice) => String(notice.id || "")).filter(Boolean));
}

function notificationsForFile(state, fileId, existingIds = new Set()) {
  const id = String(fileId || "");
  return (state.fileNotifications || [])
    .filter((notice) => {
      const noticeFileId = String(notice.fileId || notice.file_id || notice.relatedRecordId || notice.related_record_id || "");
      return (!id || noticeFileId === id) && !existingIds.has(String(notice.id || ""));
    })
    .slice(0, 50);
}
