const assert = require("assert");
const { calculateDashboardCounts } = require("../src/services/fileViewRules");

const files = [
  { id: "received", fileReceivedDate: "2026-08-01", dueDate: "2026-08-10", stages: { Received: true } },
  { id: "allotted", assignedStaff: "Staff A", dueDate: "2026-07-01", stages: { Received: true, Allotted: true } },
  { id: "wip", stages: { Received: true, Allotted: true, WIP: true } },
  { id: "work-done", workDone: true, stages: { Received: true, Allotted: true, WIP: true, "Work Done": true } },
  { id: "client-pending", stages: { Received: true, Allotted: true, WIP: true, "Client Pending": true } },
  { id: "approval-pending", shared: true, approved: false, stages: { Received: true, Allotted: true, WIP: true, "Approval Pending": true } },
  { id: "completed", filed: true, checkedBy: "Manager", checkedDate: "2026-08-01", stages: { Completed: true } },
  { id: "not-checked", filed: true, stages: { Completed: true } },
  { id: "removed", isRemoved: true, stages: { Removed: true } },
  { id: "received", fileReceivedDate: "2026-08-01", stages: { Received: true } },
];

assert.deepStrictEqual(
  calculateDashboardCounts(files, { today: "2026-08-02" }),
  {
    totalFiles: 8,
    activeFiles: 6,
    wipFiles: 5,
    completedFiles: 2,
    overdueFiles: 1,
    notCheckedFiles: 1,
  }
);

console.log("Dashboard count rules passed.");
