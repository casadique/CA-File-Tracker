const crypto = require("crypto");
const { supabaseAdmin } = require("../config/supabase");
const { getAppStateRecord, saveAppStateIfCurrent } = require("./appStateService");

const RESET_CONFIRMATION = "DELETE ALL FILES";
const FILE_ARRAY_KEYS = [
  "files",
  "deletedFileIds",
  "correctionHistory",
  "fileActivities",
  "fileActivityHistory",
  "fileAssignments",
  "assignmentHistory",
  "reassignmentHistory",
  "fileCheckingRecords",
  "fileCorrectionRecords",
  "fileBillingLinks",
  "fileAttachments",
  "myTasks",
  "removedFiles",
];

async function resetAllFileData({ confirmation, userId, profile = {} }) {
  if (confirmation !== RESET_CONFIRMATION) {
    const error = new Error(`Type ${RESET_CONFIRMATION} exactly to continue.`);
    error.status = 400;
    throw error;
  }

  const record = await getAppStateRecord();
  const prepared = prepareFileDataReset(record.state, profile);
  await archiveFileDataBackup(prepared.archive, record.updatedAt);
  const saved = await saveAppStateIfCurrent(prepared.state, userId, record.updatedAt);
  return {
    backup: prepared.backup,
    summary: prepared.summary,
    updatedAt: saved.updatedAt,
  };
}

function prepareFileDataReset(sourceState = {}, profile = {}) {
  const state = structuredClone(sourceState || {});
  const files = Array.isArray(state.files) ? state.files : [];
  const fileIds = collectFileIds(state);
  const receiptIds = collectFeeReceiptIds(files);
  const linkedCollections = (state.otherCashCollections || []).filter((row) => isFileLinkedCollection(row, fileIds, receiptIds));
  const manualCollections = (state.otherCashCollections || []).filter((row) => !isFileLinkedCollection(row, fileIds, receiptIds));
  const fileNotifications = (state.fileNotifications || []).filter((row) => isFileRelatedNotification(row, fileIds));
  const retainedNotifications = (state.fileNotifications || []).filter((row) => !isFileRelatedNotification(row, fileIds));
  const fileAuditLog = (state.auditLog || []).filter((row) => isFileRelatedAudit(row, fileIds));
  const retainedAuditLog = (state.auditLog || []).filter((row) => !isFileRelatedAudit(row, fileIds));
  const now = new Date().toISOString();
  const archiveId = crypto.randomUUID();
  const backup = {
    app: "CA File Tracker",
    version: "file-data-backup-v1",
    backupId: archiveId,
    exportedAt: now,
    exportedBy: profile?.name || "Admin",
    purpose: "Backup created immediately before clearing all operational file data",
    summary: {
      files: files.length,
      linkedCollections: linkedCollections.length,
      fileNotifications: fileNotifications.length,
      fileAuditEvents: fileAuditLog.length,
      correctionHistory: (state.correctionHistory || []).length,
      attachmentReferences: countAttachmentReferences(files),
    },
    data: {
      files,
      deletedFileIds: state.deletedFileIds || [],
      correctionHistory: state.correctionHistory || [],
      fileNotifications,
      fileAuditLog,
      linkedCollections,
      bulkBillingReports: state.bulkBillingReports || null,
      bulkFeeReceivedReports: state.bulkFeeReceivedReports || null,
      additionalFileData: Object.fromEntries(
        FILE_ARRAY_KEYS
          .filter((key) => !["files", "deletedFileIds", "correctionHistory"].includes(key) && Object.prototype.hasOwnProperty.call(state, key))
          .map((key) => [key, state[key]])
      ),
    },
  };

  FILE_ARRAY_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(state, key) || ["files", "deletedFileIds", "correctionHistory"].includes(key)) state[key] = [];
  });
  state.otherCashCollections = manualCollections;
  state.fileNotifications = retainedNotifications;
  state.auditLog = [...retainedAuditLog, {
    id: crypto.randomUUID(),
    action: "All file records cleared",
    details: {
      backupId: archiveId,
      filesRemoved: files.length,
      linkedCollectionsRemoved: linkedCollections.length,
      retainedManualCollections: manualCollections.length,
    },
    user: profile?.name || "Admin",
    role: profile?.role || "Admin",
    at: now,
  }].slice(-1000);
  state.readNotifications = (state.readNotifications || []).filter((id) => !fileNotifications.some((notice) => notice.id === id));
  state.bulkBillingReports = null;
  state.bulkFeeReceivedReports = null;
  resetSequenceFields(state);
  const archive = {
    id: archiveId,
    createdAt: now,
    createdBy: profile?.name || "Admin",
    backup,
  };
  delete state.fileDataBackups;

  return {
    state,
    backup,
    archive,
    summary: {
      filesRemoved: files.length,
      linkedCollectionsRemoved: linkedCollections.length,
      manualCollectionsRetained: manualCollections.length,
      usersRetained: (state.users || []).length,
    },
  };
}

async function archiveFileDataBackup(archive, sourceStateUpdatedAt = null) {
  const payloadText = JSON.stringify(archive);
  const { error } = await supabaseAdmin.from("app_state_archives").upsert({
    id: archive.id,
    archive_type: "file-data-reset",
    payload: archive,
    payload_md5: crypto.createHash("md5").update(payloadText).digest("hex"),
    created_by: archive.createdBy || null,
    created_at: archive.createdAt || new Date().toISOString(),
    source_state_updated_at: sourceStateUpdatedAt,
  }, { onConflict: "id" });
  if (error) throw error;
}

function collectFileIds(state = {}) {
  const ids = new Set((state.deletedFileIds || []).map(cleanId).filter(Boolean));
  (state.files || []).forEach((file) => {
    [file.id, file.fileId, file.file_id].map(cleanId).filter(Boolean).forEach((id) => ids.add(id));
  });
  (state.correctionHistory || []).forEach((row) => {
    [row.fileId, row.file_id].map(cleanId).filter(Boolean).forEach((id) => ids.add(id));
  });
  return ids;
}

function collectFeeReceiptIds(files = []) {
  const ids = new Set();
  files.forEach((file) => {
    [
      file.feeReceiptId,
      file.fee_receipt_id,
      file.feeTransactionId,
      file.fee_transaction_id,
      file.feeReceipt?.feeReceiptId,
      file.feeReceipt?.transactionId,
    ].map(cleanId).filter(Boolean).forEach((id) => ids.add(id));
  });
  return ids;
}

function isFileLinkedCollection(row = {}, fileIds = new Set(), receiptIds = new Set()) {
  const fileId = cleanId(row.fileId || row.file_id || row.linkedFileId || row.linked_file_id);
  if (fileId && fileIds.has(fileId)) return true;
  const sourceType = String(row.sourceType || row.source_type || "").trim().toLowerCase();
  if (sourceType === "fee_receipt") return true;
  return [row.feeReceiptId, row.fee_receipt_id, row.sourceId, row.source_id]
    .map(cleanId)
    .some((id) => id && receiptIds.has(id));
}

function isFileRelatedNotification(row = {}, fileIds = new Set()) {
  const linkedId = cleanId(row.fileId || row.file_id || row.related_record_id || row.relatedRecordId || row.recordId);
  if (linkedId && fileIds.has(linkedId)) return true;
  const type = String(row.notification_type || row.notificationType || row.changeType || row.type || "");
  if (/announcement|administrative/i.test(type)) return false;
  return Boolean(row.fileName) || /file|allot|assign|status|correction|checked|billing|fee received/i.test(type);
}

function isFileRelatedAudit(row = {}, fileIds = new Set()) {
  const details = row.details || {};
  const linkedId = cleanId(details.fileId || details.file_id || row.fileId || row.file_id || row.related_record_id);
  if (linkedId && fileIds.has(linkedId)) return true;
  const action = String(row.action || row.type || "");
  if (/visitor|staff details|user role|login|chat|collection saved|expense|cash reconciliation|daily report/i.test(action)) return false;
  return /file|allot|assign|reassign|checking|checked|correction|billing|fee pending|fee received|dropdown cleanup/i.test(action)
    && Boolean(details.fileName || details.name || linkedId || /file/i.test(action));
}

function countAttachmentReferences(files = []) {
  return files.reduce((total, file) => total + (Array.isArray(file.attachments) ? file.attachments.length : 0), 0);
}

function resetSequenceFields(state) {
  const zeroFields = ["fileSequence", "fileSerialSequence", "lastFileSerial", "nextFileNumber"];
  zeroFields.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(state, key)) state[key] = 0;
  });
}

function cleanId(value) {
  return String(value || "").trim().toLowerCase();
}

module.exports = {
  RESET_CONFIRMATION,
  resetAllFileData,
  prepareFileDataReset,
  archiveFileDataBackup,
  isFileLinkedCollection,
};
