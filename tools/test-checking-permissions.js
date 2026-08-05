const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const pendingFile = (id, completedBy, assignedStaff = "Althaf") => ({
  id,
  name: `Checking Test ${id}`,
  serviceType: "ITR Filing",
  assignedStaff,
  completedBy,
  completedByEmail: completedBy ? `${completedBy.toLowerCase()}@example.com` : "",
  completionDate: "2026-08-05",
  filed: true,
  stages: { Received: true, Allotted: true, WIP: true, "Work Done": true, Completed: true },
  checkedBy: "",
  checkedDate: "",
});

let centralState = {
  files: [
    pendingFile("other-work-althaf", "Rabiyath", "Althaf"),
    pendingFile("other-work-nisha", "Rabiyath", "Nisha"),
    pendingFile("other-work-rizwana", "Rabiyath", "Rizwana"),
    pendingFile("own-work", "Althaf", "Rabiyath"),
    pendingFile("unauthorised", "Rabiyath", "Anusree"),
  ],
  users: [], fileNotifications: [], auditLog: [],
};

const appStatePath = require.resolve(path.join(root, "src/services/appStateService.js"));
require.cache[appStatePath] = {
  id: appStatePath,
  filename: appStatePath,
  loaded: true,
  exports: {
    patchAppState: async (mutator) => {
      centralState = await mutator(structuredClone(centralState));
      return structuredClone(centralState);
    },
    sortFilesNewestFirst: (rows) => rows,
    normalizeFileNotifications: (rows) => rows,
  },
};

const service = require(path.join(root, "src/services/fileService.js"));
const checker = (name) => ({ id: `${name.toLowerCase()}-id`, name, email: `${name.toLowerCase()}@example.com`, role: "Staff Manager" });

async function main() {
  for (const name of ["Althaf", "Nisha", "Rizwana"]) {
    const profile = checker(name);
    await service.markFileChecked(`other-work-${name.toLowerCase()}`, {
      checkingDate: "2026-08-05",
      checkingRemarks: `Verified by ${name}`,
    }, profile.id, profile);
    const file = centralState.files.find((row) => row.id === `other-work-${name.toLowerCase()}`);
    assert.equal(file.checkedBy, name);
    assert.equal(file.checkingRemarks, `Verified by ${name}`);
  }

  await assert.rejects(
    () => service.markFileChecked("own-work", { checkingDate: "2026-08-05", checkingRemarks: "Self check" }, checker("Althaf").id, checker("Althaf")),
    /cannot check a file completed by yourself/
  );
  await assert.rejects(
    () => service.markFileChecked("unauthorised", { checkingDate: "2026-08-05", checkingRemarks: "Checked" }, checker("Anusree").id, checker("Anusree")),
    /Only authorised checkers/
  );

  const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
  assert.match(appSource, /checkingStaffNames = new Set\(\["nisha", "rizwana", "althaf"\]\)/);
  assert.match(appSource, /listView === "notChecked" && canManageChecking\(\) \? \(state\.files \|\| \[\]\) : visibleFiles\(\)/,
    "Authorised checkers must receive all Not Checked files before filtering");
  assert.match(appSource, /const hasRecordedWorker = Boolean/);
  assert.match(appSource, /return !hasRecordedWorker && \(/,
    "Assigned Staff must be only a legacy fallback when identifying self-completed work");
  console.log("Althaf, Nisha and Rizwana all-file checking access and self-check prevention passed.");
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
