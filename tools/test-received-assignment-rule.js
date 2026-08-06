const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
let capturedState = {
  files: [],
  users: [{ id: "admin-id", name: "Test Admin", email: "admin@example.com", role: "Admin" }],
  fileNotifications: [],
  auditLog: [],
};

const appStatePath = require.resolve(path.join(root, "src/services/appStateService.js"));
require.cache[appStatePath] = {
  id: appStatePath,
  filename: appStatePath,
  loaded: true,
  exports: {
    patchAppState: async (mutator) => {
      capturedState = await mutator(structuredClone(capturedState));
      return capturedState;
    },
    sortFilesNewestFirst: (rows) => rows,
    normalizeFileNotifications: (rows) => rows,
  },
};

const { upsertFile } = require(path.join(root, "src/services/fileService.js"));
const profile = { id: "admin-id", name: "Test Admin", email: "admin@example.com", role: "Admin" };

function baseFile(overrides = {}) {
  return {
    name: "Assignment workflow test",
    serviceType: "Accounts Preparation",
    stages: { Received: true },
    assignedStaff: "Not Assigned",
    currentAssignedStaff: "Not Assigned",
    createdAt: "2026-08-06T03:00:00.000Z",
    ...overrides,
  };
}

async function main() {
  await upsertFile(baseFile(), "admin-id", profile);

  let rejected = false;
  try {
    await upsertFile(baseFile({ assignedStaff: "Althaf", currentAssignedStaff: "Althaf" }), "admin-id", profile);
  } catch (error) {
    rejected = /Assigned Staff cannot be selected/.test(error.message);
  }
  if (!rejected) throw new Error("Server accepted Assigned Staff while workflow was Received.");

  await upsertFile(baseFile({
    stages: { Received: true, Allotted: true },
    assignedStaff: "Althaf",
    currentAssignedStaff: "Althaf",
  }), "admin-id", profile);

  const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
  if (!appSource.includes("bindWorkflowAssignmentAvailability(canAssignThisFile)")) {
    throw new Error("Add/Edit form is not binding workflow-aware assignment controls.");
  }
  if (!appSource.includes('const workflowAllowsAssignment = selectedWorkflowStatus !== "Received"')) {
    throw new Error("Save path does not enforce the Received assignment rule.");
  }
  console.log("Received workflow assignment regression test passed.");
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
