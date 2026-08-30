const { supabaseAdmin } = require("../config/supabase");
const { env } = require("../config/env");

const TABLE = "file_records";
const WRITE_BATCH_SIZE = 200;
let shadowQueue = Promise.resolve();

function relationalShadowWriteEnabled() {
  return env.filesRelationalShadowWrite === true;
}

function fileToRelationalRow(file = {}, sourceStateUpdatedAt = null) {
  const id = String(file.id || "").trim();
  if (!id) return null;
  const workflowStatus = text(file.workflowStatus || file.workflow_status || file.status);
  return {
    id,
    client_id: nullableText(file.clientId || file.client_id),
    client_name: text(file.name || file.clientName || file.client_name),
    pan_reg_no: text(file.pan || file.panRegNo || file.pan_reg_no),
    financial_year: text(file.fy || file.financialYear || file.financial_year),
    service_type: text(file.serviceType || file.service_type),
    care_of: text(file.careOf || file.care_of),
    assigned_staff_id: text(file.assignedStaffId || file.assigned_staff_id),
    assigned_staff_email: text(file.assignedStaffEmail || file.assigned_staff_email).toLowerCase(),
    assigned_staff_name: text(file.assignedStaff || file.assigned_staff),
    workflow_status: workflowStatus,
    priority: text(file.priority),
    billing_status: text(file.billingStatus || file.billing_status || file.billingType),
    file_received_date: dateOnly(file.fileReceivedDate || file.file_received_date),
    due_date: dateOnly(file.dueDate || file.due_date),
    status_updated_at: timestamp(file.status_updated_at || file.statusUpdatedAt || file.updated_at),
    is_removed: truthy(file.isRemoved ?? file.is_removed) || workflowStatus.toLowerCase() === "removed",
    is_completed: truthy(file.filed ?? file.isCompleted ?? file.is_completed) || truthy(file.stages?.Completed),
    is_billed: truthy(file.billed ?? file.isBilled ?? file.is_billed) || truthy(file.stages?.Billed),
    payload: file,
    source_state_updated_at: timestamp(sourceStateUpdatedAt),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  };
}

function fileChanges(previousFiles = [], nextFiles = []) {
  const previous = new Map(validFiles(previousFiles).map((file) => [String(file.id), file]));
  const next = new Map(validFiles(nextFiles).map((file) => [String(file.id), file]));
  const upserts = [];
  const deletedIds = [];
  next.forEach((file, id) => {
    const before = previous.get(id);
    if (!before || JSON.stringify(before) !== JSON.stringify(file)) upserts.push(file);
  });
  previous.forEach((_file, id) => {
    if (!next.has(id)) deletedIds.push(id);
  });
  return { upserts, deletedIds };
}

function queueFileShadowSync(previousFiles, nextFiles, options = {}) {
  if (!relationalShadowWriteEnabled()) return Promise.resolve({ skipped: true });
  const changeSet = fileChanges(previousFiles, nextFiles);
  if (!changeSet.upserts.length && !changeSet.deletedIds.length) return Promise.resolve({ skipped: true });
  shadowQueue = shadowQueue
    .then(() => syncFileChanges(changeSet, options))
    .catch((error) => {
      console.error("Relational file shadow sync failed:", error.message);
      return { ok: false, error: error.message };
    });
  return shadowQueue;
}

async function syncFileChanges(changeSet, options = {}) {
  const sourceUpdatedAt = options.sourceStateUpdatedAt || new Date().toISOString();
  const rows = changeSet.upserts
    .map((file) => fileToRelationalRow(file, sourceUpdatedAt))
    .filter(Boolean);
  for (let index = 0; index < rows.length; index += WRITE_BATCH_SIZE) {
    const { error } = await supabaseAdmin
      .from(TABLE)
      .upsert(rows.slice(index, index + WRITE_BATCH_SIZE), { onConflict: "id" });
    if (error) throw error;
  }
  for (let index = 0; index < changeSet.deletedIds.length; index += WRITE_BATCH_SIZE) {
    const ids = changeSet.deletedIds.slice(index, index + WRITE_BATCH_SIZE);
    const { error } = await supabaseAdmin
      .from(TABLE)
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .in("id", ids);
    if (error) throw error;
  }
  return { ok: true, upserted: rows.length, tombstoned: changeSet.deletedIds.length };
}

async function fileRelationalParity(centralFiles = []) {
  const expectedIds = new Set(validFiles(centralFiles).map((file) => String(file.id)));
  const actualIds = new Set();
  let relationalCount = 0;
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error, count } = await supabaseAdmin
      .from(TABLE)
      .select("id", { count: from === 0 ? "exact" : undefined })
      .is("deleted_at", null)
      .range(from, from + pageSize - 1);
    if (error) {
      if (["42P01", "PGRST205"].includes(error.code)) {
        return { available: false, shadowWriteEnabled: relationalShadowWriteEnabled() };
      }
      throw error;
    }
    if (from === 0) relationalCount = count ?? (data || []).length;
    (data || []).forEach((row) => actualIds.add(String(row.id)));
    if ((data || []).length < pageSize) break;
  }
  const missingIds = [...expectedIds].filter((id) => !actualIds.has(id));
  const extraIds = [...actualIds].filter((id) => !expectedIds.has(id));
  return {
    available: true,
    shadowWriteEnabled: relationalShadowWriteEnabled(),
    centralCount: expectedIds.size,
    relationalCount,
    missingCount: missingIds.length,
    extraCount: extraIds.length,
    parity: missingIds.length === 0 && extraIds.length === 0 && relationalCount === expectedIds.size,
  };
}

function validFiles(files) {
  return Array.isArray(files) ? files.filter((file) => file && typeof file === "object" && String(file.id || "").trim()) : [];
}

function text(value) {
  return String(value ?? "").trim();
}

function nullableText(value) {
  const clean = text(value);
  return clean || null;
}

function dateOnly(value) {
  const match = text(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

function timestamp(value) {
  if (!value) return null;
  const parsed = typeof value === "number" ? value : Date.parse(String(value));
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

function truthy(value) {
  return value === true || ["true", "1", "yes"].includes(String(value ?? "").trim().toLowerCase());
}

module.exports = {
  fileToRelationalRow,
  fileChanges,
  queueFileShadowSync,
  syncFileChanges,
  fileRelationalParity,
  relationalShadowWriteEnabled,
};
