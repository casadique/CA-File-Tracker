const crypto = require("crypto");
const { getAppState, patchAppStateAtomic } = require("./appStateService");
const { supabaseAdmin } = require("../config/supabase");
const { createNotificationEvent } = require("./notificationEventService");

const TODO_STATUSES = new Set(["Pending", "In Progress", "Waiting", "Completed", "Cancelled"]);
const TODO_PRIORITIES = new Set(["Low", "Medium", "High", "Urgent"]);

function permissionSet(profile = {}) {
  const raw = profile.permissions || profile.role_permissions || [];
  return new Set(Array.isArray(raw) ? raw : Object.keys(raw || {}).filter((key) => raw[key]));
}

function isTodoAdmin(profile = {}) {
  return String(profile.role || "") === "Admin";
}

function canAssignTodo(profile = {}) {
  return isTodoAdmin(profile) || permissionSet(profile).has("can_assign_todo");
}

function actorIdentity(userId, profile = {}) {
  return {
    id: String(userId || ""),
    profileId: String(profile.id || ""),
    email: String(profile.email || "").trim().toLowerCase(),
    name: String(profile.name || profile.email || "User").trim(),
    role: String(profile.role || "Staff"),
  };
}

function identityMatches(task = {}, prefix, actor = {}) {
  const id = String(task[`${prefix}_id`] || task[prefix] || "");
  const email = String(task[`${prefix}_email`] || "").trim().toLowerCase();
  return Boolean((id && [actor.id, actor.profileId].includes(id)) || (email && email === actor.email));
}

function canViewTodo(task, actor, profile) {
  return isTodoAdmin(profile)
    || identityMatches(task, "assigned_to", actor)
    || identityMatches(task, "created_by", actor)
    || identityMatches(task, "assigned_by", actor);
}

function visibleTodoTasks(state, userId, profile = {}, query = {}) {
  const actor = actorIdentity(userId, profile);
  let rows = (state.todoTasks || []).filter((task) => canViewTodo(task, actor, profile));
  const scope = String(query.scope || "all").toLowerCase();
  if (scope === "mine" || scope === "my-tasks") rows = rows.filter((task) => identityMatches(task, "assigned_to", actor));
  if (scope === "personal") rows = rows.filter((task) => identityMatches(task, "created_by", actor) && identityMatches(task, "assigned_to", actor));
  if (scope === "assigned-to-me") rows = rows.filter((task) => identityMatches(task, "assigned_to", actor) && !identityMatches(task, "created_by", actor));
  if (scope === "assigned-by-me") rows = rows.filter((task) => identityMatches(task, "assigned_by", actor) && !identityMatches(task, "assigned_to", actor));
  if (scope === "completed") rows = rows.filter((task) => task.status === "Completed");
  if (scope === "all-staff" && !isTodoAdmin(profile)) rows = rows.filter((task) => canViewTodo(task, actor, profile));

  const status = String(query.status || "").trim();
  const priority = String(query.priority || "").trim();
  const assignedTo = String(query.assigned_to || query.assignedTo || "").trim();
  const search = String(query.search || "").trim().toLowerCase();
  if (status) rows = rows.filter((task) => task.status === status);
  if (priority) rows = rows.filter((task) => task.priority === priority);
  if (assignedTo && isTodoAdmin(profile)) rows = rows.filter((task) => task.assigned_to_id === assignedTo || task.assigned_to === assignedTo);
  if (search) rows = rows.filter((task) => [task.title, task.description, task.remarks, task.waiting_remarks, task.assigned_to_name, task.assigned_by_name].some((value) => String(value || "").toLowerCase().includes(search)));
  return rows.sort(todoSort);
}

async function listTodos(userId, profile, query = {}) {
  return visibleTodoTasks(await getAppState(), userId, profile, query);
}

async function todoPageData(userId, profile, query = {}) {
  const state = await getAppState();
  const tasks = visibleTodoTasks(state, userId, profile, query);
  const today = indiaDate();
  const dashboard = { summary: summarizeTodos(tasks, today), staff: [] };
  if (isTodoAdmin(profile) && String(query.scope || "").toLowerCase() === "all-staff") dashboard.staff = staffTodoSummary(state.todoTasks || [], today);
  return { tasks, dashboard };
}

async function todoMeta(userId, profile) {
  const { data, error } = await supabaseAdmin
    .from("app_users")
    .select("id, auth_user_id, email, name, role, permissions, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) throw error;
  const actor = actorIdentity(userId, profile);
  const users = (data || []).map(publicTodoUser);
  return {
    isAdmin: isTodoAdmin(profile),
    canAssign: canAssignTodo(profile),
    currentUser: publicTodoUser({ ...profile, auth_user_id: userId }),
    assignableUsers: canAssignTodo(profile) ? users : users.filter((item) => item.authUserId === actor.id || item.id === actor.profileId),
  };
}

async function createTodo(payload, userId, profile) {
  const actor = actorIdentity(userId, profile);
  const assignee = await resolveAssignee(payload.assigned_to_id || payload.assignedToId || userId, actor, profile);
  let createdTask;
  let notices = [];
  const state = await patchAppStateAtomic((current) => {
    notices = [];
    const now = new Date().toISOString();
    createdTask = {
      id: crypto.randomUUID(),
      title: requiredText(payload.title, "Task title", 240),
      description: cleanText(payload.description, 4000),
      priority: TODO_PRIORITIES.has(payload.priority) ? payload.priority : "Medium",
      status: "Pending",
      due_date: cleanDate(payload.due_date || payload.dueDate),
      due_time: cleanTime(payload.due_time || payload.dueTime),
      reminder_at: cleanDateTime(payload.reminder_at || payload.reminderAt),
      remarks: "",
      waiting_remarks: "",
      ...identityFields("created_by", actor),
      ...identityFields("assigned_by", actor),
      ...identityFields("assigned_to", assignee),
      created_at: now,
      updated_at: now,
      completed_by: "",
      completed_by_name: "",
      completed_at: null,
    };
    current.todoTasks = [createdTask, ...(current.todoTasks || [])];
    appendActivity(current, createdTask, actor, "Task created", { assignedTo: assignee.name });
    if (assignee.id !== actor.id) notices = appendTodoNotification(current, assignmentNotice(createdTask, actor, assignee));
    return current;
  }, userId);
  return { state, task: createdTask, notices };
}

async function updateTodo(taskId, payload, userId, profile) {
  const actor = actorIdentity(userId, profile);
  let savedTask;
  let notices = [];
  const state = await patchAppStateAtomic(async (current) => {
    notices = [];
    const index = (current.todoTasks || []).findIndex((task) => task.id === taskId);
    if (index < 0) throw httpError("To-Do task not found.", 404);
    const before = current.todoTasks[index];
    if (!canViewTodo(before, actor, profile)) throw httpError("You do not have permission to view this task.", 403);
    const admin = isTodoAdmin(profile);
    const creator = identityMatches(before, "created_by", actor) || identityMatches(before, "assigned_by", actor);
    const assignee = identityMatches(before, "assigned_to", actor);
    const personalOwner = creator && assignee;
    const next = { ...before };
    const attemptsContentChange = ["title", "description", "priority", "due_date", "dueDate", "due_time", "dueTime", "reminder_at", "reminderAt", "assigned_to_id", "assignedToId"]
      .some((key) => Object.prototype.hasOwnProperty.call(payload, key) && payload[key] !== undefined);
    if (before.status === "Completed" && !admin && attemptsContentChange) throw httpError("Completed tasks cannot be edited or reassigned. Admin can reopen the task first.", 409);

    if (admin || creator || personalOwner) {
      if (Object.prototype.hasOwnProperty.call(payload, "title")) next.title = requiredText(payload.title, "Task title", 240);
      if (Object.prototype.hasOwnProperty.call(payload, "description")) next.description = cleanText(payload.description, 4000);
      if (Object.prototype.hasOwnProperty.call(payload, "priority")) next.priority = TODO_PRIORITIES.has(payload.priority) ? payload.priority : next.priority;
      if (Object.prototype.hasOwnProperty.call(payload, "due_date") || Object.prototype.hasOwnProperty.call(payload, "dueDate")) next.due_date = cleanDate(payload.due_date || payload.dueDate);
      if (Object.prototype.hasOwnProperty.call(payload, "due_time") || Object.prototype.hasOwnProperty.call(payload, "dueTime")) next.due_time = cleanTime(payload.due_time || payload.dueTime);
      if (Object.prototype.hasOwnProperty.call(payload, "reminder_at") || Object.prototype.hasOwnProperty.call(payload, "reminderAt")) next.reminder_at = cleanDateTime(payload.reminder_at || payload.reminderAt);
    }

    const requestedAssignee = payload.assigned_to_id || payload.assignedToId;
    if (requestedAssignee && requestedAssignee !== before.assigned_to_id) {
      if (!(admin || (creator && canAssignTodo(profile)))) throw httpError("You cannot reassign this task.", 403);
      const target = await resolveAssignee(requestedAssignee, actor, profile);
      Object.assign(next, identityFields("assigned_to", target));
      notices.push(...appendTodoNotification(current, assignmentNotice(next, actor, target)));
    }

    if (Object.prototype.hasOwnProperty.call(payload, "status")) {
      if (!(admin || creator || assignee)) throw httpError("You cannot change this task status.", 403);
      if (!TODO_STATUSES.has(payload.status)) throw httpError("Invalid To-Do status.", 400);
      next.status = payload.status;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "remarks") && (admin || creator || assignee)) next.remarks = cleanText(payload.remarks, 4000);
    if (Object.prototype.hasOwnProperty.call(payload, "waiting_remarks") && (admin || creator || assignee)) next.waiting_remarks = cleanText(payload.waiting_remarks, 4000);

    const justCompleted = before.status !== "Completed" && next.status === "Completed";
    if (justCompleted) {
      next.completed_by = actor.id;
      next.completed_by_name = actor.name;
      next.completed_at = new Date().toISOString();
      const assignedBy = todoIdentity(before, "assigned_by");
      if (assignedBy.id && assignedBy.id !== actor.id) notices.push(...appendTodoNotification(current, completionNotice(next, actor, assignedBy)));
    } else if (before.status === "Completed" && next.status !== "Completed") {
      if (!(admin || creator)) throw httpError("Only Admin or the task assigner can reopen this task.", 403);
      next.completed_by = "";
      next.completed_by_name = "";
      next.completed_at = null;
    }
    next.updated_at = new Date().toISOString();
    current.todoTasks[index] = next;
    savedTask = next;
    appendActivity(current, next, actor, activityLabel(before, next), changedTodoFields(before, next));
    return current;
  }, userId);
  return { state, task: savedTask, notices };
}

async function deleteTodo(taskId, userId, profile) {
  const actor = actorIdentity(userId, profile);
  return patchAppStateAtomic((state) => {
    const index = (state.todoTasks || []).findIndex((task) => task.id === taskId);
    if (index < 0) throw httpError("To-Do task not found.", 404);
    const task = state.todoTasks[index];
    const creator = identityMatches(task, "created_by", actor) || identityMatches(task, "assigned_by", actor);
    if (!isTodoAdmin(profile) && !(creator && task.status !== "Completed")) throw httpError("You cannot delete this task.", 403);
    state.todoTasks.splice(index, 1);
    appendActivity(state, task, actor, "Task deleted", {});
    return state;
  }, userId);
}

async function todoHistory(taskId, userId, profile) {
  const state = await getAppState();
  const actor = actorIdentity(userId, profile);
  const task = (state.todoTasks || []).find((item) => item.id === taskId);
  if (!task) throw httpError("To-Do task not found.", 404);
  if (!canViewTodo(task, actor, profile)) throw httpError("You do not have permission to view this task history.", 403);
  return (state.todoActivity || []).filter((item) => item.task_id === taskId).sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

async function todoDashboard(userId, profile, query = {}) {
  const state = await getAppState();
  const tasks = visibleTodoTasks(state, userId, profile, query);
  const today = indiaDate();
  const summary = summarizeTodos(tasks, today);
  if (!isTodoAdmin(profile)) return { summary, staff: [] };
  return { summary, staff: staffTodoSummary(state.todoTasks || [], today) };
}

function staffTodoSummary(tasks, today) {
  const staff = new Map();
  for (const task of tasks) {
    const key = task.assigned_to_id || task.assigned_to_email || "unassigned";
    const row = staff.get(key) || { id: key, name: task.assigned_to_name || "Unassigned", pending: 0, dueToday: 0, overdue: 0, upcoming: 0, completed: 0 };
    const bucket = todoBucket(task, today);
    if (bucket === "completed") row.completed += 1;
    else { row.pending += 1; if (bucket === "dueToday") row.dueToday += 1; if (bucket === "overdue") row.overdue += 1; if (bucket === "upcoming") row.upcoming += 1; }
    staff.set(key, row);
  }
  return [...staff.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function summarizeTodos(tasks, today = indiaDate()) {
  return tasks.reduce((result, task) => {
    const bucket = todoBucket(task, today);
    if (bucket === "completed") {
      result.completed += 1;
      if (task.completed_at && indiaDate(task.completed_at) === today) result.completedToday += 1;
    }
    else result.pending += 1;
    if (bucket === "dueToday") result.dueToday += 1;
    if (bucket === "overdue") result.overdue += 1;
    if (bucket === "upcoming") result.upcoming += 1;
    return result;
  }, { pending: 0, dueToday: 0, overdue: 0, upcoming: 0, completed: 0, completedToday: 0 });
}

function todoBucket(task, today) {
  if (task.status === "Completed") return "completed";
  if (!task.due_date) return "pending";
  if (task.due_date < today) return "overdue";
  if (task.due_date === today) return "dueToday";
  return "upcoming";
}

function appendActivity(state, task, actor, action, changes) {
  state.todoActivity = [...(state.todoActivity || []), { id: crypto.randomUUID(), task_id: task.id, action, changes, actor_id: actor.id, actor_name: actor.name, created_at: new Date().toISOString() }].slice(-3000);
}

function appendTodoNotification(state, notice) {
  state.fileNotifications = [notice, ...(state.fileNotifications || []).filter((row) => row.id !== notice.id)].slice(0, 800);
  return [notice];
}

function assignmentNotice(task, actor, assignee) {
  const due = task.due_date ? ` - Due ${task.due_date.split("-").reverse().join("-")}` : "";
  return createNotificationEvent({ eventKey: `todo-assigned:${task.id}:${task.updated_at || task.created_at}:${assignee.id}`, eventType: "New Task Assigned", changeType: "New Task Assigned", fileId: task.id, sourceEventId: task.updated_at || task.created_at, fileName: task.title, changeText: `${actor.name} assigned you a task: ${task.title}${due}`, changedBy: actor.name, changedByRole: actor.role, recipient: { id: assignee.profileId, authUserId: assignee.id, email: assignee.email, name: assignee.name }, category: "todo", route: `/?page=todo&todo=${encodeURIComponent(task.id)}`, tone: "progress" });
}

function completionNotice(task, actor, assignedBy) {
  return createNotificationEvent({ eventKey: `todo-completed:${task.id}:${task.completed_at}:${assignedBy.id}`, eventType: "Task Completed", changeType: "Task Completed", fileId: task.id, sourceEventId: task.completed_at, fileName: task.title, changeText: `${actor.name} completed: ${task.title}`, changedBy: actor.name, changedByRole: actor.role, recipient: { id: assignedBy.profileId, authUserId: assignedBy.id, email: assignedBy.email, name: assignedBy.name }, category: "todo", route: `/?page=todo&todo=${encodeURIComponent(task.id)}`, tone: "approval" });
}

async function resolveAssignee(requestedId, actor, profile) {
  if (!canAssignTodo(profile)) return actor;
  const { data, error } = await supabaseAdmin.from("app_users").select("id, auth_user_id, email, name, role, is_active").eq("auth_user_id", requestedId).eq("is_active", true).maybeSingle();
  if (error) throw error;
  if (!data) throw httpError("Selected assignee is not an active user.", 400);
  return actorIdentity(data.auth_user_id, data);
}

function publicTodoUser(profile = {}) { return { id: profile.id || "", authUserId: profile.auth_user_id || profile.authUserId || "", email: profile.email || "", name: profile.name || "", role: profile.role || "Staff" }; }
function identityFields(prefix, identity) { return { [prefix]: identity.id, [`${prefix}_id`]: identity.id, [`${prefix}_profile_id`]: identity.profileId || "", [`${prefix}_email`]: identity.email, [`${prefix}_name`]: identity.name }; }
function todoIdentity(task, prefix) { return { id: task[`${prefix}_id`] || task[prefix] || "", profileId: task[`${prefix}_profile_id`] || "", email: task[`${prefix}_email`] || "", name: task[`${prefix}_name`] || "" }; }
function requiredText(value, label, max) { const text = cleanText(value, max); if (!text) throw httpError(`${label} is required.`, 400); return text; }
function cleanText(value, max = 4000) { return String(value || "").trim().slice(0, max); }
function cleanDate(value) { const text = String(value || "").trim(); if (!text) return ""; if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw httpError("Invalid due date.", 400); return text; }
function cleanTime(value) { const text = String(value || "").trim(); if (!text) return ""; if (!/^\d{2}:\d{2}$/.test(text)) throw httpError("Invalid due time.", 400); return text; }
function cleanDateTime(value) { const text = String(value || "").trim(); if (!text) return ""; if (!Number.isFinite(Date.parse(text))) throw httpError("Invalid reminder date and time.", 400); return new Date(text).toISOString(); }
function indiaDate(value = new Date()) { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value)); }
function todoSort(a, b) { const done = Number(a.status === "Completed") - Number(b.status === "Completed"); if (done) return done; return String(a.due_date || "9999-12-31").localeCompare(String(b.due_date || "9999-12-31")) || Date.parse(b.updated_at || 0) - Date.parse(a.updated_at || 0); }
function activityLabel(before, after) { if (before.status !== after.status) return after.status === "Completed" ? "Task completed" : `Status changed to ${after.status}`; if (before.assigned_to_id !== after.assigned_to_id) return "Task reassigned"; return "Task updated"; }
function changedTodoFields(before, after) { return Object.fromEntries(["title", "description", "priority", "status", "due_date", "due_time", "reminder_at", "remarks", "waiting_remarks", "assigned_to_id", "assigned_to_name"].filter((key) => before[key] !== after[key]).map((key) => [key, { from: before[key] ?? "", to: after[key] ?? "" }])); }
function httpError(message, status) { const error = new Error(message); error.status = status; return error; }

module.exports = { canAssignTodo, canViewTodo, createTodo, deleteTodo, listTodos, summarizeTodos, todoDashboard, todoHistory, todoMeta, todoPageData, updateTodo, visibleTodoTasks };
