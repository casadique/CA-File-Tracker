const crypto = require("crypto");
const { patchAppState, sortFilesNewestFirst, normalizeFileNotifications } = require("./appStateService");

const WORKFLOW_STAGES = [
  "Received",
  "Allotted",
  "WIP",
  "Work Done",
  "On Hold",
  "Client Pending",
  "Approval Pending",
  "Approved",
  "Completed",
  "Correction Required",
  "Corrected & Completed",
  "Billed",
  "Removed",
];

async function listFiles(state, options = {}) {
  return sortFilesForRequest(state.files || [], options);
}

function sortFilesForRequest(files, options = {}) {
  const sortField = String(options.sort || options.sortField || "").trim();
  const direction = String(options.direction || options.sortDirection || "desc").toLowerCase() === "asc" ? "asc" : "desc";
  const listView = String(options.listView || options.view || "").trim();
  let rows = [...files];
  if (listView === "removed") rows = rows.filter(isRemovedFile);
  else rows = rows.filter((file) => !isRemovedFile(file));
  if (listView === "completed") rows = rows.filter((file) => isCompletedFile(file) && !hasOpenCorrection(file) && !(isCorrectedCompleted(file) && !isCheckedFile(file)));
  if (listView === "active") rows = rows.filter((file) => !isCompletedFile(file) || hasOpenCorrection(file));
  if (listView === "correctionRequired") rows = rows.filter(hasOpenCorrection);
  if (listView === "notChecked") rows = rows.filter((file) => isCompletedFile(file) && !hasOpenCorrection(file) && !file.checkedBy);
  if (listView === "feeReceived") rows = rows.filter((file) => file.feeReceived);
  if (sortField === "assigned_at") return sortFilesByDate(rows, fileAssignmentDateValue, direction, fileReceivedDateValue);
  if (sortField === "returned_for_correction_at") return sortFilesByDate(rows, fileCorrectionDateValue, direction, fileCreatedTime);
  if (sortField === "file_received_date") return sortFilesByDate(rows, fileReceivedDateValue, direction, fileCreatedTime);
  if (sortField === "completed_date") return [...rows].sort((a, b) => direction === "asc" ? sortCompletedFilesAsc(a, b) : sortCompletedFilesDesc(a, b));
  if (sortField === "fee_received_at") return [...rows].sort((a, b) => direction === "asc" ? sortFeeReceivedAsc(a, b) : sortFeeReceivedDesc(a, b));
  if (listView === "completed") return [...rows].sort(sortCompletedFilesDesc);
  if (listView === "feeReceived") return [...rows].sort(sortFeeReceivedDesc);
  if (listView === "removed") return sortFilesByDate(rows, removedTime, "desc", fileCreatedTime);
  return sortFilesNewestFirst(rows);
}

function isRemovedFile(file = {}) {
  return Boolean(file.is_removed || file.isRemoved)
    || String(file.status || file.workflowStatus || "").trim().toLowerCase() === "removed"
    || Boolean(file.stages?.Removed);
}

function removedTime(file = {}) {
  return dateOrNumber(file.removed_at || file.removedAt || file.removal_checked_at || file.removalCheckedAt);
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
  return completionTime(file);
}

function fileAssignmentDateValue(file = {}) {
  return dateOrNumber(file.task_activity_at || file.taskActivityAt || file.managerUpdatedAt || file.manager_updated_at || file.reAssignedDate || file.re_assigned_date || file.reassigned_at || file.assigned_at || file.assignedAt || file.workAllotmentDate || file.work_allotment_date);
}

function fileCorrectionDateValue(file = {}) {
  const latest = latestCorrection(file);
  return dateOrNumber(latest?.returned_at || latest?.returnedAt || latest?.created_at || latest?.createdAt || file.returned_for_correction_at || file.returnedAt || file.returned_at || file.returnedDate);
}

function fileCreatedTime(file = {}) {
  return dateOrNumber(file.created_at || file.createdAt || file.updated_at || file.updatedAt || file.lastUpdatedDate);
}

function feeReceivedTime(file = {}) {
  return dateOrNumber(file.fee_received_at || file.feeReceivedAt || file.received_at || file.receivedAt);
}

function completionTime(file = {}) {
  return dateOrNumber(file.completed_at || file.completedAt || file.final_completed_at || file.finalCompletedAt)
    || dateOrNumber(file.completed_date || file.completionDate || file.completedDate || file.workCompletedDate || file.work_completed_date);
}

function checkedTime(file = {}) {
  return dateOrNumber(file.checked_at || file.checkedAt || file.checked_date || file.checkedDate);
}

function stableFileIdSortDesc(a = {}, b = {}) {
  const left = a.id ?? "";
  const right = b.id ?? "";
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && leftNumber !== rightNumber) return rightNumber - leftNumber;
  return String(right).localeCompare(String(left));
}

function sortFeeReceivedDesc(a = {}, b = {}) {
  const leftTime = feeReceivedTime(a);
  const rightTime = feeReceivedTime(b);
  if (rightTime && leftTime && rightTime !== leftTime) return rightTime - leftTime;
  if (rightTime && !leftTime) return 1;
  if (!rightTime && leftTime) return -1;
  const idSort = stableFileIdSortDesc(a, b);
  if (idSort) return idSort;
  return fileCreatedTime(b) - fileCreatedTime(a);
}

function sortFeeReceivedAsc(a = {}, b = {}) {
  return -sortFeeReceivedDesc(a, b);
}

function sortCompletedFilesDesc(a = {}, b = {}) {
  const leftTime = completionTime(a);
  const rightTime = completionTime(b);
  if (rightTime && leftTime && rightTime !== leftTime) return rightTime - leftTime;
  if (rightTime && !leftTime) return 1;
  if (!rightTime && leftTime) return -1;
  const checked = checkedTime(b) - checkedTime(a);
  if (checked) return checked;
  return stableFileIdSortDesc(a, b);
}

function sortCompletedFilesAsc(a = {}, b = {}) {
  return -sortCompletedFilesDesc(a, b);
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
  if (isCorrectedCompleted(file)) return false;
  return Boolean(file.stages?.["Correction Required"])
    || ["correction required", "correction in progress", "returned again", "returned for correction"].includes(status);
}

function isCorrectedCompleted(file = {}) {
  const status = String(file.correctionStatus || file.correction_status || "").trim().toLowerCase();
  return Boolean(file.stages?.["Corrected & Completed"] || file.stages?.corrected_completed)
    || ["corrected & completed", "corrected and completed", "corrected_completed", "resubmitted for checking"].includes(status);
}

function isCheckedFile(file = {}) {
  return Boolean(file.checkedBy || file.checkedDate);
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
    if ((!before || !isRemovedFile(before)) && isRemovedFile(record)) {
      throw httpError("Use the Remove action to move a file to Removed Files.", 400);
    }
    if (before && isRemovedFile(before) && !isRemovedFile(record)) {
      throw httpError("Use Take Back to restore a removed file.", 400);
    }
    preserveCheckingDetailsForGeneralSave(record, before);
    validateReassignmentTarget(before, file);
    const nowIso = new Date(now).toISOString();
    applyFeeReceivedTimestamp(record, before, nowIso);
    applyCompletionTimestamps(record, before, nowIso);
    const taskActivityAt = shouldBumpTaskActivity(before, record, profile)
      ? new Date(now).toISOString()
      : (before?.taskActivityAt || before?.task_activity_at || record.taskActivityAt || record.task_activity_at || record.assignedAt || record.assigned_at || record.workAllotmentDate || record.reAssignedDate || "");
    record.taskActivityAt = taskActivityAt;
    record.task_activity_at = taskActivityAt;
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

function assertRemovalPermission(profile = {}) {
  if (!["Admin", "Manager"].includes(String(profile?.role || "").trim())) {
    throw httpError("Only Admin or Manager can remove or restore files.", 403);
  }
}

function activeWorkflowStatus(file = {}) {
  const explicit = String(file.workflowStatus || file.status || "").trim();
  if (explicit && explicit.toLowerCase() !== "removed") return explicit;
  return WORKFLOW_STAGES.filter((stage) => !["Billed", "Removed"].includes(stage) && file.stages?.[stage]).pop() || "Received";
}

async function removeFile(fileId, payload, userId, profile = {}) {
  return patchAppState((state) => {
    assertRemovalPermission(profile);
    const files = state.files || [];
    let index = files.findIndex((file) => file.id === fileId);
    if (index < 0 && payload.file && payload.file.id === fileId) {
      files.push({ ...payload.file, id: fileId });
      index = files.length - 1;
    }
    if (index < 0) throw httpError("File record not found.", 404);
    if (isRemovedFile(files[index])) throw httpError("This file is already in Removed Files.", 409);
    const removalReason = String(payload.removalReason || payload.removal_reason || "").trim();
    if (!removalReason) throw httpError("Removal reason is required.", 400);

    const before = { ...files[index] };
    const now = new Date();
    const nowIso = now.toISOString();
    const date = nowIso.slice(0, 10);
    const actorId = profile?.id || profile?.auth_user_id || userId || "";
    const actorName = String(profile?.name || "").trim() || "Admin";
    const previousAssignee = currentFileAssignee(before);
    const removalEvent = {
      id: crypto.randomUUID(),
      fileId,
      file_id: fileId,
      action: "Removed",
      removedAt: nowIso,
      removed_at: nowIso,
      removedBy: actorName,
      removed_by: actorName,
      removedByUserId: actorId,
      removed_by_user_id: actorId,
      removalReason,
      removal_reason: removalReason,
      previousStatus: activeWorkflowStatus(before),
      previous_status: activeWorkflowStatus(before),
      previousAssignedStaff: previousAssignee.name || "Not Assigned",
      previous_assigned_staff_id: previousAssignee.id || "",
      previousChecking: {
        checkedBy: before.checkedBy || "",
        checkedDate: before.checkedDate || "",
        checkedAt: before.checkedAt || before.checked_at || "",
        checkingRemarks: before.checkingRemarks || "",
        completionDate: before.completionDate || "",
        completedAt: before.completedAt || before.completed_at || "",
      },
    };
    files[index] = {
      ...before,
      status: "Removed",
      workflowStatus: "Removed",
      stages: { ...(before.stages || {}), Removed: true },
      is_removed: true,
      isRemoved: true,
      removed_at: nowIso,
      removedAt: nowIso,
      removed_by_user_id: actorId,
      removedByUserId: actorId,
      removedBy: actorName,
      removal_reason: removalReason,
      removalReason,
      previous_status: removalEvent.previousStatus,
      previousStatus: removalEvent.previousStatus,
      previous_assigned_staff_id: previousAssignee.id || "",
      previousAssignedStaffId: previousAssignee.id || "",
      previousAssignedStaff: previousAssignee.name || "Not Assigned",
      removal_checked_at: nowIso,
      removalCheckedAt: nowIso,
      completedAt: nowIso,
      completed_at: nowIso,
      completionDate: date,
      checkedBy: actorName,
      checkedDate: date,
      checkedAt: nowIso,
      checked_at: nowIso,
      removalHistory: [...(before.removalHistory || []), removalEvent],
      lastUpdatedDate: date,
      updatedAt: now.getTime(),
    };
    state.auditLog = [...(state.auditLog || []), {
      id: crypto.randomUUID(),
      action: "File moved to Removed Files",
      details: { fileId, fileName: before.name, removalReason, previousStatus: removalEvent.previousStatus, previousAssignedStaff: removalEvent.previousAssignedStaff },
      user: actorName,
      role: profile?.role || "",
      at: nowIso,
    }].slice(-1000);
    state.files = sortFilesNewestFirst(files);
    return state;
  }, userId);
}

async function restoreRemovedFile(fileId, userId, profile = {}) {
  return patchAppState((state) => {
    assertRemovalPermission(profile);
    const files = state.files || [];
    const index = files.findIndex((file) => file.id === fileId);
    if (index < 0) throw httpError("File record not found.", 404);
    const before = files[index];
    if (!isRemovedFile(before)) throw httpError("This file has already been restored.", 409);
    const now = new Date();
    const nowIso = now.toISOString();
    const date = nowIso.slice(0, 10);
    const actorId = profile?.id || profile?.auth_user_id || userId || "";
    const actorName = String(profile?.name || "").trim() || "Admin";
    const history = [...(before.removalHistory || []), {
      id: crypto.randomUUID(),
      fileId,
      file_id: fileId,
      action: "Restored",
      restoredAt: nowIso,
      restored_at: nowIso,
      restoredBy: actorName,
      restored_by: actorName,
      restoredByUserId: actorId,
      restored_by_user_id: actorId,
    }];
    files[index] = {
      ...before,
      status: "Not Assigned",
      workflowStatus: "Not Assigned",
      stages: { ...Object.fromEntries(WORKFLOW_STAGES.map((stage) => [stage, false])), Received: true },
      is_removed: false,
      isRemoved: false,
      assignedStaff: "Not Assigned",
      assignedStaffId: "",
      assignedStaffEmail: "",
      currentAssignedStaff: "Not Assigned",
      current_assigned_to: "Not Assigned",
      reAssignedStaff: "",
      reAssignedStaffId: "",
      reAssignedStaffEmail: "",
      restored_at: nowIso,
      restoredAt: nowIso,
      restored_by_user_id: actorId,
      restoredByUserId: actorId,
      restoredBy: actorName,
      workDone: false,
      shared: false,
      reportPrepared: false,
      approved: false,
      filed: false,
      checkedBy: "",
      checkedDate: "",
      checkedAt: "",
      checked_at: "",
      checkingRemarks: "",
      completionDate: "",
      completedAt: "",
      completed_at: "",
      removalHistory: history,
      lastUpdatedDate: date,
      updatedAt: now.getTime(),
    };
    state.auditLog = [...(state.auditLog || []), {
      id: crypto.randomUUID(),
      action: "Removed file restored",
      details: { fileId, fileName: before.name, restoredAs: "Not Assigned" },
      user: actorName,
      role: profile?.role || "",
      at: nowIso,
    }].slice(-1000);
    state.files = sortFilesNewestFirst(files);
    return state;
  }, userId);
}

function preserveCheckingDetailsForGeneralSave(record, before = null) {
  ["checkedBy", "checkedDate", "checkedAt", "checked_at", "finalCompletedAt", "final_completed_at", "checkingRemarks"]
    .forEach((field) => { record[field] = before?.[field] || ""; });
}

async function markFileChecked(fileId, payload, userId, profile = {}) {
  return patchAppState((state) => {
    const files = state.files || [];
    const index = files.findIndex((file) => file.id === fileId);
    if (index < 0) throw httpError("File record not found.", 404);
    assertCheckingPermission(profile);
    const before = { ...files[index] };
    if (!isCompletedFile(before) || hasOpenCorrection(before) || isCheckedFile(before)) {
      throw httpError("This file is not pending checking.", 400);
    }
    if (fileWasCompletedBy(before, profile)) {
      throw httpError("You cannot check a file completed by yourself. This file must be checked by another authorised user.", 403);
    }
    const checkingRemarks = String(payload?.checkingRemarks || "").trim();
    if (!/[a-z0-9]{2,}/i.test(checkingRemarks)) {
      throw httpError("Please enter a valid Checking Remark containing at least two characters before marking this file as Checked.", 400);
    }
    const checkedAt = new Date().toISOString();
    const completedAt = reliableCompletionTimestamp(before);
    if (completedAt && Date.parse(checkedAt) < Date.parse(completedAt)) {
      throw httpError("Checked date and time cannot be earlier than Work Completed date and time.", 400);
    }
    const checkedBy = String(profile?.name || "").trim();
    if (!checkedBy) throw httpError("Checker profile name is unavailable.", 400);
    const checkedDate = checkedAt.slice(0, 10);
    const after = {
      ...before,
      checkedBy,
      checkedDate,
      checkedAt,
      checked_at: checkedAt,
      finalCompletedAt: before.finalCompletedAt || before.final_completed_at || checkedAt,
      final_completed_at: before.final_completed_at || before.finalCompletedAt || checkedAt,
      checkingRemarks,
      lastUpdatedDate: checkedDate,
      updatedAt: Date.now(),
      taskActivityAt: checkedAt,
      task_activity_at: checkedAt,
    };
    files[index] = after;
    appendFileUpdateNotifications(state, before, after, profile, new Date(checkedAt));
    state.auditLog = [...(state.auditLog || []), {
      id: crypto.randomUUID(),
      action: "File marked Checked",
      details: { fileId, fileName: after.name, checkedBy, checkedDate, checkedAt, checkingRemarks },
      user: checkedBy,
      role: profile?.role || "",
      at: checkedAt,
    }].slice(-1000);
    state.files = sortFilesNewestFirst(files);
    return state;
  }, userId);
}

function reliableCompletionTimestamp(file = {}) {
  const value = file.completed_at || file.completedAt || file.work_completed_at || file.workCompletedAt || "";
  if (!value || /^\d{4}-\d{2}-\d{2}$/.test(String(value))) return "";
  return Number.isFinite(Date.parse(value)) ? value : "";
}

function assertCheckingPermission(profile = {}) {
  const role = String(profile?.role || "").trim();
  const authorisedStaff = new Set(["nisha", "rizwana", "althaf"]);
  if (["Admin", "Manager", "Staff Manager"].includes(role)) return;
  if (role === "Staff" && authorisedStaff.has(normalizeStaffIdentity(profile?.name))) return;
  throw httpError("Only authorised checkers can check completed files.", 403);
}

function fileWasCompletedBy(file = {}, profile = {}) {
  const checker = [profile.id, profile.auth_user_id, profile.email, profile.name].filter(Boolean);
  const workers = [file.completedById, file.completedByEmail, file.completedBy, file.workDoneById, file.workDoneByEmail, file.workDoneBy].filter(Boolean);
  return checker.some((identity) => workers.some((worker) => exactIdentity(identity, worker) || sameStaffIdentity(identity, worker)));
}

function httpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function validateReassignmentTarget(before = null, incoming = {}) {
  if (!before || !hasAssignedStaffValue(incoming.reAssignedStaff)) return;
  const current = currentFileAssignee(before);
  const requested = {
    name: incoming.reAssignedStaff || "",
    id: incoming.reAssignedStaffId || incoming.re_assigned_staff_id || "",
    email: incoming.reAssignedStaffEmail || incoming.re_assigned_staff_email || "",
  };
  if (!assigneeMatches(current, requested)) return;

  const existingReassignment = {
    name: before.reAssignedStaff || "",
    id: before.reAssignedStaffId || before.re_assigned_staff_id || "",
    email: before.reAssignedStaffEmail || before.re_assigned_staff_email || "",
  };
  const isExistingCurrentReassignment = hasAssignedStaffValue(existingReassignment.name)
    && assigneeMatches(existingReassignment, requested)
    && sameText(before.reAssignedDate || before.reassigned_at, incoming.reAssignedDate || incoming.reassigned_at)
    && sameText(before.reassignedBy || before.reassigned_by, incoming.reassignedBy || incoming.reassigned_by);
  if (isExistingCurrentReassignment) return;

  const error = new Error("This file is already assigned to this staff member. Please select a different staff member.");
  error.status = 400;
  throw error;
}

function assigneeMatches(left = {}, right = {}) {
  return (hasAssignedStaffValue(left.name) && hasAssignedStaffValue(right.name) && sameStaffIdentity(left.name, right.name))
    || exactIdentity(left.id, right.id)
    || exactIdentity(left.email, right.email);
}

function sameStaffIdentity(left, right) {
  return normalizeStaffIdentity(left) === normalizeStaffIdentity(right);
}

function normalizeStaffIdentity(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function exactIdentity(left, right) {
  const cleanLeft = String(left || "").trim().toLowerCase();
  const cleanRight = String(right || "").trim().toLowerCase();
  return Boolean(cleanLeft && cleanRight && cleanLeft === cleanRight);
}

function applyFeeReceivedTimestamp(record = {}, before = {}, fallbackIso = new Date().toISOString()) {
  if (!record.feeReceived) {
    record.feeReceivedAt = "";
    record.fee_received_at = "";
    record.receivedAt = "";
    record.received_at = "";
    return record;
  }
  const existingTimestamp = before?.feeReceivedAt || before?.fee_received_at || before?.receivedAt || before?.received_at || "";
  const incomingTimestamp = record.feeReceivedAt || record.fee_received_at || record.receivedAt || record.received_at || "";
  const becameReceived = !before?.feeReceived;
  const receivedTimestamp = incomingTimestamp || existingTimestamp || (becameReceived ? fallbackIso : "");
  record.feeReceivedAt = receivedTimestamp;
  record.fee_received_at = receivedTimestamp;
  record.receivedAt = receivedTimestamp;
  record.received_at = receivedTimestamp;
  return record;
}

function applyCompletionTimestamps(record = {}, before = {}, fallbackIso = new Date().toISOString()) {
  const isCompleted = Boolean(record.filed || record.stages?.Completed);
  const wasCompleted = Boolean(before?.filed || before?.stages?.Completed);
  const existingCompletedAt = before?.completed_at || before?.completedAt || record.completed_at || record.completedAt || "";
  const completedAt = isCompleted
    ? (existingCompletedAt || (!wasCompleted ? fallbackIso : ""))
    : existingCompletedAt;
  if (completedAt) {
    record.completed_at = completedAt;
    record.completedAt = completedAt;
  }

  const existingCheckedAt = before?.checked_at || before?.checkedAt || record.checked_at || record.checkedAt || "";
  const hasChecking = Boolean(record.checkedBy || record.checkedDate);
  const hadChecking = Boolean(before?.checkedBy || before?.checkedDate);
  const checkedAt = hasChecking
    ? (existingCheckedAt || (!hadChecking ? fallbackIso : ""))
    : "";
  record.checked_at = checkedAt;
  record.checkedAt = checkedAt;

  if (hasChecking) {
    const existingFinalAt = before?.final_completed_at || before?.finalCompletedAt || record.final_completed_at || record.finalCompletedAt || "";
    const finalCompletedAt = existingFinalAt || checkedAt || fallbackIso;
    record.final_completed_at = finalCompletedAt;
    record.finalCompletedAt = finalCompletedAt;
  }
  return record;
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
    const stages = { ...(file.stages || {}), "Correction Required": true, "Corrected & Completed": false, Completed: false };
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
      taskActivityAt: now.toISOString(),
      task_activity_at: now.toISOString(),
    };
    state.correctionHistory = [...(state.correctionHistory || []), correction];
    const correctionEventId = `${fileId}|returned-for-correction|${correction.id || correction.returned_at || correction.returnedAt || correction.returnedDate || now.toISOString()}`;
    appendUniqueFileNotifications(state, [{
      id: crypto.randomUUID(),
      dedupeKey: `${correction.returnedToId || correction.returnedToEmail || correction.returnedTo}|Returned for Correction|${fileId}|${correctionEventId}`,
      fileId,
      related_record_id: fileId,
      event_id: correctionEventId,
      notification_type: "Returned for Correction",
      user_id: correction.returnedToId || correction.returnedToEmail || correction.returnedTo || "",
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
      created_at: now.toISOString(),
      tone: "overdue",
    }], 500);
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
  const assignee = currentFileAssignee(file);
  return users.find((user) => user.id && user.id === assignee.id)
    || users.find((user) => user.email && user.email === assignee.email)
    || users.find((user) => String(user.name || "").toLowerCase() === String(assignee.name || "").toLowerCase())
    || {};
}

function currentFileAssignee(file = {}) {
  if (hasAssignedStaffValue(file.reAssignedStaff) || file.reAssignedStaffId || file.reAssignedStaffEmail) {
    return {
      name: file.reAssignedStaff || "",
      id: file.reAssignedStaffId || "",
      email: file.reAssignedStaffEmail || "",
    };
  }
  return {
    name: file.assignedStaff || "",
    id: file.assignedStaffId || "",
    email: file.assignedStaffEmail || "",
  };
}

function appendFileUpdateNotifications(state, before, after, profile = {}, now = new Date()) {
  const change = describeFileChange(before, after);
  if (!change) return;
  const recipients = change.type === "File Checked" ? checkedNotificationRecipients(state, after) : notificationRecipients(state, after);
  if (!recipients.length) return;
  const existingKeys = new Set((state.fileNotifications || []).map((notice) => notice.dedupeKey).filter(Boolean));
  const date = now.toISOString().slice(0, 10);
  const time = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
  const notices = [];
  for (const recipient of recipients) {
    const changeEventId = `${change.key}|${after.updatedAt || after.updated_at || after.taskActivityAt || after.task_activity_at || after.lastUpdatedDate || now.toISOString()}`;
    const recipientId = recipient.id || recipient.email || recipient.name || "";
    const dedupeKey = `${recipientId}|${change.type}|${after.id}|${changeEventId}`;
    if (existingKeys.has(dedupeKey)) continue;
    existingKeys.add(dedupeKey);
    notices.push({
      id: crypto.randomUUID(),
      dedupeKey,
      fileId: after.id,
      related_record_id: after.id,
      event_id: changeEventId,
      notification_type: change.type,
      user_id: recipientId,
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
  if (notices.length) appendUniqueFileNotifications(state, notices);
}

function appendUniqueFileNotifications(state, notices = [], limit = 800) {
  state.fileNotifications = normalizeFileNotifications([...(state.fileNotifications || []), ...(notices || [])]).slice(0, limit);
}

function describeFileChange(before, after) {
  if (!before) {
    const assignee = currentFileAssignee(after);
    if (hasAssignedStaffValue(assignee.name)) {
      return { type: "File Allotted", text: `${after.name || "File"} was allotted to ${assignee.name}.`, key: `new-assigned-${assignee.name || ""}`, tone: "approval" };
    }
    return { type: "New File Added", text: `${after.name || "File"} was added.`, key: "new", tone: "progress" };
  }
  const beforeAssignee = currentFileAssignee(before);
  const afterAssignee = currentFileAssignee(after);
  if (!sameText(beforeAssignee.name, afterAssignee.name) || !sameText(beforeAssignee.id, afterAssignee.id) || !sameText(beforeAssignee.email, afterAssignee.email)) {
    const isReassigned = hasAssignedStaffValue(after.reAssignedStaff);
    return {
      type: isReassigned ? "File Reassigned" : "Allotment Changed",
      text: isReassigned
        ? `${after.name || "File"} was reassigned from ${beforeAssignee.name || "Not Assigned"} to ${afterAssignee.name || "Not Assigned"}.`
        : `${after.name || "File"} was allotted to ${afterAssignee.name || "Not Assigned"}.`,
      key: `${isReassigned ? "reassigned" : "assigned"}-${afterAssignee.name || ""}-${after.reAssignedDate || after.reassigned_at || ""}`,
      tone: "approval",
    };
  }
  if (!sameText(before.dueDate, after.dueDate)) return { type: "Due Date Changed", text: `${after.name || "File"} due date changed to ${displayDate(after.dueDate)}.`, key: `due-${after.dueDate || ""}`, tone: "pending" };
  if (!sameText(before.priority, after.priority)) return { type: "Priority Changed", text: `${after.name || "File"} priority changed to ${after.priority || "Normal"}.`, key: `priority-${after.priority || ""}`, tone: "overdue" };
  if (checkingLabel(before) !== "Checked" && checkingLabel(after) === "Checked") {
    const fy = after.fy || after.financialYear || after.financial_year || "";
    const fyText = fy ? `, FY ${fy}` : "";
    return {
      type: "File Checked",
      text: `${after.name || "File"} (${after.serviceType || "Service"}${fyText}) checked by ${after.checkedBy || "Team"} on ${displayDate(after.checkedDate)}.`,
      key: `checked-${after.checkedDate || ""}-${after.checkedBy || ""}`,
      tone: "filed",
    };
  }
  const beforeStatus = statusLabel(before);
  const afterStatus = statusLabel(after);
  if (beforeStatus !== afterStatus) return { type: "Status Updated", text: `${after.name || "File"} changed from ${beforeStatus} to ${afterStatus}.`, key: `status-${afterStatus}`, tone: afterStatus === "Completed" ? "filed" : "progress" };
  if (!before.billed && after.billed) return { type: "File Billed", text: `${after.name || "File"} was marked as billed.`, key: "billed", tone: "filed" };
  if (!before.feeReceived && after.feeReceived) return { type: "Payment Received", text: `Payment was received for ${after.name || "File"}.`, key: `fee-${after.feeReceivedDate || after.receivedOn || ""}`, tone: "filed" };
  if (!sameText(before.remarks, after.remarks)) return { type: "Remarks Updated", text: `Important remarks were updated for ${after.name || "File"}.`, key: `remarks-${after.updatedAt || ""}`, tone: "progress" };
  return null;
}

function checkingLabel(file = {}) {
  if (file.checkedBy || file.checkedDate) return "Checked";
  if (hasOpenCorrection(file)) return "Returned for Correction";
  if (isCompletedFile(file)) return "Not Checked";
  return "";
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

function checkedNotificationRecipients(state, file) {
  const users = state.users || [];
  const assignee = currentFileAssignee(file);
  const identities = [
    file.completedById,
    file.completedByEmail,
    file.completedBy,
    file.workDoneById,
    file.workDoneByEmail,
    file.workDoneBy,
    file.doneById,
    file.doneByEmail,
    file.doneBy,
    assignee.id,
    assignee.email,
    assignee.name,
  ];
  const map = new Map();
  identities.forEach((identity) => {
    const clean = String(identity || "").trim().toLowerCase();
    if (!clean || clean === "not assigned") return;
    const user = users.find((item) => sameText(item.id, identity))
      || users.find((item) => sameText(item.email, identity))
      || users.find((item) => sameText(item.name, identity));
    if (!user) return;
    const key = String(user.id || user.email || user.name || "").toLowerCase();
    if (key) map.set(key, user);
  });
  return [...map.values()];
}

function shouldBumpTaskActivity(before, after, profile = {}) {
  if (!before) return hasAssignedStaffValue(currentFileAssignee(after).name);
  const role = String(profile?.role || "").trim();
  const beforeAssignee = currentFileAssignee(before);
  const afterAssignee = currentFileAssignee(after);
  if (!sameText(beforeAssignee.name, afterAssignee.name) || !sameText(beforeAssignee.id, afterAssignee.id) || !sameText(beforeAssignee.email, afterAssignee.email)) return true;
  if (!["Admin", "Manager", "Staff Manager"].includes(role)) return false;
  if (statusLabel(before) !== statusLabel(after)) return true;
  if (checkingLabel(before) !== checkingLabel(after)) return true;
  return false;
}

function statusLabel(file = {}) {
  const stages = file.stages || {};
  if (stages["Correction Required"]) return "Correction Required";
  if (isCorrectedCompleted(file) && !isCheckedFile(file)) return "Corrected & Completed";
  if (file.feeReceived) return "Received";
  if (file.filed || stages.Completed) return "Completed";
  if (file.billed || stages.Billed) return "Billed";
  for (let index = WORKFLOW_STAGES.length - 1; index >= 0; index -= 1) {
    const stage = WORKFLOW_STAGES[index];
    if (!["Billed", "Completed", "Correction Required", "Corrected & Completed"].includes(stage) && stages[stage]) return stage;
  }
  if (stages.Allotted || hasAssignedStaffValue(currentFileAssignee(file).name)) return "Allotted";
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
          related_record_id: fileId,
          event_id: "file-deleted",
          notification_type: "File Deleted",
          user_id: user.id || user.email || user.name || "",
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
      appendUniqueFileNotifications(state, notices);
    }
    return state;
  }, userId);
}

module.exports = {
  listFiles,
  upsertFile,
  markFileChecked,
  returnFileForCorrection,
  removeFile,
  restoreRemovedFile,
  deleteFile,
  sortFilesForRequest,
};
