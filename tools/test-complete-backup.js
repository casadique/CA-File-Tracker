const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { BACKUP_VERSION, RELATIONAL_TABLES, redactSecrets, checksumFor } = require("../src/services/completeBackupService");

const cleaned = redactSecrets({
  users: [{ email: "staff@example.com", password: "NeverExport", temporaryPassword: "NeverExport" }],
  access_token: "NeverExport",
  nested: { refreshToken: "NeverExport", session: { token: "NeverExport" } },
  client: { gst_password_encrypted: "ciphertext-is-recoverable", bankAccount: "123" },
});
assert.equal(cleaned.users[0].email, "staff@example.com");
assert.equal("password" in cleaned.users[0], false);
assert.equal("temporaryPassword" in cleaned.users[0], false);
assert.equal("access_token" in cleaned, false);
assert.equal("refreshToken" in cleaned.nested, false);
assert.equal("session" in cleaned.nested, false);
assert.equal(cleaned.client.gst_password_encrypted, "ciphertext-is-recoverable");
assert.equal(checksumFor({ a: 1 }), checksumFor({ a: 1 }));
assert.equal(BACKUP_VERSION, "ca-file-tracker-complete-v2");
for (const table of ["app_users", "clients", "invoices", "payment_receipts", "notification_events"]) {
  assert(RELATIONAL_TABLES.includes(table), `${table} must be included`);
}

const stateRoute = fs.readFileSync(path.join(__dirname, "../src/routes/stateRoutes.js"), "utf8");
const legacyRoute = fs.readFileSync(path.join(__dirname, "../src/routes/legacyRoutes.js"), "utf8");
const clientScript = fs.readFileSync(path.join(__dirname, "../backup-client.js"), "utf8");
assert(stateRoute.includes("createCompleteBackup"));
assert(legacyRoute.includes("archiveCompleteBackup"));
assert(legacyRoute.includes('router.post("/backup/download"'));
assert(clientScript.includes("/api/backup/download"));
assert(clientScript.includes("fetchCompleteBackupDownload"));
assert(clientScript.includes("response.blob()"));
assert(clientScript.includes("clientMaster: payload.clientMaster"));
console.log("Complete backup coverage and secret-redaction tests passed.");
