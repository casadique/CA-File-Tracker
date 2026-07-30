const crypto = require("crypto");
const { patchAppState, sortFilesNewestFirst } = require("./appStateService");

async function listFiles(state, options = {}) {
  return sortFilesForRequest(state.files || [], options);
}

function sortFilesForRequest(files, options = {}) {
  const sortField = String(options.sort || options.sortField || "").trim();
  const direction = String(options.direction || options.sortDirection || "desc").toLowerCase() === "asc" ? "asc" : "desc";
  const listView = String(options.listView || options.view || "").trim();
  let rows = [...files];
  if (listView === "completed") rows = rows.filter((file) => isCompletedFile(file) && !hasOpenCorrection(file));
  if (listView === "active") rows = rows.filter((file) => !isCompletedFile(file) || hasOpenCorrection(file));
  if (listView === "correctionRequired") rows = rows.filter(hasOpenCorrection);
  if (listView === "notChecked") rows = rows.filter((file) => isCompletedFile(file) && !hasOpenCorrection(file) && !file.checkedBy);
  if (sortField === "assigned_at") return sortFilesByDate(rows, fileAssignmentDateValue, direction, fileReceivedDateValue);
  if (sortField === "returned_for_correction_at") return sortFilesByDate(rows, fileCorrectionDateValue, direction, fileUpdatedTime);
  if (sortField === "file_received_date") return sortFilesByDate(rows, fileReceivedDateValue, direction, fileCreatedTime);
  if (sortField === "completed_date") return sortFilesByDate(rows, fileCompletionDateValue, direction, fileUpdatedTime);
  return sortFilesNewestFirst(rows);
}

function sortFilesByDate(files, dateGetter, direction = "desc", tieGetter = fileCreatedTime) {
  return [...files].sort((a, b) => {
    const leftDate = dateGetter(a);
    const rightDate = dateGetter(b);
    if (leftDate && rightDate && leftDate !== rightDate) return direction === "asc" ? leftDate - rightDate : rightDate - leftDate;
    if (leftDate && !rightDate) return -1;
    if (!leftDate && rightDate) return 1;
    const leftTie = tieGetter(a);
    const rightTie = tieGetter(b);
    if (leftTie !== rightTie) return direction === "asc" ? leftTie - rightTie : rightTie - leftTie;
    return direction === "asc"
      ? String(a.id || "").localeCompare(String(b.id || ""))
      : String(b.id || "").localeCompare(String(a.id || ""));
  });
}

function fileReceivedDateValue(file = {}) {
  return dateOrNumber(file.file_received_date || file.fileReceivedDate || file.receivedDate || file.received_on);
}

function fileCompletionDateValue(file = {}) {
  return dateOrNumber(file.completed_date || file.completionDate || file.completedDate || file.workCompletedDate || file.work_completed_date || file.completed_at || file.completedAt);
}

function fileAssignmentDateValue(file = {}) {
  return dateOrNumber(file.assigned_at || file.assignedAt || file.workAllotmentDate || file.work_allotment_date || file.reAssignedDate || file.re_assigned_date);
}

function fileCorrectionDateValue(file = {}) {
  const latest = latestCorrection(file);
  return dateOrNumber(latest?.returned_at || latest?.returnedAt || latest?.created_at || latest?.createdAt || file.returned_for_correction_at || file.returnedAt || file.returned_at || file.returnedDate);
}

function fileCreatedTime(file = {}) {
  return dateOrNumber(file.created_at || file.createdAt || file.updated_at || file.updatedAt || file.lastUpdatedDate);
}

function fileUpdatedTime(file = {}) {
  return dateOrNumber(file.updated_at || file.updatedAt || file.completed_at || file.completedAt || file.created_at || file.createdAt);
}

function dateOrNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (!value) return 0;
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function isCompletedFile(file = {}) {
  return Boolean(file.filed || file.stages?.Completed);
}

function hasOpenCorrection(file = {}) {
  const status = String(file.correctionStatus || file.correction_status || "").trim().toLowerCase();
  return Boolean(file.stages?.["Correction Required"])
    || ["correction required", "correction in progress", "resubmitted for checking", "returned again", "returned for correction"].includes(status);
}

function latestCorrection(file = {}) {
  const history = Array.isArray(file.correctionHistory) ? file.correctionHistory : [];
  return [...history].sort((a, b) => fileCorrectionRowTime(b) - fileCorrectionRowTime(a))[0] || null;
}

function fileCorrectionRowTime(row = {}) {
  return dateOrNumber(row.returned_at || row.returnedAt || row.created_at || row.createdAt || row.returnedDate);
}

async function upsertFile(file, userId, profile = {}) {
  return patchAppState((state) => {
    const now = Date.now();
    const isNew = !file.id || !(state.files || []).some((item) => item.id === file.id);
    const record = {
      ...file,
      id: file.id || crypto.randomUUID(),
      createdAt: file.createdAt || file.created_at || (isNew ? new Date(now).toISOString() : undefined),
      updatedAt: now,
    };
    const files = state.files || [];
    const index = files.findIndex((item) => item.id === record.id);
    const before = index >= 0 ? { ...files[index] } : null;
    if (index >= 0) {
      const merged = { ...files[index], ...record };
      if (!merged.createdAt) merged.createdAt = files[index].createdAt || files[index].created_at || new Date(now).toISOString();
      files[index] = merged;
    } else {
      files.push(record);
    }
    if (Array.isArray(record.correctionHistory) && record.correctionHistory.length) {
      state.correctionHistory = mergeById(state.correctionHistory || [], record.correctionHistory);
    }
    const savedRecord = index >= 0 ? files[index] : record;
    appendFileUpdateNotifications(state, before, savedRecord, profile, new Date(now));
    state.files = sortFilesNewestFirst(files);
    return state;
  }, userId);
}

async function returnFileForCorrection(fileId, payload, userId, profile) {
  return patchAppState((state) => {
    const files = state.files || [];
    const index = files.findIndex((file) => file.id === fileId);
    if (index < 0) {
      const error = new Error("File record not found.");
      error.status = 404;
      throw error;
    }
    const now = new Date();
    const file = files[index];
    const returnedTo = resolveFileAssignee(state, file);
    const correction = {
      id: crypto.randomUUID(),
      file_id: fileId,
      fileId,
      correction_reason: String(payload.correctionReason || payload.correctionRemarks || "").trim(),
      correctionReason: String(payload.correctionReason || payload.correctionRemarks || "").trim(),
      returned_by: profile?.id || userId,
      authReturnedById: userId,
      returnedById: profile?.id || userId,
      returnedByEmail: profile?.email || "",
      returned_by_name: profile?.name || "",
      returnedBy: profile?.name || "",
      returned_to: returnedTo.id || "",
      returnedToId: returnedTo.id || "",
      returnedToEmail: returnedTo.email || "",
      returned_to_name: returnedTo.name || file.assignedStaff || "",
      returnedTo: returnedTo.name || file.assignedStaff || "",
      returned_at: now.toISOString(),
      returnedAt: now.toISOString(),
      returnedDate: now.toISOString().slice(0, 10),
      status: "Returned for Correction",
      response: "",
      resubmitted_at: null,
      completed_at: null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };
    if (!correction.correctionReason) {
      const error = new Error("Correction reason is required.");
      error.status = 400;
      throw error;
    }
    const stages = { ...(file.stages || {}), "Correction Required": true, Completed: false };
    files[index] = {
      ...file,
      stages,
      filed: false,
      checkedBy: "",
      checkedDate: "",
      checkingRemarks: "",
      correctionRemarks: correction.correctionReason,
      returnedBy: correction.returnedBy,
      returnedById: correction.returnedById,
      returnedByEmail: correction.returnedByEmail,
      returnedTo: correction.returnedTo,
      returnedToId: correction.returnedToId,
      returnedToEmail: correction.returnedToEmail,
      returnedDate: correction.returnedDate,
      correctionStatus: correction.status,
      correctionHistory: [...(file.correctionHistory || []), correction],
      lastUpdatedDate: correction.returnedDate,
      updatedAt: now.getTime(),
    };
    state.correctionHistory = [...(state.correctionHistory || []), correction];
    state.fileNotifications = [
      ...(state.fileNotifications || []),
      {
        id: crypto.randomUUID(),
        fileId,
        fileName: file.name,
        changeType: "Returned for Correction",
        changeText: `Correction Reason: ${correction.correctionReason}`,
        changedBy: correction.returnedBy,
        changedByRole: profile?.role || "",
        targetUserId: correction.returnedToId,
        targetUserEmail: correction.returnedToEmail,
        targetUserName: correction.returnedTo,
        date: correction.returnedDate,
        time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        createdAt: now.getTime(),
        tone: "overdue",
      },
    ].slice(-500);
    state.auditLog = [
      ...(state.auditLog || []),
      {
        id: crypto.randomUUID(),
        action: "File returned for correction",
        details: {
          fileId,
          fileName: file.name,
          correctionReason: correction.correctionReason,
          returnedBy: correction.returnedBy,
          returnedTo: correction.returnedTo,
        },
        user: correction.returnedBy,
        role: profile?.role || "",
        at: now.toISOString(),
      },
    ].slice(-1000);
    state.files = sortFilesNewestFirst(files);
    return state;
  }, userId);
}

function resolveFileAssignee(state, file) {
  const users = state.users || [];
  return users.find((user) => user.id && user.id === file.assignedStaffId)
    || users.find((user) => user.email && user.email === file.assignedStaffEmail)
    || users.find((user) => String(user.name || "").toLowerCase() === String(file.assignedStaff || "").toLowerCase())
    || {};
}

function appendFileUpdateNotifications(state, before, after, profile = {}, now = new Date()) {
  const change = describeFileChange(before, after);
  if (!change) return;
  const recipients = notificationRecipients(state, after);
  if (!recipients.length) return;
  const existingKeys = new Set((state.fileNotifications || []).map((notice) => notice.dedupeKey).filter(Boolean));
  const date = now.toISOString().slice(0, 10);
  const time = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
  const notices = [];
  for (const recipient of recipients) {
    const dedupeKey = `${after.id}|${change.type}|${change.key}|${recipient.id || recipient.email || recipient.name}`;
    if (existingKeys.has(dedupeKey)) continue;
    existingKeys.add(dedupeKey);
    notices.push({
      id: crypto.randomUUID(),
      dedupeKey,
      fileId: after.id,
      fileName: after.name || "File",
      changeType: change.type,
      changeText: change.text,
      changedBy: profile?.name || "Team",
      changedByRole: profile?.role || "",
      targetUserId: recipient.id || "",
      targetUserEmail: recipient.email || "",
      targetUserName: recipient.name || "",
      recipientRole: recipient.role || "",
      date,
      time,
      createdAt: now.getTime(),
      created_at: now.toISOString(),
      tone: change.tone,
    });
  }
  if (notices.length) state.fileNotifications = [...(state.fileNotifications || []), ...notices].slice(-800);
}

function describeFileChange(before, after) {
  if (!before) {
    if (hasAssignedStaffValue(after.assignedStaff)) {
      return { type: "File Allotted", text: `${after.name || "File"} was allotted to ${after.assignedStaff}.`, key: `new-assigned-${after.assignedStaff || ""}`, tone: "approval" };
    }
    return { type: "New File Added", text: `${after.name || "File"} was added.`, key: "new", tone: "progress" };
  }
  if (!sameText(before.assignedStaff, after.assignedStaff)) return { type: "Allotment Changed", text: `${after.name || "File"} was allotted to ${after.assignedStaff || "Not Assigned"}.`, key: `assigned-${after.assignedStaff || ""}`, tone: "approval" };
  if (!sameText(before.dueDate, after.dueDate)) return { type: "Due Date Changed", text: `${after.name || "File"} due date changed to ${displayDate(after.dueDate)}.`, key: `due-${after.dueDate || ""}`, tone: "pending" };
  if (!sameText(before.priority, after.priority)) return { type: "Priority Changed", text: `${after.name || "File"} priority changed to ${after.priority || "Normal"}.`, key: `priority-${after.priority || ""}`, tone: "overdue" };
  const beforeStatus = statusLabel(before);
  const afterStatus = statusLabel(after);
  if (beforeStatus !== afterStatus) return { type: "Status Updated", text: `${after.name || "File"} changed from ${beforeStatus} to ${afterStatus}.`, key: `status-${afterStatus}`, tone: afterStatus === "Completed" ? "filed" : "progress" };
  if (!before.billed && after.billed) return { type: "File Billed", text: `${after.name || "File"} was marked as billed.`, key: "billed", tone: "filed" };
  if (!before.feeReceived && after.feeReceived) return { type: "Payment Received", text: `Payment was received for ${after.name || "File"}.`, key: `fee-${after.feeReceivedDate || after.receivedOn || ""}`, tone: "filed" };
  if (!sameText(before.remarks, after.remarks)) return { type: "Remarks Updated", text: `Important remarks were updated for ${after.name || "File"}.`, key: `remarks-${after.updatedAt || ""}`, tone: "progress" };
  return null;
}

function notificationRecipients(state, file) {
  const users = state.users || [];
  const recipients = users.filter((user) => ["Admin", "Manager"].includes(user.role));
  const assignee = resolveFileAssignee(state, file);
  if (assignee?.id || assignee?.email || assignee?.name) recipients.push(assignee);
  const map = new Map();
  recipients.forEach((user) => {
    if (!user) return;
    const key = String(user.id || user.email || user.name || "").toLowerCase();
    if (key) map.set(key, user);
  });
  return [...map.values()];
}

function statusLabel(file = {}) {
  const stages = file.stages || {};
  if (stages["Correction Required"]) return "Correction Required";
  if (file.feeReceived) return "Received";
  if (file.filed || stages.Completed) return "Completed";
  if (file.billed || stages.Billed) return "Billed";
  if (stages.WIP) return "WIP";
  if (stages.Allotted || hasAssignedStaffValue(file.assignedStaff)) return "Allotted";
  return "Received";
}

function hasAssignedStaffValue(value) {
  const clean = String(value || "").trim().toLowerCase();
  return Boolean(clean && clean !== "not assigned");
}

function sameText(left, right) {
  return String(left || "").trim().toLowerCase() === String(right || "").trim().toLowerCase();
}

function displayDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[3]}-${iso[2]}-${iso[1]}`;
  return raw;
}

function mergeById(existingRows, incomingRows) {
  const map = new Map();
  [...existingRows, ...incomingRows].forEach((row) => {
    if (!row) return;
    const id = row.id || crypto.randomUUID();
    map.set(id, { ...(map.get(id) || {}), ...row, id });
  });
  return [...map.values()];
}

async function deleteFile(fileId, userId, profile = {}) {
  return patchAppState((state) => {
    const before = (state.files || []).find((file) => file.id === fileId);
    state.files = (state.files || []).filter((file) => file.id !== fileId);
    state.deletedFileIds = [...new Set([...(state.deletedFileIds || []), fileId])];
    if (before) {
      const now = new Date();
      const users = (state.users || []).filter((user) => ["Admin", "Manager"].includes(user.role));
      const existingKeys = new Set((state.fileNotifications || []).map((notice) => notice.dedupeKey).filter(Boolean));
      const notices = users.map((user) => {
        const dedupeKey = `${fileId}|File Deleted|${user.id || user.email || user.name}`;
        if (existingKeys.has(dedupeKey)) return null;
        existingKeys.add(dedupeKey);
        return {
          id: crypto.randomUUID(),
          dedupeKey,
          fileId,
          fileName: before.name || "File",
          changeType: "File Deleted",
          changeText: `${before.name || "File"} was deleted.`,
          changedBy: profile?.name || "Team",
          changedByRole: profile?.role || "",
          targetUserId: user.id || "",
          targetUserEmail: user.email || "",
          targetUserName: user.name || "",
          recipientRole: user.role || "",
          date: now.toISOString().slice(0, 10),
          time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }),
          createdAt: now.getTime(),
          created_at: now.toISOString(),
          tone: "overdue",
        };
      }).filter(Boolean);
      state.fileNotifications = [...(state.fileNotifications || []), ...notices].slice(-800);
    }
    return state;
  }, userId);
}

module.exports = { listFiles, upsertFile, returnFileForCorrection, deleteFile, sortFilesForRequest };
