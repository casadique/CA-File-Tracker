const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const migration = read("database/migrations/20260830_complaints_dsc_registers.sql");
const complaintService = read("src/services/complaintService.js");
const dscService = read("src/services/dscService.js");
const reminderService = read("src/services/registerReminderService.js");
const complaintRoutes = read("src/routes/complaintRoutes.js");
const dscRoutes = read("src/routes/dscRoutes.js");
const client = read("register-client.js");
const app = read("app.js");
const index = read("index.html");

[
  "complaints", "complaint_activity", "complaint_categories", "complaint_settings",
  "dsc_master", "dsc_movements", "dsc_boxes", "dsc_handover_requests",
  "dsc_fresh_issues", "dsc_renewals", "dsc_activity", "dsc_reminder_history",
].forEach((table) => assert.match(migration, new RegExp(`create table if not exists public\\.${table}\\b`, "i"), `${table} table is required`));

assert.match(migration, /revoke all[\s\S]+from anon, authenticated/i, "register tables must not be directly writable by browser roles");
assert.match(migration, /dsc_no_credentials/i, "database must reject obvious PIN/password content");
assert.match(migration, /unique \(dsc_id, reminder_stage, recipient_user_id, channel\)/i, "DSC reminders must be idempotent");
assert.match(dscService, /Authorized DSC Custodian permission is required/, "DSC mutations need backend authorization");
assert.match(dscService, /Approved handover permission is required/, "DSC out must require configured approval");
assert.match(dscService, /A DSC with this Token or Certificate Serial already exists/, "duplicate DSC tokens must be blocked");
assert.match(complaintService, /A complaint must be Resolved before it can be Closed/, "resolution and closure must remain separate");
assert.match(complaintService, /Resolution Summary.*required when resolving/s, "complaint resolution fields must be mandatory");
assert.match(complaintService, /addWorkingMinutes/, "complaint SLA must use working-time calculation");
assert.match(reminderService, /Complaint SLA Breached/, "complaint SLA breach alerts are required");
assert.match(reminderService, /dsc:expiry:/, "DSC expiry reminders are required");
assert.match(reminderService, /dsc:return-overdue:/, "DSC overdue return alerts are required");
assert.match(complaintRoutes, /requireAuth/, "complaint routes must require authentication");
assert.match(dscRoutes, /requireAuth/, "DSC routes must require authentication");
assert.match(client, /server-side|pageSize: 25|pageSize", 25/i, "register pages must use pagination");
assert.match(client, /PW is encrypted and masked.*never included/is, "DSC UI must explain protected credential handling");
assert.match(dscService, /aes-256-gcm/, "DSC PW must use authenticated encryption");
assert.match(dscService, /withoutPassword/, "DSC PW must be removed from browser responses");
assert.match(app, /complaints: \(\) => window\.renderComplaintRegisterPage/, "Complaint Register must be integrated in navigation");
assert.match(app, /dsc: \(\) => window\.renderDscRegisterPage/, "DSC Register must be integrated in navigation");
assert.match(index, /register-client\.js/, "register client must load independently");
assert.match(index, /registers\.css/, "register styles must load independently");
assert.doesNotMatch(read("src/routes/dashboardRoutes.js"), /(complaints|dsc_master|dsc_movements)/i, "register data must not be added to dashboard startup route");

console.log("Complaint and DSC register integration checks passed.");
