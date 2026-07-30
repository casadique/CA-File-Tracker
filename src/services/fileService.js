const crypto = require("crypto");
const { patchAppState, sortFilesNewestFirst } = require("./appStateService");

async function listFiles(state) {
  return sortFilesNewestFirst(state.files || []);
}

async function upsertFile(file, userId) {
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

function mergeById(existingRows, incomingRows) {
  const map = new Map();
  [...existingRows, ...incomingRows].forEach((row) => {
    if (!row) return;
    const id = row.id || crypto.randomUUID();
    map.set(id, { ...(map.get(id) || {}), ...row, id });
  });
  return [...map.values()];
}

async function deleteFile(fileId, userId) {
  return patchAppState((state) => {
    state.files = (state.files || []).filter((file) => file.id !== fileId);
    state.deletedFileIds = [...new Set([...(state.deletedFileIds || []), fileId])];
    return state;
  }, userId);
}

module.exports = { listFiles, upsertFile, returnFileForCorrection, deleteFile };
