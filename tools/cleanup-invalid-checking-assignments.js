require("dotenv").config({ quiet: true });

const crypto = require("crypto");
const { getAppState, saveAppState } = require("../src/services/appStateService");

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function checkerMatchesAssignment(file = {}) {
  const checker = normalize(file.checkedBy);
  if (!checker) return false;
  return [
    file.assignedStaff,
    file.reAssignedStaff,
    file.currentAssignedStaff,
    file.current_assigned_to,
  ].some((value) => checker === normalize(value));
}

async function main() {
  const state = await getAppState();
  const repaired = [];
  state.files = (state.files || []).map((file) => {
    if (!checkerMatchesAssignment(file)) return file;
    repaired.push({ id: file.id, name: file.name, removedCheckedBy: file.checkedBy });
    return {
      ...file,
      checkedBy: "",
      checkedDate: "",
      checkedAt: "",
      checked_at: "",
      finalCompletedAt: "",
      final_completed_at: "",
      checkingRemarks: "",
    };
  });
  if (!repaired.length) {
    console.log("No invalid Checked By assignments found.");
    return;
  }
  const at = new Date().toISOString();
  state.auditLog = [...(state.auditLog || []), {
    id: crypto.randomUUID(),
    action: "Invalid checking assignments cleaned",
    details: { repairedCount: repaired.length, repaired },
    user: "System repair",
    role: "System",
    at,
  }].slice(-1000);
  await saveAppState(state, null);
  console.log(`Cleared invalid checking details from ${repaired.length} file(s).`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
