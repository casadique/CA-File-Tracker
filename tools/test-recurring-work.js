const assert = require("assert");
const fs = require("fs");
const path = require("path");
const recurring = require("../src/services/recurringWorkService");

assert.equal(recurring.periodEnd("2026-07-01", "Monthly", 1), "2026-07-31");
assert.equal(recurring.nextPeriod("2026-07-01", "Quarterly", 1), "2026-10-01");
assert.equal(recurring.financialYear("2027-01-01"), "2026-27");
assert.equal(recurring.periodLabel("2026-04-01", "Quarterly", 1), "Q1 FY 2026-27");
assert.equal(recurring.periodLabel("2027-01-01", "Quarterly", 1), "Q4 FY 2026-27");
assert.equal(recurring.periodLabel("2026-04-01", "Half-yearly", 1), "H1 FY 2026-27");
assert.equal(recurring.periodLabel("2026-04-01", "Annual", 1), "FY 2026-27");
assert.equal(recurring.ruleDate("2026-07-01", "2026-07-31", { type: "Fixed day in following month", day: 20 }), "2026-08-20");
assert.equal(recurring.ruleDate("2026-07-01", "2026-07-31", { type: "N days after period end", days: 10 }), "2026-08-10");

const root = path.join(__dirname, "..");
const migration = fs.readFileSync(path.join(root, "database/migrations/20260830_recurring_work_scheduler.sql"), "utf8");
const client = fs.readFileSync(path.join(root, "recurring-client.js"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
for (const token of ["for update", "unique (recurring_schedule_id, period_start, work_type)", "generate_recurring_work", "jsonb_set(state,'{files}'", "insert into public.file_records"]) assert(migration.toLowerCase().includes(token.toLowerCase()), `Migration missing ${token}`);
for (const token of ["Active Schedules", "Upcoming Work", "Generated Work", "Generation History", "Paused Schedules", "Templates", "Settings", "Generate Now", "Skip Next", "Continue from current period"]) assert(client.includes(token), `Client missing ${token}`);
for (const token of ["recurringWork", "Make Recurring", "Add Recurring Work", "Recurring Services"]) assert(app.includes(token), `App integration missing ${token}`);
console.log("Recurring work scheduler checks passed.");
