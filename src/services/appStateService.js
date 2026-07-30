const { supabaseAdmin } = require("../config/supabase");

const APP_STATE_ID = "default";

async function getAppState() {
  const { data, error } = await supabaseAdmin
    .from("app_state")
    .select("state, updated_at")
    .eq("id", APP_STATE_ID)
    .maybeSingle();
  if (error) throw error;
  return data?.state || emptyState();
}

async function getAppStateRecord() {
  const { data, error } = await supabaseAdmin
    .from("app_state")
    .select("state, updated_at, updated_by")
    .eq("id", APP_STATE_ID)
    .maybeSingle();
  if (error) throw error;
  return {
    state: data?.state || emptyState(),
    updatedAt: data?.updated_at || null,
    updatedBy: data?.updated_by || null,
  };
}

async function saveAppState(state, updatedBy = null) {
  const { data, error } = await supabaseAdmin
    .from("app_state")
    .upsert({
      id: APP_STATE_ID,
      state,
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
};
