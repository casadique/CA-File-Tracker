const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
let centralState = {
  files: [{
    id: "file-1", name: "Correction Workflow Test", serviceType: "ITR Filing",
    assignedStaff: "Test Staff", filed: true, checkedBy: "Manager", checkedDate: "2026-08-05",
    stages: { Received: true, Allotted: true, WIP: true, "Work Done": true, Completed: true },
  }],
  users: [{ id: "staff-1", name: "Test Staff", email: "staff@example.com", role: "Staff" }],
  correctionHistory: [], fileNotifications: [], auditLog: [],
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
const manager = { id: "manager-1", name: "Manager", email: "manager@example.com", role: "Manager" };
const staff = { id: "staff-1", name: "Test Staff", email: "staff@example.com", role: "Staff" };

async function main() {
  await assert.rejects(
    () => service.upsertFile({
      ...centralState.files[0],
      filed: false,
      correctionRemarks: "Correct the computation",
      stages: { ...centralState.files[0].stages, Completed: false, "Correction Required": true },
    }, manager.id, manager),
    /Expected correction date is required/
  );
  await assert.rejects(
    () => service.returnFileForCorrection("file-1", { correctionReason: "Correct the computation" }, manager.id, manager),
    /Expected correction date is required/
  );
  await service.returnFileForCorrection("file-1", {
    correctionReason: "Correct the computation",
    expectedCorrectionDate: "2026-08-08",
  }, manager.id, manager);
  let returned = centralState.files[0];
  assert.equal(returned.expectedCorrectionDate, "2026-08-08");
  assert.equal(returned.correctionHistory[0].expectedCorrectionDate, "2026-08-08");

  await assert.rejects(
    () => service.upsertFile({ ...returned, filed: true, stages: { ...returned.stages, Completed: true, "Correction Required": false, "Corrected & Completed": false } }, staff.id, staff),
    /cannot be marked Completed/
  );
  await assert.rejects(
    () => service.upsertFile({ ...returned, filed: true, stages: { ...returned.stages, Completed: true, "Correction Required": false, "Corrected & Completed": true } }, staff.id, staff),
    /Correction response is required/
  );

  const correctionHistory = returned.correctionHistory.map((row) => ({ ...row, response: "Recomputed and replaced the incorrect statement." }));
  await service.upsertFile({
    ...returned,
    filed: true,
    correctionResponse: "Recomputed and replaced the incorrect statement.",
    correctionHistory,
    correctionStatus: "Corrected & Completed",
    stages: { ...returned.stages, Completed: true, "Correction Required": false, "Corrected & Completed": true },
  }, staff.id, staff);
  assert.equal(centralState.files[0].correctionResponse, "Recomputed and replaced the incorrect statement.");
  assert.equal(centralState.correctionHistory[0].response, "Recomputed and replaced the incorrect statement.");

  const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
  assert.match(appSource, /Expected correction date \(YYYY-MM-DD\)/);
  assert.match(appSource, /formField\("expectedCorrectionDate", "Expected Correction Date"/);
  assert.match(appSource, /bindCorrectionWorkflowFields\(\)/);
  assert.match(appSource, /Expected Correction Date/);
  assert.match(appSource, /markingCorrectionRequired[\s\S]*?newCorrectionEntry/);
  assert.match(appSource, /Select Corrected & Completed instead of Completed/);
  assert.match(appSource, /Describe the correction completed \/ correction response/);
  assert.match(appSource, /markLatestCorrectionResubmitted\(existingFile, "Corrected & Completed", correctionResponse\)/);
  assert.match(appSource, /Response \/ Remarks[\s\S]*?details\.response/);
  console.log("Correction expected-date, corrected completion and mandatory response rules passed.");
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
