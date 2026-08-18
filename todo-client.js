const todoUi = {
  meta: null, tasks: [], dashboard: { summary: {}, staff: [] }, scope: "all", view: "list", request: 0, routeConsumed: false,
  search: "", dueDate: "", status: "", priority: "", assignedTo: "", sort: "created_at", direction: "desc",
  page: 1, pageSize: 20, modal: null, dirty: false, returnFocus: null, focusTask: "",
  loaded: false, lastLoadedAt: 0, queryKey: "", dataSignature: "", metaPromise: null, refreshPromise: null, refreshKey: "",
};
const todoReminderUi = { tabId: `${Date.now()}-${Math.random()}`, queue: [], index: 0, channel: null, audio: null, unlocked: false, polling: false };
const TODO_BACKGROUND_REFRESH_MS = 20000;

async function renderTodoPage() {
  const target = document.querySelector("#todo");
  if (!target) return;
  if (!isSupabaseMode()) return void (target.innerHTML = `<div class="permission-note">The secure To-Do module requires the central Supabase login.</div>`);
  if (!todoUi.meta) {
    if (!target.querySelector(".todo-loading")) target.innerHTML = todoLoading();
    todoUi.metaPromise ||= apiJson("/api/todos/meta");
    try { todoUi.meta = await todoUi.metaPromise; }
    catch (error) { target.innerHTML = `<div class="permission-note">${escapeHtml(error.message || "Unable to load To-Do permissions.")}</div>`; return; }
    finally { todoUi.metaPromise = null; }
    todoUi.scope = todoUi.meta.isAdmin ? "mine" : "all";
  }
  if (!todoUi.routeConsumed) { todoUi.focusTask = new URLSearchParams(location.search).get("todo") || todoUi.focusTask; todoUi.routeConsumed = true; }
  if (todoUi.loaded) {
    if (!target.querySelector(".todo-workspace")) todoPaint();
    void todoRefresh({ background: true, maxAgeMs: TODO_BACKGROUND_REFRESH_MS });
    return;
  }
  await todoRefresh({ showLoading: true });
}

function todoScopes() {
  if (todoUi.meta?.isAdmin) return [["mine", "My To-Dos"], ["all-staff", "All Staff To-Dos"], ["completed", "Completed"]];
  if (todoUi.meta?.canAssign) return [["all", "My Tasks"], ["assigned-by-me", "Assigned by Me"], ["completed", "Completed"]];
  return [["all", "All My Tasks"], ["personal", "Personal"], ["assigned-to-me", "Assigned to Me"], ["completed", "Completed"]];
}

async function todoRefresh(options = {}) {
  const target = document.querySelector("#todo");
  if (!target) return;
  const query = todoQuery();
  const queryKey = query || "__default__";
  if (options.maxAgeMs && todoUi.loaded && todoUi.queryKey === queryKey && Date.now() - todoUi.lastLoadedAt < options.maxAgeMs) return false;
  if (todoUi.refreshPromise && todoUi.refreshKey === queryKey) return todoUi.refreshPromise;
  const request = ++todoUi.request;
  const hasStableContent = todoUi.loaded && Boolean(target.querySelector(".todo-workspace"));
  if (!hasStableContent && options.showLoading !== false) target.innerHTML = todoLoading();
  if (hasStableContent) target.querySelector(".todo-workspace")?.setAttribute("aria-busy", "true");
  const refresh = (async () => {
    try {
      const result = await apiJson(`/api/todos?${query}`);
      if (request !== todoUi.request) return false;
      const tasks = result.tasks || [];
      const dashboard = result.dashboard || { summary: {}, staff: [] };
      const signature = JSON.stringify([tasks, dashboard]);
      const changed = !todoUi.loaded || todoUi.queryKey !== queryKey || todoUi.dataSignature !== signature;
      todoUi.tasks = tasks;
      todoUi.dashboard = dashboard;
      todoUi.loaded = true;
      todoUi.lastLoadedAt = Date.now();
      todoUi.queryKey = queryKey;
      todoUi.dataSignature = signature;
      if (activePage === "todo" && (changed || !target.querySelector(".todo-workspace"))) todoPaint();
      if (activePage === "todo" && todoUi.focusTask) { const task = todoUi.tasks.find((row) => row.id === todoUi.focusTask); todoUi.focusTask = ""; if (task) openTodoDetails(task); }
      return changed;
    } catch (error) {
      if (request !== todoUi.request) return false;
      if (!todoUi.loaded) target.innerHTML = `<div class="permission-note">${escapeHtml(error.message || "Unable to load To-Do tasks.")}</div>`;
      else if (!options.background) toast(error.message || "Unable to refresh To-Do tasks.");
      return false;
    } finally {
      if (request === todoUi.request) target.querySelector(".todo-workspace")?.removeAttribute("aria-busy");
    }
  })();
  todoUi.refreshPromise = refresh;
  todoUi.refreshKey = queryKey;
  try { return await refresh; }
  finally {
    if (todoUi.refreshPromise === refresh) { todoUi.refreshPromise = null; todoUi.refreshKey = ""; }
  }
}

function todoQuery(overrides = {}) {
  const params = new URLSearchParams();
  const values = { scope: todoUi.scope, search: todoUi.search, due_date: todoUi.dueDate, status: todoUi.status, priority: todoUi.priority, assigned_to: todoUi.assignedTo, ...overrides };
  Object.entries(values).forEach(([key, value]) => { if (value) params.set(key, value); });
  return params.toString();
}

function todoPaint() {
  const target = document.querySelector("#todo");
  if (!target) return;
  const summary = todoUi.dashboard.summary || {};
  const assignedByMe = todoUi.tasks.filter(todoAssignedByMe).length;
  target.innerHTML = `<section class="todo-workspace">
    <div class="todo-toolbar panel"><div><span class="dashboard-eyebrow">PRIVATE WORKSPACE</span><h3>${todoUi.meta.isAdmin && todoUi.scope === "all-staff" ? "Organisation To-Dos" : "My To-Dos"}</h3><p>Personal reminders and assigned tasks in your authorised scope.</p></div><div class="todo-toolbar-actions"><button class="secondary-button" id="todoViewToggle">${todoUi.view === "calendar" ? "List View" : "Calendar View"}</button><button class="secondary-button" id="todoExport">Export</button><button class="primary-button" id="todoAdd">+ Add To-Do</button></div></div>
    <div class="todo-tabs">${todoScopes().map(([key, label]) => `<button class="${todoUi.scope === key ? "active" : ""}" data-todo-scope="${key}">${escapeHtml(label)}</button>`).join("")}</div>
    <div class="todo-kpis">${todoMetric("My Pending Tasks", summary.pending, "pending")}${todoMetric("Due Today", summary.dueToday, "today")}${todoMetric("Overdue", summary.overdue, "overdue")}${todoMetric("Upcoming", summary.upcoming, "upcoming")}${todoMetric("Completed Today", summary.completedToday, "completed")}${todoUi.meta.canAssign && !todoUi.meta.isAdmin ? todoMetric("Assigned by Me", assignedByMe, "assigned") : ""}</div>
    ${todoFilters()}${todoUi.meta.isAdmin && todoUi.scope === "all-staff" ? todoStaffDashboard() : ""}${todoUi.view === "calendar" ? todoCalendar() : todoTable()}
  </section>`;
  bindTodoPage();
}

function todoMetric(label, value, tone) { return `<div class="todo-kpi ${tone}"><span>${escapeHtml(label)}</span><strong>${Number(value || 0)}</strong></div>`; }
function todoFilters() {
  const staffFilter = todoUi.meta.canAssign ? `<label>Assigned To<select id="todoAssignedFilter"><option value="">All permitted staff</option>${todoUi.meta.assignableUsers.map((user) => `<option value="${escapeHtml(user.authUserId)}" ${todoUi.assignedTo === user.authUserId ? "selected" : ""}>${escapeHtml(user.name)}</option>`).join("")}</select></label>` : "";
  return `<div class="todo-filters panel"><label class="todo-filter-search">Search Task Title<input id="todoSearch" value="${escapeHtml(todoUi.search)}" placeholder="Search task title"></label><label>Due Date<input id="todoDueFilter" type="date" value="${escapeHtml(todoUi.dueDate)}"></label><label>Priority<select id="todoPriorityFilter">${todoOptions(["", "Low", "Medium", "High", "Urgent"], todoUi.priority, "All Priorities")}</select></label>${staffFilter}<label>Status<select id="todoStatusFilter">${todoOptions(["", "Pending", "In Progress", "On Hold", "Completed", "Cancelled"], todoUi.status, "All Statuses")}</select></label><button class="primary-button" id="todoApplyFilters">Apply</button><button class="mini-button" id="todoClearFilters">Reset</button></div>`;
}

function todoStaffDashboard() {
  const rows = todoUi.dashboard.staff || [];
  return `<section class="panel todo-staff-dashboard"><div class="todo-section-head"><div><h3>All Staff To-Do Dashboard</h3><p>Admin-only organisation view</p></div></div><div class="table-wrap"><table class="file-table file-table-compact"><thead><tr><th>Staff Name</th><th>Pending</th><th>Due Today</th><th>Overdue</th><th>Upcoming</th><th>Completed</th></tr></thead><tbody>${rows.map((row) => `<tr><td><button class="todo-staff-link" data-todo-staff="${escapeHtml(row.id)}">${escapeHtml(row.name)}</button></td>${["pending", "dueToday", "overdue", "upcoming", "completed"].map((key) => `<td><button class="todo-count-link" data-todo-staff="${escapeHtml(row.id)}">${Number(row[key] || 0)}</button></td>`).join("")}</tr>`).join("") || `<tr><td colspan="6">No To-Do records yet.</td></tr>`}</tbody></table></div></section>`;
}

function todoSortedTasks() {
  const priority = { Low: 1, Medium: 2, High: 3, Urgent: 4 };
  const value = (task, key) => key === "priority" ? priority[task.priority] || 0 : key === "assigned_to_name" ? String(task.assigned_to_name || "").toLowerCase() : key === "created_at" || key === "updated_at" ? Date.parse(task[key] || 0) : String(task[key] || "").toLowerCase();
  return [...todoUi.tasks].sort((a, b) => { const left = value(a, todoUi.sort); const right = value(b, todoUi.sort); const result = typeof left === "number" ? left - right : left.localeCompare(right); return (todoUi.direction === "asc" ? result : -result) || Date.parse(b.updated_at || 0) - Date.parse(a.updated_at || 0) || String(b.id).localeCompare(String(a.id)); });
}

function todoTable() {
  const sorted = todoSortedTasks(); const pages = Math.max(1, Math.ceil(sorted.length / todoUi.pageSize)); todoUi.page = Math.min(todoUi.page, pages); const start = (todoUi.page - 1) * todoUi.pageSize; const rows = sorted.slice(start, start + todoUi.pageSize);
  const heading = (label, key) => `<button class="todo-sort" data-todo-sort="${key}">${label}<span>${todoUi.sort === key ? (todoUi.direction === "asc" ? "▲" : "▼") : ""}</span></button>`;
  return `<section class="panel todo-list-panel"><div class="todo-section-head"><div><h3>My Task</h3><p>${sorted.length} record(s)</p></div></div><div class="table-wrap todo-table-wrap"><table class="file-table file-table-compact todo-table"><thead><tr><th>SN</th><th>${heading("Task Title", "title")}</th><th>${heading("Created On", "created_at")}</th><th>${heading("Due On", "due_date")}</th><th>${heading("Due Time", "due_time")}</th><th>${heading("Priority", "priority")}</th><th>${heading("Assigned To", "assigned_to_name")}</th><th>${heading("Status", "status")}</th><th>Actions</th></tr></thead><tbody>${rows.map((task, index) => todoTableRow(task, start + index + 1)).join("") || `<tr><td colspan="9"><div class="empty-state"><strong>No To-Do tasks found.</strong><p>Create a reminder or adjust the filters.</p></div></td></tr>`}</tbody></table></div>${todoPagination(sorted.length, pages)}</section>`;
}

function todoTableRow(task, number) {
  const title = String(task.title || "");
  return `<tr data-todo-row="${escapeHtml(task.id)}"><td>${number}</td><td class="todo-title-cell"><button data-todo-view="${escapeHtml(task.id)}" title="${escapeHtml(title)}">${escapeHtml(title)}</button></td><td>${escapeHtml(todoDisplayDateTimeDate(task.created_at))}</td><td>${task.due_date ? escapeHtml(todoDisplayDate(task.due_date)) : "—"}</td><td>${task.due_time ? escapeHtml(todoDisplayTime(task.due_time)) : "—"}</td><td><span class="todo-priority ${String(task.priority || "Medium").toLowerCase()}">${escapeHtml(task.priority || "Medium")}</span></td><td>${escapeHtml(task.assigned_to_name || "—")}</td><td><span class="todo-status ${todoStatusClass(todoDisplayStatus(task.status))}">${escapeHtml(todoDisplayStatus(task.status))}</span></td><td class="todo-actions-cell"><button class="todo-actions-button" data-todo-actions="${escapeHtml(task.id)}" aria-haspopup="menu" aria-expanded="false" title="Actions">⋮</button><div class="todo-actions-menu" data-todo-menu="${escapeHtml(task.id)}" role="menu">${todoActionItems(task)}</div></td></tr>`;
}
function todoActionItems(task) {
  const inactive = ["Completed", "Cancelled"].includes(todoDisplayStatus(task.status));
  return `<button role="menuitem" data-todo-action="view" data-id="${task.id}">View Details</button><button role="menuitem" data-todo-action="edit" data-id="${task.id}">Edit</button><button role="menuitem" data-todo-action="status" data-id="${task.id}">Update Status</button>${inactive ? "" : `<button role="menuitem" data-todo-action="complete" data-id="${task.id}">Mark Completed</button><button role="menuitem" data-todo-action="snooze" data-id="${task.id}">Snooze Reminder</button>`}<button role="menuitem" data-todo-action="history" data-id="${task.id}">View History</button><button role="menuitem" data-todo-action="duplicate" data-id="${task.id}">Duplicate</button>${todoCanDelete(task) ? `<button class="danger" role="menuitem" data-todo-action="delete" data-id="${task.id}">Delete</button>` : ""}`;
}
function todoPagination(total, pages) { return `<nav class="todo-pagination" aria-label="To-Do pagination"><span>Showing ${total ? (todoUi.page - 1) * todoUi.pageSize + 1 : 0}–${Math.min(todoUi.page * todoUi.pageSize, total)} of ${total}</span><label>Rows<select id="todoPageSize">${[10, 20, 50].map((size) => `<option ${todoUi.pageSize === size ? "selected" : ""}>${size}</option>`).join("")}</select></label><div><button class="mini-button" data-todo-page="${todoUi.page - 1}" ${todoUi.page <= 1 ? "disabled" : ""}>Previous</button><span>Page ${todoUi.page} of ${pages}</span><button class="mini-button" data-todo-page="${todoUi.page + 1}" ${todoUi.page >= pages ? "disabled" : ""}>Next</button></div></nav>`; }
function todoCalendar() { const groups = new Map(); todoUi.tasks.forEach((task) => { const key = task.due_date || "No due date"; groups.set(key, [...(groups.get(key) || []), task]); }); return `<section class="panel todo-calendar"><div class="todo-section-head"><div><h3>${todoUi.meta.isAdmin && todoUi.scope === "all-staff" ? "All Staff Calendar" : "My Calendar"}</h3><p>Calendar privacy follows the same server-enforced task scope.</p></div></div><div class="todo-calendar-grid">${[...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, tasks]) => `<div class="todo-calendar-day"><h4>${date === "No due date" ? date : todoDisplayDate(date)}</h4>${tasks.map((task) => `<button data-todo-view="${escapeHtml(task.id)}"><strong>${escapeHtml(task.title)}</strong><span>${escapeHtml(task.assigned_to_name || "")} · ${escapeHtml(todoDisplayStatus(task.status))}</span></button>`).join("")}</div>`).join("") || `<div class="empty-state">No calendar tasks found.</div>`}</div></section>`; }

function bindTodoPage() {
  document.querySelectorAll("[data-todo-scope]").forEach((button) => button.onclick = () => { todoUi.scope = button.dataset.todoScope; todoUi.assignedTo = ""; todoUi.page = 1; todoRefresh(); });
  document.querySelector("#todoAdd").onclick = (event) => openTodoEditor({ assigned_to_id: todoUi.meta.currentUser.authUserId, assigned_to_name: todoUi.meta.currentUser.name, priority: "Medium", status: "Pending" }, event.currentTarget);
  document.querySelector("#todoViewToggle").onclick = () => { todoUi.view = todoUi.view === "calendar" ? "list" : "calendar"; todoPaint(); };
  document.querySelector("#todoExport").onclick = exportTodos;
  document.querySelector("#todoApplyFilters").onclick = () => { todoUi.search = document.querySelector("#todoSearch").value.trim(); todoUi.dueDate = document.querySelector("#todoDueFilter").value; todoUi.status = document.querySelector("#todoStatusFilter").value; todoUi.priority = document.querySelector("#todoPriorityFilter").value; todoUi.assignedTo = document.querySelector("#todoAssignedFilter")?.value || ""; todoUi.page = 1; todoRefresh(); };
  document.querySelector("#todoSearch").onkeydown = (event) => { if (event.key === "Enter") document.querySelector("#todoApplyFilters").click(); };
  document.querySelector("#todoClearFilters").onclick = () => { todoUi.search = todoUi.dueDate = todoUi.status = todoUi.priority = todoUi.assignedTo = ""; todoUi.page = 1; todoRefresh(); };
  document.querySelectorAll("[data-todo-staff]").forEach((button) => button.onclick = () => { todoUi.assignedTo = button.dataset.todoStaff; todoUi.page = 1; todoRefresh(); });
  document.querySelectorAll("[data-todo-view]").forEach((button) => button.onclick = () => openTodoDetails(todoTask(button.dataset.todoView), button));
  document.querySelectorAll("[data-todo-sort]").forEach((button) => button.onclick = () => { const key = button.dataset.todoSort; todoUi.direction = todoUi.sort === key && todoUi.direction === "asc" ? "desc" : "asc"; todoUi.sort = key; todoUi.page = 1; todoPaint(); });
  document.querySelectorAll("[data-todo-page]").forEach((button) => button.onclick = () => { todoUi.page = Number(button.dataset.todoPage); todoPaint(); });
  document.querySelector("#todoPageSize")?.addEventListener("change", (event) => { todoUi.pageSize = Number(event.target.value); todoUi.page = 1; todoPaint(); });
  document.querySelectorAll("[data-todo-actions]").forEach((button) => button.onclick = (event) => { event.stopPropagation(); const menu = document.querySelector(`[data-todo-menu="${CSS.escape(button.dataset.todoActions)}"]`); const open = menu.classList.toggle("open"); document.querySelectorAll(".todo-actions-menu.open").forEach((other) => { if (other !== menu) other.classList.remove("open"); }); if (open) { const rect = button.getBoundingClientRect(); menu.style.left = `${Math.max(8, rect.right - menu.offsetWidth)}px`; menu.style.top = `${window.innerHeight - rect.bottom > menu.offsetHeight + 8 ? rect.bottom + 4 : Math.max(8, rect.top - menu.offsetHeight - 4)}px`; } button.setAttribute("aria-expanded", String(open)); });
  document.querySelectorAll("[data-todo-action]").forEach((button) => button.onclick = () => handleTodoAction(button.dataset.todoAction, todoTask(button.dataset.id), button));
  document.addEventListener("click", closeTodoActionMenus, { once: true });
}

function handleTodoAction(action, task, trigger) {
  if (!task) return;
  if (action === "view") openTodoDetails(task, trigger);
  if (action === "edit") (todoCanFullEdit(task) ? openTodoEditor(task, trigger) : openTodoStatus(task, trigger));
  if (action === "status") openTodoStatus(task, trigger);
  if (action === "complete") openTodoComplete(task, trigger);
  if (action === "snooze") openTodoSnooze(task, trigger);
  if (action === "history") showTodoHistory(task.id, trigger);
  if (action === "duplicate") openTodoEditor({ ...task, id: "", title: `${task.title} (Copy)`, status: "Pending", created_at: "", completed_at: null }, trigger);
  if (action === "delete") openTodoDelete(task, trigger);
}

function openTodoEditor(task, trigger) {
  const isNew = !task.id; const currentId = todoUi.meta.currentUser.authUserId; const fullEdit = isNew || todoUi.meta.isAdmin || (todoDisplayStatus(task.status) !== "Completed" && (task.created_by_id === currentId || task.assigned_by_id === currentId)); const selected = task.assigned_to_id || currentId; const details = todoTaskDetails(task);
  const assignee = todoUi.meta.canAssign && fullEdit ? `<select id="todoFormAssignee">${todoUi.meta.assignableUsers.map((user) => `<option value="${escapeHtml(user.authUserId)}" ${selected === user.authUserId ? "selected" : ""}>${escapeHtml(user.name)}</option>`).join("")}</select>` : `<input value="${escapeHtml(task.assigned_to_name || todoUi.meta.currentUser.name)}" disabled><input id="todoFormAssignee" type="hidden" value="${escapeHtml(selected)}">`;
  const content = `<form id="todoEditorForm" novalidate><div class="todo-form-grid"><label class="todo-title-field">Task Title<span class="required">*</span><input id="todoFormTitle" maxlength="240" value="${escapeHtml(task.title || "")}" ${fullEdit ? "" : "disabled"} required><small class="todo-field-error" id="todoTitleError"></small></label><label>Priority<select id="todoFormPriority" ${fullEdit ? "" : "disabled"}>${todoOptions(["Low", "Medium", "High", "Urgent"], task.priority || "Medium")}</select></label><label>Status<select id="todoFormStatus">${todoOptions(["Pending", "In Progress", "On Hold", "Completed", "Cancelled"], todoDisplayStatus(task.status || "Pending"))}</select></label><label>Due Date<input id="todoFormDueDate" type="date" value="${escapeHtml(task.due_date || "")}" ${fullEdit ? "" : "disabled"}><small class="todo-field-error" id="todoDueError"></small></label><label>Due Time<input id="todoFormDueTime" type="time" value="${escapeHtml(task.due_time || "")}" ${fullEdit ? "" : "disabled"}></label><label>Reminder Date &amp; Time<div class="todo-reminder-control"><input id="todoFormReminder" type="datetime-local" value="${escapeHtml(todoLocalDateTime(task.snoozed_until || task.reminder_at))}" ${fullEdit ? "" : "disabled"}><select id="todoReminderPreset" aria-label="Quick reminder" tabindex="-1" ${fullEdit ? "" : "disabled"}><option value="">Custom</option><option value="0">At due time</option><option value="15">15 minutes before</option><option value="30">30 minutes before</option><option value="60">1 hour before</option><option value="1440">1 day before</option></select></div><small class="todo-field-error" id="todoReminderError"></small></label><label>Assigned To${assignee}</label><label class="todo-details-field">Task Description / Remarks<textarea id="todoFormDetails" rows="3" ${fullEdit ? "" : "disabled"}>${escapeHtml(details)}</textarea></label></div></form>`;
  openTodoModal({ title: isNew ? "Add To-Do" : "Edit To-Do", subtitle: isNew ? "Create a reminder or assign a task" : "Update task details and schedule", content, primary: isNew ? "Create To-Do" : "Save Changes", trigger, onPrimary: () => saveTodoEditor(task, fullEdit) });
  document.querySelector("#todoFormTitle")?.focus(); document.querySelector("#todoReminderPreset")?.addEventListener("change", applyTodoReminderPreset);
}

function applyTodoReminderPreset(event) { if (event.target.value === "") return; const date = document.querySelector("#todoFormDueDate")?.value; const time = document.querySelector("#todoFormDueTime")?.value || "09:00"; if (!date) return showTodoFieldError("todoDueError", "Choose a due date first."); const due = new Date(`${date}T${time}`); due.setMinutes(due.getMinutes() - Number(event.target.value)); document.querySelector("#todoFormReminder").value = todoInputDateTime(due); document.querySelector("#todoFormReminder").dispatchEvent(new Event("input", { bubbles: true })); }
async function saveTodoEditor(task, fullEdit) {
  clearTodoErrors(); const title = document.querySelector("#todoFormTitle")?.value.trim(); const dueDate = document.querySelector("#todoFormDueDate")?.value || ""; const dueTime = document.querySelector("#todoFormDueTime")?.value || ""; const reminderLocal = document.querySelector("#todoFormReminder")?.value || ""; const assignee = document.querySelector("#todoFormAssignee")?.value;
  if (!title) { showTodoFieldError("todoTitleError", "Task title is required."); document.querySelector("#todoFormTitle")?.focus(); return false; }
  if (assignee !== todoUi.meta.currentUser.authUserId && !dueDate) { showTodoFieldError("todoDueError", "Due date is required for assigned tasks."); return false; }
  const due = dueDate ? new Date(`${dueDate}T${dueTime || "23:59"}`) : null; const reminder = reminderLocal ? new Date(reminderLocal) : null; if (due && reminder && reminder > due) { showTodoFieldError("todoReminderError", "Reminder cannot be later than the due date and time."); return false; }
  const details = document.querySelector("#todoFormDetails")?.value || ""; const payload = { status: document.querySelector("#todoFormStatus")?.value, status_remarks: details }; if (fullEdit) Object.assign(payload, { title, task_details_or_remarks: details, priority: document.querySelector("#todoFormPriority")?.value, due_date: dueDate, due_time: dueTime, reminder_at: reminder ? reminder.toISOString() : "", assigned_to_id: assignee });
  return todoSubmit(task.id ? `/api/todos/${encodeURIComponent(task.id)}` : "/api/todos", task.id ? "PATCH" : "POST", payload, task.id ? "To-Do updated" : "To-Do created");
}

function openTodoStatus(task, trigger) {
  const content = `<div class="todo-status-summary"><span>Task Title</span><strong>${escapeHtml(task.title)}</strong><span>Current Status</span><strong>${escapeHtml(todoDisplayStatus(task.status))}</strong></div><label class="todo-modal-field">New Status<select id="todoStatusNew">${todoOptions(["Pending", "In Progress", "On Hold", "Completed", "Cancelled"], todoDisplayStatus(task.status))}</select></label><label class="todo-modal-field">Task Description / Remarks<textarea id="todoStatusRemarks" rows="3">${escapeHtml(task.status_remarks || "")}</textarea><small class="todo-field-error" id="todoStatusError"></small></label>`;
  openTodoModal({ title: "Update To-Do Status", subtitle: "Record progress against this task", content, primary: "Update Status", compact: true, trigger, onPrimary: async () => { const status = document.querySelector("#todoStatusNew").value; const remarks = document.querySelector("#todoStatusRemarks").value.trim(); if (status === "On Hold" && !remarks) { showTodoFieldError("todoStatusError", "Remarks are required when status is On Hold."); return false; } return todoSubmit(`/api/todos/${encodeURIComponent(task.id)}`, "PATCH", { status, status_remarks: remarks }, "Status updated"); } });
}
function openTodoComplete(task, trigger) { const content = `<p>Are you sure you want to mark this To-Do as completed?</p><div class="todo-confirm-task"><strong>${escapeHtml(task.title)}</strong></div><label class="todo-modal-field">Optional remarks<textarea id="todoCompleteRemarks" rows="2"></textarea></label>`; openTodoModal({ title: "Mark To-Do Completed", subtitle: "This will stop future reminders", content, primary: "Mark Completed", compact: true, trigger, onPrimary: () => todoSubmit(`/api/todos/${encodeURIComponent(task.id)}`, "PATCH", { status: "Completed", status_remarks: document.querySelector("#todoCompleteRemarks").value }, "To-Do completed") }); }
function openTodoDelete(task, trigger) { openTodoModal({ title: "Delete To-Do", subtitle: "This action is retained in activity history", content: `<p>Are you sure you want to delete this To-Do?</p><div class="todo-confirm-task"><strong>${escapeHtml(task.title)}</strong></div>`, primary: "Delete", danger: true, compact: true, trigger, onPrimary: async () => { try { await apiJson(`/api/todos/${encodeURIComponent(task.id)}`, { method: "DELETE" }); toast("To-Do deleted"); closeTodoModal(true); await todoRefresh(); return true; } catch (error) { showTodoModalError(error.message || "Unable to delete To-Do."); return false; } } }); }
function openTodoSnooze(task, trigger) { const content = `<p>Choose when this reminder should appear again.</p><label class="todo-modal-field">Snooze until<select id="todoTaskSnooze"><option value="10">10 Minutes</option><option value="30">30 Minutes</option><option value="60">1 Hour</option><option value="tomorrow">Tomorrow</option><option value="custom">Custom</option></select></label><label class="todo-modal-field hidden" id="todoTaskSnoozeCustomLabel">Custom date and time<input type="datetime-local" id="todoTaskSnoozeCustom"></label>`; openTodoModal({ title: "Snooze Reminder", subtitle: task.title, content, primary: "Snooze", compact: true, trigger, onPrimary: async () => { const until = todoSnoozeDate(document.querySelector("#todoTaskSnooze").value, document.querySelector("#todoTaskSnoozeCustom").value); if (!until) return false; return todoSubmit(`/api/todos/${encodeURIComponent(task.id)}`, "PATCH", { snoozed_until: until.toISOString() }, "Reminder snoozed"); } }); document.querySelector("#todoTaskSnooze").onchange = (event) => document.querySelector("#todoTaskSnoozeCustomLabel").classList.toggle("hidden", event.target.value !== "custom"); }
function openTodoDetails(task, trigger) { const content = `<dl class="todo-detail-list"><div><dt>Task</dt><dd>${escapeHtml(task.title)}</dd></div><div><dt>Task Description / Remarks</dt><dd>${escapeHtml(todoTaskDetails(task) || "—")}</dd></div><div><dt>Due</dt><dd>${task.due_date ? escapeHtml(todoDisplayDate(task.due_date)) : "—"}${task.due_time ? ` at ${escapeHtml(todoDisplayTime(task.due_time))}` : ""}</dd></div><div><dt>Priority</dt><dd><span class="todo-priority ${String(task.priority).toLowerCase()}">${escapeHtml(task.priority)}</span></dd></div><div><dt>Assigned To</dt><dd>${escapeHtml(task.assigned_to_name || "—")}</dd></div><div><dt>Assigned By</dt><dd>${escapeHtml(task.assigned_by_name || task.created_by_name || "—")}</dd></div><div><dt>Status</dt><dd>${escapeHtml(todoDisplayStatus(task.status))}</dd></div><div><dt>Created On</dt><dd>${escapeHtml(todoDateTime(task.created_at))}</dd></div></dl>`; openTodoModal({ title: "To-Do Details", subtitle: "Private task record", content, primary: "Close", compact: true, trigger, onPrimary: () => { closeTodoModal(true); return true; }, cancelLabel: "" }); }

function openTodoModal({ title, subtitle = "", content, primary, onPrimary, compact = false, danger = false, trigger = null, cancelLabel = "Cancel" }) {
  if (document.querySelector("#todoModal")) return; todoUi.dirty = false; todoUi.returnFocus = trigger || document.activeElement;
  const backdrop = document.createElement("div"); backdrop.id = "todoModal"; backdrop.className = "todo-modal-backdrop"; backdrop.innerHTML = `<section class="todo-modal-dialog ${compact ? "compact" : ""}" role="dialog" aria-modal="true" aria-labelledby="todoModalTitle"><header><div><h2 id="todoModalTitle">${escapeHtml(title)}</h2><p>${escapeHtml(subtitle)}</p></div><button class="icon-button" id="todoModalClose" type="button" tabindex="-1" aria-label="Close">×</button></header><div class="todo-modal-body"><div class="todo-modal-error" id="todoModalError" role="alert"></div>${content}</div><footer>${cancelLabel ? `<button class="secondary-button" id="todoModalCancel" type="button">${escapeHtml(cancelLabel)}</button>` : ""}<button class="${danger ? "danger-button" : "primary-button"}" id="todoModalPrimary" type="button">${escapeHtml(primary)}</button></footer></section>`;
  document.body.appendChild(backdrop); document.body.classList.add("todo-modal-open"); todoUi.modal = backdrop; backdrop.addEventListener("input", () => { todoUi.dirty = true; }); backdrop.addEventListener("change", () => { todoUi.dirty = true; }); backdrop.addEventListener("keydown", trapTodoModalFocus); document.querySelector("#todoModalClose").onclick = () => closeTodoModal(false); document.querySelector("#todoModalCancel")?.addEventListener("click", () => closeTodoModal(false)); document.querySelector("#todoModalPrimary").onclick = async () => { const button = document.querySelector("#todoModalPrimary"); if (button.disabled) return; button.disabled = true; const old = button.textContent; button.textContent = "Saving…"; try { const result = await onPrimary(); if (result === false && document.body.contains(button)) { button.disabled = false; button.textContent = old; } } catch (error) { showTodoModalError(error.message || "Unable to complete this action."); if (document.body.contains(button)) { button.disabled = false; button.textContent = old; } } };
}
function closeTodoModal(force = false) { if (!todoUi.modal) return true; if (!force && todoUi.dirty && !confirm("You have unsaved changes. Are you sure you want to close?")) return false; const focus = todoUi.returnFocus; todoUi.modal.remove(); todoUi.modal = null; todoUi.dirty = false; document.body.classList.remove("todo-modal-open"); setTimeout(() => focus?.focus?.(), 0); return true; }
function trapTodoModalFocus(event) { if (event.key === "Escape") { event.preventDefault(); closeTodoModal(false); return; } if (event.key !== "Tab") return; const focusable = [...todoUi.modal.querySelectorAll('button:not([disabled]):not([tabindex="-1"]),input:not([disabled]):not([tabindex="-1"]),select:not([disabled]):not([tabindex="-1"]),textarea:not([disabled]):not([tabindex="-1"]),[href]')].filter((item) => item.offsetParent !== null); if (!focusable.length) return; const first = focusable[0]; const last = focusable.at(-1); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } }
async function todoSubmit(url, method, payload, success) { try { await apiJson(url, { method, body: JSON.stringify(payload) }); todoUi.dirty = false; closeTodoModal(true); toast(success); await todoRefresh(); return true; } catch (error) { showTodoModalError(error.message || "Unable to save To-Do."); return false; } }
async function showTodoHistory(id, trigger) { try { const result = await apiJson(`/api/todos/${encodeURIComponent(id)}/history`); const content = `<div class="todo-history-list">${(result.history || []).map((row) => `<article><strong>${escapeHtml(row.action)}</strong><span>${escapeHtml(row.actor_name || "System")} · ${escapeHtml(todoDateTime(row.created_at))}</span>${Object.keys(row.changes || {}).length ? `<pre>${escapeHtml(JSON.stringify(row.changes, null, 2))}</pre>` : ""}</article>`).join("") || `<p>No activity recorded.</p>`}</div>`; openTodoModal({ title: "Task Activity History", subtitle: "Read-only audit trail", content, primary: "Close", compact: true, trigger, cancelLabel: "", onPrimary: () => { closeTodoModal(true); return true; } }); } catch (error) { toast(error.message || "Unable to load task history."); } }
async function exportTodos() { try { const result = await apiJson(`/api/todos/export?${todoQuery()}`); const rows = (result.tasks || []).map((task, index) => ({ SN: index + 1, "Task Title": task.title, "Task Description / Remarks": todoTaskDetails(task), "Created On": todoDateTime(task.created_at), "Due On": task.due_date, "Due Time": task.due_time || "—", Priority: task.priority, "Assigned To": task.assigned_to_name, Status: todoDisplayStatus(task.status), "Completed By": task.completed_by_name, "Completed At": task.completed_at ? todoDateTime(task.completed_at) : "" })); if (!rows.length) return toast("No permitted To-Do data to export."); await downloadXlsxRows(`todo-list-${todoIndiaDate()}`, rows, "To-Do List"); toast("To-Do export downloaded"); } catch (error) { toast(error.message || "Unable to export To-Do data."); } }

function closeTodoActionMenus() { document.querySelectorAll(".todo-actions-menu.open").forEach((menu) => menu.classList.remove("open")); }
function todoTask(id) { return todoUi.tasks.find((task) => task.id === id); }
function todoTaskDetails(task = {}) { return task.task_details_or_remarks || [task.description, task.remarks, task.waiting_remarks].filter(Boolean).join("\n"); }
function todoAssignedByMe(task) { const id = todoUi.meta?.currentUser?.authUserId; return task.assigned_by_id === id && task.assigned_to_id !== id; }
function todoCanFullEdit(task) { const id = todoUi.meta?.currentUser?.authUserId; return todoUi.meta?.isAdmin || (todoDisplayStatus(task.status) !== "Completed" && (task.created_by_id === id || task.assigned_by_id === id)); }
function todoCanDelete(task) { const id = todoUi.meta?.currentUser?.authUserId; return todoUi.meta?.isAdmin || task.created_by_id === id || task.assigned_by_id === id; }
function todoOptions(values, selected, emptyLabel = "") { return values.map((value) => `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(value || emptyLabel)}</option>`).join(""); }
function todoLoading() { return `<div class="panel todo-loading"><strong>Loading secure To-Do workspace...</strong></div>`; }
function todoDisplayStatus(value) { return value === "Waiting" ? "On Hold" : value || "Pending"; }
function todoStatusClass(value) { return String(value || "pending").toLowerCase().replace(/[^a-z]+/g, "-"); }
function todoIndiaDate() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
function todoDisplayDate(value) { const [year, month, day] = String(value || "").split("-"); return year && month && day ? `${day}-${month}-${year}` : value || ""; }
function todoDisplayDateTimeDate(value) { const date = new Date(value); return Number.isFinite(date.getTime()) ? date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }) : "—"; }
function todoDisplayTime(value) { if (!value) return "—"; const [hour, minute] = value.split(":"); const date = new Date(2000, 0, 1, Number(hour), Number(minute)); return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }); }
function todoDateTime(value) { const date = new Date(value); return Number.isFinite(date.getTime()) ? date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : ""; }
function todoLocalDateTime(value) { if (!value) return ""; const date = new Date(value); return Number.isFinite(date.getTime()) ? todoInputDateTime(date) : ""; }
function todoInputDateTime(date) { const offset = date.getTimezoneOffset() * 60000; return new Date(date.getTime() - offset).toISOString().slice(0, 16); }
function showTodoFieldError(id, message) { const node = document.querySelector(`#${id}`); if (node) node.textContent = message; }
function clearTodoErrors() { document.querySelectorAll(".todo-field-error").forEach((node) => { node.textContent = ""; }); showTodoModalError(""); }
function showTodoModalError(message) { const node = document.querySelector("#todoModalError"); if (node) { node.textContent = message; node.classList.toggle("visible", Boolean(message)); } }
function todoSnoozeDate(value, custom) { const date = new Date(); if (value === "tomorrow") { date.setDate(date.getDate() + 1); date.setHours(9, 0, 0, 0); return date; } if (value === "custom") { const result = new Date(custom); if (!custom || result <= new Date()) { showTodoModalError("Choose a future custom date and time."); return null; } return result; } date.setMinutes(date.getMinutes() + Number(value)); return date; }

function initialiseTodoReminders() {
  try { todoReminderUi.channel = new BroadcastChannel("fineasy-todo-reminders"); todoReminderUi.channel.onmessage = () => { if (todoReminderLeader()) pollTodoReminders(); }; } catch { /* localStorage lease still prevents duplicate alerts. */ }
  const unlock = () => unlockTodoReminderAudio(); document.addEventListener("pointerdown", unlock, { once: true, capture: true }); document.addEventListener("keydown", unlock, { once: true, capture: true }); setInterval(pollTodoReminders, 30000); setTimeout(pollTodoReminders, 4000); new MutationObserver(addTodoSoundSettings).observe(document.body, { childList: true, subtree: true });
}
function todoReminderLeader() { const key = "fineasy-todo-reminder-leader"; const now = Date.now(); try { const current = JSON.parse(localStorage.getItem(key) || "null"); if (current?.expires > now && current.id !== todoReminderUi.tabId) return false; localStorage.setItem(key, JSON.stringify({ id: todoReminderUi.tabId, expires: now + 45000 })); return true; } catch { return true; } }
async function pollTodoReminders() { if (todoReminderUi.polling || typeof apiJson !== "function" || typeof state === "undefined" || !state.session?.loggedIn || !isSupabaseMode() || !todoReminderLeader()) return; todoReminderUi.polling = true; try { const result = await apiJson("/api/todos/reminders/due"); const existing = new Set(todoReminderUi.queue.map((row) => row.occurrence_key)); (result.reminders || []).forEach((row) => { if (!existing.has(row.occurrence_key)) todoReminderUi.queue.push(row); }); if (todoReminderUi.queue.length && !document.querySelector("#todoDueAlert")) showTodoDueAlert(); } catch { /* Login transitions and temporary network failures are retried quietly. */ } finally { todoReminderUi.polling = false; } }
function showTodoDueAlert() {
  const reminder = todoReminderUi.queue[todoReminderUi.index]; if (!reminder) return; document.querySelector("#todoDueAlert")?.remove(); const task = reminder.task || {}; const alert = document.createElement("aside"); alert.id = "todoDueAlert"; alert.className = "todo-due-alert"; alert.setAttribute("role", "alertdialog"); alert.setAttribute("aria-modal", "false");
  alert.innerHTML = `<header><div><span>${todoReminderUi.queue.length > 1 ? `${todoReminderUi.queue.length} tasks are due` : "Reminder"}</span><h2>Alert — Task Due</h2></div><button class="icon-button" data-todo-due-dismiss aria-label="Dismiss">×</button></header><div class="todo-due-body"><dl><div><dt>Task</dt><dd>${escapeHtml(task.title || "")}</dd></div><div><dt>Details</dt><dd>${escapeHtml(todoTaskDetails(task) || "—")}</dd></div><div><dt>Due</dt><dd>${task.due_date ? escapeHtml(todoDisplayDate(task.due_date)) : "—"}${task.due_time ? ` at ${escapeHtml(todoDisplayTime(task.due_time))}` : ""}</dd></div><div><dt>Priority</dt><dd><span class="todo-priority ${String(task.priority || "Medium").toLowerCase()}">${escapeHtml(task.priority || "Medium")}</span></dd></div><div><dt>Assigned To</dt><dd>${escapeHtml(task.assigned_to_name || "—")}</dd></div>${task.assigned_by_name ? `<div><dt>Assigned By</dt><dd>${escapeHtml(task.assigned_by_name)}</dd></div>` : ""}</dl></div><footer><button class="secondary-button" data-todo-due-open>Open Task</button><button class="secondary-button" data-todo-due-snooze>Snooze</button><button class="primary-button" data-todo-due-complete>Mark Completed</button><button class="mini-button" data-todo-due-dismiss>Dismiss</button></footer>${todoReminderUi.queue.length > 1 ? `<nav><button class="mini-button" data-todo-due-prev ${todoReminderUi.index <= 0 ? "disabled" : ""}>Previous</button><span>${todoReminderUi.index + 1} of ${todoReminderUi.queue.length}</span><button class="mini-button" data-todo-due-next ${todoReminderUi.index >= todoReminderUi.queue.length - 1 ? "disabled" : ""}>Next</button></nav>` : ""}`; document.body.appendChild(alert); playTodoReminderSound(reminder.occurrence_key);
  alert.querySelectorAll("[data-todo-due-dismiss]").forEach((button) => button.onclick = () => actOnTodoReminder("dismiss", reminder)); alert.querySelector("[data-todo-due-open]").onclick = () => actOnTodoReminder("open", reminder); alert.querySelector("[data-todo-due-complete]").onclick = async () => { if (!confirm("Are you sure you want to mark this To-Do as completed?")) return; try { await apiJson(`/api/todos/${encodeURIComponent(task.id)}`, { method: "PATCH", body: JSON.stringify({ status: "Completed" }) }); removeTodoReminder(reminder); toast("To-Do completed"); if (activePage === "todo") todoRefresh(); } catch (error) { toast(error.message || "Unable to complete To-Do."); } }; alert.querySelector("[data-todo-due-snooze]").onclick = () => showTodoDueSnooze(reminder); alert.querySelector("[data-todo-due-prev]")?.addEventListener("click", () => { todoReminderUi.index -= 1; showTodoDueAlert(); }); alert.querySelector("[data-todo-due-next]")?.addEventListener("click", () => { todoReminderUi.index += 1; showTodoDueAlert(); });
}
async function actOnTodoReminder(action, reminder, snoozedUntil = "") { try { await apiJson(`/api/todos/${encodeURIComponent(reminder.task.id)}/reminder`, { method: "POST", body: JSON.stringify({ action, occurrence_key: reminder.occurrence_key, snoozed_until: snoozedUntil }) }); removeTodoReminder(reminder); todoReminderUi.channel?.postMessage({ action, occurrence: reminder.occurrence_key }); if (action === "open") { todoUi.focusTask = reminder.task.id; activePage = "todo"; renderAll(); } } catch (error) { toast(error.message || "Unable to update reminder."); } }
function showTodoDueSnooze(reminder) { const value = prompt("Snooze for 10, 30, or 60 minutes, or enter 1440 for tomorrow:", "10"); if (value === null) return; const minutes = Number(value); if (![10, 30, 60, 1440].includes(minutes)) return toast("Choose 10, 30, 60, or 1440 minutes."); actOnTodoReminder("snooze", reminder, new Date(Date.now() + minutes * 60000).toISOString()); }
function removeTodoReminder(reminder) { todoReminderUi.queue = todoReminderUi.queue.filter((row) => row.occurrence_key !== reminder.occurrence_key); todoReminderUi.index = Math.min(todoReminderUi.index, Math.max(0, todoReminderUi.queue.length - 1)); document.querySelector("#todoDueAlert")?.remove(); if (todoReminderUi.queue.length) showTodoDueAlert(); }
function unlockTodoReminderAudio() { if (todoReminderUi.unlocked) return; try { todoReminderUi.audio ||= new (window.AudioContext || window.webkitAudioContext)(); todoReminderUi.audio.resume(); todoReminderUi.unlocked = true; } catch { todoReminderUi.unlocked = false; } }
function playTodoReminderSound(key, test = false) { if (!test && localStorage.getItem("fineasy-todo-reminder-sound") === "off") return; if (!test && sessionStorage.getItem(`todo-sound:${key}`)) return; try { unlockTodoReminderAudio(); if (!todoReminderUi.audio || todoReminderUi.audio.state !== "running") return void toast("Reminder displayed. Click the page once to enable reminder sound."); const now = todoReminderUi.audio.currentTime; [0, .18].forEach((delay, index) => { const oscillator = todoReminderUi.audio.createOscillator(); const gain = todoReminderUi.audio.createGain(); oscillator.type = "sine"; oscillator.frequency.value = index ? 740 : 620; gain.gain.setValueAtTime(.0001, now + delay); gain.gain.exponentialRampToValueAtTime(.12, now + delay + .02); gain.gain.exponentialRampToValueAtTime(.0001, now + delay + .15); oscillator.connect(gain).connect(todoReminderUi.audio.destination); oscillator.start(now + delay); oscillator.stop(now + delay + .17); }); if (!test) sessionStorage.setItem(`todo-sound:${key}`, "1"); } catch { /* Visual reminder remains available. */ } }
function addTodoSoundSettings() { const host = document.querySelector(".desktop-notification-settings-body"); if (!host || host.querySelector("#todoReminderSoundSetting")) return; const row = document.createElement("div"); row.id = "todoReminderSoundSetting"; row.className = "todo-sound-setting"; row.innerHTML = `<label><strong>Reminder Sound</strong><select id="todoReminderSound"><option value="on">On</option><option value="off">Off</option></select></label><button class="mini-button" id="todoTestSound" type="button">Test Sound</button>`; host.appendChild(row); const select = row.querySelector("#todoReminderSound"); select.value = localStorage.getItem("fineasy-todo-reminder-sound") === "off" ? "off" : "on"; select.onchange = () => localStorage.setItem("fineasy-todo-reminder-sound", select.value); row.querySelector("#todoTestSound").onclick = () => playTodoReminderSound("test", true); }
document.addEventListener("DOMContentLoaded", initialiseTodoReminders);
