const crypto = require("crypto");
const { supabaseAdmin } = require("../config/supabase");
const {
  ACTIVE_SERVICE_TYPES,
  canonicalServiceType,
  isRetiredServiceType,
} = require("../constants/serviceTypes");
const {
  archiveExpiredNotificationRows,
  applyInitialNotificationCleanup,
} = require("./notificationRetentionService");

const APP_STATE_ID = "default";
const PERF_LOG_ENABLED = process.env.PERF_LOG === "1";
const DISPLAY_NAME_MIGRATIONS = new Map([
  ["Najmunnisa", "Najma"],
]);
const PROTECTED_IDENTITY_KEYS = /(?:id|email|password|auth|token)$/i;

async function getAppState() {
  const startedAt = perfStart();
  const { data, error } = await supabaseAdmin
    .from("app_state")
    .select("state, updated_at")
    .eq("id", APP_STATE_ID)
    .maybeSingle();
  if (error) throw error;
  const state = normalizeServerState(data?.state || emptyState());
  perfLog("getAppState", startedAt, { files: state.files?.length || 0 });
  return state;
}

async function getAppStateRecord() {
  const { data, error } = await supabaseAdmin
    .from("app_state")
    .select("state, updated_at, updated_by")
    .eq("id", APP_STATE_ID)
    .maybeSingle();
  if (error) throw error;
  return {
    state: normalizeServerState(data?.state || emptyState()),
    updatedAt: data?.updated_at || null,
    updatedBy: data?.updated_by || null,
  };
}

async function saveAppState(state, updatedBy = null) {
  const startedAt = perfStart();
  const normalized = normalizeServerState(state || emptyState());
  const { data, error } = await supabaseAdmin
    .from("app_state")
    .upsert({
      id: APP_STATE_ID,
      state: normalized,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    })
    .select("state")
    .single();
  if (error) throw error;
  perfLog("saveAppState", startedAt, { files: normalized.files?.length || 0 });
  return data.state;
}

async function saveAppStateIfCurrent(state, updatedBy = null, expectedUpdatedAt = null) {
  if (!expectedUpdatedAt) {
    const error = new Error("Central data version is unavailable. Reload and try again.");
    error.status = 409;
    throw error;
  }
  const normalized = normalizeServerState(state || emptyState());
  const { data, error } = await supabaseAdmin
    .from("app_state")
    .update({
      state: normalized,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    })
    .eq("id", APP_STATE_ID)
    .eq("updated_at", expectedUpdatedAt)
    .select("state, updated_at")
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    const conflict = new Error("Central data changed while the reset was being prepared. Reload and try again.");
    conflict.status = 409;
    throw conflict;
  }
  return { state: data.state, updatedAt: data.updated_at };
}

async function patchAppState(mutator, updatedBy = null) {
  const startedAt = perfStart();
  const state = await getAppState();
  const next = await mutator(structuredClone(state));
  const saved = await saveAppState(next || state, updatedBy);
  perfLog("patchAppState", startedAt);
  return saved;
}

async function migrateNotificationRetention() {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const record = await getAppStateRecord();
    const cleanup = applyInitialNotificationCleanup(record.state, { actor: "Admin" });
    if (!cleanup.changed) return { changed: false, retention: record.state.notificationRetention || {} };
    try {
      const saved = await saveAppStateIfCurrent(cleanup.state, null, record.updatedAt);
      return { changed: true, retention: saved.state?.notificationRetention || cleanup.state.notificationRetention };
    } catch (error) {
      if (error.status !== 409 || attempt === 1) throw error;
    }
  }
  return { changed: false };
}

function perfStart() {
  return PERF_LOG_ENABLED ? Date.now() : 0;
}

function perfLog(label, startedAt, details = {}) {
  if (!PERF_LOG_ENABLED || !startedAt) return;
  console.info(`[perf] ${label}: ${Date.now() - startedAt}ms`, details);
}

function emptyState() {
  return {
    files: [],
    users: [],
    invites: [],
    revokedAccess: [],
    visitors: [],
    expenses: [],
    feeReceipts: [],
    otherCashCollections: [],
    openingBalances: [],
    accountTransfers: [],
    cashReconciliations: [],
    chatMessages: [],
    chatGroups: [],
    readChatMessages: [],
    staffDetails: [],
    fileNotifications: [],
    auditLog: [],
    services: [],
    careOfList: [],
    staffMaster: [],
    modeList: [],
    company: {},
    theme: "professional",
  };
}

function normalizeServerState(state) {
  const displayNormalizedState = normalizeServiceTypes(normalizeDisplayNames(state));
  return {
    ...displayNormalizedState,
    files: sortFilesNewestFirst(displayNormalizedState.files || []),
    visitors: sortVisitorsNewestFirst(displayNormalizedState.visitors || []),
    expenses: sortFinanceRows(displayNormalizedState.expenses || []),
    feeReceipts: sortFinanceRows(displayNormalizedState.feeReceipts || []),
    otherCashCollections: sortFinanceRows((displayNormalizedState.otherCashCollections || []).map(normalizeCollectionRow)),
    accountTransfers: sortFinanceRows(displayNormalizedState.accountTransfers || []),
    openingBalances: sortFinanceRows(displayNormalizedState.openingBalances || []),
    cashReconciliations: sortFinanceRows(displayNormalizedState.cashReconciliations || []),
    chatMessages: sortMessagesOldestFirst(displayNormalizedState.chatMessages || []).slice(-1000),
    chatGroups: Array.isArray(displayNormalizedState.chatGroups) ? displayNormalizedState.chatGroups : [],
    readChatMessages: Array.isArray(displayNormalizedState.readChatMessages) ? [...new Set(displayNormalizedState.readChatMessages.filter(Boolean))] : [],
    fileNotifications: archiveExpiredNotificationRows(
      normalizeFileNotifications(displayNormalizedState.fileNotifications || []),
      displayNormalizedState
    ),
    staffDetails: sortStaffDetailsNewestFirst(displayNormalizedState.staffDetails || []),
    correctionHistory: sortCorrectionsNewestFirst(displayNormalizedState.correctionHistory || []),
    careOfList: normalizeMasterList(displayNormalizedState.careOfList || []),
    staffMaster: normalizeMasterList(displayNormalizedState.staffMaster || []),
    modeList: normalizeMasterList(displayNormalizedState.modeList || []),
  };
}

function normalizeMasterList(values = []) {
  const uniqueValues = new Map();
  (Array.isArray(values) ? values : []).forEach((value) => {
    const cleaned = String(value || "").trim().replace(/\s+/g, " ");
    if (!cleaned) return;
    const key = cleaned.toLocaleLowerCase("en-IN");
    if (!uniqueValues.has(key)) uniqueValues.set(key, cleaned);
  });
  return [...uniqueValues.values()].sort((left, right) => left.localeCompare(right));
}

function normalizeServiceTypes(state = {}) {
  const renamedState = replaceServiceLabels(state);
  const files = (renamedState.files || []).map((file) => {
    const serviceType = canonicalServiceType(file.serviceType || file.service_type);
    return {
      ...file,
      serviceType,
      ...(Object.prototype.hasOwnProperty.call(file, "service_type") ? { service_type: serviceType } : {}),
    };
  });
  const services = [
    ...ACTIVE_SERVICE_TYPES,
    ...(renamedState.services || []).map(canonicalServiceType),
    ...files.map((file) => file.serviceType),
  ].filter((serviceType) => serviceType && !isRetiredServiceType(serviceType));
  return {
    ...renamedState,
    files,
    services: [...new Map(services.map((serviceType) => [serviceType.toLowerCase(), serviceType])).values()]
      .sort((left, right) => left.localeCompare(right)),
  };
}

function replaceServiceLabels(value) {
  if (Array.isArray(value)) return value.map(replaceServiceLabels);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, childValue]) => [key, replaceServiceLabels(childValue)])
    );
  }
  if (typeof value !== "string") return value;
  return value
    .replace(/\bNet\s*Worth Certificate\b/gi, "Networth Certificate")
    .replace(/\bIndependend Audit\b/gi, "Independent Audit");
}

function normalizeDisplayNames(value, key = "") {
  if (Array.isArray(value)) return value.map((item) => normalizeDisplayNames(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [
        childKey,
        normalizeDisplayNames(childValue, childKey),
      ])
    );
  }
  if (
    typeof value !== "string"
    || PROTECTED_IDENTITY_KEYS.test(key)
    || value.includes("@")
    || /^(?:user|auth|staff|profile)[-_]/i.test(value)
  ) return value;
  let normalized = value;
  DISPLAY_NAME_MIGRATIONS.forEach((nextName, previousName) => {
    normalized = normalized.replace(new RegExp(`\\b${previousName}\\b`, "gi"), nextName);
  });
  return normalized;
}

async function migrateDisplayNames() {
  const { data, error } = await supabaseAdmin
    .from("app_state")
    .select("state")
    .eq("id", APP_STATE_ID)
    .maybeSingle();
  if (error) throw error;
  if (!data?.state) return { changed: false };
  const migrated = normalizeDisplayNames(data.state);
  if (JSON.stringify(migrated) === JSON.stringify(data.state)) return { changed: false };
  const { error: updateError } = await supabaseAdmin
    .from("app_state")
    .update({ state: migrated, updated_at: new Date().toISOString() })
    .eq("id", APP_STATE_ID);
  if (updateError) throw updateError;
  return { changed: true };
}

async function migrateServiceTypes() {
  const { data, error } = await supabaseAdmin
    .from("app_state")
    .select("state")
    .eq("id", APP_STATE_ID)
    .maybeSingle();
  if (error) throw error;
  if (!data?.state) return { changed: false };
  const migrated = normalizeServiceTypes(data.state);
  if (JSON.stringify(migrated) === JSON.stringify(data.state)) return { changed: false };
  const { error: updateError } = await supabaseAdmin
    .from("app_state")
    .update({ state: migrated, updated_at: new Date().toISOString() })
    .eq("id", APP_STATE_ID);
  if (updateError) throw updateError;
  return { changed: true };
}

function normalizeFileNotifications(rows = []) {
  const map = new Map();
  (rows || []).forEach((notice) => {
    if (!notice) return;
    const normalized = {
      ...notice,
      id: notice.id || crypto.randomUUID(),
      dedupeKey: notice.dedupeKey || notificationDedupeKey(notice),
    };
    const key = normalized.dedupeKey || normalized.id;
    const existing = map.get(key);
    if (!existing || notificationCompleteness(normalized) >= notificationCompleteness(existing)) {
      map.set(key, { ...existing, ...normalized });
    }
  });
  return [...map.values()]
    .sort((a, b) => notificationTime(b) - notificationTime(a))
    .slice(0, 800);
}

function notificationDedupeKey(notice = {}) {
  const recipient = String(notice.targetUserId || notice.targetUserEmail || notice.targetUserName || notice.user_id || notice.userId || "").trim().toLowerCase();
  const type = String(notice.notification_type || notice.notificationType || notice.changeType || notice.type || "notification").trim().toLowerCase();
  const record = String(notice.related_record_id || notice.relatedRecordId || notice.fileId || notice.file_id || notice.recordId || "").trim().toLowerCase();
  const event = String(notice.event_id || notice.eventId || notice.dedupeKey || notice.changeKey || notice.created_at || notice.createdAt || notice.date || "").trim().toLowerCase();
  return [recipient, type, record, event].filter(Boolean).join("|");
}

function notificationCompleteness(notice = {}) {
  return [
    notice.id,
    notice.dedupeKey,
    notice.fileId || notice.related_record_id,
    notice.fileName,
    notice.changeType || notice.notification_type,
    notice.changeText,
    notice.targetUserId || notice.targetUserEmail || notice.targetUserName || notice.user_id,
    notice.createdAt || notice.created_at,
  ].filter(Boolean).length;
}

function notificationTime(notice = {}) {
  return dateOrNumber(notice.createdAt || notice.created_at || notice.date);
}

function sortStaffDetailsNewestFirst(rows) {
  return [...rows].sort((a, b) => {
    const left = dateOrNumber(a.updated_at || a.updatedAt || a.created_at || a.createdAt || a.dateOfJoining || a.date_of_joining);
    const right = dateOrNumber(b.updated_at || b.updatedAt || b.created_at || b.createdAt || b.dateOfJoining || b.date_of_joining);
    if (right !== left) return right - left;
    return String(b.id || "").localeCompare(String(a.id || ""));
  });
}

function sortFilesNewestFirst(files) {
  return [...files].sort((a, b) => {
    const leftReceived = fileSortDate(a);
    const rightReceived = fileSortDate(b);
    if (rightReceived !== leftReceived) return rightReceived - leftReceived;
    const leftCreated = fileCreatedTime(a);
    const rightCreated = fileCreatedTime(b);
    if (rightCreated !== leftCreated) return rightCreated - leftCreated;
    return String(b.id || "").localeCompare(String(a.id || ""));
  });
}

function fileSortDate(file = {}) {
  return dateOrNumber(file.file_received_date || file.fileReceivedDate || file.receivedDate || file.received_on);
}

function fileCreatedTime(file = {}) {
  return dateOrNumber(file.created_at || file.createdAt || file.updated_at || file.updatedAt || file.lastUpdatedDate);
}

function sortMessagesOldestFirst(messages) {
  return [...messages].sort((a, b) => messageTime(a) - messageTime(b));
}

function messageTime(message = {}) {
  return dateOrNumber(message.created_at || message.createdAt || message.dateTime || `${message.date || ""} ${message.time || ""}`);
}

function sortCorrectionsNewestFirst(rows) {
  return [...rows].sort((a, b) => dateOrNumber(b.returned_at || b.returnedAt || b.created_at || b.createdAt) - dateOrNumber(a.returned_at || a.returnedAt || a.created_at || a.createdAt));
}

function sortFinanceRows(rows) {
  return [...rows].sort((a, b) => {
    const left = dateOrNumber(a.updated_at || a.updatedAt || a.created_at || a.createdAt || a.date);
    const right = dateOrNumber(b.updated_at || b.updatedAt || b.created_at || b.createdAt || b.date);
    if (right !== left) return right - left;
    return String(b.id || "").localeCompare(String(a.id || ""));
  });
}

function normalizeCollectionRow(row = {}) {
  const collectionType = normalizeCollectionType(row.collectionType || row.collection_type);
  return {
    ...row,
    collectionType,
    collection_type: collectionType,
  };
}

function normalizeCollectionType(value = "") {
  const raw = String(value || "").trim();
  const key = raw.toLowerCase().replace(/[\s-]+/g, "_");
  const aliases = {
    fee_collection: "fee_collection",
    other_cash_collection: "other_cash_collection",
    cash_collection: "other_cash_collection",
    bank_collection: "other_bank_collection",
    other_bank_collection: "other_bank_collection",
    other_collection: "other",
    refund: "refund",
    other: "other",
  };
  return aliases[key] || "";
}

function sortVisitorsNewestFirst(rows) {
  return [...rows].sort((a, b) => {
    const aDate = String(a.date || a.visit_date || "");
    const bDate = String(b.date || b.visit_date || "");
    if (bDate !== aDate) return bDate.localeCompare(aDate);
    const aTime = String(a.visitTime || a.visit_time || "");
    const bTime = String(b.visitTime || b.visit_time || "");
    if (bTime !== aTime) return bTime.localeCompare(aTime);
    return dateOrNumber(b.created_at || b.createdAt || b.updated_at || b.updatedAt) - dateOrNumber(a.created_at || a.createdAt || a.updated_at || a.updatedAt);
  });
}

function dateOrNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (!value) return 0;
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function backupPayload(state, exportedBy = "", extras = {}) {
  return {
    app: "CA File Tracker",
    version: "supabase-central-state-v1",
    exportedAt: new Date().toISOString(),
    exportedBy,
    backupSummary: {
      files: state.files?.length || 0,
      users: state.users?.length || 0,
      services: state.services?.length || 0,
      careOfList: state.careOfList?.length || 0,
      visitors: state.visitors?.length || 0,
      expenses: state.expenses?.length || 0,
      otherCashCollections: state.otherCashCollections?.length || 0,
      openingBalances: state.openingBalances?.length || 0,
      chatMessages: state.chatMessages?.length || 0,
      fileNotifications: state.fileNotifications?.length || 0,
      auditLog: state.auditLog?.length || 0,
      billedFiles: (state.files || []).filter((file) => file.billed).length,
      completedFiles: (state.files || []).filter((file) => file.filed || file.stages?.Completed).length,
      clients: Array.isArray(extras.clientMaster) ? extras.clientMaster.length : 0,
    },
    includedKeys: Object.keys(state).sort(),
    state,
    clientMaster: Array.isArray(extras.clientMaster) ? extras.clientMaster : [],
  };
}

module.exports = {
  getAppState,
  getAppStateRecord,
  saveAppState,
  saveAppStateIfCurrent,
  patchAppState,
  backupPayload,
  sortFilesNewestFirst,
  normalizeFileNotifications,
  normalizeDisplayNames,
  migrateDisplayNames,
  normalizeServiceTypes,
  migrateServiceTypes,
  migrateNotificationRetention,
};
