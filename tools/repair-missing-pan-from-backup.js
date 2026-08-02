const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: path.join(__dirname, "..", ".env"), quiet: true });

const backupPath = process.argv[2];
const applyChanges = process.argv.includes("--apply");

if (!backupPath) {
  throw new Error("Usage: node tools/repair-missing-pan-from-backup.js <backup.json> [--apply]");
}

const supabaseUrl = String(process.env.SUPABASE_URL || "").trim();
const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const normalizeName = (value) => String(value || "").trim().toLocaleLowerCase("en-IN").replace(/\s+/g, " ");
const cleanPan = (value) => String(value || "").trim();
const unavailablePanValues = new Set([
  "",
  "na",
  "n/a",
  "not entered",
  "not available",
  "regn no. not available",
]);
const hasUsablePan = (value) => !unavailablePanValues.has(cleanPan(value).toLocaleLowerCase("en-IN"));

function addPanCandidate(candidates, name, pan) {
  const nameKey = normalizeName(name);
  const normalizedPan = cleanPan(pan).toUpperCase();
  if (!nameKey || !hasUsablePan(normalizedPan)) return;
  if (!candidates.has(nameKey)) candidates.set(nameKey, new Set());
  candidates.get(nameKey).add(normalizedPan);
}

async function main() {
  const backup = JSON.parse(fs.readFileSync(path.resolve(backupPath), "utf8"));
  const { data, error } = await client
    .from("app_state")
    .select("state, updated_at")
    .eq("id", "default")
    .single();
  if (error) throw error;

  const state = data?.state || {};
  const files = Array.isArray(state.files) ? state.files : [];
  const backupState = backup?.state || backup || {};
  const candidates = new Map();

  files.forEach((file) => addPanCandidate(candidates, file.name, file.pan));
  (backupState.files || []).forEach((file) => addPanCandidate(candidates, file.name, file.pan));
  (backupState.auditLog || []).forEach((entry) => addPanCandidate(
    candidates,
    entry.fileName || entry.name,
    entry.pan,
  ));

  let repaired = 0;
  let conflicting = 0;
  let unresolved = 0;
  const repairedClients = new Set();
  const repairedFiles = files.map((file) => {
    if (hasUsablePan(file.pan)) return file;
    const matches = candidates.get(normalizeName(file.name));
    if (!matches?.size) {
      unresolved += 1;
      return file;
    }
    if (matches.size !== 1) {
      conflicting += 1;
      return file;
    }
    repaired += 1;
    repairedClients.add(file.name);
    return { ...file, pan: [...matches][0] };
  });

  const summary = {
    mode: applyChanges ? "apply" : "dry-run",
    totalFiles: files.length,
    repaired,
    repairedClients: repairedClients.size,
    conflicting,
    unresolved,
  };

  if (!applyChanges) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const backupDirectory = path.join(__dirname, "..", "data", "backups");
  fs.mkdirSync(backupDirectory, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const safetyBackupPath = path.join(backupDirectory, `app-state-before-pan-repair-${timestamp}.json`);
  fs.writeFileSync(safetyBackupPath, JSON.stringify({
    exportedAt: new Date().toISOString(),
    reason: "Before missing PAN/Registration number repair",
    state,
  }, null, 2));

  const { error: updateError } = await client
    .from("app_state")
    .update({ state: { ...state, files: repairedFiles }, updated_at: new Date().toISOString() })
    .eq("id", "default")
    .eq("updated_at", data.updated_at);
  if (updateError) throw updateError;

  console.log(JSON.stringify({ ...summary, safetyBackupPath }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
