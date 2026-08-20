const UNASSIGNED = "UNASSIGNED";
const UNASSIGNED_LABEL = "Not Allotted";

const UNASSIGNED_ALIASES = new Set([
  "",
  "unassigned",
  "not assigned",
  "not allotted",
  "none",
  "null",
]);

function isUnassignedAssignment(value) {
  return UNASSIGNED_ALIASES.has(String(value ?? "").trim().toLowerCase());
}

function hasAssignedStaffValue(value) {
  return !isUnassignedAssignment(value);
}

function assignmentDisplayLabel(value) {
  return isUnassignedAssignment(value) ? UNASSIGNED_LABEL : String(value || "").trim();
}

function normalizeFileAssignment(file = {}) {
  const reassigned = file.reAssignedStaff || file.re_assigned_staff || "";
  const assigned = reassigned || file.assignedStaff || file.assigned_staff || "";
  const hasIdentity = Boolean(
    file.reAssignedStaffId || file.reAssignedStaffEmail || file.reassigned_to_id
    || file.assignedStaffId || file.assignedStaffEmail || file.assigned_staff_id
  );
  const unassigned = !hasIdentity && isUnassignedAssignment(assigned);
  if (!unassigned) return { ...file, assignmentStatus: "ALLOTTED" };
  return {
    ...file,
    assignmentStatus: UNASSIGNED,
    assignedStaff: UNASSIGNED_LABEL,
    assigned_staff: Object.prototype.hasOwnProperty.call(file, "assigned_staff") ? UNASSIGNED_LABEL : file.assigned_staff,
  };
}

module.exports = {
  UNASSIGNED,
  UNASSIGNED_LABEL,
  isUnassignedAssignment,
  hasAssignedStaffValue,
  assignmentDisplayLabel,
  normalizeFileAssignment,
};
