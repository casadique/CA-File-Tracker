const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
let centralState;

const appStatePath = require.resolve(path.join(root, "src/services/appStateService.js"));
const applyMutation = async (mutator) => {
  centralState = await mutator(structuredClone(centralState));
  return structuredClone(centralState);
};
require.cache[appStatePath] = {
  id: appStatePath,
  filename: appStatePath,
  loaded: true,
  exports: {
    patchAppState: applyMutation,
    patchAppStateAtomic: applyMutation,
    sortFilesNewestFirst: (rows) => rows,
    normalizeFileNotifications: (rows) => rows,
  },
};

const service = require(path.join(root, "src/services/fileService.js"));

const profiles = {
  admin: { id: "profile-admin", auth_user_id: "auth-admin", name: "Admin User", role: "Admin" },
  manager: { id: "profile-manager", auth_user_id: "auth-manager", name: "Manager User", role: "Manager" },
  staffManager: { id: "profile-sm", auth_user_id: "auth-sm", name: "Staff Manager User", role: "Staff Manager" },
  staff: { id: "profile-staff", auth_user_id: "auth-staff", name: "Staff User", role: "Staff" },
  viewer: { id: "profile-viewer", auth_user_id: "auth-viewer", name: "Viewer User", role: "Viewer" },
  unknown: { id: "profile-unknown", auth_user_id: "auth-unknown", name: "Unknown User", role: "Unexpected" },
};

function work(overrides = {}) {
  return {
    id: "work-1",
    name: "Due-date permission test",
    serviceType: "ITR Filing",
    dueDate: "2026-08-20",
    assignedStaff: "Other Staff",
    assignedStaffId: "profile-other",
    assignedStaffEmail: "other@example.com",
    stages: { Received: true, Allotted: true },
    priority: "Medium",
    createdAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

function resetState(file = work()) {
  centralState = {
    files: [file],
    users: [{ id: "profile-other", authUserId: "auth-other", name: "Other Staff", email: "other@example.com", role: "Staff" }],
    fileNotifications: [],
    notificationEvents: [],
    auditLog: [],
  };
}

function permission(profile, file) {
  return service.canModifyDueDate({ userId: profile.auth_user_id, profile, file });
}

async function expectDenied(profile, patch, matcher = /due date/i, mergeCurrent = true) {
  const before = structuredClone(centralState);
  await assert.rejects(
    () => service.upsertFile(mergeCurrent ? { ...centralState.files[0], ...patch } : patch, profile.auth_user_id, profile, { sourceAction: "permission-test" }),
    (error) => error.status === 403 && matcher.test(error.message)
  );
  assert.deepEqual(centralState.files, before.files, "a rejected request must leave the due date unchanged");
  assert.deepEqual(centralState.auditLog, before.auditLog, "a rejected request must not create an audit record");
  assert.deepEqual(centralState.fileNotifications, before.fileNotifications, "a rejected request must not create a notification");
}

async function main() {
  const otherWork = work();
  const ownWork = work({ assignedStaffId: "profile-sm" });
  const ownByAuthId = work({ assignedStaffId: "auth-sm" });
  const multiAssigneeWork = work({ assigneeIds: ["profile-other", "profile-sm"] });

  assert.equal(permission(profiles.admin, ownWork), true, "Admin may change any due date");
  assert.equal(permission(profiles.manager, ownWork), true, "Manager may change any due date");
  assert.equal(permission(profiles.staffManager, otherWork), true, "Staff Manager may change another user's due date");
  assert.equal(permission(profiles.staffManager, ownWork), false, "Staff Manager may not change their own due date");
  assert.equal(permission(profiles.staffManager, ownByAuthId), false, "server auth user IDs must be recognized");
  assert.equal(permission(profiles.staffManager, multiAssigneeWork), false, "a Staff Manager in a multi-assignee list must be denied");
  assert.equal(permission(profiles.staff, work({ assignedStaffId: "profile-staff" })), false, "Staff may not change their own due date");
  assert.equal(permission(profiles.staff, otherWork), false, "Staff may not change another user's due date");
  assert.equal(permission(profiles.viewer, otherWork), false, "Viewer is read-only");
  assert.equal(permission(profiles.unknown, otherWork), false, "unknown roles default to deny");
  assert.equal(service.canModifyDueDate({ userId: "", profile: {}, file: otherWork }), false, "missing roles default to deny");

  resetState(ownWork);
  await expectDenied(profiles.staffManager, { dueDate: "2026-08-21" });
  resetState(work({ assignedStaffId: "profile-staff" }));
  await expectDenied(profiles.staff, { dueDate: "2026-08-21" });
  resetState(otherWork);
  await expectDenied(profiles.staff, { id: "work-1", due_date: "2026-08-21" }, /due date/i, false);
  resetState(otherWork);
  await expectDenied(profiles.staff, { dueDate: null });
  resetState(multiAssigneeWork);
  await expectDenied(profiles.staffManager, { dueDate: "2026-08-22" });

  resetState(otherWork);
  await service.upsertFile({ ...otherWork, dueDate: "2026-08-23" }, profiles.manager.auth_user_id, profiles.manager, { sourceAction: "my-task" });
  assert.equal(centralState.files[0].dueDate, "2026-08-23");
  const dueAudits = centralState.auditLog.filter((row) => row.action === "Due date changed");
  const dueNotices = centralState.fileNotifications.filter((row) => row.changeType === "Due Date Changed");
  assert.equal(dueAudits.length, 1, "an authorized due-date update must create one audit record");
  assert.equal(dueNotices.length, 1, "an authorized due-date update must create one assignee notification");
  assert.equal(dueAudits[0].details.previousDueDate, "2026-08-20");
  assert.equal(dueAudits[0].details.newDueDate, "2026-08-23");
  assert.equal(dueAudits[0].details.changedByUserId, "auth-manager");
  assert.equal(dueAudits[0].details.sourceAction, "my-task");
  assert.match(dueNotices[0].changeText, /20-08-2026.*23-08-2026/);

  const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
  const routeSource = fs.readFileSync(path.join(root, "src/routes/fileRoutes.js"), "utf8");
  const stateRouteSource = fs.readFileSync(path.join(root, "src/routes/stateRoutes.js"), "utf8");
  const migrationSource = fs.readFileSync(path.join(root, "database/20260810_due_date_permissions.sql"), "utf8");
  assert.match(appSource, /function dueDateEditPolicy/);
  assert.match(appSource, /delete payloadFile\.dueDate/);
  assert.match(appSource, /input\.removeAttribute\("name"\)/);
  assert.match(routeSource, /sourceAction: req\.body\.sourceAction/);
  assert.match(stateRouteSource, /router\.put\("\/", requireAuth, requireRole\("Admin"\)/, "bulk central-state replacement must remain Admin-only");
  assert.match(migrationSource, /revoke insert, update, delete, truncate, references, trigger[\s\S]*from anon, authenticated/i);
  assert.match(migrationSource, /cmd <> 'SELECT'/, "legacy direct-write RLS policies must be removed");

  console.log("Due-date permission, audit, notification, API-bypass and database-boundary tests passed.");
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
