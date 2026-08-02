const path = require("path");

const root = path.resolve(__dirname, "..");
let capturedState = {
  files: [{
    id: "completion-test-file",
    name: "Completion test client",
    serviceType: "Accounts Preparation",
    assignedStaff: "Test Staff",
    assignedStaffId: "test-staff-id",
    assignedStaffEmail: "staff@example.com",
    stages: { Received: true, Allotted: true },
    filed: false,
    createdAt: "2026-08-03T03:00:00.000Z",
    updatedAt: Date.parse("2026-08-03T03:00:00.000Z"),
  }],
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

async function main() {
  const before = capturedState.files[0];
  const result = await upsertFile({
    ...before,
    filed: true,
    stages: {
      ...before.stages,
      WIP: true,
      "Work Done": true,
      Completed: true,
    },
    completionDate: "2026-08-03",
    completedBy: "Test Staff",
    completedById: "test-staff-id",
    completedByEmail: "staff@example.com",
  }, "admin-id", {
    id: "admin-id",
    name: "Test Admin",
    email: "admin@example.com",
    role: "Admin",
  });

  const saved = result.files.find((file) => file.id === before.id);
  if (!saved?.stages?.Completed || !saved.completed_at) {
    throw new Error("Completed workflow timestamp was not saved.");
  }
  console.log("File completion save regression test passed.");
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
