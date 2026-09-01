(function registerModules() {
  "use strict";

  const ui = {
    complaintTab: "dashboard", complaintPage: 1, complaintSearch: "", complaints: [], complaintDashboard: null,
    dscTab: "dashboard", dscPage: 1, dscSearch: "", dscRecords: [], dscDashboard: null,
    categories: [], boxes: [], users: [], clients: [], loading: false,
  };

  const complaintTabs = [
    ["dashboard","Dashboard"],["all","All Complaints"],["open","Open Complaints"],["assigned","Assigned to Me"],
    ["pending-client","Pending Client Response"],["escalated","Escalated"],["resolved","Resolved"],["closed","Closed"],
    ["reports","Complaint Reports"],["settings","Complaint Settings"],
  ];
  const dscTabs = [
    ["dashboard","DSC Dashboard"],["master","DSC Master"],["movements","DSC In & Out"],["fresh","Fresh Issue Tracker"],
    ["renewal","Renewal Tracker"],["expiry","Expiry Register"],["handover","Handover Requests"],["boxes","Box / Storage Register"],
    ["reports","DSC Reports"],["settings","DSC Settings"],
  ];

  const api = (path, options) => window.apiJson(path, options);
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[ch]));
  const date = (value, includeTime = false) => value ? new Date(value).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric", ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}) }) : "—";
  const role = () => window.getRegisterContext?.().role || "Staff";
  const perms = () => window.getRegisterContext?.().permissions || [];
  const canManageDsc = () => role() === "Admin" || perms().includes("manage_dsc");
  const canApproveDsc = () => role() === "Admin" || perms().includes("approve_dsc_handover");
  const canManageComplaintSettings = () => role() === "Admin";
  const toast = (message) => window.toast?.(message);
  window.openComplaintTab = function openComplaintTab(tab) { ui.complaintTab = tab || "dashboard"; ui.complaintPage = 1; };
  window.openDscTab = function openDscTab(tab) { ui.dscTab = tab || "dashboard"; ui.dscPage = 1; };
  window.getCurrentRegisterTab = function getCurrentRegisterTab(kind) { return kind === "complaint" ? ui.complaintTab : ui.dscTab; };
  window.openDscForClient = function openDscForClient(clientName) { ui.dscTab = "master"; ui.dscSearch = String(clientName || ""); ui.dscPage = 1; };

  async function loadDirectory() {
    if (ui.users.length) return;
    const result = await api("/api/users/directory");
    ui.users = result.users || [];
  }

  function moduleShell(kind, tabs, active, body, primaryAction = "") {
    return `<section class="register-module ${kind}-module">
      <div class="register-toolbar">
        <div class="register-tabs" role="tablist">${tabs.map(([id,label]) => `<button type="button" data-register-tab="${kind}:${id}" class="${active === id ? "active" : ""}">${esc(label)}</button>`).join("")}</div>
        ${primaryAction}
      </div>
      <div class="register-content">${body}</div>
    </section>`;
  }

  function bindTabs(root, kind) {
    root.querySelectorAll(`[data-register-tab^="${kind}:"]`).forEach((button) => button.addEventListener("click", () => {
      const next = button.dataset.registerTab.split(":")[1];
      if (kind === "complaint") { ui.complaintTab = next; ui.complaintPage = 1; window.renderComplaintRegisterPage(); }
      else { ui.dscTab = next; ui.dscPage = 1; window.renderDscRegisterPage(); }
    }));
  }

  window.renderComplaintRegisterPage = async function renderComplaintRegisterPage() {
    const root = document.querySelector("#complaints"); if (!root) return;
    root.innerHTML = moduleShell("complaint", complaintTabs, ui.complaintTab, loadingCard("Loading Complaint Register…"), `<button class="primary-button register-primary" id="newComplaint">+ New Complaint</button>`);
    bindTabs(root, "complaint"); root.querySelector("#newComplaint")?.addEventListener("click", openComplaintForm);
    try {
      await loadDirectory();
      let body;
      if (ui.complaintTab === "dashboard") body = await complaintDashboard();
      else if (ui.complaintTab === "reports") body = complaintReports();
      else if (ui.complaintTab === "settings") body = await complaintSettings();
      else body = await complaintList();
      root.querySelector(".register-content").innerHTML = body; bindComplaintActions(root);
    } catch (error) { root.querySelector(".register-content").innerHTML = errorCard(error); }
  };

  async function complaintDashboard() {
    ui.complaintDashboard = await api("/api/complaints/dashboard"); const d = ui.complaintDashboard;
    return `<div class="register-kpi-grid">
      ${kpi("Total Complaints",d.total,"blue")}${kpi("Open",d.open,"amber")}${kpi("High Priority",d.high,"orange")}${kpi("Critical",d.critical,"red")}
      ${kpi("SLA Due Today",d.slaDueToday,"purple")}${kpi("SLA Breached",d.slaBreached,"red")}${kpi("Resolved This Month",d.resolvedThisMonth,"green")}${kpi("Reopened",d.reopened,"amber")}${kpi("Average Resolution",`${d.averageResolutionHours} hrs`,"blue")}
    </div>
    <div class="register-grid-two"><section class="register-card"><h3>Recent Complaints</h3>${complaintRows(d.recent || [], true)}</section>
      <section class="register-card"><h3>Management Review</h3><div class="register-summary-list"><span><strong>${d.slaBreached}</strong>SLA breaches requiring action</span><span><strong>${d.critical}</strong>Critical complaints</span><span><strong>${d.reopened}</strong>Reopened complaints</span></div></section></div>
    <div class="register-grid-two"><section class="register-card"><h3>Complaints by Category</h3>${miniBars(d.byCategory)}</section><section class="register-card"><h3>Complaints by Service</h3>${miniBars(d.byService)}</section></div>
    <div class="register-grid-two"><section class="register-card"><h3>Complaints by Staff</h3>${miniBars(d.byStaff)}</section><section class="register-card"><h3>Complaint Trend</h3>${miniBars(d.trend)}</section></div>`;
  }

  async function complaintList() {
    const params = new URLSearchParams({ page: ui.complaintPage, pageSize: 25, q: ui.complaintSearch });
    if (ui.complaintTab !== "all") params.set("view", ui.complaintTab);
    const result = await api(`/api/complaints?${params}`); ui.complaints = result.complaints || [];
    return `<section class="register-card"><div class="register-filter-row"><input id="complaintSearch" value="${esc(ui.complaintSearch)}" placeholder="Search complaint no., client, PAN or subject"><button class="secondary-button" id="complaintSearchButton">Search</button><span>${result.total} complaint(s)</span></div>
      ${complaintRows(ui.complaints)}${pagination("complaint", result)}</section>`;
  }

  function complaintRows(rows, compact = false) {
    if (!rows.length) return `<div class="register-empty">No complaints found.</div>`;
    return `<div class="register-table-wrap"><table class="register-table"><thead><tr><th>Complaint</th><th>Client / Subject</th><th>Priority</th><th>Status</th>${compact ? "" : "<th>Assigned To</th><th>SLA Due</th>"}<th>Action</th></tr></thead><tbody>${rows.map((row) => `<tr>
      <td><strong>${esc(row.complaint_no)}</strong><small>${date(row.complaint_at, true)}</small></td><td><strong>${esc(row.client_name)}</strong><small>${esc(row.subject)}</small></td>
      <td>${badge(row.priority)}</td><td>${badge(row.status)}</td>${compact ? "" : `<td>${esc(row.assigned?.name || row.assigned_team || "Unassigned")}</td><td class="${isBreached(row) ? "register-danger" : ""}">${date(row.sla_due_at, true)}</td>`}
      <td><button class="mini-button" data-view-complaint="${row.id}">View</button></td></tr>`).join("")}</tbody></table></div>`;
  }

  function complaintReports() {
    const reports = ["Complaint Register","Open Complaint Report","SLA Breach Report","Staff-wise Complaints","Service-wise Complaints","Client-wise Complaints","Root Cause Analysis","Resolution Time Report","Reopened Complaint Report"];
    return `<section class="register-card"><div class="register-card-head"><div><h3>Complaint Reports</h3><p>Management-ready complaint and resolution analysis.</p></div><div><button class="secondary-button" data-download="/api/complaints/export/pdf">Export PDF</button> <button class="primary-button" data-download="/api/complaints/export/xlsx">Export Excel</button></div></div><div class="report-tile-grid">${reports.map((name) => `<article><strong>${esc(name)}</strong><span>Uses the current complaint filters and role access.</span></article>`).join("")}</div></section>`;
  }

  async function complaintSettings() {
    if (!canManageComplaintSettings()) return `<div class="register-card"><h3>Complaint Settings</h3><p>Only Admin can change complaint categories and SLA rules.</p></div>`;
    const [categoryResult, settingsResult] = await Promise.all([api("/api/complaints/categories?all=true"), api("/api/complaints/settings")]);
    ui.categories = categoryResult.categories || []; const s = settingsResult.settings;
    return `<div class="register-grid-two"><section class="register-card"><h3>SLA by Priority</h3><form id="complaintSettingsForm" class="register-form-grid">
      ${numberField("Critical (minutes)","sla_critical_minutes",s.sla_critical_minutes)}${numberField("High (minutes)","sla_high_minutes",s.sla_high_minutes)}${numberField("Normal (minutes)","sla_normal_minutes",s.sla_normal_minutes)}${numberField("Low (minutes)","sla_low_minutes",s.sla_low_minutes)}
      ${numberField("Acknowledgement (minutes)","acknowledgement_minutes",s.acknowledgement_minutes)}${numberField("SLA approaching (minutes)","approaching_minutes",s.approaching_minutes)}<button class="primary-button" type="submit">Save SLA Settings</button></form></section>
      <section class="register-card"><div class="register-card-head"><h3>Complaint Categories</h3><button class="mini-button" id="addComplaintCategory">+ Add</button></div><div class="settings-list">${ui.categories.map((c) => `<span><strong>${esc(c.name)}</strong><em>${c.is_active ? "Active" : "Inactive"}</em></span>`).join("")}</div></section></div>`;
  }

  function bindComplaintActions(root) {
    root.querySelectorAll("[data-view-complaint]").forEach((button) => button.onclick = () => openComplaintDetail(button.dataset.viewComplaint));
    root.querySelector("#complaintSearchButton")?.addEventListener("click", () => { ui.complaintSearch = root.querySelector("#complaintSearch")?.value || ""; ui.complaintPage = 1; window.renderComplaintRegisterPage(); });
    root.querySelector("#complaintSearch")?.addEventListener("keydown", (event) => { if (event.key === "Enter") root.querySelector("#complaintSearchButton")?.click(); });
    bindPagination(root, "complaint", (page) => { ui.complaintPage = page; window.renderComplaintRegisterPage(); });
    root.querySelectorAll("[data-download]").forEach((button) => button.onclick = () => secureDownload(button.dataset.download));
    root.querySelector("#complaintSettingsForm")?.addEventListener("submit", async (event) => { event.preventDefault(); await submitJson("/api/complaints/settings", "PUT", formObject(event.currentTarget)); toast("Complaint SLA settings saved."); window.renderComplaintRegisterPage(); });
    root.querySelector("#addComplaintCategory")?.addEventListener("click", () => simplePrompt("Add Complaint Category", `<label>Category Name<input name="name" required></label><label>Display Order<input name="displayOrder" type="number" value="100"></label>`, async (values) => { await submitJson("/api/complaints/categories", "POST", values); toast("Complaint category added."); window.renderComplaintRegisterPage(); }));
  }

  async function openComplaintForm(existing = null) {
    const directoryRequest = ui.users.length ? Promise.resolve({ users: ui.users }) : api("/api/users/directory");
    const [clientResult, categoryResult, directoryResult] = await Promise.all([api("/api/clients/search?limit=50"), api("/api/complaints/categories"), directoryRequest]);
    ui.clients = clientResult.clients || []; ui.categories = categoryResult.categories || []; ui.users = directoryResult.users || ui.users;
    const today = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 16);
    showModal("New Complaint", `<form id="complaintForm" class="register-form-grid register-form-wide">
      <label>Client Master<select name="clientId" id="complaintClient"><option value="">Select client</option>${ui.clients.map((c) => `<option value="${c.id}" data-pan="${esc(c.pan_reg_no || "")}" data-contact="${esc(c.contact_person || "")}" data-phone="${esc(c.contact_number || "")}" data-email="${esc(c.email || "")}" data-name="${esc(c.client_name)}">${esc(c.client_name)}${c.pan_reg_no ? ` — ${esc(c.pan_reg_no)}` : ""}</option>`).join("")}</select></label>
      ${inputField("Client Name","clientName","",true)}${inputField("Contact Person","contactPerson")}${inputField("Contact No","contactNumber","","", "tel")}${inputField("Email","email","","", "email")}
      ${selectField("Complaint Source","source",["Phone","WhatsApp","Email","Office Visit","Website","Client Portal","Staff Reported","Other"])}
      <label>Complaint Category<select name="categoryId" id="complaintCategory" required><option value="">Select category</option>${ui.categories.map((c) => `<option value="${c.id}" data-name="${esc(c.name)}">${esc(c.name)}</option>`).join("")}</select></label>
      ${inputField("Complaint Date & Time","complaintAt",today,true,"datetime-local")}${selectField("Priority","priority",["Low","Normal","High","Critical"],"Normal")}${selectField("Severity","severity",["Low","Medium","High","Critical"],"Medium")}
      <label>Assigned To<select name="assignedUserId"><option value="">Unassigned</option>${ui.users.map((u) => `<option value="${u.id}">${esc(u.name)} — ${esc(u.role)}</option>`).join("")}</select></label>
      ${inputField("Target Resolution","targetResolutionAt","","","datetime-local")}${inputField("Follow Up","followUpAt","","","datetime-local")}
      <label class="form-span-2">Complaint Description<textarea name="description" rows="5" required></textarea></label>
      <div class="form-span-2 register-error" data-complaint-save-error role="alert" hidden></div>
      <div class="modal-actions form-span-2"><button type="button" class="secondary-button" data-close-register-modal>Cancel</button><button type="submit" class="primary-button">Save Complaint</button></div></form>`);
    const form = document.querySelector("#complaintForm");
    form.querySelector("#complaintClient").onchange = (event) => { const option = event.target.selectedOptions[0]; if (!option?.value) return; form.elements.clientName.value = option.dataset.name; form.elements.contactPerson.value = option.dataset.contact; form.elements.contactNumber.value = option.dataset.phone; form.elements.email.value = option.dataset.email; };
    form.onsubmit = async (event) => {
      event.preventDefault();
      const submit = form.querySelector('[type="submit"]'); const errorBox = form.querySelector("[data-complaint-save-error]");
      submit.disabled = true; submit.textContent = "Saving…"; errorBox.hidden = true; errorBox.textContent = "";
      try {
        const values = formObject(form); values.clientType = values.clientId ? "Existing Client" : "Non-Client / General";
        const cat = form.querySelector("#complaintCategory").selectedOptions[0]; values.categoryName = cat?.dataset.name || "Other";
        await submitJson("/api/complaints", "POST", values); closeModal(); toast("Complaint registered."); window.renderComplaintRegisterPage();
      } catch (error) {
        errorBox.textContent = error.message || "Unable to save the complaint. Please check the entered details."; errorBox.hidden = false;
        submit.disabled = false; submit.textContent = "Save Complaint";
      }
    };
  }

  async function openComplaintDetail(id) {
    const result = await api(`/api/complaints/${id}`); const row = result.complaint;
    showModal(`${row.complaint_no} — ${row.subject}`, `<div class="register-detail">
      <div class="detail-summary-grid"><span><small>Client</small><strong>${esc(row.client_name)}</strong></span><span><small>Status</small>${badge(row.status)}</span><span><small>Priority</small>${badge(row.priority)}</span><span><small>SLA Due</small><strong class="${isBreached(row) ? "register-danger" : ""}">${date(row.sla_due_at,true)}</strong></span><span><small>Assigned To</small><strong>${esc(row.assigned?.name || row.assigned_team || "Unassigned")}</strong></span><span><small>Contact</small><strong>${esc(row.contact_number || row.email || "—")}</strong></span></div>
      <section class="detail-copy"><h4>Description</h4><p>${esc(row.description)}</p></section>
      <div class="mobile-action-bar"><button data-complaint-whatsapp>WhatsApp</button><button data-complaint-email>Email</button><button data-complaint-call>Call</button><button data-complaint-status>Update Status</button><button data-complaint-note>Add Note</button></div>
      ${row.related_file_id ? `<div class="linked-record-note"><strong>Linked File:</strong> ${esc(row.related_file_id)}. Creating this complaint has not changed the file.</div>` : ""}
      <section><h4>Activity Timeline</h4><div class="activity-timeline">${(result.activities || []).map((a) => `<article><i></i><div><strong>${esc(a.activity_type)}</strong><small>${esc(a.actor_name || "System")} · ${date(a.created_at,true)}</small><p>${esc(a.remarks || "")}</p></div></article>`).join("") || "No activity yet."}</div></section></div>`);
    document.querySelector("[data-complaint-whatsapp]").onclick = () => communicateComplaint(row, "WhatsApp");
    document.querySelector("[data-complaint-email]").onclick = () => communicateComplaint(row, "Email");
    document.querySelector("[data-complaint-call]").onclick = () => { if (row.contact_number) location.href = `tel:${row.contact_number.replace(/[^+\d]/g, "")}`; };
    document.querySelector("[data-complaint-note]").onclick = () => simplePrompt("Add Complaint Note", `<label>Note<textarea name="remarks" rows="4" required></textarea></label>`, async (values) => { await submitJson(`/api/complaints/${id}/activity`, "POST", { ...values, type: "Note added" }); closeModal(); openComplaintDetail(id); });
    document.querySelector("[data-complaint-status]").onclick = () => complaintStatusPrompt(row);
  }

  function communicateComplaint(row, channel) {
    const message = `Dear ${row.client_name}, Complaint Ref. ${row.complaint_no} regarding ${row.subject} has been registered with us. Our team is reviewing the matter and will keep you updated.`;
    if (channel === "WhatsApp") window.open(`https://wa.me/${String(row.contact_number || "").replace(/\D/g, "")}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
    else location.href = `mailto:${encodeURIComponent(row.email || "")}?subject=${encodeURIComponent(`Complaint acknowledgement ${row.complaint_no}`)}&body=${encodeURIComponent(message)}`;
    submitJson(`/api/complaints/${row.id}/activity`, "POST", { type: `${channel} sent`, channel, recipient: channel === "WhatsApp" ? row.contact_number : row.email, remarks: message }).catch(() => {});
  }

  function complaintStatusPrompt(row) {
    const statuses = ["New","Acknowledged","Assigned","Under Review","Action in Progress","Waiting for Client","Waiting for Third Party","Escalated","Resolution Proposed","Resolved","Closed","Reopened"];
    simplePrompt("Update Complaint Status", `${selectField("Status","status",statuses,row.status)}<label>Remarks<textarea name="remarks" rows="3"></textarea></label><div data-resolution-fields>${inputField("Resolution Date","resolutionDate",new Date().toISOString().slice(0,10),false,"date")}<label>Resolution Summary<textarea name="resolutionSummary"></textarea></label><label>Action Taken<textarea name="actionTaken"></textarea></label>${selectField("Root Cause","rootCause",["Process Failure","Staff Error","Client Delay","Communication Gap","System / Technical Error","Third Party / Department Delay","Incorrect Information Received","Other"])}<label>Corrective Action<textarea name="correctiveAction"></textarea></label><label>Preventive Action<textarea name="preventiveAction"></textarea></label></div>`, async (values) => { await submitJson(`/api/complaints/${row.id}/status`, "POST", values); closeModal(); toast("Complaint status updated."); window.renderComplaintRegisterPage(); });
  }

  window.renderDscRegisterPage = async function renderDscRegisterPage() {
    const root = document.querySelector("#dsc"); if (!root) return;
    root.innerHTML = moduleShell("dsc", dscTabs, ui.dscTab, loadingCard("Loading DSC Register…"), canManageDsc() ? `<button class="primary-button register-primary" id="newDsc">+ Add DSC</button>` : "");
    bindTabs(root, "dsc"); root.querySelector("#newDsc")?.addEventListener("click", openDscForm);
    try {
      await loadDirectory(); let body;
      if (ui.dscTab === "dashboard") body = await dscDashboard();
      else if (["master","expiry"].includes(ui.dscTab)) body = await dscList();
      else if (ui.dscTab === "movements") body = await movementList();
      else if (ui.dscTab === "handover") body = await handoverList();
      else if (ui.dscTab === "boxes") body = await boxList();
      else if (ui.dscTab === "fresh") body = await freshList();
      else if (ui.dscTab === "renewal") body = await renewalList();
      else if (ui.dscTab === "reports") body = dscReports();
      else body = await dscSettings();
      root.querySelector(".register-content").innerHTML = body; bindDscActions(root);
    } catch (error) { root.querySelector(".register-content").innerHTML = errorCard(error); }
  };

  async function dscDashboard() {
    const d = await api("/api/dsc/dashboard"); ui.dscDashboard = d;
    return `<div class="register-kpi-grid">${kpi("Total Active DSCs",d.totalActive,"blue")}${kpi("In Office",d.inOffice,"green")}${kpi("Issued Out",d.issuedOut,"orange")}${kpi("Return Overdue",d.returnOverdue,"red")}${kpi("Expiring in 30 Days",d.expiring30,"amber")}${kpi("Expired",d.expired,"red")}${kpi("Renewal Pending",d.renewalPending,"purple")}${kpi("Fresh Issue Pending",d.freshPending,"blue")}${kpi("Approval Pending",d.approvalPending,"amber")}${kpi("Missing / Damaged",d.missingDamaged,"red")}</div>
      <section class="register-card"><h3>Upcoming Expiries</h3>${dscRows(d.upcoming || [], true)}</section>`;
  }

  async function dscList() {
    const params = new URLSearchParams({ page: ui.dscPage, pageSize: 25, q: ui.dscSearch });
    if (ui.dscTab === "expiry") { params.set("expiryFrom", new Date().toISOString().slice(0,10)); params.set("expiryTo", new Date(Date.now()+90*86400000).toISOString().slice(0,10)); }
    const result = await api(`/api/dsc?${params}`); ui.dscRecords = result.records || [];
    const importActions = ui.dscTab === "master" && canManageDsc() ? `<button class="secondary-button" id="downloadDscSample">Download Sample Excel</button><button class="secondary-button" id="importDscExcel">Import Excel</button><input id="dscImportFile" type="file" accept=".xlsx,.xls" hidden>` : "";
    const expiryActions = ui.dscTab === "expiry" ? `<button class="secondary-button" data-download="/api/dsc/export/pdf?report=expiry">Export PDF</button><button class="primary-button" data-download="/api/dsc/export/xlsx?report=expiry">Export Excel</button>` : "";
    return `<section class="register-card"><div class="register-card-head"><div class="register-filter-row"><input id="dscSearch" value="${esc(ui.dscSearch)}" placeholder="Search entity, PAN, holder, token, box or slot"><button class="secondary-button" id="dscSearchButton">Search</button><span>${result.total} DSC record(s)</span></div><div>${importActions}${expiryActions}</div></div>${dscRows(ui.dscRecords)}${pagination("dsc",result)}</section>`;
  }
  function dscRows(rows, compact = false) {
    if (!rows.length) return `<div class="register-empty">No DSC records found.</div>`;
    return `<div class="register-table-wrap"><table class="register-table"><thead><tr><th>DSC / Client</th><th>Holder / Token</th><th>Expiry</th><th>Status</th><th>Custody</th>${compact ? "" : "<th>Box / Slot</th>"}<th>Action</th></tr></thead><tbody>${rows.map((r) => `<tr><td><strong>${esc(r.dsc_id)}</strong><small>${esc(r.client_name)}</small></td><td><strong>${esc(r.holder_name)}</strong><small>${esc(r.token_name || r.token_make || r.token_serial || "—")}</small></td><td class="${expiryDanger(r.expiry_date) ? "register-danger" : ""}">${date(r.expiry_date)}</td><td>${badge(r.status)}</td><td>${esc(r.current_custody)}</td>${compact ? "" : `<td><strong>${esc(r.box?.box_code || "Unboxed")}</strong><small>${esc(r.slot_position || "—")}</small></td>`}<td><button class="mini-button" data-view-dsc="${r.id}">View</button></td></tr>`).join("")}</tbody></table></div>`;
  }

  async function handoverList() {
    const result = await api("/api/dsc/handovers?page=1&pageSize=100");
    return `<section class="register-card"><div class="register-card-head"><div><h3>${ui.dscTab === "movements" ? "DSC In & Out" : "Handover Requests"}</h3><p>Permission, handover and return trail.</p></div><button class="primary-button" id="requestHandover">Request Handover Permission</button></div>
      <div class="register-table-wrap"><table class="register-table"><thead><tr><th>Request</th><th>DSC</th><th>Hand Over To</th><th>Purpose</th><th>Expected Return</th><th>Status</th><th>Action</th></tr></thead><tbody>${(result.requests || []).map((r) => `<tr><td><strong>${esc(r.request_no)}</strong><small>${date(r.created_at,true)}</small></td><td>${esc(r.dsc?.holder_name || "")}<small>${esc(r.dsc?.token_name || r.dsc?.token_serial || "")}</small></td><td>${esc(r.handover_to)}</td><td>${esc(r.purpose)}</td><td>${date(r.expected_return_date)}</td><td>${badge(r.status)}</td><td>${canApproveDsc() && ["Requested","Level 1 Approved"].includes(r.status) ? `<button class="mini-button" data-approve-handover="${r.id}">Approve</button> <button class="mini-button danger" data-reject-handover="${r.id}">Reject</button>` : ""}${canManageDsc() && r.status === "Approved" ? `<button class="mini-button" data-mark-out="${r.id}">Mark Out</button>` : ""}${r.status === "Handed Over" && canManageDsc() ? `<button class="mini-button" data-return-dsc="${r.dsc?.id}" data-request-id="${r.id}">Mark Returned</button>` : ""}</td></tr>`).join("") || `<tr><td colspan="7">No handover requests.</td></tr>`}</tbody></table></div></section>`;
  }

  async function movementList() {
    const result=await api("/api/dsc/movements?page=1&pageSize=100");
    return `<section class="register-card"><div class="register-card-head"><div><h3>DSC In & Out</h3><p>Complete custody movement trail.</p></div><div>${canManageDsc()?`<button class="primary-button" id="addDscMovement">+ Add DSC Movement</button> `:""}<button class="secondary-button" id="requestHandover">Request Handover Permission</button> <button class="secondary-button" data-download="/api/dsc/export/pdf?report=movements">Export PDF</button> <button class="primary-button" data-download="/api/dsc/export/xlsx?report=movements">Export Excel</button></div></div>
      <div class="register-table-wrap"><table class="register-table"><thead><tr><th>Date & Time</th><th>Movement</th><th>DSC / Holder</th><th>Issued To / Condition</th><th>From / To Slot</th><th>Remarks</th></tr></thead><tbody>${(result.movements||[]).map((row)=>`<tr><td>${date(row.movement_at,true)}</td><td>${badge(row.movement_type==="RETURN"?"IN":row.movement_type)}</td><td><strong>${esc(row.dsc?.entity_name||row.dsc?.client_name||"")}</strong><small>${esc(row.dsc?.holder_name||"")} · ${esc(row.dsc?.token_name||"")}</small></td><td><strong>${esc(row.issued_to||row.condition||"—")}</strong><small>${esc(row.purpose||"")}</small></td><td>${esc(row.from_slot||"—")} → ${esc(row.to_slot||"—")}</td><td>${esc(row.remarks||"")}</td></tr>`).join("")||`<tr><td colspan="6">No DSC movements recorded.</td></tr>`}</tbody></table></div></section>`;
  }

  async function boxList() {
    const result = await api("/api/dsc/boxes"); ui.boxes = result.boxes || [];
    return `<section class="register-card"><div class="register-card-head"><div><h3>Box / Storage Register</h3><p>Physical identification and capacity.</p></div>${canManageDsc() ? `<button class="primary-button" id="addDscBox">+ Add Box</button>` : ""}</div><div class="box-grid">${ui.boxes.map((b) => `<button data-view-box="${b.id}"><strong>${esc(b.box_code)}</strong><span>${esc(b.cabinet || "")} ${esc(b.shelf || "")}</span><small>${esc(b.location)}</small><em>${b.occupied} occupied · ${b.available} available</em></button>`).join("") || "No boxes configured."}</div></section>`;
  }

  async function freshList() {
    const result = await api("/api/dsc/fresh-issues?page=1&pageSize=100");
    const rows=result.records||[];
    const table=!rows.length?`<div class="register-empty">No Fresh DSC Issue records found.</div>`:`<div class="register-table-wrap"><table class="register-table fresh-issue-table"><thead><tr><th>SN</th><th>Client Name</th><th>Organisation Name</th><th>DSC Class</th><th>Authority</th><th>Issue Date</th><th>Expiry Date</th><th>Status</th><th>Kept with Us</th><th>Actions</th></tr></thead><tbody>${rows.map((row,index)=>`<tr><td>${index+1}</td><td><strong>${esc(row.holder_name||"—")}</strong></td><td>${esc(row.organization_name||row.client_name||"—")}</td><td>${esc(row.class_type||"—")}</td><td>${esc(row.authority||"—")}</td><td>${date(row.actual_issue_date)}</td><td>${date(row.valid_to)}</td><td>${badge(row.status)}</td><td><strong>${row.keep_in_custody?"Yes":"No"}</strong></td><td>${canManageDsc()&&row.status==="DSC Received"&&!row.linked_dsc_id?`<button class="mini-button" data-add-fresh-master="${row.id}">Add to DSC Master</button>`:"—"}</td></tr>`).join("")}</tbody></table></div>`;
    return `<section class="register-card"><div class="register-card-head"><div><h3>Fresh DSC Issue Tracker</h3><p>Application, issue, validity and custody tracking.</p></div><div>${canManageDsc() ? `<button class="primary-button" id="newFreshIssue">+ New Fresh Issue</button> ` : ""}<button class="secondary-button" data-download="/api/dsc/export/pdf?report=fresh">Export PDF</button> <button class="primary-button" data-download="/api/dsc/export/xlsx?report=fresh">Export Excel</button></div></div>${table}</section>`;
  }

  async function renewalList() {
    const result = await api("/api/dsc/renewals?page=1&pageSize=100");
    return `<section class="register-card"><h3>DSC Renewal Tracker</h3>${genericRows(result.records || [], ["initiated_date","expiry_date","documents_pending","verification_status","status"])}</section>`;
  }

  function dscReports() {
    const reports = ["Complete DSC Register","DSC In Office","DSC Issued Out","DSC Movement Register","DSC Return Overdue","DSC Expiry Report","Renewal Pending","Fresh Issue Pending","Handover Approval Pending","Box-wise DSC Register","Client-wise DSC Register","Staff-wise Custody Report","Missing/Damaged DSC Report"];
    return `<section class="register-card"><div class="register-card-head"><div><h3>DSC Reports</h3><p>No PIN or password is included in any export.</p></div><div><button class="secondary-button" data-download="/api/dsc/export/pdf">Export PDF</button> <button class="primary-button" data-download="/api/dsc/export/xlsx">Export Excel</button></div></div><div class="report-tile-grid">${reports.map((name) => `<article><strong>${esc(name)}</strong><span>Role-restricted, audit-ready register.</span></article>`).join("")}</div></section>`;
  }

  async function dscSettings() {
    if (role() !== "Admin") return `<section class="register-card"><h3>DSC Settings</h3><p>Only Admin can configure approval levels and expiry reminders.</p></section>`;
    const result = await api("/api/dsc/settings"); const s = result.settings;
    return `<section class="register-card"><h3>DSC Approval & Reminder Settings</h3><form id="dscSettingsForm" class="register-form-grid">
      ${selectField("Approval Levels","approvalLevels",["0","1","2"],String(s.approval_levels))}<label>Reminder Days<input name="reminderDays" value="${esc((s.reminder_days || []).join(", "))}" placeholder="90, 60, 30, 15, 7, 0"></label>
      <label class="form-span-2">Authorized Approvers<select name="approverUserIds" multiple size="6">${ui.users.map((u) => `<option value="${u.id}" ${(s.approver_user_ids || []).includes(u.id) ? "selected" : ""}>${esc(u.name)} — ${esc(u.role)}</option>`).join("")}</select></label><button class="primary-button" type="submit">Save DSC Settings</button></form></section>`;
  }

  function bindDscActions(root) {
    root.querySelector("#dscSearchButton")?.addEventListener("click", () => { ui.dscSearch = root.querySelector("#dscSearch")?.value || ""; ui.dscPage = 1; window.renderDscRegisterPage(); });
    root.querySelector("#dscSearch")?.addEventListener("keydown", (event) => { if (event.key === "Enter") root.querySelector("#dscSearchButton")?.click(); });
    root.querySelector("#downloadDscSample")?.addEventListener("click", downloadDscSample);
    root.querySelector("#importDscExcel")?.addEventListener("click", () => root.querySelector("#dscImportFile")?.click());
    root.querySelector("#dscImportFile")?.addEventListener("change", importDscExcel);
    bindPagination(root,"dsc",(page) => { ui.dscPage = page; window.renderDscRegisterPage(); });
    root.querySelectorAll("[data-view-dsc]").forEach((button) => button.onclick = () => openDscDetail(button.dataset.viewDsc));
    root.querySelectorAll("[data-download]").forEach((button) => button.onclick = () => secureDownload(button.dataset.download));
    root.querySelector("#requestHandover")?.addEventListener("click", requestHandoverForm);
    root.querySelector("#addDscMovement")?.addEventListener("click", addDscMovementForm);
    root.querySelectorAll("[data-approve-handover]").forEach((b) => b.onclick = () => decideHandover(b.dataset.approveHandover,"Approved"));
    root.querySelectorAll("[data-reject-handover]").forEach((b) => b.onclick = () => decideHandover(b.dataset.rejectHandover,"Rejected"));
    root.querySelectorAll("[data-mark-out]").forEach((b) => b.onclick = async () => { await submitJson(`/api/dsc/handovers/${b.dataset.markOut}/out`,"POST",{}); toast("DSC marked Issued Out."); window.renderDscRegisterPage(); });
    root.querySelectorAll("[data-return-dsc]").forEach((b) => b.onclick = () => returnDscForm(b.dataset.returnDsc,b.dataset.requestId));
    root.querySelector("#addDscBox")?.addEventListener("click", addBoxForm);
    root.querySelectorAll("[data-view-box]").forEach((b) => b.onclick = () => viewBox(b.dataset.viewBox));
    root.querySelector("#newFreshIssue")?.addEventListener("click", freshIssueForm);
    root.querySelectorAll("[data-add-fresh-master]").forEach((button)=>button.onclick=async()=>{button.disabled=true;try{await submitJson(`/api/dsc/fresh-issues/${button.dataset.addFreshMaster}/add-to-master`,"POST",{});toast("Fresh DSC added to DSC Master.");window.renderDscRegisterPage();}catch(error){toast(error.message);button.disabled=false;}});
    root.querySelector("#dscSettingsForm")?.addEventListener("submit", async (event) => { event.preventDefault(); const values = formObject(event.currentTarget); values.reminderDays = String(values.reminderDays).split(",").map((n) => Number(n.trim())).filter((n) => n >= 0); values.approverUserIds = [...event.currentTarget.elements.approverUserIds.selectedOptions].map((o) => o.value); await submitJson("/api/dsc/settings","PUT",values); toast("DSC settings saved."); window.renderDscRegisterPage(); });
  }

  async function downloadDscSample() {
    await window.loadSheetJs?.();
    if (!window.XLSX) throw new Error("Excel support is unavailable. Please reload and try again.");
    const sample = [{ "DSC HOLDER NAME":"","ENTITY NAME":"","DESIGNATION":"Director","C/O":"","PAN":"","PW":"","MOBILE NO":"","EMAIL":"","DSC TYPE":"","DSC CLASS":"Class III","TOKEN NAME":"Extratrust","BOX TYPE":"Blue","SLOT POSITION":"","ISSUE DATE":"","VALID FROM":"","VALID TO":"","STATUS":"","REMARKS":"" }];
    const sheet = XLSX.utils.json_to_sheet(sample); sheet["!cols"] = Object.keys(sample[0]).map((name) => ({ wch: Math.max(14,name.length+2) }));
    const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book,sheet,"DSC Import"); XLSX.writeFile(book,"DSC-Register-Import-Sample.xlsx");
  }

  async function importDscExcel(event) {
    const file=event.target.files?.[0]; if(!file)return;
    try {
      await window.loadSheetJs?.(); if(!window.XLSX)throw new Error("Excel support is unavailable. Please reload and try again.");
      const book=XLSX.read(await file.arrayBuffer(),{type:"array",cellDates:true}); const source=XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]],{defval:""});
      if(!source.length)throw new Error("The Excel file has no DSC rows.");
      const rows=source.map((row,index)=>{let issue=dscExcelDate(row["ISSUE DATE"]),validFrom=dscExcelDate(row["VALID FROM"]),validTo=dscExcelDate(row["VALID TO"]);if(!validFrom&&issue)validFrom=issue;if(!validTo&&validFrom)validTo=dscAddYears(validFrom,2);return{holderName:row["DSC HOLDER NAME"],entityName:row["ENTITY NAME"],holderDesignation:row.DESIGNATION,careOf:row["C/O"],pan:row.PAN,password:row.PW,mobile:row["MOBILE NO"],email:row.EMAIL,dscType:row["DSC TYPE"],certificateClass:row["DSC CLASS"],tokenName:row["TOKEN NAME"],boxType:row["BOX TYPE"],slotPosition:row["SLOT POSITION"],issuedDate:issue,validFrom,expiryDate:validTo,status:row.STATUS,remarks:row.REMARKS,importRow:index+2};});
      const result=await submitJson("/api/dsc/import","POST",{rows}); const errors=(result.results||[]).filter((item)=>!item.created);
      showModal("DSC Import Result",`<div class="register-kpi-grid">${kpi("Rows",result.total,"blue")}${kpi("Created",result.created,"green")}${kpi("Not Created",result.failed,"red")}</div>${errors.length?`<div class="register-card"><h4>Row-level Errors</h4>${errors.map((item)=>`<p>Row ${item.row}: ${esc(item.error)}</p>`).join("")}</div>`:`<p>All DSC records were imported successfully.</p>`}`);
    } catch(error) { toast(error.message); } finally { event.target.value=""; }
  }
  function dscExcelDate(value){if(!value)return"";if(value instanceof Date)return value.toISOString().slice(0,10);const raw=String(value).trim();const match=raw.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/);return match?`${match[3]}-${match[2].padStart(2,"0")}-${match[1].padStart(2,"0")}`:raw.slice(0,10);}
  function dscAddYears(value,years){const d=new Date(`${value}T00:00:00`);d.setFullYear(d.getFullYear()+years);return d.toISOString().slice(0,10);}

  async function openDscForm(existing = null) {
    const [clientResult, masterResult, optionResult] = await Promise.all([api("/api/clients/search?limit=50"), api("/api/clients/masters"), api("/api/dsc/form-options")]);
    ui.clients = clientResult.clients || [];
    const cleanValues = (defaults, custom, current) => [...new Set([...defaults, ...(custom || []).map((item) => item.value), current].map((value) => String(value || "").trim()).filter(Boolean))];
    const careOfValues = cleanValues([], (masterResult.careOf || []).map((value) => ({ value })), existing?.care_of);
    const designationValues = cleanValues(["Director","Designated Partner","Owner","Auth Representative"], optionResult.designations, existing?.holder_designation);
    const tokenValues = cleanValues(["Extratrust","Vsign","Emudhra"], optionResult.tokenNames, existing?.token_name || existing?.token_make);
    const boxValues = cleanValues(["Blue","Black"], optionResult.boxNames, existing?.box_type);
    const entityName = existing?.entity_name || existing?.client_name || "";
    const clients = [...ui.clients];
    if (existing?.client_id && !clients.some((client) => client.id === existing.client_id)) clients.push({ id: existing.client_id, client_name: entityName, pan_reg_no: existing.pan, contact_number: existing.mobile, email: existing.email, care_of: existing.care_of });
    const customEntities = [...(optionResult.entityNames || [])];
    if (entityName && !clients.some((client) => client.client_name?.toLowerCase() === entityName.toLowerCase()) && !customEntities.some((option) => option.value.toLowerCase() === entityName.toLowerCase())) customEntities.push({ id: "existing", value: entityName });
    const optionHtml = (values, selected) => values.map((value) => `<option value="${esc(value)}" ${value === selected ? "selected" : ""}>${esc(value)}</option>`).join("");
    showModal(existing ? "Edit DSC" : "Add DSC", `<form id="dscForm" class="register-form-grid dsc-form-layout">
      <label class="dsc-span-6">DSC HOLDER NAME<input name="holderName" value="${esc(existing?.holder_name || "")}" required></label>
      <label class="dsc-span-8"><span class="dsc-label-row">ENTITY NAME<button type="button" data-dsc-add-option="entity_name" data-dsc-option-target="#dscEntity" aria-label="Add Entity Name">+</button></span><select name="clientId" id="dscEntity" required><option value="">Select from Client Master</option>${clients.map((c) => `<option value="${c.id}" data-name="${esc(c.client_name)}" data-pan="${esc(c.pan_reg_no || "")}" data-phone="${esc(c.contact_number || "")}" data-email="${esc(c.email || "")}" data-careof="${esc(c.care_of || "")}" ${existing?.client_id === c.id ? "selected" : ""}>${esc(c.client_name)}${c.pan_reg_no ? ` — ${esc(c.pan_reg_no)}` : ""}</option>`).join("")}${customEntities.map((item) => `<option value="custom:${item.id}" data-custom="true" data-name="${esc(item.value)}" ${!existing?.client_id && item.value.toLowerCase() === entityName.toLowerCase() ? "selected" : ""}>${esc(item.value)}</option>`).join("")}</select><input type="hidden" name="entityName" value="${esc(entityName)}"></label>
      <label class="dsc-span-6"><span class="dsc-label-row">DESIGNATION<button type="button" data-dsc-add-option="designation" data-dsc-option-target="#dscDesignation" aria-label="Add Designation">+</button></span><select name="holderDesignation" id="dscDesignation">${optionHtml(designationValues,existing?.holder_designation || "Director")}</select></label>
      <label class="dsc-span-5">C/O<select name="careOf"><option value="">Select C/O</option>${optionHtml(careOfValues,existing?.care_of || "")}</select></label>
      <label class="dsc-span-5">PAN<input name="pan" value="${esc(existing?.pan || "")}"></label>
      <label class="dsc-span-5"><span class="dsc-label-row">PW<button type="button" class="pw-visibility-toggle" data-toggle-dsc-pw>Show</button></span><input name="password" type="password" autocomplete="off" data-lpignore="true" data-1p-ignore></label>
      <label class="dsc-span-5">MOBILE NO<input name="mobile" type="tel" value="${esc(existing?.mobile || "")}"></label>
      <label class="dsc-span-4">EMAIL<input name="email" type="email" value="${esc(existing?.email || "")}"></label>
      <label class="dsc-span-4">DSC TYPE<select name="dscType"><option value="Token" ${(existing?.dsc_type || "Token") === "Token" ? "selected" : ""}>Token</option><option value="Other file" ${existing?.dsc_type === "Other file" ? "selected" : ""}>Other file</option></select></label>
      <label class="dsc-span-4">DSC CLASS<select name="certificateClass">${optionHtml(["Class II","Class III","Class I"],existing?.certificate_class || "Class III")}</select></label>
      <label class="dsc-span-4"><span class="dsc-label-row">TOKEN NAME<button type="button" data-dsc-add-option="token_name" data-dsc-option-target="#dscTokenName" aria-label="Add Token Name">+</button></span><select name="tokenName" id="dscTokenName">${optionHtml(tokenValues,existing?.token_name || existing?.token_make || "Extratrust")}</select></label>
      <label class="dsc-span-4"><span class="dsc-label-row">BOX TYPE<button type="button" data-dsc-add-option="box_name" data-dsc-option-target="#dscBoxType" aria-label="Add Box Type">+</button></span><select name="boxType" id="dscBoxType">${optionHtml(boxValues,existing?.box_type || "Blue")}</select></label>
      <label class="dsc-span-2 dsc-slot-compact">SLOT POSITION<input name="slotPosition" value="${esc(existing?.slot_position || "")}"></label>
      <label class="dsc-span-6">ISSUE DATE<input name="issuedDate" type="date" value="${esc(existing?.issued_date || "")}"></label>
      <label class="dsc-span-6">VALID FROM<input name="validFrom" type="date" value="${esc(existing?.valid_from || "")}"></label>
      <label class="dsc-span-6">VALID TO<input name="expiryDate" type="date" value="${esc(existing?.expiry_date || "")}"></label>
      <label class="dsc-span-20 form-span-2">REMARKS<textarea name="remarks" rows="2">${esc(existing?.remarks || "")}</textarea></label>
      <div class="security-callout dsc-span-20 form-span-2">PW is encrypted and masked. It is never included in DSC lists, reports, exports, notifications or QR codes.</div>
      <div class="register-error dsc-span-20 form-span-2" data-dsc-save-error role="alert" hidden></div>
      <div class="modal-actions dsc-span-20 form-span-2"><button type="button" class="secondary-button" data-close-register-modal>Cancel</button><button type="submit" class="primary-button">Save DSC</button></div>
    </form>`);
    const form = document.querySelector("#dscForm");
    const setValidTo = () => { const value=form.elements.validFrom.value; if(!value)return; const d=new Date(`${value}T00:00:00`); d.setFullYear(d.getFullYear()+2); form.elements.expiryDate.value=d.toISOString().slice(0,10); };
    form.elements.issuedDate.onchange = () => { form.elements.validFrom.value=form.elements.issuedDate.value; setValidTo(); };
    form.elements.validFrom.onchange = setValidTo;
    form.querySelector("#dscEntity").onchange = (event) => { const o=event.target.selectedOptions[0]; if(!o?.value)return; form.elements.entityName.value=o.dataset.name; if(o.dataset.custom === "true"){form.elements.pan.value="";form.elements.mobile.value="";form.elements.email.value="";return;} form.elements.pan.value=o.dataset.pan; form.elements.mobile.value=o.dataset.phone; form.elements.email.value=o.dataset.email; if(o.dataset.careof)form.elements.careOf.value=o.dataset.careof; };
    form.querySelectorAll("[data-dsc-add-option]").forEach((button) => button.onclick = () => addDscFormOption(button, form));
    const passwordInput=form.elements.password; let passwordEdited=false;
    passwordInput.addEventListener("input",()=>{if(document.activeElement===passwordInput)passwordEdited=true;});
    passwordInput.value=""; setTimeout(()=>{if(!passwordEdited)passwordInput.value="";},350);
    form.querySelector("[data-toggle-dsc-pw]").onclick = (event) => { const input=form.elements.password,showing=input.type==="text"; input.type=showing?"password":"text"; event.currentTarget.textContent=showing?"Show":"Hide"; };
    form.onsubmit = async (event) => { event.preventDefault(); const submit=form.querySelector('[type="submit"]'),errorBox=form.querySelector("[data-dsc-save-error]"); submit.disabled=true; submit.textContent="Saving…"; errorBox.hidden=true; try { const body=formObject(form); if(existing&&!passwordEdited)delete body.password; if(String(body.clientId).startsWith("custom:"))body.clientId=""; const path=existing ? `/api/dsc/${existing.id}` : "/api/dsc"; await submitJson(path,existing ? "PUT" : "POST",body); closeModal(); toast(existing ? "DSC updated." : "DSC added to Master."); window.renderDscRegisterPage(); } catch(error) { errorBox.textContent=error.message||"Unable to save the DSC. Please review the entered details."; errorBox.hidden=false; submit.disabled=false; submit.textContent="Save DSC"; } };
  }

  async function addDscFormOption(button, form) {
    const labels = { entity_name: "Entity Name", designation: "Designation", token_name: "Token Name", authority: "Authority", box_name: "Box Name" };
    const label=labels[button.dataset.dscAddOption],select=form.querySelector(button.dataset.dscOptionTarget); const value = window.prompt(`Enter new ${label}:`)?.trim(); if(!value)return;
    button.disabled=true;
    try {
      const result=await submitJson(`/api/dsc/form-options/${button.dataset.dscAddOption}`,"POST",{value});
      let option=[...select.options].find((item)=>item.textContent.trim().toLowerCase()===result.option.value.toLowerCase());
      if(!option){option=document.createElement("option");option.textContent=result.option.value;option.value=button.dataset.dscAddOption==="entity_name"?`custom:${result.option.id}`:result.option.value;select.appendChild(option);}
      if(button.dataset.dscAddOption==="entity_name"){option.dataset.custom="true";option.dataset.name=result.option.value;if(form.elements.entityName)form.elements.entityName.value=result.option.value;if(form.elements.organizationName)form.elements.organizationName.value=result.option.value;}
      select.value=option.value; toast(`${label} added.`);
    } catch(error){toast(error.message);} finally {button.disabled=false;}
  }
  async function openDscDetail(id) {
    const result = await api(`/api/dsc/${id}`); const r=result.record;
    showModal(`${r.dsc_id} — ${r.holder_name}`, `<div class="register-detail"><div class="detail-summary-grid"><span><small>Entity Name</small><strong>${esc(r.entity_name || r.client_name)}</strong></span><span><small>Token Name</small><strong>${esc(r.token_name || r.token_make || r.token_serial || "—")}</strong></span><span><small>Expiry</small><strong>${date(r.expiry_date)}</strong></span><span><small>Status</small>${badge(r.status)}</span><span><small>Custody</small><strong>${esc(r.current_custody)}</strong></span><span><small>Storage</small><strong>Box Type: ${esc(r.box_type || "—")} | Slot: ${esc(r.slot_position || "—")}</strong></span></div>
      <div class="mobile-action-bar"><button data-request-record>Request Handover</button>${r.status === "Issued Out" && canManageDsc() ? `<button data-return-record>Mark Returned</button>` : ""}${canManageDsc() ? `<button data-renew-record>Start Renewal</button><button class="danger" data-missing-record>Mark Missing</button>` : ""}<button data-whatsapp-record>WhatsApp</button><button data-call-record>Call</button></div>
      <section><h4>DSC Activity History</h4><div class="activity-timeline">${(result.activities || []).map((a) => `<article><i></i><div><strong>${esc(a.action)}</strong><small>${esc(a.actor_name || "System")} · ${date(a.created_at,true)}</small><p>${esc(a.remarks || "")}</p></div></article>`).join("") || "No activity yet."}</div></section></div>`);
    document.querySelector("[data-request-record]").onclick = () => { closeModal(); requestHandoverForm(r.id); };
    document.querySelector("[data-return-record]")?.addEventListener("click", () => { closeModal(); returnDscForm(r.id); });
    document.querySelector("[data-renew-record]")?.addEventListener("click", async () => { await submitJson(`/api/dsc/${r.id}/start-renewal`,"POST",{}); closeModal(); toast("Renewal started."); window.renderDscRegisterPage(); });
    document.querySelector("[data-missing-record]")?.addEventListener("click", () => simplePrompt("Mark DSC Missing", `${inputField("Date","date",new Date().toISOString().slice(0,10),true,"date")}${inputField("Last Known Custody","lastKnownCustody",r.current_custody)}<label>Remarks<textarea name="remarks" required></textarea></label>`, async (values) => { await submitJson(`/api/dsc/${r.id}/missing`,"POST",values); closeModal(); toast("Urgent missing DSC alert recorded."); window.renderDscRegisterPage(); }));
    document.querySelector("[data-whatsapp-record]").onclick = () => window.open(`https://wa.me/${String(r.mobile || "").replace(/\D/g,"")}?text=${encodeURIComponent(`Dear ${r.client_name}, the DSC of ${r.holder_name} is due to expire on ${date(r.expiry_date)}. Kindly contact us to initiate renewal.`)}`,"_blank","noopener");
    document.querySelector("[data-call-record]").onclick = () => { if(r.mobile) location.href=`tel:${r.mobile.replace(/[^+\d]/g,"")}`; };
  }

  async function requestHandoverForm(selectedId = "") {
    if (!ui.dscRecords.length) ui.dscRecords = (await api("/api/dsc?page=1&pageSize=100")).records || [];
    showModal("Request Handover Permission", `<form id="handoverForm" class="register-form-grid"><label>DSC<select name="dscId" required><option value="">Select DSC</option>${ui.dscRecords.map((r) => `<option value="${r.id}" ${r.id===selectedId?"selected":""}>${esc(r.entity_name || r.client_name)} — ${esc(r.holder_name)} — ${esc(r.token_name || r.token_make || r.token_serial || "—")}</option>`).join("")}</select></label>${inputField("Hand Over To","handoverTo","",true)}${inputField("Purpose","purpose","",true)}${inputField("Proposed Date","proposedDate",new Date().toISOString().slice(0,10),true,"date")}${inputField("Expected Return Date","expectedReturnDate","","","date")}${inputField("Related Work","relatedWork")}<label class="form-span-2">Remarks<textarea name="remarks"></textarea></label><div class="modal-actions form-span-2"><button type="button" class="secondary-button" data-close-register-modal>Cancel</button><button class="primary-button">Send Approval Request</button></div></form>`);
    document.querySelector("#handoverForm").onsubmit = async (event) => { event.preventDefault(); await submitJson("/api/dsc/handovers","POST",formObject(event.currentTarget)); closeModal(); toast("Handover permission requested."); window.renderDscRegisterPage(); };
  }

  async function loadAllMovementDsc(){const first=await api("/api/dsc?page=1&pageSize=100"),pages=[];for(let page=2;page<=first.pageCount;page+=1)pages.push(api(`/api/dsc?page=${page}&pageSize=100`));const rest=pages.length?await Promise.all(pages):[];return{...first,records:[...(first.records||[]),...rest.flatMap((result)=>result.records||[])]};}

  async function addDscMovementForm(){
    const [dscResult,approvedResult,handedResult,optionResult]=await Promise.all([loadAllMovementDsc(),api("/api/dsc/handovers?page=1&pageSize=100&status=Approved"),api("/api/dsc/handovers?page=1&pageSize=100&status=Handed%20Over"),api("/api/dsc/form-options")]);
    const records=dscResult.records||[],approved=approvedResult.requests||[],handed=handedResult.requests||[];
    const uniqueValues=(defaults,custom,current)=>[...new Set([...defaults,...(custom||[]).map((item)=>item.value),...(current||[])].map((value)=>String(value||"").trim()).filter(Boolean))];
    const tokenNames=uniqueValues(["Hyperkey","Prox Key","Other"],optionResult.tokenNames,records.map((row)=>row.token_name)),authorities=uniqueValues(["XtraTrust","Emudhra","Vsign"],optionResult.authorities,records.map((row)=>row.authority)),boxNames=uniqueValues(["Blue","Black"],optionResult.boxNames,records.map((row)=>row.box_type));
    const options=(values)=>values.map((value)=>`<option value="${esc(value)}">${esc(value)}</option>`).join(""),movementAt=new Date(Date.now()+330*60000).toISOString().slice(0,16);
    showModal("Add DSC Movement",`<form id="dscMovementForm" class="register-form-grid dsc-movement-form-layout">
      <label>MOVEMENT TYPE<select name="movementType"><option value="OUT">Out</option><option value="IN">In</option><option value="TRANSFER">Transfer</option></select></label>
      <label class="movement-span-2">SELECT DSC<select name="dscId"><option value="">Select DSC from complete list</option>${records.map((row)=>`<option value="${row.id}" data-organization="${esc(row.entity_name||row.client_name||"")}" data-dsc-type="${esc(row.certificate_class||"Class III")}" data-token="${esc(row.token_name||"")}" data-authority="${esc(row.authority||"")}" data-mobile="${esc(row.mobile||"")}" data-box="${esc(row.box_type||"")}" data-slot="${esc(row.slot_position||"")}" data-expiry="${esc(row.expiry_date||"")}">${esc(row.holder_name)} — ${esc(row.entity_name||row.client_name)} — ${esc(row.token_name||row.token_serial||"")}</option>`).join("")}</select></label>
      <label>DATE & TIME<input name="movementAt" type="datetime-local" value="${movementAt}" required></label>
      <label data-movement-in hidden>OR ENTER DSC NAME<input name="manualDscName"></label>
      <label class="movement-span-2" data-movement-out>APPROVED HANDOVER REQUEST<select name="handoverRequestId"><option value="">Select if approval is enabled</option>${approved.map((request)=>`<option value="${request.id}" data-dsc="${request.dsc?.id||request.dsc_id}" data-issued-to="${esc(request.handover_to||"")}">${esc(request.request_no)} — ${esc(request.dsc?.holder_name||"")} — ${esc(request.handover_to)}</option>`).join("")}</select></label>
      <label data-movement-out>ISSUED TO<input name="issuedTo"></label><label data-movement-out>MOBILE NO<input name="issuedMobile" type="tel"></label><label data-movement-out>RELATION<input name="relation"></label>
      <label data-movement-out>PERMISSION SOUGHT ?<select name="permissionSought"><option value="Yes">Yes</option><option value="No">No</option></select></label><label data-movement-out>PERMISSION MODE<select name="permissionMode"><option value="Whatsapp">Whatsapp</option><option value="Email">Email</option><option value="Call">Call</option><option value="Direct" selected>Direct</option></select></label>
      <label data-movement-out>PURPOSE<input name="purpose"></label><label data-movement-out>RETURNED BY<select name="returnedByUserId"><option value="">Select active staff</option>${ui.users.map((user)=>`<option value="${user.id}">${esc(user.name)} — ${esc(user.role)}</option>`).join("")}</select></label><label data-movement-out>EXPECTED RETURN DATE<input name="expectedReturnDate" type="date"></label>
      <label data-movement-in hidden>ORGANISATION<input name="organization"></label><label data-movement-in hidden>DSC TYPE<select name="certificateClass"><option value="Class II">Class II</option><option value="Class III">Class III</option></select></label>
      <label data-movement-in hidden><span class="dsc-label-row">TOKEN NAME<button type="button" data-dsc-add-option="token_name" data-dsc-option-target="#movementTokenName">+</button></span><select name="tokenName" id="movementTokenName"><option value="">Select Token</option>${options(tokenNames)}</select></label>
      <label data-movement-in hidden><span class="dsc-label-row">AUTHORITY<button type="button" data-dsc-add-option="authority" data-dsc-option-target="#movementAuthority">+</button></span><select name="authority" id="movementAuthority"><option value="">Select Authority</option>${options(authorities)}</select></label>
      <label data-movement-in hidden>RECEIVED FROM<input name="receivedFrom"></label><label data-movement-in hidden>MOBILE NO<input name="mobile" type="tel"></label>
      <label data-movement-in hidden><span class="dsc-label-row">BOX NAME<button type="button" data-dsc-add-option="box_name" data-dsc-option-target="#movementBoxName">+</button></span><select name="boxName" id="movementBoxName"><option value="">Select Box</option>${options(boxNames)}</select></label><label data-movement-in hidden>SLOT NO<input name="slotPosition"></label>
      <label data-movement-in hidden><span class="dsc-label-row">PW<button type="button" class="pw-visibility-toggle" data-toggle-movement-pw>Show</button></span><input name="password" type="password" autocomplete="new-password"></label><label data-movement-in hidden>EXPIRY DATE<input name="expiryDate" type="date"></label>
      <label data-movement-transfer hidden>CURRENT BOX<input name="currentBox" readonly></label><label data-movement-transfer hidden>CURRENT SLOT<input name="currentSlot" readonly></label>
      <label data-movement-transfer hidden><span class="dsc-label-row">TO BOX<button type="button" data-dsc-add-option="box_name" data-dsc-option-target="#transferBoxName">+</button></span><select name="transferBoxName" id="transferBoxName"><option value="">Select destination Box</option>${options(boxNames)}</select></label><label data-movement-transfer hidden>TO SLOT<input name="transferSlotPosition"></label>
      <input type="hidden" name="requestId"><label class="form-span-2 movement-span-all">REMARKS<textarea name="remarks" rows="2"></textarea></label><div class="form-span-2 movement-span-all register-error" data-movement-error role="alert" hidden></div><div class="modal-actions form-span-2 movement-span-all"><button type="button" class="secondary-button" data-close-register-modal>Cancel</button><button type="submit" class="primary-button">Save Movement</button></div>
    </form>`);
    const form=document.querySelector("#dscMovementForm"),outFields=[...form.querySelectorAll("[data-movement-out]")],inFields=[...form.querySelectorAll("[data-movement-in]")],transferFields=[...form.querySelectorAll("[data-movement-transfer]")];
    const fillDetails=()=>{const selected=form.elements.dscId.selectedOptions[0];if(!selected?.value)return;form.elements.manualDscName.value="";form.elements.organization.value=selected.dataset.organization||"";form.elements.certificateClass.value=selected.dataset.dscType||"Class III";form.elements.tokenName.value=selected.dataset.token||"";form.elements.authority.value=selected.dataset.authority||"";form.elements.mobile.value=selected.dataset.mobile||"";form.elements.boxName.value=selected.dataset.box||"";form.elements.slotPosition.value=selected.dataset.slot||"";form.elements.expiryDate.value=selected.dataset.expiry||"";form.elements.currentBox.value=selected.dataset.box||"Unassigned";form.elements.currentSlot.value=selected.dataset.slot||"Unassigned";};
    const update=()=>{const type=form.elements.movementType.value,isOut=type==="OUT",isIn=type==="IN",isTransfer=type==="TRANSFER",hasRequest=Boolean(form.elements.handoverRequestId.value),hasDsc=Boolean(form.elements.dscId.value);outFields.forEach((field)=>field.hidden=!isOut);inFields.forEach((field)=>field.hidden=!isIn);transferFields.forEach((field)=>field.hidden=!isTransfer);form.elements.dscId.required=!isIn;form.elements.manualDscName.required=isIn&&!hasDsc;form.elements.organization.required=isIn&&!hasDsc;form.elements.tokenName.required=isIn;form.elements.authority.required=isIn;form.elements.issuedTo.required=isOut&&!hasRequest;form.elements.purpose.required=isOut&&!hasRequest;form.elements.returnedByUserId.required=isOut&&!hasRequest;form.elements.receivedFrom.required=isIn;form.elements.boxName.required=isIn;form.elements.slotPosition.required=isIn;form.elements.expiryDate.required=isIn;form.elements.transferBoxName.required=isTransfer;form.elements.transferSlotPosition.required=isTransfer;if(isIn){const match=handed.find((request)=>(request.dsc?.id||request.dsc_id)===form.elements.dscId.value);form.elements.requestId.value=match?.id||"";}else form.elements.requestId.value="";fillDetails();};
    form.elements.movementType.onchange=update;form.elements.handoverRequestId.onchange=()=>{const selected=form.elements.handoverRequestId.selectedOptions[0];if(selected?.dataset.dsc)form.elements.dscId.value=selected.dataset.dsc;if(selected?.dataset.issuedTo)form.elements.issuedTo.value=selected.dataset.issuedTo;update();};form.elements.dscId.onchange=update;form.elements.manualDscName.oninput=()=>{if(form.elements.manualDscName.value.trim())form.elements.dscId.value="";update();};form.querySelectorAll("[data-dsc-add-option]").forEach((button)=>button.onclick=()=>addDscFormOption(button,form));form.querySelector("[data-toggle-movement-pw]").onclick=(event)=>{const input=form.elements.password,showing=input.type==="text";input.type=showing?"password":"text";event.currentTarget.textContent=showing?"Show":"Hide";};update();
    form.onsubmit=async(event)=>{event.preventDefault();const submit=form.querySelector('[type="submit"]'),errorBox=form.querySelector("[data-movement-error]");submit.disabled=true;submit.textContent="Saving…";errorBox.hidden=true;try{await submitJson("/api/dsc/movements","POST",formObject(form));closeModal();toast("DSC movement recorded.");window.renderDscRegisterPage();}catch(error){errorBox.textContent=error.message||"Unable to save the DSC movement.";errorBox.hidden=false;submit.disabled=false;submit.textContent="Save Movement";}};
  }

  async function decideHandover(id, decision) { const remarks = prompt(`${decision} remarks (optional):`) || ""; await submitJson(`/api/dsc/handovers/${id}/decision`,"POST",{ decision, remarks }); toast(`Handover ${decision.toLowerCase()}.`); window.renderDscRegisterPage(); }
  async function returnDscForm(id, requestId = "") { if(!ui.boxes.length) ui.boxes=(await api("/api/dsc/boxes")).boxes||[]; simplePrompt("Mark DSC Returned", `<label>Returned Box<select name="boxId" required><option value="">Select box</option>${ui.boxes.map((b)=>`<option value="${b.id}">${esc(b.box_code)} — ${esc(b.location)}</option>`).join("")}</select></label>${inputField("Slot / Position","slotPosition","",true)}${selectField("Condition","condition",["Good","Damaged","Needs Inspection"],"Good")}<label>Remarks<textarea name="remarks"></textarea></label>`, async(values)=>{ await submitJson(`/api/dsc/${id}/return`,"POST",{...values,requestId}); closeModal(); toast("DSC returned to office storage."); window.renderDscRegisterPage(); }); }
  function addBoxForm() { simplePrompt("Add Storage Box", `${inputField("Box Code","boxCode","",true)}${inputField("Box Name","boxName")}${inputField("Cabinet","cabinet")}${inputField("Shelf","shelf")}${inputField("Location","location","",true)}${numberField("Capacity","capacity",20)}`, async(values)=>{ await submitJson("/api/dsc/boxes","POST",values); toast("Storage box added."); window.renderDscRegisterPage(); }); }
  async function viewBox(id) { const result=await api(`/api/dsc/boxes/${id}`); showModal(`Box ${result.box.box_code}`, `<div class="detail-summary-grid"><span><small>Location</small><strong>${esc(result.box.location)}</strong></span><span><small>Capacity</small><strong>${result.box.capacity}</strong></span><span><small>Occupied</small><strong>${result.box.occupied}</strong></span><span><small>Available</small><strong>${result.box.available}</strong></span></div>${genericRows(result.records,["slot_position","client_name","holder_name","token_name","expiry_date","status"])}<div class="modal-actions"><button class="secondary-button" onclick="window.print()">Print Box List</button></div>`); }
  async function freshIssueForm(){
    const directoryRequest=ui.users.length?Promise.resolve({users:ui.users}):api("/api/users/directory");
    const [clientResult, optionResult, directoryResult]=await Promise.all([api("/api/clients/search?limit=50"),api("/api/dsc/form-options"),directoryRequest]);
    const uniqueValues=(defaults,custom)=>[...new Set([...defaults,...(custom||[]).map((item)=>item.value)].filter(Boolean))];
    const clients=clientResult.clients||[],customEntities=optionResult.entityNames||[],activeStaff=(directoryResult.users||ui.users).filter((user)=>user.is_active!==false);ui.users=directoryResult.users||ui.users;
    const designations=uniqueValues(["Director","Designated Partner","Owner","Auth Representative"],optionResult.designations);
    const tokenNames=uniqueValues(["HyperKey","Proxkey","Others"],optionResult.tokenNames);
    const authorities=uniqueValues(["XtraTrust","Vsign","Emudhra"],optionResult.authorities);
    const boxNames=uniqueValues(["Blue","Black"],optionResult.boxNames);
    const statuses=["New Request","Documents Pending","Documents Received","Application Prepared","Application Submitted","Payment Pending","Verification Pending","Video Verification Pending","Under Processing","Approved","Token Awaited","DSC Received","Handed Over","Completed","Rejected","Cancelled"];
    const options=(values,selected="")=>values.map((value)=>`<option value="${esc(value)}" ${value===selected?"selected":""}>${esc(value)}</option>`).join("");
    const workDate=new Date(Date.now()+330*60000).toISOString().slice(0,10);
    showModal("New Fresh DSC Issue",`<form id="freshDscForm" class="register-form-grid dsc-fresh-form-layout">
      <label>CLIENT NAME<input name="clientName" required></label>
      <label><span class="dsc-label-row">ORGANIZATION NAME<button type="button" data-dsc-add-option="entity_name" data-dsc-option-target="#freshOrganization" aria-label="Add Organization Name">+</button></span><select name="clientId" id="freshOrganization" required><option value="">Select from Client Master</option>${clients.map((client)=>`<option value="${client.id}" data-name="${esc(client.client_name)}" data-pan="${esc(client.pan_reg_no||"")}" data-mobile="${esc(client.contact_number||"")}" data-email="${esc(client.email||"")}">${esc(client.client_name)}</option>`).join("")}${customEntities.map((item)=>`<option value="custom:${item.id}" data-custom="true" data-name="${esc(item.value)}">${esc(item.value)}</option>`).join("")}</select><input type="hidden" name="organizationName"></label>
      <label>DESIGNATION<select name="designation"><option value="">Select designation</option>${options(designations)}</select></label>
      <label>PAN<input name="pan"></label>
      <label>MOBILE NO<input name="mobile" type="tel"></label>
      <label>EMAIL ID<input name="email" type="email"></label>
      <label>AADHAAR NO<input name="aadhaarNo" inputmode="numeric" maxlength="14"></label>
      <label>WORK DATE<input name="workDate" type="date" value="${workDate}" required></label>
      <label>WORK BY<select name="workByUserId" required><option value="">Select active staff</option>${activeStaff.map((user)=>`<option value="${user.id}">${esc(user.name||user.email)} — ${esc(user.role||"Staff")}</option>`).join("")}</select></label>
      <label>STATUS<select name="status">${options(statuses,"New Request")}</select></label>
      <label>APPLICATION ID<input name="applicationId" maxlength="120" required></label>
      <label><span class="dsc-label-row">TOKEN NAME<button type="button" data-dsc-add-option="token_name" data-dsc-option-target="#freshTokenName" aria-label="Add Token Name">+</button></span><select name="tokenName" id="freshTokenName" required><option value="">Select token</option>${options(tokenNames)}</select></label>
      <label><span class="dsc-label-row">AUTHORITY<button type="button" data-dsc-add-option="authority" data-dsc-option-target="#freshAuthority" aria-label="Add Authority">+</button></span><select name="authority" id="freshAuthority">${options(authorities,"XtraTrust")}</select></label>
      <label>CLASS TYPE<select name="classType"><option value="Class II">Class II</option><option value="Class III" selected>Class III</option></select></label>
      <label><span class="dsc-label-row">PW<button type="button" class="pw-visibility-toggle" data-toggle-fresh-pw>Show</button></span><input name="password" id="freshPassword" type="password" autocomplete="new-password"></label>
      <label>ISSUE DATE<input name="issuedDate" type="date" value="${workDate}"></label>
      <label>VALID FROM<input name="validFrom" type="date" value="${workDate}"></label>
      <label>VALID TO<input name="validTo" type="date" value="${dscAddYears(workDate,2)}"></label>
      <label>KEEP IN CUSTODY<select name="keepInCustody" id="freshCustody"><option value="No">No</option><option value="Yes">Kept With Us</option></select></label>
      <label data-fresh-custody-field hidden><span class="dsc-label-row">BOX NAME<button type="button" data-dsc-add-option="box_name" data-dsc-option-target="#freshBoxName" aria-label="Add Box Name">+</button></span><select name="boxName" id="freshBoxName"><option value="">Select Box</option>${options(boxNames)}</select></label>
      <label data-fresh-custody-field hidden>SLOT POSITION<input name="slotPosition"></label>
      <label class="form-span-2 fresh-remarks">REMARKS<textarea name="remarks" rows="2"></textarea></label>
      <div class="security-callout form-span-2">PW is encrypted and masked. It is never included in lists, reports, exports, notifications or QR codes.</div>
      <div class="form-span-2 register-error" data-fresh-save-error role="alert" hidden></div>
      <div class="modal-actions form-span-2"><button type="button" class="secondary-button" data-close-register-modal>Cancel</button><button type="submit" class="primary-button">Save Fresh Issue</button></div>
    </form>`);
    const form=document.querySelector("#freshDscForm"),custodyFields=[...form.querySelectorAll("[data-fresh-custody-field]")];
    const toggleCustody=()=>{const kept=form.elements.keepInCustody.value==="Yes";custodyFields.forEach((label)=>label.hidden=!kept);form.elements.boxName.required=kept;form.elements.slotPosition.required=kept;if(!kept){form.elements.boxName.value="";form.elements.slotPosition.value="";}};
    const setFreshValidTo=()=>{const value=form.elements.validFrom.value;if(!value)return;form.elements.validTo.value=dscAddYears(value,2);};
    form.elements.keepInCustody.onchange=toggleCustody;toggleCustody();
    form.querySelectorAll("[data-dsc-add-option]").forEach((button)=>button.onclick=()=>addDscFormOption(button,form));
    form.querySelector("[data-toggle-fresh-pw]").onclick=(event)=>{const input=form.elements.password,showing=input.type==="text";input.type=showing?"password":"text";event.currentTarget.textContent=showing?"Show":"Hide";};
    form.elements.issuedDate.onchange=()=>{form.elements.validFrom.value=form.elements.issuedDate.value;setFreshValidTo();};form.elements.validFrom.onchange=setFreshValidTo;
    form.querySelector("#freshOrganization").onchange=(event)=>{const selected=event.target.selectedOptions[0];if(!selected?.value)return;form.elements.organizationName.value=selected.dataset.name;if(selected.dataset.custom==="true"){form.elements.pan.value="";form.elements.mobile.value="";form.elements.email.value="";return;}form.elements.pan.value=selected.dataset.pan;form.elements.mobile.value=selected.dataset.mobile;form.elements.email.value=selected.dataset.email;};
    form.onsubmit=async(event)=>{event.preventDefault();const submit=form.querySelector('[type="submit"]'),errorBox=form.querySelector("[data-fresh-save-error]");submit.disabled=true;submit.textContent="Saving…";errorBox.hidden=true;try{const body=formObject(form);if(String(body.clientId).startsWith("custom:"))body.clientId="";body.keepInCustody=body.keepInCustody==="Yes";await submitJson("/api/dsc/fresh-issues","POST",body);closeModal();toast("Fresh DSC issue added.");window.renderDscRegisterPage();}catch(error){errorBox.textContent=error.message||"Unable to save the Fresh DSC Issue.";errorBox.hidden=false;submit.disabled=false;submit.textContent="Save Fresh Issue";}};
  }

  function showModal(title, content) { closeModal(); const modal=document.createElement("div"); modal.id="registerModal"; modal.className="register-modal-backdrop"; modal.innerHTML=`<div class="register-modal" role="dialog" aria-modal="true"><header><h3>${esc(title)}</h3><button type="button" data-close-register-modal aria-label="Close">×</button></header><div class="register-modal-body">${content}</div></div>`; document.body.appendChild(modal); modal.querySelectorAll("[data-close-register-modal]").forEach((b)=>b.onclick=closeModal); }
  function closeModal(){ document.querySelector("#registerModal")?.remove(); }
  function simplePrompt(title, fields, handler){ showModal(title,`<form id="registerPromptForm" class="register-form-grid">${fields}<div class="modal-actions form-span-2"><button type="button" class="secondary-button" data-close-register-modal>Cancel</button><button class="primary-button" type="submit">Save</button></div></form>`); const form=document.querySelector("#registerPromptForm"); form.onsubmit=async(e)=>{e.preventDefault(); const submit=form.querySelector('[type="submit"]'); submit.disabled=true; try{await handler(formObject(form));}catch(error){toast(error.message);submit.disabled=false;}}; }
  function formObject(form){ const data=new FormData(form); const result={}; for(const [key,value] of data.entries()) result[key]=value; return result; }
  async function submitJson(path,method,body){ return api(path,{method,body:JSON.stringify(body)}); }
  async function secureDownload(path){ const response=await fetch(path,{headers:{Authorization:`Bearer ${window.apiToken()}`}}); if(!response.ok)throw new Error((await response.json()).error||"Export failed."); const blob=await response.blob(); const link=document.createElement("a"); link.href=URL.createObjectURL(blob); link.download=(response.headers.get("content-disposition")?.match(/filename="?([^";]+)/i)||[])[1]||"export"; link.click(); setTimeout(()=>URL.revokeObjectURL(link.href),1000); }
  async function uploadAttachment(file){ const data=new FormData(); data.append("file",file); const response=await fetch("/api/storage/attachments",{method:"POST",headers:{Authorization:`Bearer ${window.apiToken()}`},body:data}); const result=await response.json(); if(!response.ok)throw new Error(result.error||"Attachment upload failed."); return result.attachment; }
  function loadingCard(message){return `<div class="register-card register-loading">${esc(message)}</div>`;}
  function errorCard(error){return `<div class="register-card register-error"><strong>Unable to load this register.</strong><span>${esc(error?.message||"Please try again.")}</span><button class="secondary-button" onclick="location.reload()">Refresh</button></div>`;}
  function kpi(label,value,tone){return `<article class="register-kpi ${tone}"><span>${esc(label)}</span><strong>${esc(value)}</strong></article>`;}
  function badge(value){const tone=String(value||"").toLowerCase().replace(/[^a-z]+/g,"-");return `<span class="register-badge ${tone}">${esc(value||"—")}</span>`;}
  function isBreached(row){return row.sla_due_at&&Date.parse(row.sla_due_at)<Date.now()&&!["Resolved","Closed"].includes(row.status);}
  function expiryDanger(value){return value&&Date.parse(value)<Date.now()+30*86400000;}
  function pagination(kind,result){return `<div class="register-pagination"><button class="secondary-button" data-${kind}-page="${Math.max(1,result.page-1)}" ${result.page<=1?"disabled":""}>Previous</button><span>Page ${result.page} of ${result.pageCount}</span><button class="secondary-button" data-${kind}-page="${Math.min(result.pageCount,result.page+1)}" ${result.page>=result.pageCount?"disabled":""}>Next</button></div>`;}
  function bindPagination(root,kind,handler){root.querySelectorAll(`[data-${kind}-page]`).forEach((b)=>b.onclick=()=>handler(Number(b.dataset[`${kind}Page`])));}
  function inputField(label,name,value="",required=false,type="text"){return `<label>${esc(label)}<input name="${name}" type="${type}" value="${esc(value)}" ${required?"required":""}></label>`;}
  function numberField(label,name,value){return `<label>${esc(label)}<input name="${name}" type="number" min="0" value="${esc(value)}" required></label>`;}
  function selectField(label,name,options,value=""){return `<label>${esc(label)}<select name="${name}" required>${options.map((o)=>`<option value="${esc(o)}" ${String(o)===String(value)?"selected":""}>${esc(o)}</option>`).join("")}</select></label>`;}
  function genericRows(rows,fields){if(!rows.length)return `<div class="register-empty">No records found.</div>`;return `<div class="register-table-wrap"><table class="register-table"><thead><tr>${fields.map((f)=>`<th>${esc(f.replaceAll("_"," "))}</th>`).join("")}</tr></thead><tbody>${rows.map((r)=>`<tr>${fields.map((f)=>`<td>${f.includes("date")?date(r[f]):f==="status"?badge(r[f]):esc(r[f]||"—")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;}
  function miniBars(rows=[]){if(!rows.length)return `<div class="register-empty">No data yet.</div>`;const max=Math.max(...rows.map((r)=>r.value),1);return `<div class="mini-bars">${rows.map((r)=>`<span><label>${esc(r.label)}</label><i><b style="width:${Math.max(4,(r.value/max)*100)}%"></b></i><strong>${r.value}</strong></span>`).join("")}</div>`;}
})();
