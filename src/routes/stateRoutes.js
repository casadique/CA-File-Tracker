const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const { getAppStateRecord, getAppStateWithoutFilesRecord, saveAppState, saveAppStateIfCurrent, assertSafeStateReplacement } = require("../services/appStateService");
const { visibleChatMessages } = require("../services/chatService");
const { resetAllFileData } = require("../services/fileDataResetService");
const { calculateDashboardCounts } = require("../services/fileViewRules");
const { restoreClients } = require("../services/clientService");
const { visibleTodoTasks } = require("../services/todoService");
const { mergeStaffDetailsImport } = require("../services/staffDetailsService");
const { activeNotificationRows } = require("../services/notificationRetentionService");
const { createCompleteBackup } = require("../services/completeBackupService");
const { restoreCompleteBackup, mergeState } = require("../services/completeRestoreService");
const { fileRelationalParity } = require("../services/fileRecordService");

const router = express.Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const excludeFiles = ["1", "true", "yes"].includes(String(req.query.excludeFiles || "").toLowerCase());
    const record = excludeFiles ? await getAppStateWithoutFilesRecord() : await getAppStateRecord();
    const visibleState = stateForProfile(record.state, req.profile, req.user.id);
    res.json({
      state: visibleState,
      dashboardCounts: !excludeFiles && ["Admin", "Manager"].includes(req.profile?.role)
        ? calculateDashboardCounts(record.state.files || [])
        : null,
      updatedAt: record.updatedAt,
      profile: req.profile,
      filesExcluded: excludeFiles,
      notificationsExcluded: excludeFiles,
      deferredHistoryExcluded: excludeFiles,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/version", requireAuth, async (_req, res, next) => {
  try {
    const record = await getAppStateRecord();
    res.json({ ok: true, updatedAt: record.updatedAt, updatedBy: record.updatedBy });
  } catch (error) {
    next(error);
  }
});

router.put("/", requireAuth, requireRole("Admin"), async (req, res, next) => {
  try {
    const record = await getAppStateRecord();
    const incoming = req.body.state || {};
    assertSafeStateReplacement(record.state, incoming);
    const saved = await saveAppStateIfCurrent(incoming, req.user.id, req.body.expectedUpdatedAt);
    res.json({ ok: true, state: saved.state, updatedAt: saved.updatedAt });
  } catch (error) {
    next(error);
  }
});

router.post("/staff-details/import", requireAuth, requireRole("Admin"), async (req, res, next) => {
  try {
    let saved;
    let summary;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const record = await getAppStateRecord();
      const merged = mergeStaffDetailsImport(record.state, req.body.records, {
        id: req.user.id,
        name: req.profile?.name || req.profile?.email || "Admin",
        role: req.profile?.role || "Admin",
        source: String(req.body.source || ""),
      });
      try {
        saved = await saveAppStateIfCurrent(merged.state, req.user.id, record.updatedAt);
        summary = { created: merged.created, updated: merged.updated, rejected: merged.rejected };
        break;
      } catch (error) {
        if (error.status !== 409 || attempt === 2) throw error;
      }
    }
    res.json({
      ok: true,
      staffDetails: saved.state.staffDetails || [],
      auditLog: saved.state.auditLog || [],
      updatedAt: saved.updatedAt,
      ...summary,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/backup", requireAuth, requireRole("Admin", "Manager"), async (req, res, next) => {
  try {
    const payload = await createCompleteBackup(req.profile.name, { mode: req.query.mode });
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

router.get("/diagnostics", requireAuth, requireRole("Admin", "Manager"), async (_req, res, next) => {
  try {
    const record = await getAppStateRecord();
    const state = record.state;
    const relationalFiles = await fileRelationalParity(state.files || []);
    const assignmentCounts = {};
    for (const file of state.files || []) {
      const key = String(file.assignedStaffEmail || file.assignedStaff || "Not Assigned").trim() || "Not Assigned";
      assignmentCounts[key] = (assignmentCounts[key] || 0) + 1;
    }
    res.json({
      ok: true,
      files: state.files?.length || 0,
      users: state.users?.length || 0,
      notifications: state.fileNotifications?.length || 0,
      auditEvents: state.auditLog?.length || 0,
      assignmentCounts,
      relationalFiles,
      updatedAt: record.updatedAt,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/restore", requireAuth, requireRole("Admin"), async (req, res, next) => {
  try {
    if (req.body.backup?.version === "ca-file-tracker-complete-v3") {
      const result = await restoreCompleteBackup(req.body.backup, req.user.id);
      return res.json({ ok: true, ...result });
    }
    const incoming = req.body.state || req.body;
    const current = await getAppStateRecord({ bypassCache: true });
    const merged = mergeState(current.state, incoming);
    const saved = await saveAppStateIfCurrent(merged, req.user.id, current.updatedAt);
    const state = saved.state;
    const clientMaster = req.body.clientMaster || req.body.client_master || [];
    const clients = await restoreClients(clientMaster, req.user.id);
    res.json({ ok: true, state, clients });
  } catch (error) {
    next(error);
  }
});

router.post("/files/reset", requireAuth, requireRole("Admin"), async (req, res, next) => {
  try {
    const result = await resetAllFileData({
      confirmation: req.body.confirmation,
      userId: req.user.id,
      profile: req.profile,
    });
    res.json({ ok: true, ...result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

function stateForProfile(state, profile, userId) {
  const visibleState = {
    ...state,
    chatMessages: visibleChatMessages(state, profile, userId),
    correctionHistory: visibleCorrectionHistory(state, profile, userId),
    todoTasks: visibleTodoTasks(state, userId, profile),
  };
  visibleState.fileNotifications = activeNotificationRows(visibleState.fileNotifications || [], state);
  const visibleTodoIds = new Set((visibleState.todoTasks || []).map((task) => task.id));
  visibleState.todoActivity = (state.todoActivity || []).filter((row) => visibleTodoIds.has(row.task_id));
  const todoActorIds = new Set([userId, profile?.id].filter(Boolean).map(String));
  visibleState.todoReminderEvents = (state.todoReminderEvents || []).filter((row) => visibleTodoIds.has(row.task_id) && (profile?.role === "Admin" || todoActorIds.has(String(row.user_id || ""))));
  visibleState.fileNotifications = visibleState.fileNotifications.filter((notice) => notice.category !== "todo" || todoNotificationForUser(notice, profile, userId));
  // Embedded reset backups are for server-side recovery only. The browser does
  // not use them, and sending them added more than two megabytes to every Admin
  // login/refresh response.
  delete visibleState.fileDataBackups;
  return visibleState;
}

function todoNotificationForUser(notice, profile, userId) {
  const ids = [userId, profile?.id].filter(Boolean).map(String);
  const targetId = String(notice.targetUserAuthId || notice.targetUserId || "");
  const targetEmail = String(notice.targetUserEmail || "").trim().toLowerCase();
  return (targetId && ids.includes(targetId)) || (targetEmail && targetEmail === String(profile?.email || "").trim().toLowerCase());
}

function visibleCorrectionHistory(state, profile, userId) {
  if (["Admin", "Manager", "Staff Manager"].includes(profile?.role)) return state.correctionHistory || [];
  const user = resolveUser(state, profile, userId);
  return (state.correctionHistory || []).filter((row) =>
    sameUser(user, row.returnedById || row.returned_by, row.returnedByEmail, row.returnedBy)
    || sameUser(user, row.returnedToId || row.returned_to, row.returnedToEmail, row.returnedTo)
  );
}

function resolveUser(state, profile, userId) {
  return (state.users || []).find((user) => user.authUserId === userId || user.id === profile?.id || user.id === userId || user.email === profile?.email || user.name === profile?.name)
    || { id: profile?.id || userId, authUserId: userId, email: profile?.email || "", name: profile?.name || "" };
}

function sameUser(user, id, email, name) {
  return (id && [user.id, user.authUserId].includes(id))
    || (email && String(email).toLowerCase() === String(user.email || "").toLowerCase())
    || (name && String(name).trim().toLowerCase() === String(user.name || "").trim().toLowerCase());
}
