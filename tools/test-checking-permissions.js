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
    pendingFile("own-work-nisha", "Nisha", "Rabiyath"),
    pendingFile("own-work-rizwana", "Rizwana", "Rabiyath"),
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
const checkerProfiles = {
  Althaf: { id: "althaf-id", name: "Althaf M K", email: "althafmk2210@gmail.com", role: "Staff Manager" },
  Nisha: { id: "nisha-id", name: "Nisha Gireesh", email: "nishagireesh986@gmail.com", role: "Staff Manager" },
  Rizwana: { id: "rizwana-id", name: "Rizwana Shirin K A", email: "rizwanashir06@gmail.com", role: "Staff Manager" },
};
const checker = (name, role = "Staff Manager") => ({ ...(checkerProfiles[name] || { id: `${name.toLowerCase()}-id`, name, email: `${name.toLowerCase()}@example.com` }), role });

async function main() {
  for (const name of ["Althaf", "Nisha", "Rizwana"]) {
    const profile = checker(name, "Staff");
    await service.markFileChecked(`other-work-${name.toLowerCase()}`, {
      checkingDate: "2026-08-05",
      checkingRemarks: `Verified by ${name}`,
    }, profile.id, profile);
    const file = centralState.files.find((row) => row.id === `other-work-${name.toLowerCase()}`);
    assert.equal(file.checkedBy, checkerProfiles[name].name);
    assert.equal(file.checkingRemarks, `Verified by ${name}`);
  }

  centralState.files.push(pendingFile("staff-manager-check", "Rabiyath", "Althaf"));
  await service.markFileChecked("staff-manager-check", {
    checkingDate: "2026-08-05",
    checkingRemarks: "Verified through Staff Manager compatibility",
  }, checker("Althaf").id, checker("Althaf"));
  assert.equal(centralState.files.find((row) => row.id === "staff-manager-check").checkedBy, "Althaf M K");

  centralState.files.push(pendingFile("normalized-role-check", "Rabiyath", "Althaf"));
  await service.markFileChecked("normalized-role-check", {
    checkingDate: "2026-08-06",
    checkingRemarks: "Verified with normalized role",
  }, checker("Althaf").id, checker("Althaf", "staff_manager"));
  assert.equal(centralState.files.find((row) => row.id === "normalized-role-check").checkedBy, "Althaf M K");

  for (const [name, fileId] of [["Althaf", "own-work"], ["Nisha", "own-work-nisha"], ["Rizwana", "own-work-rizwana"]]) {
    await assert.rejects(
      () => service.markFileChecked(fileId, { checkingDate: "2026-08-05", checkingRemarks: "Self check" }, checker(name).id, checker(name)),
      /cannot check a file completed by yourself/
    );
  }
  await assert.rejects(
    () => service.markFileChecked("unauthorised", { checkingDate: "2026-08-05", checkingRemarks: "Checked" }, checker("Anusree").id, checker("Anusree")),
    /Only authorised checkers/
  );

  const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
  const routeSource = fs.readFileSync(path.join(root, "src", "routes", "fileRoutes.js"), "utf8");
  const serviceSource = fs.readFileSync(path.join(root, "src", "services", "fileService.js"), "utf8");
  assert.match(appSource, /checkingStaffNames = new Set\(\["nisha", "rizwana", "althaf"\]\)/);
  assert.match(appSource, /checkingStaffEmails = new Set\(\["nishagireesh986@gmail\.com", "rizwanashir06@gmail\.com", "althafmk2210@gmail\.com"\]\)/);
  assert.match(appSource, /const nameVariants = staffNameVariants\(user\?\.name \|\| state\.currentUser\)/,
    "Authorised checker recognition must support actual full staff names");
  assert.match(appSource, /navItem\("not-checked-files", "pending", "Not Checked Files", "notChecked"\)/,
    "Not Checked Files must be present in the Staff navigation");
  assert.match(appSource, /\["Staff", "Staff Manager"\]\.includes\(normalizeRole\(state\.currentRole\)\)/,
    "All Staff roles must be allowed to view their Not Checked tab");
  assert.match(appSource, /listView === "notChecked" && isAuthorisedCheckingStaff\(\) \? \(state\.files \|\| \[\]\) : visibleFiles\(\)/,
    "Authorised checkers must receive all Not Checked files before filtering");
  assert.match(appSource, /function filteredFileSource\(listView = state\.filters\.listView \|\| ""\)[\s\S]*?listView === "notChecked" && isAuthorisedCheckingStaff\(\)[\s\S]*?return \(state\.files \|\| \[\]\)\.filter/,
    "The modern filtered page must source every Not Checked file for authorised checkers");
  assert.match(appSource, /const authorisedAllNotCheckedView = isStaffLogin\(\) && f\.listView === "notChecked" && isAuthorisedCheckingStaff\(\)/,
    "The active modern filter path must identify the special all-file view");
  assert.match(appSource, /!authorisedAllNotCheckedView && !currentFileBelongsToUser/,
    "The ordinary staff ownership filter must not remove cross-office Not Checked files for the three authorised checkers");
  assert.match(appSource, /filteredFileSource\(\)\.map\(fileFy\)/,
    "Not Checked filter options must be built from the same cross-office file source");
  assert.match(appSource, /const hasRecordedWorker = Boolean/);
  assert.match(appSource, /return !hasRecordedWorker && \(/,
    "Assigned Staff must be only a legacy fallback when identifying self-completed work");
  assert.match(appSource, /if \(apiToken\(\)\) \{[\s\S]*?markFileCheckedInApi/,
    "Hosted checking must use the dedicated endpoint whenever an API token exists");
  assert.match(appSource, /if \(!allowLocalLoginFallback\(\)\) \{[\s\S]*?login session is unavailable/,
    "Hosted checking must never fall back to a local-only checked state");
  assert.match(routeSource, /router\.post\("\/:id\/check", requireAuth, async/,
    "The checking service must be the single permission authority for the dedicated route");
  assert.doesNotMatch(routeSource, /router\.post\("\/:id\/check", requireAuth, requireRole/,
    "A generic exact-role gate must not reject an authorised checker before domain validation");
  assert.match(serviceSource, /function normalizedRole[\s\S]*?replace\(\/\[_-\]\+\/g, " "\)/,
    "Checking permission must normalize stored role variants");
  console.log("All-staff Not Checked navigation, special checker all-file access and self-check prevention passed.");
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
