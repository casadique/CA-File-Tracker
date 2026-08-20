const crypto = require("crypto");
const { supabaseAdmin } = require("../config/supabase");
const { env } = require("../config/env");
const { BACKUP_VERSION, checksumFor } = require("./completeBackupService");
const { getAppStateRecord, saveAppStateIfCurrent } = require("./appStateService");

const RESTORE_TABLE_ORDER = [
  "app_users", "client_types", "client_constitutions", "clients", "client_type_assignments",
  "invoice_settings", "invoice_sequences", "invoices", "invoice_items", "invoice_audit_events",
  "receipt_sequences", "payment_receipts", "receipt_events", "desktop_notification_settings",
  "notification_preferences", "notification_events", "notification_deliveries", "notification_cleanup_audit",
  "audit_events", "client_audit_events", "client_migration_backups", "app_state_archives",
];

function verifyCompleteBackup(backup) {
  if (!backup || typeof backup !== "object" || !backup.state) throw httpError(400, "The selected file is not a CA File Tracker backup.");
  if (backup.version !== BACKUP_VERSION || !backup.manifest) throw httpError(400, `Incompatible backup. Expected ${BACKUP_VERSION}.`);
  if (!backup.integrity?.checksum || backup.integrity.algorithm !== "sha256") throw httpError(400, "Backup checksum is missing.");
  const { integrity, ...core } = backup;
  const actual = checksumFor(core);
  if (!crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(integrity.checksum))) throw httpError(400, "Backup checksum validation failed. The file may be corrupted or incomplete.");
  return actual;
}

function mergeValue(current, incoming) {
  if (Array.isArray(current) && Array.isArray(incoming)) return mergeRows(current, incoming);
  if (current && incoming && typeof current === "object" && typeof incoming === "object" && !Array.isArray(current) && !Array.isArray(incoming)) {
    const result = { ...current };
    Object.entries(incoming).forEach(([key, value]) => { result[key] = key in result ? mergeValue(result[key], value) : value; });
    return result;
  }
  return incoming;
}

function mergeRows(current = [], incoming = []) {
  const result = current.map((row) => structuredClone(row));
  const byId = new Map(result.map((row, index) => [String(row?.id || ""), index]).filter(([id]) => id));
  incoming.forEach((row) => {
    const id = String(row?.id || "");
    if (id && byId.has(id)) result[byId.get(id)] = mergeValue(result[byId.get(id)], row);
    else if (!id && result.some((item) => JSON.stringify(item) === JSON.stringify(row))) return;
    else { if (id) byId.set(id, result.length); result.push(structuredClone(row)); }
  });
  return result;
}

function mergeState(current = {}, incoming = {}) {
  const result = { ...current };
  Object.entries(incoming).forEach(([key, value]) => { result[key] = key in result ? mergeValue(result[key], value) : value; });
  return result;
}

async function restoreRelationalData(relationalData = {}) {
  const summary = {};
  for (const table of RESTORE_TABLE_ORDER) {
    const rows = relationalData[table] || [];
    summary[table] = 0;
    for (let offset = 0; offset < rows.length; offset += 250) {
      const batch = rows.slice(offset, offset + 250);
      const { error } = await supabaseAdmin.from(table).upsert(batch);
      if (error) throw httpError(400, `Restore failed for ${table}: ${error.message}`);
      summary[table] += batch.length;
    }
  }
  return summary;
}

async function restoreStorageFiles(files = []) {
  let restored = 0;
  let skipped = 0;
  for (const file of files) {
    const buffer = Buffer.from(String(file.contentBase64 || ""), "base64");
    const digest = crypto.createHash("sha256").update(buffer).digest("hex");
    if (!file.path || digest !== file.sha256) throw httpError(400, `Attachment checksum failed: ${file.path || "unknown file"}`);
    const { error } = await supabaseAdmin.storage.from(env.storageBucket).upload(file.path, buffer, { contentType: file.mimeType || "application/octet-stream", upsert: false });
    if (error && /already exists|duplicate/i.test(error.message || "")) skipped += 1;
    else if (error) throw httpError(400, `Attachment restore failed for ${file.path}: ${error.message}`);
    else restored += 1;
  }
  return { restored, skipped };
}

async function restoreCompleteBackup(backup, actorId) {
  const checksum = verifyCompleteBackup(backup);
  const initial = await getAppStateRecord({ bypassCache: true });
  if ((initial.state.backupRestoreHistory || []).some((entry) => entry.checksum === checksum)) throw httpError(409, "This backup has already been restored. No duplicate records were created.");
  const tables = await restoreRelationalData(backup.relationalData || {});
  const storage = await restoreStorageFiles(backup.storageFiles || []);
  let saved;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const record = await getAppStateRecord({ bypassCache: true });
    if ((record.state.backupRestoreHistory || []).some((entry) => entry.checksum === checksum)) throw httpError(409, "This backup has already been restored. No duplicate records were created.");
    const merged = mergeState(record.state, backup.state);
    merged.backupRestoreHistory = [...(merged.backupRestoreHistory || []), { checksum, restoredAt: new Date().toISOString(), restoredBy: actorId, version: backup.version, mode: backup.mode || "full" }].slice(-100);
    try { saved = await saveAppStateIfCurrent(merged, actorId, record.updatedAt); break; }
    catch (error) { if (error.status !== 409 || attempt === 2) throw error; }
  }
  return { state: saved.state, checksum, tables, storage, merged: true };
}

function httpError(status, message) { const error = new Error(message); error.status = status; return error; }

module.exports = { verifyCompleteBackup, mergeRows, mergeState, restoreCompleteBackup, restoreRelationalData, restoreStorageFiles };
