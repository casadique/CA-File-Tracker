const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const ui = fs.readFileSync(path.join(root, "todo-client.js"), "utf8");
const css = fs.readFileSync(path.join(root, "todo.css"), "utf8");
const service = fs.readFileSync(path.join(root, "src", "services", "todoService.js"), "utf8");
const routes = fs.readFileSync(path.join(root, "src", "routes", "todoRoutes.js"), "utf8");

assert.match(ui, /Add To-Do/);
assert.match(ui, /Create a reminder or assign a task/);
assert.match(ui, /Task Description \/ Remarks/);
assert.equal((ui.match(/id="todoFormDetails"/g) || []).length, 1, "Add/Edit form must have one multiline content field");
assert.doesNotMatch(ui, /id="todoFormDescription"|id="todoFormRemarks"|id="todoFormWaiting"/);
assert.match(ui, /<th>SN<\/th>.*Task Title.*Created On.*Due On.*Due Time.*Priority.*Assigned To.*Status.*<th>Actions<\/th>/s);
assert.match(ui, /data-todo-actions/);
assert.match(ui, /View Details.*Edit.*Update Status.*Mark Completed.*Snooze Reminder.*View History.*Duplicate.*Delete/s);
assert.match(ui, /Alert — Task Due/);
assert.match(ui, /Open Task.*Snooze.*Mark Completed.*Dismiss/s);
assert.match(ui, /BroadcastChannel\("fineasy-todo-reminders"\)/);
assert.match(ui, /sessionStorage\.setItem\(`todo-sound:/);
assert.match(ui, /You have unsaved changes\. Are you sure you want to close\?/);
assert.match(css, /width:\s*min\(52vw,\s*780px\)/);
assert.match(css, /\.todo-table th, \.todo-table td\s*\{[^}]*border-right:[^}]*border-bottom:/s);
assert.match(css, /@media \(max-width: 640px\)[\s\S]*\.todo-form-grid \{ grid-template-columns: 1fr;/);
assert.match(service, /deleted_at:\s*deletedAt/);
assert.match(service, /occurrence_key/);
assert.match(service, /Due date is required for assigned tasks/);
assert.match(service, /Reminder date and time cannot be later/);
assert.match(routes, /reminders\/due/);
assert.match(routes, /:id\/reminder/);

console.log("To-Do compact modal, table, actions, reminder and responsive acceptance checks passed.");
