const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ids = { admin: "auth-admin", nisha: "auth-nisha", althaf: "auth-althaf", rahul: "auth-rahul", chindu: "auth-chindu", najma: "auth-najma" };
const profiles = {
  admin: { id: "p-admin", auth_user_id: ids.admin, name: "CA Sadique", email: "admin@example.com", role: "Admin", permissions: [] },
  nisha: { id: "p-nisha", auth_user_id: ids.nisha, name: "Nisha", email: "nisha@example.com", role: "Staff", permissions: ["can_assign_todo"] },
  althaf: { id: "p-althaf", auth_user_id: ids.althaf, name: "Althaf", email: "althaf@example.com", role: "Staff", permissions: ["can_assign_todo"] },
  rahul: { id: "p-rahul", auth_user_id: ids.rahul, name: "Rahul", email: "rahul@example.com", role: "Staff", permissions: [] },
  chindu: { id: "p-chindu", auth_user_id: ids.chindu, name: "Chindu", email: "chindu@example.com", role: "Staff", permissions: ["can_assign_todo"] },
};

function identity(prefix, profile) {
  return { [prefix]: profile.auth_user_id, [`${prefix}_id`]: profile.auth_user_id, [`${prefix}_profile_id`]: profile.id, [`${prefix}_email`]: profile.email, [`${prefix}_name`]: profile.name };
}
function task(id, creator, assignee, title, status = "Pending") {
  return { id, title, status, priority: "Medium", due_date: "2099-08-20", created_at: "2026-08-18T00:00:00Z", updated_at: "2026-08-18T00:00:00Z", ...identity("created_by", creator), ...identity("assigned_by", creator), ...identity("assigned_to", assignee) };
}

let centralState = {
  todoTasks: [
    task("rahul-personal", profiles.rahul, profiles.rahul, "Rahul personal"),
    task("admin-to-rahul", profiles.admin, profiles.rahul, "Admin assigned"),
    task("nisha-to-rahul", profiles.nisha, profiles.rahul, "Nisha assigned"),
    task("althaf-to-rahul", profiles.althaf, profiles.rahul, "Althaf assigned"),
    task("nisha-personal", profiles.nisha, profiles.nisha, "Nisha personal"),
    task("najma-to-chindu", { ...profiles.chindu, auth_user_id: ids.najma, id: "p-najma", name: "Najma", email: "najma@example.com" }, profiles.chindu, "Unrelated private task"),
  ],
  todoActivity: [], fileNotifications: [], users: [],
};

const appStatePath = require.resolve("../src/services/appStateService");
const configPath = require.resolve("../src/config/supabase");
require.cache[appStatePath] = { id: appStatePath, filename: appStatePath, loaded: true, exports: {
  getAppState: async () => structuredClone(centralState),
  patchAppStateAtomic: async (mutator) => { centralState = await mutator(structuredClone(centralState)); return structuredClone(centralState); },
} };

let selectedAuthId = "";
const userRows = Object.values(profiles);
const query = {
  select() { return this; }, eq(column, value) { if (column === "auth_user_id") selectedAuthId = value; return this; },
  async maybeSingle() { const row = userRows.find((profile) => profile.auth_user_id === selectedAuthId); return { data: row ? { ...row, is_active: true } : null, error: null }; },
};
require.cache[configPath] = { id: configPath, filename: configPath, loaded: true, exports: { supabaseAdmin: { from: () => query } } };

const servicePath = require.resolve("../src/services/todoService");
delete require.cache[servicePath];
const { canAssignTodo, dueTodoReminders, updateTodo, updateTodoReminder, visibleTodoTasks } = require(servicePath);

(async () => {
  assert.equal(canAssignTodo(profiles.admin), true);
  assert.equal(canAssignTodo(profiles.nisha), true);
  assert.equal(canAssignTodo(profiles.rahul), false);
  assert.equal(canAssignTodo({ role: "Manager", permissions: [] }), true);
  assert.equal(canAssignTodo({ role: "Co-ordinator", permissions: [] }), true);

  assert.deepEqual(visibleTodoTasks(centralState, ids.rahul, profiles.rahul).map((row) => row.id).sort(), ["admin-to-rahul", "althaf-to-rahul", "nisha-to-rahul", "rahul-personal"]);
  assert.deepEqual(visibleTodoTasks(centralState, ids.nisha, profiles.nisha).map((row) => row.id).sort(), ["nisha-personal", "nisha-to-rahul"]);
  assert.equal(visibleTodoTasks(centralState, ids.admin, profiles.admin).length, 6);
  assert.deepEqual(visibleTodoTasks(centralState, ids.rahul, profiles.rahul, { scope: "personal" }).map((row) => row.id), ["rahul-personal"]);
  assert.deepEqual(visibleTodoTasks(centralState, ids.rahul, profiles.rahul, { scope: "assigned-to-me" }).map((row) => row.id).sort(), ["admin-to-rahul", "althaf-to-rahul", "nisha-to-rahul"]);
  assert.deepEqual(visibleTodoTasks(centralState, ids.nisha, profiles.nisha, { scope: "assigned-by-me" }).map((row) => row.id), ["nisha-to-rahul"]);

  await assert.rejects(() => updateTodo("althaf-to-rahul", { title: "Nisha must not edit this" }, ids.nisha, profiles.nisha), (error) => error.status === 403);
  await assert.rejects(() => updateTodo("nisha-to-rahul", { assigned_to_id: ids.chindu }, ids.rahul, profiles.rahul), (error) => error.status === 403);

  const assigneeUpdate = await updateTodo("nisha-to-rahul", { title: "Tampered title", status: "Completed", remarks: "Done" }, ids.rahul, profiles.rahul);
  assert.equal(assigneeUpdate.task.title, "Nisha assigned", "Assignee cannot alter original title");
  assert.equal(assigneeUpdate.task.status, "Completed");
  assert.equal(assigneeUpdate.task.completed_by, ids.rahul);

  await assert.rejects(() => updateTodo("nisha-to-rahul", { title: "Late edit" }, ids.nisha, profiles.nisha), (error) => error.status === 409);
  const assignerUpdate = await updateTodo("nisha-personal", { title: "Updated by Nisha", assigned_to_id: ids.chindu }, ids.nisha, profiles.nisha);
  assert.equal(assignerUpdate.task.title, "Updated by Nisha");
  assert.equal(assignerUpdate.task.assigned_to_id, ids.chindu);

  centralState.todoTasks.find((row) => row.id === "admin-to-rahul").reminder_at = "2000-01-01T00:00:00.000Z";
  const firstReminderPoll = await dueTodoReminders(ids.rahul, profiles.rahul);
  assert.equal(firstReminderPoll.reminders.length, 1);
  assert.equal(firstReminderPoll.notices.length, 1);
  const secondReminderPoll = await dueTodoReminders(ids.rahul, profiles.rahul);
  assert.equal(secondReminderPoll.reminders.length, 1, "Unacknowledged reminder remains visible");
  assert.equal(secondReminderPoll.notices.length, 0, "Reminder event is idempotent");
  await updateTodoReminder("admin-to-rahul", { action: "dismiss", occurrence_key: firstReminderPoll.reminders[0].occurrence_key }, ids.rahul, profiles.rahul);
  assert.equal((await dueTodoReminders(ids.rahul, profiles.rahul)).reminders.length, 0, "Dismissed reminder does not repeat");

  const routeSource = fs.readFileSync(path.resolve(__dirname, "..", "src", "routes", "stateRoutes.js"), "utf8");
  const schemaSource = fs.readFileSync(path.resolve(__dirname, "..", "database", "20260818_todo_privacy.sql"), "utf8");
  const uiSource = fs.readFileSync(path.resolve(__dirname, "..", "todo-client.js"), "utf8");
  assert.match(routeSource, /todoTasks:\s*visibleTodoTasks/);
  assert.match(routeSource, /todoActivity = .*visibleTodoIds/);
  assert.match(routeSource, /todoReminderEvents = .*visibleTodoIds/);
  assert.match(schemaSource, /revoke select, insert, update, delete/);
  assert.match(uiSource, /All Staff To-Dos/);
  assert.match(uiSource, /Assigned by Me/);
  assert.match(uiSource, /Assigned to Me/);
  console.log("To-Do privacy, assignment, editing and database-boundary tests passed.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
