const WIP_STATUSES = new Set([
  "Allotted",
  "WIP",
  "Work Done",
  "Client Pending",
  "Approval Pending",
]);

function isRemovedFile(file = {}) {
  return Boolean(file.is_removed || file.isRemoved)
    || String(file.status || file.workflowStatus || "").trim().toLowerCase() === "removed"
    || Boolean(file.stages?.Removed);
}

function isCompletedFile(file = {}) {
  return Boolean(file.filed || file.stages?.Completed);
}

function isCorrectedCompleted(file = {}) {
  const status = String(file.correctionStatus || file.correction_status || "").trim().toLowerCase();
  return Boolean(file.stages?.["Corrected & Completed"] || file.stages?.corrected_completed)
    || ["corrected & completed", "corrected and completed", "corrected_completed", "resubmitted for checking"].includes(status);
}

function hasOpenCorrection(file = {}) {
  const status = String(file.correctionStatus || file.correction_status || "").trim().toLowerCase();
  if (isCorrectedCompleted(file)) return false;
  return Boolean(file.stages?.["Correction Required"])
    || ["correction required", "correction in progress", "returned again", "returned for correction"].includes(status);
}

function isCheckedFile(file = {}) {
  return Boolean(String(file.checkedBy || file.checked_by || "").trim())
    && Boolean(file.checkedDate || file.checked_date || file.checkedAt || file.checked_at);
}

function isCheckedCompletedFile(file = {}) {
  return isCompletedFile(file) && !hasOpenCorrection(file);
}

function isDisplayCompletedFile(file = {}) {
  return isCheckedCompletedFile(file) && !(isCorrectedCompleted(file) && !isCheckedFile(file));
}

function isNotCheckedFile(file = {}) {
  return isCheckedCompletedFile(file) && !isCheckedFile(file);
}

function isActiveFile(file = {}) {
  return !isDisplayCompletedFile(file);
}

function workflowStatus(file = {}) {
  if (hasOpenCorrection(file)) return "Correction Required";
  if (isCorrectedCompleted(file) && !isCheckedFile(file)) return "Corrected & Completed";
  if (isDisplayCompletedFile(file)) return "Completed";
  if (file.stages?.["Approval Pending"] || (file.shared && !file.approved)) return "Approval Pending";
  if (file.stages?.["Client Pending"]) return "Client Pending";
  if (file.workDone || file.stages?.["Work Done"]) return "Work Done";
  if (file.stages?.WIP) return "WIP";
  if (file.stages?.Allotted || hasAssignedStaff(file.assignedStaff)) return "Allotted";
  return "Received";
}

function isWipFile(file = {}) {
  return isActiveFile(file) && WIP_STATUSES.has(workflowStatus(file));
}

function isOverdueFile(file = {}, today = indiaDate()) {
  const dueDate = normalizeDateOnly(file.dueDate || file.due_date);
  return Boolean(dueDate && dueDate < today && !isDisplayCompletedFile(file));
}

function calculateDashboardCounts(files = [], options = {}) {
  const rows = dedupeFiles(files).filter((file) => !isRemovedFile(file));
  const today = options.today || indiaDate();
  return {
    totalFiles: rows.length,
    activeFiles: rows.filter(isActiveFile).length,
    wipFiles: rows.filter(isWipFile).length,
    completedFiles: rows.filter(isDisplayCompletedFile).length,
    overdueFiles: rows.filter((file) => isOverdueFile(file, today)).length,
    notCheckedFiles: rows.filter(isNotCheckedFile).length,
  };
}

function dedupeFiles(files = []) {
  const seen = new Set();
  return files.filter((file, index) => {
    const id = String(file?.id || file?.fileId || file?.file_id || "").trim();
    const key = id ? `id:${id}` : `row:${index}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hasAssignedStaff(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return Boolean(normalized && !["not assigned", "not allotted", "na", "n/a", "-"].includes(normalized));
}

function normalizeDateOnly(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const local = raw.match(/^(\d{1,2})[-/]([0-9]{1,2})[-/](\d{4})/);
  if (local) return `${local[3]}-${local[2].padStart(2, "0")}-${local[1].padStart(2, "0")}`;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
}

function indiaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

module.exports = {
  WIP_STATUSES,
  calculateDashboardCounts,
  dedupeFiles,
  hasOpenCorrection,
  isActiveFile,
  isCheckedCompletedFile,
  isCheckedFile,
  isCompletedFile,
  isCorrectedCompleted,
  isDisplayCompletedFile,
  isNotCheckedFile,
  isOverdueFile,
  isRemovedFile,
  isWipFile,
  workflowStatus,
};
