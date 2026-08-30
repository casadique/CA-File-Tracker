const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const { getAppState } = require("../services/appStateService");
const {
  queryFiles,
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
const {
  relationalFileCandidates,
  relationalFileSnapshot,
  fileSnapshotMetadata,
  relationalReadConfigured,
  relationalReadEnabled,
  waitForFileShadowSync,
} = require("../services/fileRecordService");

function sendDesktopUpdates(state, notices) {
  dispatchFileNotifications(state, notices).catch((error) => console.error("Desktop file notification failed:", error.message));
}

router.get("/snapshot/version", requireAuth, (_req, res) => {
  res.json(fileSnapshotMetadata());
});

router.get("/snapshot", requireAuth, async (_req, res, next) => {
  try {
    if (relationalReadEnabled()) {
      try {
        await waitForFileShadowSync();
        const files = await relationalFileSnapshot();
        res.set("X-File-Read-Source", "relational");
        res.json({ files, total: files.length, source: "relational", ...fileSnapshotMetadata() });
        return;
      } catch (error) {
        console.error("Relational file snapshot failed; using central fallback:", error.message);
      }
    }
    const files = (await getAppState()).files || [];
    const source = relationalReadConfigured() ? "central-fallback" : "central";
    res.set("X-File-Read-Source", source);
    res.json({ files, total: files.length, source });
  } catch (error) {
    next(error);
  }
});

router.get("/", requireAuth, async (req, res, next) => {
  try {
    if (relationalReadEnabled()) {
      try {
        await waitForFileShadowSync();
        const files = await relationalFileCandidates(req.query || {});
        res.set("X-File-Read-Source", "relational");
        res.json(queryFiles({ files }, req.query || {}));
        return;
      } catch (error) {
        console.error("Relational file read failed; using central fallback:", error.message);
        res.set("X-File-Read-Source", "central-fallback");
      }
    } else if (relationalReadConfigured()) {
      res.set("X-File-Read-Source", "central-warming");
    } else {
      res.set("X-File-Read-Source", "central");
    }
    res.json(await queryFiles(await getAppState(), req.query || {}));
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, requireRole("Admin", "Manager", "Staff Manager", "Staff"), async (req, res, next) => {
  try {
    const notificationBoundary = Date.now();
    const state = await upsertFile(req.body.file || req.body, req.user.id, req.profile, {
      sourceAction: req.body.sourceAction || req.get("X-Source-Action") || "add-file",
    });
    const savedId = (req.body.file || req.body)?.id;
    const savedFile = (state.files || []).find((file) => file.id === savedId) || (state.files || [])[0] || null;
    const fileNotifications = notificationsForFileSince(state, savedFile?.id || savedId, notificationBoundary);
    res.json({ ok: true, file: savedFile, fileNotifications });
    sendDesktopUpdates(state, fileNotifications);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", requireAuth, requireRole("Admin", "Manager", "Staff Manager", "Staff"), async (req, res, next) => {
  try {
    const notificationBoundary = Date.now();
    const state = await upsertFile({ ...(req.body.file || req.body), id: req.params.id }, req.user.id, req.profile, {
      sourceAction: req.body.sourceAction || req.get("X-Source-Action") || "edit-file",
    });
    const savedFile = (state.files || []).find((file) => file.id === req.params.id) || null;
    const fileNotifications = notificationsForFileSince(state, req.params.id, notificationBoundary);
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
    const notificationBoundary = Date.now();
    const state = await markFileChecked(req.params.id, req.body || {}, req.user.id, req.profile);
    const savedFile = (state.files || []).find((file) => file.id === req.params.id) || null;
    const fileNotifications = notificationsForFileSince(state, req.params.id, notificationBoundary);
    res.json({ ok: true, file: savedFile, fileNotifications });
    sendDesktopUpdates(state, fileNotifications);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/return-correction", requireAuth, requireRole("Admin", "Manager", "Staff Manager"), async (req, res, next) => {
  try {
    const notificationBoundary = Date.now();
    const state = await returnFileForCorrection(req.params.id, req.body || {}, req.user.id, req.profile);
    const fileNotifications = notificationsForFileSince(state, req.params.id, notificationBoundary);
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

function notificationsForFileSince(state, fileId, boundary = 0) {
  const id = String(fileId || "");
  return (state.fileNotifications || [])
    .filter((notice) => {
      const noticeFileId = String(notice.fileId || notice.file_id || notice.relatedRecordId || notice.related_record_id || "");
      const createdAt = Number(notice.createdAt || 0) || Date.parse(notice.created_at || notice.at || "") || 0;
      return (!id || noticeFileId === id) && createdAt >= boundary;
    })
    .slice(0, 50);
}
