const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const migration = read("database/migrations/20260830_complaints_dsc_registers.sql");
const movementInMigration = read("database/migrations/20260901_dsc_movement_in_fields.sql");
const movementAuthorityMigration = read("database/migrations/20260901_dsc_movement_authority.sql");
const movementPermissionMigration = read("database/migrations/20260901_dsc_movement_permission_details.sql");
const complaintService = read("src/services/complaintService.js");
const dscService = read("src/services/dscService.js");
const reminderService = read("src/services/registerReminderService.js");
const complaintRoutes = read("src/routes/complaintRoutes.js");
const dscRoutes = read("src/routes/dscRoutes.js");
const client = read("register-client.js");
const styles = read("registers.css");
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
assert.match(dscService, /async function addMovement[\s\S]+\["OUT","IN","TRANSFER"\]/, "DSC Movement must support Out, In and Transfer");
assert.match(dscService, /Select an Approved Handover Request before recording an Out movement/, "Manual Out movement must preserve configured handover approval");
assert.match(dscRoutes, /router\.post\("\/movements"/, "DSC Movement save route is missing");
assert.match(client, /\+ Add DSC Movement/, "DSC In & Out must provide Add DSC Movement");
assert.match(client, /value="OUT">Out[\s\S]+value="IN">In/, "DSC Movement form must provide both Out and In");
for (const label of ["DSC NAME","ORGANISATION","DATE & TIME","DSC TYPE","TOKEN NAME","AUTHORITY","RECEIVED FROM","MOBILE NO","BOX NAME","SLOT NO","PW","EXPIRY DATE"]) assert.match(client, new RegExp(label), `DSC In movement is missing ${label}`);
for (const value of ["Class II","Class III","Hyperkey","Prox Key","Other","Blue","Black"]) assert.ok(client.includes(value), `DSC In movement is missing ${value}`);
assert.match(client, /data-dsc-add-option="token_name" data-dsc-option-target="#movementTokenName"/, "DSC In Token Name needs a + add button");
assert.match(client, /data-dsc-add-option="box_name" data-dsc-option-target="#movementBoxName"/, "DSC In Box Name needs a + add button");
assert.match(client, /data-dsc-add-option="authority" data-dsc-option-target="#movementAuthority"/, "DSC In Authority needs a + add button");
for (const value of ["XtraTrust","Emudhra","Vsign"]) assert.ok(client.includes(value), `DSC In Authority is missing ${value}`);
assert.ok(movementAuthorityMigration.includes("dsc_master") && movementAuthorityMigration.includes("dsc_movements") && movementAuthorityMigration.includes("authority"), "DSC movement Authority migration is incomplete");
assert.match(styles, /\.dsc-movement-form-layout\{grid-template-columns:repeat\(4/, "DSC Movement desktop layout must use compact four-column sizing");
assert.match(client, /loadAllMovementDsc[\s\S]+pageCount/, "DSC Out selection must load the complete paginated DSC list");
assert.match(client, /OR ENTER DSC NAME[\s\S]+manualDscName/, "DSC In must allow manual DSC Name entry");
for (const label of ["ISSUED TO","MOBILE NO","RELATION","PERMISSION SOUGHT ?","PERMISSION MODE"]) assert.ok(client.includes(label), `DSC Out is missing ${label}`);
for (const value of ["Whatsapp","Email","Call","Direct"]) assert.ok(client.includes(`value="${value}"`), `DSC Out Permission Mode is missing ${value}`);
assert.match(dscService, /manualDscName[\s\S]+createDsc[\s\S]+recordReturn/, "Manual DSC In must create a DSC Master record before receipt");
assert.match(client, /value="TRANSFER">Transfer[\s\S]+CURRENT BOX[\s\S]+CURRENT SLOT[\s\S]+TO BOX[\s\S]+TO SLOT/, "DSC Transfer fields are incomplete");
assert.match(dscService, /async function transferDsc[\s\S]+movement_type: "BOX_CHANGE"[\s\S]+destinationBox[\s\S]+destinationSlot/, "DSC box and slot transfer service is missing");
for (const column of ["issued_mobile","relation","permission_sought","permission_mode","from_box_name"]) assert.ok(movementPermissionMigration.includes(column), `DSC movement migration is missing ${column}`);
assert.match(dscService, /received_from:[\s\S]+received_mobile:[\s\S]+password_encrypted = encryptPassword/, "DSC In receipt details and encrypted PW handling are missing");
for (const column of ["received_from","received_mobile","box_name"]) assert.ok(movementInMigration.includes(column), `DSC In migration is missing ${column}`);
assert.match(dscService, /A DSC with this Token or Certificate Serial already exists/, "duplicate DSC tokens must be blocked");
assert.match(complaintService, /A complaint must be Resolved before it can be Closed/, "resolution and closure must remain separate");
assert.match(complaintService, /Resolution Summary.*required when resolving/s, "complaint resolution fields must be mandatory");
assert.match(complaintService, /addWorkingMinutes/, "complaint SLA must use working-time calculation");
assert.match(complaintService, /Client Name and Complaint Description are required/, "simplified complaint form must not require a hidden Subject field");
assert.match(complaintService, /categoryName.*description\.replace/s, "complaint subject must be generated from visible form values");
assert.match(complaintService, /Promise\.allSettled\(sideEffects\)/, "notification or activity failure must not falsely report that a saved complaint failed");
for (const label of ["Client Master","Client Name","Contact Person","Contact No","Email","Complaint Source","Complaint Category","Complaint Date & Time","Priority","Severity","Assigned To","Target Resolution","Follow Up","Complaint Description"]) assert.match(client, new RegExp(label), `New Complaint is missing ${label}`);
for (const removed of ["Client Type","PAN / Registration No.","Service Type","Related File / Work","Assigned Team / Department","Complaint Subject","Attachment","Internal Remarks"]) assert.doesNotMatch(client.slice(client.indexOf('showModal("New Complaint"'), client.indexOf("async function openComplaintDetail")), new RegExp(removed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `New Complaint must not show ${removed}`);
assert.match(client, /data-complaint-save-error[\s\S]+Saving…[\s\S]+catch \(error\)/, "New Complaint must show a stable inline save error and prevent double saves");
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
