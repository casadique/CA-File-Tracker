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
    chatMessages: sortMessagesOldestFirst(state.chatMessages || []).slice(-1000),
    correctionHistory: sortCorrectionsNewestFirst(state.correctionHistory || []),
  };
}

function sortFilesNewestFirst(files) {
  return [...files].sort((a, b) => {
    const left = fileSortTime(a);
    const right = fileSortTime(b);
    if (right !== left) return right - left;
    return String(b.id || "").localeCompare(String(a.id || ""));
  });
}

function fileSortTime(file = {}) {
  const created = dateOrNumber(file.created_at || file.createdAt);
  if (created) return created;
  const received = dateOrNumber(file.fileReceivedDate || file.receivedDate || file.received_on);
  if (received) return received;
  const updated = dateOrNumber(file.updated_at || file.updatedAt || file.lastUpdatedDate);
  if (updated) return updated;
  return 0;
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
