const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const {
  applyStatusUpdatedTimestamp,
  listFiles,
  sortFilesForRequest,
  workflowStatusLabel,
} = require(path.join(root, "src/services/fileService"));
const { sortFilesNewestFirst } = require(path.join(root, "src/services/appStateService"));

const received = { Received: true };
const wip = { Received: true, Allotted: true, WIP: true };
const completed = { Received: true, Allotted: true, WIP: true, "Work Done": true, Completed: true };

assert.equal(workflowStatusLabel({ stages: received }), "Received");
assert.equal(workflowStatusLabel({ stages: wip }), "WIP");
assert.equal(workflowStatusLabel({ stages: completed, filed: true }), "Completed");

const createdAt = "2026-08-05T09:00:00.123Z";
const newFile = { id: "new", createdAt, stages: received };
applyStatusUpdatedTimestamp(newFile, null, "2026-08-05T09:30:00.000Z");
assert.equal(newFile.status_updated_at, createdAt, "New files must start with created_at as their status timestamp");

const originalStatusAt = "2026-08-05T10:15:00.111Z";
const before = { id: "A", createdAt, status_updated_at: originalStatusAt, statusUpdatedAt: originalStatusAt, stages: wip, remarks: "Before" };
const remarksOnly = { ...before, remarks: "Changed", updatedAt: Date.parse("2026-08-05T15:00:00.000Z") };
applyStatusUpdatedTimestamp(remarksOnly, before, "2026-08-05T15:00:00.000Z");
assert.equal(remarksOnly.status_updated_at, originalStatusAt, "Remarks-only edits must not reorder the file");

const statusChangedAt = "2026-08-05T15:00:00.987Z";
const completedFile = { ...before, stages: completed, filed: true };
applyStatusUpdatedTimestamp(completedFile, before, statusChangedAt);
assert.equal(completedFile.status_updated_at, statusChangedAt, "A genuine workflow transition must receive the full timestamp");
const savedAgain = { ...completedFile, remarks: "No status change" };
applyStatusUpdatedTimestamp(savedAgain, completedFile, "2026-08-05T15:05:00.999Z");
assert.equal(savedAgain.status_updated_at, statusChangedAt, "Saving the same status must preserve the prior timestamp");

const rows = [
  { id: "A", createdAt: "2026-08-05T08:00:00.000Z", status_updated_at: "2026-08-05T10:15:00.100Z", updatedAt: Date.parse("2026-08-05T18:00:00.000Z"), stages: wip },
  { id: "B", createdAt: "2026-08-05T08:30:00.000Z", status_updated_at: "2026-08-05T11:30:00.200Z", stages: wip },
  { id: "C", createdAt: "2026-08-05T08:45:00.000Z", status_updated_at: "2026-08-05T14:45:00.300Z", stages: wip },
];
assert.deepEqual(sortFilesForRequest(rows, { sort: "status_updated_at" }).map((file) => file.id), ["C", "B", "A"]);
assert.deepEqual(sortFilesNewestFirst(rows).map((file) => file.id), ["C", "B", "A"], "Central-state ordering must not use generic updatedAt");

const fileAUpdatedAgain = { ...rows[0], status_updated_at: "2026-08-05T15:00:00.400Z" };
assert.deepEqual(sortFilesForRequest([fileAUpdatedAgain, rows[1], rows[2]], { sort: "status_updated_at" }).map((file) => file.id), ["A", "C", "B"]);

const tied = [
  { id: "100", createdAt: "2026-08-05T09:00:00.000Z", status_updated_at: "2026-08-05T12:00:00.000Z", stages: wip },
  { id: "101", createdAt: "2026-08-05T09:00:00.000Z", status_updated_at: "2026-08-05T12:00:00.000Z", stages: wip },
];
assert.deepEqual(sortFilesForRequest(tied, { sort: "status_updated_at" }).map((file) => file.id), ["101", "100"], "ID must be the final deterministic tie-breaker");
const millisecondOrder = [
  { id: "ms-100", createdAt, status_updated_at: "2026-08-05T12:00:00.100Z", stages: wip },
  { id: "ms-900", createdAt, status_updated_at: "2026-08-05T12:00:00.900Z", stages: wip },
];
assert.deepEqual(sortFilesForRequest(millisecondOrder, { sort: "status_updated_at" }).map((file) => file.id), ["ms-900", "ms-100"], "Milliseconds must participate in newest-first ordering");

(async () => {
  const paged = await listFiles({ files: rows }, { listView: "active", sort: "status_updated_at", page: 1, pageSize: 2 });
  assert.deepEqual(paged.map((file) => file.id), ["C", "B"], "Server sorting must happen before pagination");
  const activeOnly = sortFilesForRequest([...rows, { id: "done", createdAt, status_updated_at: "2026-08-05T16:00:00.000Z", stages: completed, filed: true }], { listView: "active", sort: "status_updated_at" });
  assert.deepEqual(activeOnly.map((file) => file.id), ["C", "B", "A"], "Files leaving Active Files must be removed before display");

  assert.match(source, /const activeSort = \[\s*"Newest First", "Received Date - Newest First"/);
  assert.match(source, /const fileListSort = \[\s*"Newest First", "Received Date - Newest First"/);
  assert.match(source, /sortLabel === "Newest First" && \["", "active"\]\.includes\(listView\)/);
  assert.match(source, /fileStatusUpdatedSortTime\(b\) - fileStatusUpdatedSortTime\(a\)/);
  assert.match(source, /applyStatusUpdatedTimestamp\(record, existingFile, saveTimestamp\)/);
  assert.match(source, /function fileSerialNumber\(file, fallbackIndex = 0\) \{\s*return fallbackIndex \+ 1;/);
  console.log("Status timestamp creation, mutation guard, deterministic sorting, Active Files eligibility, pagination and SN checks passed.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
