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
    const [clientResult, categoryResult, fileResult] = await Promise.all([api("/api/clients/search?limit=50"), api("/api/complaints/categories"), api("/api/files?page=1&pageSize=100")]);
    ui.clients = clientResult.clients || []; ui.categories = categoryResult.categories || [];
    const files = fileResult.files || [];
    const today = new Date().toISOString().slice(0, 16);
    showModal("New Complaint", `<form id="complaintForm" class="register-form-grid register-form-wide">
      ${selectField("Client Type","clientType",["Existing Client","Non-Client / General"],"Existing Client")}
      <label>Client Master<select name="clientId" id="complaintClient"><option value="">Select client</option>${ui.clients.map((c) => `<option value="${c.id}" data-pan="${esc(c.pan_reg_no || "")}" data-contact="${esc(c.contact_person || "")}" data-phone="${esc(c.contact_number || "")}" data-email="${esc(c.email || "")}" data-name="${esc(c.client_name)}">${esc(c.client_name)}${c.pan_reg_no ? ` — ${esc(c.pan_reg_no)}` : ""}</option>`).join("")}</select></label>
      ${inputField("Client Name","clientName","",true)}${inputField("PAN / Registration No.","panRegNo")}${inputField("Contact Person","contactPerson")}${inputField("Contact Number","contactNumber","","", "tel")}${inputField("Email","email","","", "email")}
      ${selectField("Complaint Source","source",["Phone","WhatsApp","Email","Office Visit","Website","Client Portal","Staff Reported","Other"])}
      <label>Complaint Category<select name="categoryId" id="complaintCategory" required><option value="">Select category</option>${ui.categories.map((c) => `<option value="${c.id}" data-name="${esc(c.name)}">${esc(c.name)}</option>`).join("")}</select></label>
      ${inputField("Service Type","serviceType")}
      <label>Related File / Work<select name="relatedFileId"><option value="">Not linked</option>${files.map((f) => `<option value="${esc(f.id)}">${esc(f.name || f.clientName)} — ${esc(f.serviceType || "")}</option>`).join("")}</select></label>
      ${inputField("Complaint Date & Time","complaintAt",today,true,"datetime-local")}${selectField("Priority","priority",["Low","Normal","High","Critical"],"Normal")}${selectField("Severity","severity",["Low","Medium","High","Critical"],"Medium")}
      <label>Assigned To<select name="assignedUserId"><option value="">Unassigned</option>${ui.users.map((u) => `<option value="${u.id}">${esc(u.name)} — ${esc(u.role)}</option>`).join("")}</select></label>
      ${inputField("Assigned Team / Department","assignedTeam")}${inputField("Target Resolution Date","targetResolutionAt","","","datetime-local")}${inputField("Follow-up Date","followUpAt","","","datetime-local")}
      <label class="form-span-2">Complaint Subject<input name="subject" maxlength="240" required></label><label class="form-span-2">Complaint Description<textarea name="description" rows="4" required></textarea></label><label>Attachment<input name="attachmentFile" type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xlsx"></label><label class="form-span-2">Internal Remarks<textarea name="internalRemarks" rows="2"></textarea></label>
      <div class="modal-actions form-span-2"><button type="button" class="secondary-button" data-close-register-modal>Cancel</button><button type="submit" class="primary-button">Save Complaint</button></div></form>`);
    const form = document.querySelector("#complaintForm");
    form.querySelector("#complaintClient").onchange = (event) => { const option = event.target.selectedOptions[0]; if (!option?.value) return; form.elements.clientName.value = option.dataset.name; form.elements.panRegNo.value = option.dataset.pan; form.elements.contactPerson.value = option.dataset.contact; form.elements.contactNumber.value = option.dataset.phone; form.elements.email.value = option.dataset.email; };
    form.onsubmit = async (event) => { event.preventDefault(); const values = formObject(form); delete values.attachmentFile; const file = form.elements.attachmentFile.files?.[0]; if (file) values.attachments = [await uploadAttachment(file)]; const cat = form.querySelector("#complaintCategory").selectedOptions[0]; values.categoryName = cat?.dataset.name || "Other"; await submitJson("/api/complaints", "POST", values); closeModal(); toast("Complaint registered."); window.renderComplaintRegisterPage(); };
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
      else if (ui.dscTab === "handover" || ui.dscTab === "movements") body = await handoverList();
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
    return `<section class="register-card"><div class="register-card-head"><div class="register-filter-row"><input id="dscSearch" value="${esc(ui.dscSearch)}" placeholder="Search entity, PAN, holder, token, box or slot"><button class="secondary-button" id="dscSearchButton">Search</button><span>${result.total} DSC record(s)</span></div><div>${importActions}</div></div>${dscRows(ui.dscRecords)}${pagination("dsc",result)}</section>`;
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

  async function boxList() {
    const result = await api("/api/dsc/boxes"); ui.boxes = result.boxes || [];
    return `<section class="register-card"><div class="register-card-head"><div><h3>Box / Storage Register</h3><p>Physical identification and capacity.</p></div>${canManageDsc() ? `<button class="primary-button" id="addDscBox">+ Add Box</button>` : ""}</div><div class="box-grid">${ui.boxes.map((b) => `<button data-view-box="${b.id}"><strong>${esc(b.box_code)}</strong><span>${esc(b.cabinet || "")} ${esc(b.shelf || "")}</span><small>${esc(b.location)}</small><em>${b.occupied} occupied · ${b.available} available</em></button>`).join("") || "No boxes configured."}</div></section>`;
  }

  async function freshList() {
    const result = await api("/api/dsc/fresh-issues?page=1&pageSize=100");
    return `<section class="register-card"><div class="register-card-head"><div><h3>Fresh DSC Issue Tracker</h3><p>Documents, verification, payment and token receipt.</p></div>${canManageDsc() ? `<button class="primary-button" id="newFreshIssue">+ New Fresh Issue</button>` : ""}</div>${genericRows(result.records || [], ["application_no","client_name","holder_name","application_date","status"])}</section>`;
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
    root.querySelectorAll("[data-approve-handover]").forEach((b) => b.onclick = () => decideHandover(b.dataset.approveHandover,"Approved"));
    root.querySelectorAll("[data-reject-handover]").forEach((b) => b.onclick = () => decideHandover(b.dataset.rejectHandover,"Rejected"));
    root.querySelectorAll("[data-mark-out]").forEach((b) => b.onclick = async () => { await submitJson(`/api/dsc/handovers/${b.dataset.markOut}/out`,"POST",{}); toast("DSC marked Issued Out."); window.renderDscRegisterPage(); });
    root.querySelectorAll("[data-return-dsc]").forEach((b) => b.onclick = () => returnDscForm(b.dataset.returnDsc,b.dataset.requestId));
    root.querySelector("#addDscBox")?.addEventListener("click", addBoxForm);
    root.querySelectorAll("[data-view-box]").forEach((b) => b.onclick = () => viewBox(b.dataset.viewBox));
    root.querySelector("#newFreshIssue")?.addEventListener("click", freshIssueForm);
    root.querySelector("#dscSettingsForm")?.addEventListener("submit", async (event) => { event.preventDefault(); const values = formObject(event.currentTarget); values.reminderDays = String(values.reminderDays).split(",").map((n) => Number(n.trim())).filter((n) => n >= 0); values.approverUserIds = [...event.currentTarget.elements.approverUserIds.selectedOptions].map((o) => o.value); await submitJson("/api/dsc/settings","PUT",values); toast("DSC settings saved."); window.renderDscRegisterPage(); });
  }

  async function downloadDscSample() {
    await window.loadSheetJs?.();
    if (!window.XLSX) throw new Error("Excel support is unavailable. Please reload and try again.");
    const sample = [{ "DSC HOLDER NAME":"","ENTITY NAME":"","DESIGNATION":"Director","C/O":"","PAN":"","PW":"","MOBILE NO":"","EMAIL":"","DSC TYPE":"","DSC CLASS":"Class III","TOKEN NAME":"Extratrust","BOX TYPE":"Blue","SLOT POSITION":"","ISSUE DATE":"","VALID FROM":"","VALID TO":"","REMARKS":"" }];
    const sheet = XLSX.utils.json_to_sheet(sample); sheet["!cols"] = Object.keys(sample[0]).map((name) => ({ wch: Math.max(14,name.length+2) }));
    const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book,sheet,"DSC Import"); XLSX.writeFile(book,"DSC-Register-Import-Sample.xlsx");
  }

  async function importDscExcel(event) {
    const file=event.target.files?.[0]; if(!file)return;
    try {
      await window.loadSheetJs?.(); if(!window.XLSX)throw new Error("Excel support is unavailable. Please reload and try again.");
      const book=XLSX.read(await file.arrayBuffer(),{type:"array",cellDates:true}); const source=XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]],{defval:""});
      if(!source.length)throw new Error("The Excel file has no DSC rows.");
      const rows=source.map((row,index)=>{let issue=dscExcelDate(row["ISSUE DATE"]),validFrom=dscExcelDate(row["VALID FROM"]),validTo=dscExcelDate(row["VALID TO"]);if(!validFrom&&issue)validFrom=issue;if(!validTo&&validFrom)validTo=dscAddYears(validFrom,2);return{holderName:row["DSC HOLDER NAME"],entityName:row["ENTITY NAME"],holderDesignation:row.DESIGNATION,careOf:row["C/O"],pan:row.PAN,password:row.PW,mobile:row["MOBILE NO"],email:row.EMAIL,dscType:row["DSC TYPE"],certificateClass:row["DSC CLASS"],tokenName:row["TOKEN NAME"],boxType:row["BOX TYPE"],slotPosition:row["SLOT POSITION"],issuedDate:issue,validFrom,expiryDate:validTo,remarks:row.REMARKS,importRow:index+2};});
      const result=await submitJson("/api/dsc/import","POST",{rows}); const errors=(result.results||[]).filter((item)=>!item.created);
      showModal("DSC Import Result",`<div class="register-kpi-grid">${kpi("Rows",result.total,"blue")}${kpi("Created",result.created,"green")}${kpi("Not Created",result.failed,"red")}</div>${errors.length?`<div class="register-card"><h4>Row-level Errors</h4>${errors.map((item)=>`<p>Row ${item.row}: ${esc(item.error)}</p>`).join("")}</div>`:`<p>All DSC records were imported successfully.</p>`}`);
    } catch(error) { toast(error.message); } finally { event.target.value=""; }
  }
  function dscExcelDate(value){if(!value)return"";if(value instanceof Date)return value.toISOString().slice(0,10);const raw=String(value).trim();const match=raw.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/);return match?`${match[3]}-${match[2].padStart(2,"0")}-${match[1].padStart(2,"0")}`:raw.slice(0,10);}
  function dscAddYears(value,years){const d=new Date(`${value}T00:00:00`);d.setFullYear(d.getFullYear()+years);return d.toISOString().slice(0,10);}

  async function openDscForm(existing = null) {
    const [clientResult, masterResult] = await Promise.all([api("/api/clients/search?limit=50"), api("/api/clients/masters")]);
    ui.clients = clientResult.clients || [];
    const careOfValues = [...new Set((masterResult.careOf || []).map((value) => String(value || "").trim()).filter(Boolean))];
    showModal(existing ? "Edit DSC" : "Add DSC", `<form id="dscForm" class="register-form-grid register-form-wide">
      ${inputField("DSC HOLDER NAME","holderName",existing?.holder_name || "",true)}
      <label>ENTITY NAME<select name="clientId" id="dscEntity" required><option value="">Select from Client Master</option>${ui.clients.map((c) => `<option value="${c.id}" data-name="${esc(c.client_name)}" data-pan="${esc(c.pan_reg_no || "")}" data-phone="${esc(c.contact_number || "")}" data-email="${esc(c.email || "")}" data-careof="${esc(c.care_of || "")}">${esc(c.client_name)}${c.pan_reg_no ? ` — ${esc(c.pan_reg_no)}` : ""}</option>`).join("")}</select><input type="hidden" name="entityName"></label>
      ${selectField("DESIGNATION","holderDesignation",["Director","Designated Partner","Owner","Auth Representative"],existing?.holder_designation || "Director")}
      <label>C/O<select name="careOf"><option value="">Select C/O</option>${careOfValues.map((value) => `<option value="${esc(value)}">${esc(value)}</option>`).join("")}</select></label>
      ${inputField("PAN","pan",existing?.pan || "")}
      ${inputField("PW","password","",false,"password")}
      ${inputField("MOBILE NO","mobile",existing?.mobile || "",false,"tel")}
      ${inputField("EMAIL","email",existing?.email || "",false,"email")}
      ${inputField("DSC TYPE","dscType",existing?.dsc_type || "")}
      ${selectField("DSC CLASS","certificateClass",["Class II","Class III","Class I"],existing?.certificate_class || "Class III")}
      ${selectField("TOKEN NAME","tokenName",["Extratrust","Vsign","Emudhra"],existing?.token_name || existing?.token_make || "Extratrust")}
      ${selectField("BOX TYPE","boxType",["Blue","Black"],existing?.box_type || "Blue")}
      ${inputField("SLOT POSITION","slotPosition",existing?.slot_position || "")}
      ${inputField("ISSUE DATE","issuedDate",existing?.issued_date || "",false,"date")}
      ${inputField("VALID FROM","validFrom",existing?.valid_from || "",false,"date")}
      ${inputField("VALID TO","expiryDate",existing?.expiry_date || "",false,"date")}
      <label class="form-span-2">REMARKS<textarea name="remarks" rows="3">${esc(existing?.remarks || "")}</textarea></label>
      <div class="security-callout form-span-2">PW is encrypted and masked. It is never included in DSC lists, reports, exports, notifications or QR codes.</div>
      <div class="modal-actions form-span-2"><button type="button" class="secondary-button" data-close-register-modal>Cancel</button><button type="submit" class="primary-button">Save DSC</button></div>
    </form>`);
    const form = document.querySelector("#dscForm");
    const setValidTo = () => { const value=form.elements.validFrom.value; if(!value)return; const d=new Date(`${value}T00:00:00`); d.setFullYear(d.getFullYear()+2); form.elements.expiryDate.value=d.toISOString().slice(0,10); };
    form.elements.issuedDate.onchange = () => { form.elements.validFrom.value=form.elements.issuedDate.value; setValidTo(); };
    form.elements.validFrom.onchange = setValidTo;
    form.querySelector("#dscEntity").onchange = (event) => { const o=event.target.selectedOptions[0]; if(!o?.value)return; form.elements.entityName.value=o.dataset.name; form.elements.pan.value=o.dataset.pan; form.elements.mobile.value=o.dataset.phone; form.elements.email.value=o.dataset.email; if(o.dataset.careof)form.elements.careOf.value=o.dataset.careof; };
    form.onsubmit = async (event) => { event.preventDefault(); const body=formObject(form); const path=existing ? `/api/dsc/${existing.id}` : "/api/dsc"; await submitJson(path,existing ? "PUT" : "POST",body); closeModal(); toast(existing ? "DSC updated." : "DSC added to Master."); window.renderDscRegisterPage(); };
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

  async function decideHandover(id, decision) { const remarks = prompt(`${decision} remarks (optional):`) || ""; await submitJson(`/api/dsc/handovers/${id}/decision`,"POST",{ decision, remarks }); toast(`Handover ${decision.toLowerCase()}.`); window.renderDscRegisterPage(); }
  async function returnDscForm(id, requestId = "") { if(!ui.boxes.length) ui.boxes=(await api("/api/dsc/boxes")).boxes||[]; simplePrompt("Mark DSC Returned", `<label>Returned Box<select name="boxId" required><option value="">Select box</option>${ui.boxes.map((b)=>`<option value="${b.id}">${esc(b.box_code)} — ${esc(b.location)}</option>`).join("")}</select></label>${inputField("Slot / Position","slotPosition","",true)}${selectField("Condition","condition",["Good","Damaged","Needs Inspection"],"Good")}<label>Remarks<textarea name="remarks"></textarea></label>`, async(values)=>{ await submitJson(`/api/dsc/${id}/return`,"POST",{...values,requestId}); closeModal(); toast("DSC returned to office storage."); window.renderDscRegisterPage(); }); }
  function addBoxForm() { simplePrompt("Add Storage Box", `${inputField("Box Code","boxCode","",true)}${inputField("Box Name","boxName")}${inputField("Cabinet","cabinet")}${inputField("Shelf","shelf")}${inputField("Location","location","",true)}${numberField("Capacity","capacity",20)}`, async(values)=>{ await submitJson("/api/dsc/boxes","POST",values); toast("Storage box added."); window.renderDscRegisterPage(); }); }
  async function viewBox(id) { const result=await api(`/api/dsc/boxes/${id}`); showModal(`Box ${result.box.box_code}`, `<div class="detail-summary-grid"><span><small>Location</small><strong>${esc(result.box.location)}</strong></span><span><small>Capacity</small><strong>${result.box.capacity}</strong></span><span><small>Occupied</small><strong>${result.box.occupied}</strong></span><span><small>Available</small><strong>${result.box.available}</strong></span></div>${genericRows(result.records,["slot_position","client_name","holder_name","token_name","expiry_date","status"])}<div class="modal-actions"><button class="secondary-button" onclick="window.print()">Print Box List</button></div>`); }
  function freshIssueForm(){ simplePrompt("New Fresh DSC Issue", `${inputField("Application No.","applicationNo","",true)}${inputField("Client Name","clientName","",true)}${inputField("DSC Holder","holderName","",true)}${inputField("PAN","pan")}${inputField("Mobile","mobile")}${inputField("Email","email")}${inputField("Application Date","applicationDate",new Date().toISOString().slice(0,10),true,"date")}${inputField("Provider / Vendor","providerVendor")}${selectField("Status","status",["New Request","Documents Pending","Documents Received","Application Prepared","Application Submitted","Payment Pending","Verification Pending","Video Verification Pending","Under Processing","Approved","Token Awaited","DSC Received","Handed Over","Completed","Rejected","Cancelled"])}<label>Documents Pending<textarea name="documentsPending"></textarea></label><label>Remarks<textarea name="remarks"></textarea></label>`, async(values)=>{ await submitJson("/api/dsc/fresh-issues","POST",values); toast("Fresh DSC issue added."); window.renderDscRegisterPage(); }); }

  function showModal(title, content) { closeModal(); const modal=document.createElement("div"); modal.id="registerModal"; modal.className="register-modal-backdrop"; modal.innerHTML=`<div class="register-modal" role="dialog" aria-modal="true"><header><h3>${esc(title)}</h3><button type="button" data-close-register-modal aria-label="Close">×</button></header><div class="register-modal-body">${content}</div></div>`; document.body.appendChild(modal); modal.querySelectorAll("[data-close-register-modal]").forEach((b)=>b.onclick=closeModal); modal.addEventListener("click",(e)=>{if(e.target===modal)closeModal();}); }
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
