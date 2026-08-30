const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

process.env.FILES_RELATIONAL_SHADOW_WRITE = "0";
const {
  fileToRelationalRow,
  fileChanges,
  relationalShadowWriteEnabled,
} = require("../src/services/fileRecordService");

const sourceUpdatedAt = "2026-08-30T06:00:00.000Z";
const file = {
  id: "file-1",
  name: "Example Client",
  pan: "ABCDE1234F",
  fy: "2026-27",
  serviceType: "ITR Filing",
  assignedStaffId: "staff-1",
  assignedStaffEmail: "STAFF@EXAMPLE.COM",
  assignedStaff: "Example Staff",
  workflowStatus: "WIP",
  fileReceivedDate: "2026-08-01",
  dueDate: "2026-08-31",
  statusUpdatedAt: "2026-08-30T05:00:00.000Z",
  billed: true,
  stages: { Completed: false },
  remarks: "Preserve every historical field",
};

const row = fileToRelationalRow(file, sourceUpdatedAt);
assert.equal(row.id, file.id);
assert.equal(row.client_name, file.name);
assert.equal(row.assigned_staff_email, "staff@example.com");
assert.equal(row.file_received_date, "2026-08-01");
assert.equal(row.is_billed, true);
assert.deepEqual(row.payload, file, "The complete original file must be retained losslessly");

const changed = { ...file, workflowStatus: "Completed", filed: true };
const changes = fileChanges([file, { id: "file-removed" }], [changed, { id: "file-new" }]);
assert.deepEqual(changes.deletedIds, ["file-removed"]);
assert.deepEqual(changes.upserts.map((item) => item.id), ["file-1", "file-new"]);
assert.equal(relationalShadowWriteEnabled(), false, "Shadow writes must be opt-in during Phase 1");

const root = path.resolve(__dirname, "..");
const migration = fs.readFileSync(path.join(root, "database", "migrations", "20260830_file_records_phase1.sql"), "utf8");
assert.match(migration, /create table if not exists public\.file_records/i);
assert.match(migration, /alter table public\.file_records enable row level security/i);
assert.match(migration, /revoke all on table public\.file_records from anon, authenticated/i);
assert.match(migration, /jsonb_array_elements\(source_state\.files\)/i);
assert.match(migration, /on conflict \(id\) do update/i);

const appStateService = fs.readFileSync(path.join(root, "src", "services", "appStateService.js"), "utf8");
assert.match(appStateService, /queueFileShadowSync\(previousState\.files/);
assert.match(appStateService, /queueFileShadowSync\(previousFiles/);

const serverSource = fs.readFileSync(path.join(root, "server.js"), "utf8");
assert.match(serverSource, /reconcileFileShadow\(record\.state\.files/);
assert.match(serverSource, /setTimeout\(reconcileFiles, 5000\)\.unref\(\)/);

console.log("Relational file Phase 1 safeguards passed.");
