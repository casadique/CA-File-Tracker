const { supabaseAdmin } = require("../config/supabase");

const APP_STATE_ID = "default";

async function getAppState() {
  const { data, error } = await supabaseAdmin
    .from("app_state")
    .select("state, updated_at")
    .eq("id", APP_STATE_ID)
    .maybeSingle();
  if (error) throw error;
  return normalizeServerState(data?.state || emptyState());
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
  return data.state;
}

async function patchAppState(mutator, updatedBy = null) {
  const state = await getAppState();
  const next = await mutator(structuredClone(state));
  return saveAppState(next || state, updatedBy);
}

function emptyState() {
  return {
    files: [],
    users: [],
    invites: [],
    revokedAccess: [],
    visitors: [],
    expenses: [],
    otherCashCollections: [],
    openingBalances: [],
    chatMessages: [],
    chatGroups: [],
    readChatMessages: [],
    staffDetails: [],
    fileNotifications: [],
    auditLog: [],
    services: [],
    careOfList: [],
    company: {},
    theme: "professional",
  };
}

function normalizeServerState(state) {
  return {
    ...state,
    files: sortFilesNewestFirst(state.files || []),
    visitors: sortVisitorsNewestFirst(state.visitors || []),
    expenses: sortFinanceRows(state.expenses || []),
    otherCashCollections: sortFinanceRows((state.otherCashCollections || []).map(normalizeCollectionRow)),
    chatMessages: sortMessagesOldestFirst(state.chatMessages || []).slice(-1000),
    chatGroups: Array.isArray(state.chatGroups) ? state.chatGroups : [],
    readChatMessages: Array.isArray(state.readChatMessages) ? [...new Set(state.readChatMessages.filter(Boolean))] : [],
    staffDetails: sortStaffDetailsNewestFirst(state.staffDetails || []),
    correctionHistory: sortCorrectionsNewestFirst(state.correctionHistory || []),
  };
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

function backupPayload(state, exportedBy = "") {
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
    },
    includedKeys: Object.keys(state).sort(),
    state,
  };
}

module.exports = {
  getAppState,
  getAppStateRecord,
  saveAppState,
  patchAppState,
  backupPayload,
  sortFilesNewestFirst,
};
