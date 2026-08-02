const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: path.join(__dirname, "..", ".env"), quiet: true });

const applyChanges = process.argv.includes("--apply");
const supabaseUrl = String(process.env.SUPABASE_URL || "").trim();
const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function isRemoved(file = {}) {
  return Boolean(file.is_removed || file.isRemoved || file.status === "Removed" || file.workflowStatus === "Removed" || file.stages?.Removed);
}

function needsRemovedByRepair(file = {}) {
  return !String(file.removedBy || file.removed_by || "").trim()
    || /^(unknown|imported record)$/i.test(String(file.removedBy || file.removed_by || "").trim());
}

function needsReasonRepair(file = {}) {
  const value = String(file.removalReason || file.removal_reason || "").trim();
  return !value || value === "-" || /^imported as removed$/i.test(value);
}

async function main() {
  const { data, error } = await client.from("app_state").select("state, updated_at").eq("id", "default").single();
  if (error) throw error;

  const state = data?.state || {};
  let removedFiles = 0;
  let removerUpdates = 0;
  let reasonUpdates = 0;
  const files = (state.files || []).map((file) => {
    if (!isRemoved(file)) return file;
    removedFiles += 1;
    const update = {};
    if (needsRemovedByRepair(file)) {
      update.removedBy = "Chindu";
      update.removed_by = "Chindu";
      removerUpdates += 1;
    }
    if (needsReasonRepair(file)) {
      update.removalReason = "Not Service Required";
      update.removal_reason = "Not Service Required";
      reasonUpdates += 1;
    }
    return Object.keys(update).length ? { ...file, ...update } : file;
  });

  const summary = { mode: applyChanges ? "apply" : "dry-run", removedFiles, removerUpdates, reasonUpdates };
  if (!applyChanges) return console.log(JSON.stringify(summary, null, 2));

  const backupDirectory = path.join(__dirname, "..", "data", "backups");
  fs.mkdirSync(backupDirectory, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const safetyBackupPath = path.join(backupDirectory, `app-state-before-removed-metadata-repair-${timestamp}.json`);
  fs.writeFileSync(safetyBackupPath, JSON.stringify({ exportedAt: new Date().toISOString(), state }, null, 2));

  const { data: updated, error: updateError } = await client
    .from("app_state")
    .update({ state: { ...state, files }, updated_at: new Date().toISOString() })
    .eq("id", "default")
    .eq("updated_at", data.updated_at)
    .select("updated_at")
    .maybeSingle();
  if (updateError) throw updateError;
  if (!updated) throw new Error("Central data changed during repair. No records were overwritten; run the tool again.");

  console.log(JSON.stringify({ ...summary, safetyBackupPath }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
