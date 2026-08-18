const todoUi = {
  meta: null, tasks: [], dashboard: { summary: {}, staff: [] }, scope: "", search: "", status: "",
  priority: "", assignedTo: "", view: "list", editing: null, request: 0,
};

window.renderTodoPage = async function renderTodoPage() {
  const target = document.querySelector("#todo");
  if (!target) return;
  if (!isSupabaseMode()) return void (target.innerHTML = `<div class="permission-note">The secure To-Do module requires the central Supabase login.</div>`);
  if (!todoUi.meta) {
    target.innerHTML = todoLoading();
    try { todoUi.meta = await apiJson("/api/todos/meta"); }
    catch (error) { target.innerHTML = `<div class="permission-note">${escapeHtml(error.message || "Unable to load To-Do permissions.")}</div>`; return; }
    todoUi.scope = todoUi.meta.isAdmin ? "mine" : "all";
  }
  await todoRefresh();
};

function todoScopes() {
  if (todoUi.meta?.isAdmin) return [["mine", "My To-Dos"], ["all-staff", "All Staff To-Dos"], ["completed", "Completed"]];
  if (todoUi.meta?.canAssign) return [["all", "My Tasks"], ["assigned-by-me", "Assigned by Me"], ["completed", "Completed"]];
  return [["all", "All My Tasks"], ["personal", "Personal"], ["assigned-to-me", "Assigned to Me"], ["completed", "Completed"]];
}

async function todoRefresh() {
  const target = document.querySelector("#todo");
  if (!target) return;
  const request = ++todoUi.request;
  target.innerHTML = todoLoading();
  try {
    const query = todoQuery();
    const tasksResult = await apiJson(`/api/todos?${query}`);
    if (request !== todoUi.request || activePage !== "todo") return;
    todoUi.tasks = tasksResult.tasks || [];
    todoUi.dashboard = tasksResult.dashboard || { summary: {}, staff: [] };
    todoPaint();
  } catch (error) { target.innerHTML = `<div class="permission-note">${escapeHtml(error.message || "Unable to load To-Do tasks.")}</div>`; }
}

function todoQuery(overrides = {}) {
  const params = new URLSearchParams();
  const values = { scope: todoUi.scope, search: todoUi.search, status: todoUi.status, priority: todoUi.priority, assigned_to: todoUi.assignedTo, ...overrides };
  Object.entries(values).forEach(([key, value]) => value && params.set(key, value));
  return params.toString();
}

function todoPaint() {
  const target = document.querySelector("#todo");
  if (!target) return;
  const summary = todoUi.dashboard.summary || {};
  const assignedByMe = todoUi.tasks.filter(todoAssignedByMe).length;
  target.innerHTML = `<section class="todo-workspace">
    <div class="todo-toolbar panel"><div><span class="dashboard-eyebrow">PRIVATE WORKSPACE</span><h3>${todoUi.meta.isAdmin && todoUi.scope === "all-staff" ? "Organisation To-Dos" : "My To-Dos"}</h3><p>Only tasks within your authorised scope are returned by the server.</p></div><div class="todo-toolbar-actions"><button class="secondary-button" id="todoViewToggle">${todoUi.view === "calendar" ? "List View" : "Calendar View"}</button><button class="secondary-button" id="todoExport">Export</button><button class="primary-button" id="todoAdd">+ Add To-Do</button></div></div>
    <div class="todo-tabs">${todoScopes().map(([key, label]) => `<button class="${todoUi.scope === key ? "active" : ""}" data-todo-scope="${key}">${escapeHtml(label)}</button>`).join("")}</div>
    <div class="todo-kpis">${todoMetric("My Pending Tasks", summary.pending, "pending")}${todoMetric("Due Today", summary.dueToday, "today")}${todoMetric("Overdue", summary.overdue, "overdue")}${todoMetric("Upcoming", summary.upcoming, "upcoming")}${todoMetric("Completed Today", summary.completedToday, "completed")}${todoUi.meta.canAssign && !todoUi.meta.isAdmin ? todoMetric("Assigned by Me", assignedByMe, "assigned") : ""}</div>
    ${todoFilters()}
    ${todoUi.meta.isAdmin && todoUi.scope === "all-staff" ? todoStaffDashboard() : ""}
    ${todoUi.editing ? todoEditor(todoUi.editing) : ""}
    ${todoUi.view === "calendar" ? todoCalendar() : todoList()}
  </section>`;
  bindTodoPage();
}

function todoMetric(label, value, tone) { return `<div class="todo-kpi ${tone}"><span>${escapeHtml(label)}</span><strong>${Number(value || 0)}</strong></div>`; }
function todoFilters() {
  const staffFilter = todoUi.meta.isAdmin && todoUi.scope === "all-staff" ? `<label>Assigned To<select id="todoAssignedFilter"><option value="">All Staff</option>${todoUi.meta.assignableUsers.map((user) => `<option value="${escapeHtml(user.authUserId)}" ${todoUi.assignedTo === user.authUserId ? "selected" : ""}>${escapeHtml(user.name)}</option>`).join("")}</select></label>` : "";
  return `<div class="todo-filters panel"><label>Search<input id="todoSearch" value="${escapeHtml(todoUi.search)}" placeholder="Search permitted tasks"></label><label>Status<select id="todoStatusFilter">${todoOptions(["", "Pending", "In Progress", "Waiting", "Completed", "Cancelled"], todoUi.status, "All Statuses")}</select></label><label>Priority<select id="todoPriorityFilter">${todoOptions(["", "Low", "Medium", "High", "Urgent"], todoUi.priority, "All Priorities")}</select></label>${staffFilter}<button class="secondary-button" id="todoApplyFilters">Apply</button><button class="mini-button" id="todoClearFilters">Clear</button></div>`;
}
function todoStaffDashboard() {
  const rows = todoUi.dashboard.staff || [];
  return `<section class="panel todo-staff-dashboard"><div class="todo-section-head"><div><h3>All Staff To-Do Dashboard</h3><p>Admin-only organisation view</p></div></div><div class="table-wrap"><table class="file-table file-table-compact"><thead><tr><th>Staff Name</th><th>Pending</th><th>Due Today</th><th>Overdue</th><th>Upcoming</th><th>Completed</th></tr></thead><tbody>${rows.map((row) => `<tr><td><button class="todo-staff-link" data-todo-staff="${escapeHtml(row.id)}">${escapeHtml(row.name)}</button></td>${["pending", "dueToday", "overdue", "upcoming", "completed"].map((key) => `<td><button class="todo-count-link" data-todo-staff="${escapeHtml(row.id)}">${Number(row[key] || 0)}</button></td>`).join("")}</tr>`).join("") || `<tr><td colspan="6">No To-Do records yet.</td></tr>`}</tbody></table></div></section>`;
}
function todoList() {
  return `<section class="panel todo-list-panel"><div class="todo-section-head"><div><h3>Tasks</h3><p>${todoUi.tasks.length} task(s) in this authorised view</p></div></div><div class="todo-task-list">${todoUi.tasks.map(todoTaskCard).join("") || `<div class="empty-state"><strong>No To-Do tasks found.</strong><p>Create a personal task or adjust the permitted filters.</p></div>`}</div></section>`;
}
function todoTaskCard(task) {
  const overdue = task.status !== "Completed" && task.due_date && task.due_date < todoIndiaDate();
  return `<article class="todo-task-card ${overdue ? "is-overdue" : ""}"><div class="todo-task-main"><div class="todo-task-title"><span class="todo-priority ${String(task.priority || "Medium").toLowerCase()}">${escapeHtml(task.priority || "Medium")}</span><h4>${escapeHtml(task.title)}</h4></div><p>${escapeHtml(task.description || "No description")}</p><div class="todo-task-meta"><span>To: <strong>${escapeHtml(task.assigned_to_name || "Unassigned")}</strong></span><span>By: ${escapeHtml(task.assigned_by_name || task.created_by_name || "")}</span><span>Due: ${task.due_date ? escapeHtml(todoDisplayDate(task.due_date)) : "No due date"}${task.due_time ? ` ${escapeHtml(task.due_time)}` : ""}</span></div>${task.remarks ? `<div class="todo-remarks">${escapeHtml(task.remarks)}</div>` : ""}</div><div class="todo-task-actions"><span class="todo-status ${todoStatusClass(task.status)}">${escapeHtml(task.status)}</span><button class="mini-button" data-todo-complete="${escapeHtml(task.id)}" ${task.status === "Completed" || task.status === "Cancelled" ? "disabled" : ""}>Complete</button><button class="mini-button" data-todo-edit="${escapeHtml(task.id)}">Edit / Update</button><button class="mini-button" data-todo-history="${escapeHtml(task.id)}">History</button>${todoCanDelete(task) ? `<button class="mini-button danger" data-todo-delete="${escapeHtml(task.id)}">Delete</button>` : ""}</div></article>`;
}
function todoCalendar() {
  const groups = new Map();
  todoUi.tasks.forEach((task) => { const key = task.due_date || "No due date"; groups.set(key, [...(groups.get(key) || []), task]); });
  return `<section class="panel todo-calendar"><div class="todo-section-head"><div><h3>${todoUi.meta.isAdmin && todoUi.scope === "all-staff" ? "All Staff Calendar" : "My Calendar"}</h3><p>Calendar privacy follows the same server-enforced task scope.</p></div></div><div class="todo-calendar-grid">${[...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, tasks]) => `<div class="todo-calendar-day"><h4>${date === "No due date" ? date : todoDisplayDate(date)}</h4>${tasks.map((task) => `<button data-todo-edit="${escapeHtml(task.id)}"><strong>${escapeHtml(task.title)}</strong><span>${escapeHtml(task.assigned_to_name || "")} · ${escapeHtml(task.status)}</span></button>`).join("")}</div>`).join("") || `<div class="empty-state">No calendar tasks found.</div>`}</div></section>`;
}
function todoEditor(task) {
  const isNew = !task.id;
  const currentId = todoUi.meta.currentUser.authUserId;
  const fullEdit = isNew || todoUi.meta.isAdmin || (task.status !== "Completed" && (task.created_by_id === currentId || task.assigned_by_id === currentId));
  const selectedAssignee = task.assigned_to_id || currentId;
  const assigneeField = todoUi.meta.canAssign && fullEdit ? `<label>Assigned To<select id="todoFormAssignee">${todoUi.meta.assignableUsers.map((user) => `<option value="${escapeHtml(user.authUserId)}" ${selectedAssignee === user.authUserId ? "selected" : ""}>${escapeHtml(user.name)}</option>`).join("")}</select></label>` : `<label>Assigned To<input value="${escapeHtml(task.assigned_to_name || todoUi.meta.currentUser.name)}" disabled><input id="todoFormAssignee" type="hidden" value="${escapeHtml(selectedAssignee)}"></label>`;
  return `<section class="panel todo-editor"><div class="todo-section-head"><div><h3>${isNew ? "Add To-Do" : fullEdit ? "Edit To-Do" : "Update Assigned Task"}</h3><p>${fullEdit ? "Task content and schedule changes are audited." : "You may update status, progress and waiting remarks."}</p></div><button class="mini-button" id="todoCancelEdit">Close</button></div><div class="todo-form-grid"><label class="todo-title-field">Task Title<input id="todoFormTitle" value="${escapeHtml(task.title || "")}" maxlength="240" ${fullEdit ? "" : "disabled"}></label><label>Description<textarea id="todoFormDescription" rows="3" ${fullEdit ? "" : "disabled"}>${escapeHtml(task.description || "")}</textarea></label><label>Priority<select id="todoFormPriority" ${fullEdit ? "" : "disabled"}>${todoOptions(["Low", "Medium", "High", "Urgent"], task.priority || "Medium")}</select></label><label>Status<select id="todoFormStatus" ${isNew ? "disabled" : ""}>${todoOptions(["Pending", "In Progress", "Waiting", "Completed", "Cancelled"], task.status || "Pending")}</select></label><label>Due Date<input id="todoFormDueDate" type="date" value="${escapeHtml(task.due_date || "")}" ${fullEdit ? "" : "disabled"}></label><label>Due Time<input id="todoFormDueTime" type="time" value="${escapeHtml(task.due_time || "")}" ${fullEdit ? "" : "disabled"}></label><label>Reminder<input id="todoFormReminder" type="datetime-local" value="${escapeHtml(todoLocalDateTime(task.reminder_at))}" ${fullEdit ? "" : "disabled"}></label>${assigneeField}<label>Progress / Remarks<textarea id="todoFormRemarks" rows="2">${escapeHtml(task.remarks || "")}</textarea></label><label>Waiting Remarks<textarea id="todoFormWaiting" rows="2">${escapeHtml(task.waiting_remarks || "")}</textarea></label></div><div class="action-row"><button class="primary-button" id="todoSave">${isNew ? "Create To-Do" : "Save Changes"}</button></div></section>`;
}

function bindTodoPage() {
  document.querySelectorAll("[data-todo-scope]").forEach((button) => button.onclick = () => { todoUi.scope = button.dataset.todoScope; todoUi.assignedTo = ""; todoUi.editing = null; todoRefresh(); });
  document.querySelector("#todoAdd").onclick = () => { todoUi.editing = { assigned_to_id: todoUi.meta.currentUser.authUserId, assigned_to_name: todoUi.meta.currentUser.name, priority: "Medium", status: "Pending" }; todoPaint(); document.querySelector(".todo-editor")?.scrollIntoView({ behavior: "smooth" }); };
  document.querySelector("#todoViewToggle").onclick = () => { todoUi.view = todoUi.view === "calendar" ? "list" : "calendar"; todoPaint(); };
  document.querySelector("#todoApplyFilters").onclick = () => { todoUi.search = document.querySelector("#todoSearch").value.trim(); todoUi.status = document.querySelector("#todoStatusFilter").value; todoUi.priority = document.querySelector("#todoPriorityFilter").value; todoUi.assignedTo = document.querySelector("#todoAssignedFilter")?.value || todoUi.assignedTo; todoRefresh(); };
  document.querySelector("#todoSearch").onkeydown = (event) => { if (event.key === "Enter") document.querySelector("#todoApplyFilters").click(); };
  document.querySelector("#todoClearFilters").onclick = () => { todoUi.search = todoUi.status = todoUi.priority = todoUi.assignedTo = ""; todoRefresh(); };
  document.querySelector("#todoExport").onclick = exportTodos;
  document.querySelectorAll("[data-todo-staff]").forEach((button) => button.onclick = () => { todoUi.assignedTo = button.dataset.todoStaff; todoRefresh(); });
  document.querySelectorAll("[data-todo-edit]").forEach((button) => button.onclick = () => { todoUi.editing = todoUi.tasks.find((task) => task.id === button.dataset.todoEdit) || null; todoPaint(); document.querySelector(".todo-editor")?.scrollIntoView({ behavior: "smooth" }); });
  document.querySelectorAll("[data-todo-complete]").forEach((button) => button.onclick = () => saveTodoPatch(button.dataset.todoComplete, { status: "Completed" }, "Task completed"));
  document.querySelectorAll("[data-todo-history]").forEach((button) => button.onclick = () => showTodoHistory(button.dataset.todoHistory));
  document.querySelectorAll("[data-todo-delete]").forEach((button) => button.onclick = () => deleteTodoTask(button.dataset.todoDelete));
  if (todoUi.editing) { document.querySelector("#todoCancelEdit").onclick = () => { todoUi.editing = null; todoPaint(); }; document.querySelector("#todoSave").onclick = saveTodoEditor; }
}

async function saveTodoEditor() {
  const task = todoUi.editing || {};
  const payload = { status: document.querySelector("#todoFormStatus")?.value, remarks: document.querySelector("#todoFormRemarks")?.value, waiting_remarks: document.querySelector("#todoFormWaiting")?.value };
  if (!document.querySelector("#todoFormTitle")?.disabled) Object.assign(payload, { title: document.querySelector("#todoFormTitle")?.value, description: document.querySelector("#todoFormDescription")?.value, priority: document.querySelector("#todoFormPriority")?.value, due_date: document.querySelector("#todoFormDueDate")?.value, due_time: document.querySelector("#todoFormDueTime")?.value, reminder_at: document.querySelector("#todoFormReminder")?.value, assigned_to_id: document.querySelector("#todoFormAssignee")?.value });
  if (!task.id && !String(payload.title || "").trim()) return toast("Task title is required.");
  const button = document.querySelector("#todoSave"); if (button) { button.disabled = true; button.textContent = "Saving..."; }
  try { await apiJson(task.id ? `/api/todos/${encodeURIComponent(task.id)}` : "/api/todos", { method: task.id ? "PATCH" : "POST", body: JSON.stringify(payload) }); todoUi.editing = null; toast(task.id ? "To-Do updated" : "To-Do created"); await todoRefresh(); }
  catch (error) { toast(error.message || "Unable to save To-Do."); if (button) { button.disabled = false; button.textContent = task.id ? "Save Changes" : "Create To-Do"; } }
}
async function saveTodoPatch(id, patch, success) { try { await apiJson(`/api/todos/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) }); toast(success); await todoRefresh(); } catch (error) { toast(error.message || "Unable to update To-Do."); } }
async function deleteTodoTask(id) { if (!confirm("Delete this To-Do task? This action is recorded in history.")) return; try { await apiJson(`/api/todos/${encodeURIComponent(id)}`, { method: "DELETE" }); toast("To-Do deleted"); await todoRefresh(); } catch (error) { toast(error.message || "Unable to delete To-Do."); } }
async function showTodoHistory(id) {
  try {
    const result = await apiJson(`/api/todos/${encodeURIComponent(id)}/history`);
    document.querySelector("#todoHistoryModal")?.remove();
    const backdrop = document.createElement("div"); backdrop.id = "todoHistoryModal"; backdrop.className = "todo-history-backdrop";
    backdrop.innerHTML = `<section class="todo-history-dialog"><div class="todo-section-head"><div><h3>Task Activity History</h3><p>Visible only to Admin, the assigner and the assignee.</p></div><button class="mini-button" data-close-todo-history>Close</button></div><div class="todo-history-list">${(result.history || []).map((row) => `<article><strong>${escapeHtml(row.action)}</strong><span>${escapeHtml(row.actor_name || "System")} · ${escapeHtml(todoDateTime(row.created_at))}</span>${Object.keys(row.changes || {}).length ? `<pre>${escapeHtml(JSON.stringify(row.changes, null, 2))}</pre>` : ""}</article>`).join("") || `<p>No activity recorded.</p>`}</div></section>`;
    backdrop.onclick = (event) => { if (event.target === backdrop || event.target.closest("[data-close-todo-history]")) backdrop.remove(); }; document.body.appendChild(backdrop);
  } catch (error) { toast(error.message || "Unable to load task history."); }
}
async function exportTodos() {
  try {
    const result = await apiJson(`/api/todos/export?${todoQuery()}`);
    const rows = (result.tasks || []).map((task, index) => ({ SN: index + 1, Task: task.title, Description: task.description, Priority: task.priority, Status: task.status, "Due Date": task.due_date, "Due Time": task.due_time, "Assigned To": task.assigned_to_name, "Assigned By": task.assigned_by_name, Remarks: task.remarks, "Waiting Remarks": task.waiting_remarks, "Completed By": task.completed_by_name, "Completed At": task.completed_at ? todoDateTime(task.completed_at) : "" }));
    if (!rows.length) return toast("No permitted To-Do data to export.");
    await downloadXlsxRows(`todo-list-${todoIndiaDate()}`, rows, "To-Do List"); toast("To-Do export downloaded");
  } catch (error) { toast(error.message || "Unable to export To-Do data."); }
}
function todoAssignedByMe(task) { const id = todoUi.meta?.currentUser?.authUserId; return task.assigned_by_id === id && task.assigned_to_id !== id; }
function todoCanDelete(task) { const id = todoUi.meta?.currentUser?.authUserId; return todoUi.meta?.isAdmin || ((task.created_by_id === id || task.assigned_by_id === id) && task.status !== "Completed"); }
function todoOptions(values, selected, emptyLabel = "") { return values.map((value) => `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(value || emptyLabel)}</option>`).join(""); }
function todoLoading() { return `<div class="panel todo-loading"><strong>Loading secure To-Do workspace...</strong></div>`; }
function todoStatusClass(value) { return String(value || "pending").toLowerCase().replace(/[^a-z]+/g, "-"); }
function todoIndiaDate() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
function todoDisplayDate(value) { const [year, month, day] = String(value || "").split("-"); return year && month && day ? `${day}-${month}-${year}` : value || ""; }
function todoDateTime(value) { const date = new Date(value); return Number.isFinite(date.getTime()) ? date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : ""; }
function todoLocalDateTime(value) { if (!value) return ""; const date = new Date(value); if (!Number.isFinite(date.getTime())) return ""; const offset = date.getTimezoneOffset() * 60000; return new Date(date.getTime() - offset).toISOString().slice(0, 16); }
