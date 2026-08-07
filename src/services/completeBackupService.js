const crypto = require("crypto");
const { supabaseAdmin } = require("../config/supabase");
const { env } = require("../config/env");
const { getAppState } = require("./appStateService");
const { backupClientsSecure } = require("./clientService");

const BACKUP_VERSION = "ca-file-tracker-complete-v2";
const PAGE_SIZE = 1000;

// Only durable business and audit tables belong in a portable backup. Push
// subscriptions are intentionally omitted because they contain private device
// authentication material and must be registered again by each browser.
const RELATIONAL_TABLES = [
  "app_users",
  "audit_events",
  "clients",
  "client_types",
  "client_constitutions",
  "client_type_assignments",
  "client_audit_events",
  "client_migration_backups",
  "invoice_settings",
  "invoice_sequences",
  "invoices",
  "invoice_items",
  "invoice_audit_events",
  "receipt_sequences",
  "payment_receipts",
  "receipt_events",
  "notification_preferences",
  "notification_deliveries",
  "desktop_notification_settings",
  "notification_events",
  "notification_cleanup_audit",
];

const SECRET_KEYS = new Set([
  "password", "temporarypassword", "passwordhash", "passcode", "accesstoken",
  "refreshtoken", "token", "session", "secret", "subscription",
]);

function isSecretKey(key) {
  return SECRET_KEYS.has(String(key || "").replace(/[^a-z]/gi, "").toLowerCase());
}

function redactSecrets(value) {
  if (Array.isArray(value)) return value.map(redactSecrets);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !isSecretKey(key))
    .map(([key, item]) => [key, redactSecrets(item)]));
}

async function readWholeTable(table) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select("*")
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

async function authUserManifest() {
  const users = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
    if (error) throw error;
    const batch = data?.users || [];
    users.push(...batch.map((user) => redactSecrets({
      id: user.id,
      email: user.email || "",
      phone: user.phone || "",
      app_metadata: user.app_metadata || {},
      user_metadata: user.user_metadata || {},
      created_at: user.created_at || null,
      updated_at: user.updated_at || null,
      confirmed_at: user.confirmed_at || null,
      last_sign_in_at: user.last_sign_in_at || null,
      banned_until: user.banned_until || null,
    })));
    if (batch.length < PAGE_SIZE) return users;
  }
}

function stateSummary(state, clientMaster, relationalData, authUsers) {
  const count = (key) => Array.isArray(state[key]) ? state[key].length : 0;
  return {
    files: count("files"),
    billedFiles: (state.files || []).filter((file) => file.billed).length,
    completedFiles: (state.files || []).filter((file) => file.filed || file.stages?.Completed).length,
    clientMaster: clientMaster.length,
    users: relationalData.app_users?.length || count("users"),
    authenticationUsers: authUsers.length,
    services: count("services"),
    visitors: count("visitors"),
    expenses: count("expenses"),
    transactions: count("otherCashCollections") + count("feeReceipts") + count("expenses") + count("accountTransfers"),
    feeReceipts: count("feeReceipts"),
    invoicesAndBillsOfSupply: Math.max(count("invoices"), relationalData.invoices?.length || 0),
    invoiceAuditEvents: Math.max(count("invoiceAuditEvents"), relationalData.invoice_audit_events?.length || 0),
    openingBalances: count("openingBalances"),
    accountTransfers: count("accountTransfers"),
    cashReconciliations: count("cashReconciliations"),
    notifications: count("fileNotifications") + (relationalData.notification_events?.length || 0),
    auditEvents: count("auditLog") + (relationalData.audit_events?.length || 0),
  };
}

function checksumFor(payload) {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

async function createCompleteBackup(exportedBy = "", options = {}) {
  const exportedAt = new Date().toISOString();
  const state = redactSecrets(options.state || await getAppState());
  const clientMaster = options.clientMaster || await backupClientsSecure();
  const relationalData = {};
  const warnings = [];
  const unavailableTables = [];

  for (const table of RELATIONAL_TABLES) {
    try {
      relationalData[table] = redactSecrets(await readWholeTable(table));
    } catch (error) {
      relationalData[table] = [];
      if (["42P01", "PGRST205"].includes(error.code) || /does not exist|schema cache/i.test(error.message || "")) {
        unavailableTables.push(table);
      } else {
        warnings.push(`${table}: ${error.message || "table could not be read"}`);
      }
    }
  }

  let authenticationUsers = [];
  try {
    authenticationUsers = await authUserManifest();
  } catch (error) {
    warnings.push(`authenticationUsers: ${error.message || "authentication users could not be read"}`);
  }

  const core = {
    app: "CA File Tracker",
    version: BACKUP_VERSION,
    exportedAt,
    exportedBy,
    complete: warnings.length === 0,
    warnings,
    unavailableTables,
    security: {
      passwordHashesIncluded: false,
      loginSessionsIncluded: false,
      pushSubscriptionSecretsIncluded: false,
      note: "Users and roles are included. Passwords, sessions and private device keys are never exported.",
    },
    includedKeys: Object.keys(state).sort(),
    state,
    clientMaster,
    relationalData,
    authenticationUsers,
  };
  core.backupSummary = stateSummary(state, clientMaster, relationalData, authenticationUsers);
  core.integrity = { algorithm: "sha256", checksum: checksumFor(core) };
  return core;
}

async function archiveCompleteBackup(payload, reason = "manual") {
  const safeReason = String(reason || "manual").replace(/[^a-z0-9-]/gi, "-").slice(0, 40) || "manual";
  const stamp = payload.exportedAt.replace(/[:.]/g, "-");
  const objectPath = `system-backups/${payload.exportedAt.slice(0, 10)}/${stamp}-${safeReason}.json`;
  const buffer = Buffer.from(JSON.stringify(payload, null, 2), "utf8");
  const { error } = await supabaseAdmin.storage.from(env.storageBucket).upload(objectPath, buffer, {
    contentType: "application/json",
    upsert: false,
  });
  if (error) throw error;
  return { path: objectPath, bytes: buffer.length };
}

module.exports = {
  BACKUP_VERSION,
  RELATIONAL_TABLES,
  redactSecrets,
  checksumFor,
  createCompleteBackup,
  archiveCompleteBackup,
};
