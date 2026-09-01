const { supabaseAdmin } = require("../config/supabase");
const { notifyRegisterUser } = require("./registerNotificationService");

const OPEN_STATUSES = ["New","Acknowledged","Assigned","Under Review","Action in Progress","Waiting for Client","Waiting for Third Party","Escalated","Resolution Proposed","Reopened"];
const STATUSES = [...OPEN_STATUSES, "Resolved", "Closed"];
const PRIORITIES = ["Low", "Normal", "High", "Critical"];
const SOURCES = ["Phone","WhatsApp","Email","Office Visit","Website","Client Portal","Staff Reported","Other"];

function text(value, max = 4000) { return String(value ?? "").trim().slice(0, max); }
function fail(message, status = 400) { const error = new Error(message); error.status = status; return error; }
function isManager(profile) { return ["Admin", "Manager", "Staff Manager"].includes(profile?.role); }
function actor(req) { return { authUserId: req.user.id, name: req.profile?.name, email: req.profile?.email }; }

async function settings() {
  const { data, error } = await supabaseAdmin.from("complaint_settings").select("*").eq("id", "default").single();
  if (error) throw error;
  return data;
}

function slaMinutes(priority, config) {
  return Number(config[`sla_${String(priority).toLowerCase()}_minutes`] || config.sla_normal_minutes || 1440);
}

function addWorkingMinutes(start, minutes) {
  const cursor = new Date(start);
  let remaining = Math.max(0, Number(minutes) || 0);
  while (remaining > 0) {
    const day = cursor.getUTCDay();
    if (day === 0 || day === 6) { cursor.setUTCDate(cursor.getUTCDate() + (day === 6 ? 2 : 1)); cursor.setUTCHours(3, 30, 0, 0); continue; }
    const istMinutes = ((cursor.getUTCHours() * 60 + cursor.getUTCMinutes()) + 330) % 1440;
    if (istMinutes < 9 * 60) { cursor.setUTCHours(3, 30, 0, 0); continue; }
    if (istMinutes >= 17 * 60) { cursor.setUTCDate(cursor.getUTCDate() + 1); cursor.setUTCHours(3, 30, 0, 0); continue; }
    const usable = Math.min(remaining, 17 * 60 - istMinutes);
    cursor.setUTCMinutes(cursor.getUTCMinutes() + usable); remaining -= usable;
  }
  return cursor;
}

function complaintPayload(input, context, existing = {}) {
  const description = text(input.description, 10000);
  const clientName = text(input.clientName ?? input.client_name ?? existing.client_name, 240);
  if (!description || !clientName) throw fail("Client Name and Complaint Description are required.");
  const categoryName = text(input.categoryName ?? input.category_name ?? existing.category_name, 160) || "Other";
  const subject = text(input.subject, 240) || text(`${categoryName} — ${description.replace(/\s+/g, " ")}`, 240);
  const priority = PRIORITIES.includes(input.priority) ? input.priority : (existing.priority || "Normal");
  const status = STATUSES.includes(input.status) ? input.status : (existing.status || "New");
  const clientId = input.clientId || input.client_id || existing.client_id || null;
  const clientType = input.clientType === "Non-Client / General" || (!input.clientType && !clientId) ? "Non-Client / General" : "Existing Client";
  if (clientType === "Existing Client" && !clientId) throw fail("Select an existing client from Client Master.");
  return {
    complaint_at: input.complaintAt || input.complaint_at || existing.complaint_at || new Date().toISOString(),
    client_type: clientType,
    client_id: clientId,
    client_name: clientName,
    pan_reg_no: text(input.panRegNo ?? input.pan_reg_no, 40) || null,
    contact_person: text(input.contactPerson ?? input.contact_person, 160) || null,
    contact_number: text(input.contactNumber ?? input.contact_number, 40) || null,
    email: text(input.email, 240).toLowerCase() || null,
    source: SOURCES.includes(input.source) ? input.source : "Other",
    category_id: input.categoryId || input.category_id || null,
    category_name: categoryName,
    service_type: text(input.serviceType ?? input.service_type, 160) || null,
    related_file_id: input.relatedFileId || input.related_file_id || null,
    subject,
    description,
    priority,
    severity: ["Low","Medium","High","Critical"].includes(input.severity) ? input.severity : "Medium",
    status,
    assigned_user_id: input.assignedUserId || input.assigned_user_id || null,
    assigned_team: text(input.assignedTeam ?? input.assigned_team, 160) || null,
    target_resolution_at: input.targetResolutionAt || input.target_resolution_at || null,
    follow_up_at: input.followUpAt || input.follow_up_at || null,
    internal_remarks: text(input.internalRemarks ?? input.internal_remarks, 10000) || null,
    attachments: Array.isArray(input.attachments) ? input.attachments.slice(0, 20) : (existing.attachments || []),
    updated_by: context.userId,
    updated_at: new Date().toISOString(),
  };
}

function applyVisibility(query, profile, userId, view = "") {
  if (isManager(profile)) return query;
  if (view === "assigned") return query.eq("assigned_user_id", profile.id);
  return query.or(`assigned_user_id.eq.${profile.id},created_by.eq.${userId}`);
}

async function listComplaints(filters, profile, userId) {
  const page = Math.max(1, Number(filters.page) || 1);
  const pageSize = Math.min(100, Math.max(10, Number(filters.pageSize) || 25));
  let query = supabaseAdmin.from("complaints").select("*,assigned:app_users!complaints_assigned_user_id_fkey(id,name,email,role),category:complaint_categories(id,name)", { count: "exact" });
  query = applyVisibility(query, profile, userId, filters.view);
  if (filters.view === "open") query = query.in("status", OPEN_STATUSES);
  if (filters.view === "pending-client") query = query.eq("status", "Waiting for Client");
  if (filters.view === "escalated") query = query.eq("status", "Escalated");
  if (filters.view === "resolved") query = query.eq("status", "Resolved");
  if (filters.view === "closed") query = query.eq("status", "Closed");
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.priority) query = query.eq("priority", filters.priority);
  if (filters.assignedTo) query = query.eq("assigned_user_id", filters.assignedTo);
  if (filters.clientId) query = query.eq("client_id", filters.clientId);
  if (filters.from) query = query.gte("complaint_at", `${filters.from}T00:00:00`);
  if (filters.to) query = query.lte("complaint_at", `${filters.to}T23:59:59`);
  const search = text(filters.q, 120).replace(/[,%()]/g, " ");
  if (search) query = query.or(`complaint_no.ilike.%${search}%,client_name.ilike.%${search}%,subject.ilike.%${search}%,pan_reg_no.ilike.%${search}%`);
  const from = (page - 1) * pageSize;
  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, from + pageSize - 1);
  if (error) throw error;
  return { complaints: data || [], total: count || 0, page, pageSize, pageCount: Math.max(1, Math.ceil((count || 0) / pageSize)) };
}

async function getComplaint(id, profile, userId) {
  let query = supabaseAdmin.from("complaints").select("*,assigned:app_users!complaints_assigned_user_id_fkey(id,name,email,role),category:complaint_categories(id,name)").eq("id", id);
  query = applyVisibility(query, profile, userId);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) throw fail("Complaint not found or access denied.", 404);
  const { data: activities, error: activityError } = await supabaseAdmin.from("complaint_activity").select("*").eq("complaint_id", id).order("created_at", { ascending: false }).limit(200);
  if (activityError) throw activityError;
  return { complaint: data, activities: activities || [] };
}

async function addActivity(complaintId, type, remarks, req, oldValue = null, newValue = null, meta = {}) {
  const { error } = await supabaseAdmin.from("complaint_activity").insert({
    complaint_id: complaintId, activity_type: type, remarks: text(remarks, 10000) || null,
    old_value: oldValue, new_value: newValue, channel: meta.channel || null, recipient: meta.recipient || null,
    actor_user_id: req.user.id, actor_name: req.profile?.name || req.profile?.email,
  });
  if (error) throw error;
}

async function createComplaint(input, req) {
  const config = await settings();
  const payload = complaintPayload(input, { userId: req.user.id });
  if (!payload.sla_due_at) payload.sla_due_at = addWorkingMinutes(payload.complaint_at, slaMinutes(payload.priority, config)).toISOString();
  payload.created_by = req.user.id;
  if (payload.assigned_user_id) {
    payload.assigned_by = req.user.id;
    payload.assigned_at = new Date().toISOString();
    if (payload.status === "New") payload.status = "Assigned";
  }
  const { data, error } = await supabaseAdmin.from("complaints").insert(payload).select("*").single();
  if (error) throw error;
  const sideEffects = [addActivity(data.id, "Complaint created", data.subject, req, null, { status: data.status })];
  if (data.assigned_user_id) sideEffects.push(sendAssignment(data, req));
  const sideEffectResults = await Promise.allSettled(sideEffects);
  sideEffectResults.filter((result) => result.status === "rejected").forEach((result) => console.error("Complaint post-save action failed:", result.reason?.message || result.reason));
  return getComplaint(data.id, req.profile, req.user.id);
}

async function updateComplaint(id, input, req) {
  const { complaint: before } = await getComplaint(id, req.profile, req.user.id);
  const payload = complaintPayload(input, { userId: req.user.id }, before);
  if (!isManager(req.profile)) {
    delete payload.assigned_user_id;
    delete payload.assigned_team;
  }
  if (payload.assigned_user_id && payload.assigned_user_id !== before.assigned_user_id) {
    payload.assigned_by = req.user.id;
    payload.assigned_at = new Date().toISOString();
  }
  const { data, error } = await supabaseAdmin.from("complaints").update(payload).eq("id", id).select("*").single();
  if (error) throw error;
  await addActivity(id, payload.assigned_user_id !== before.assigned_user_id ? "Reassigned" : "Complaint updated", input.remarks || "", req, before, data);
  if (payload.assigned_user_id && payload.assigned_user_id !== before.assigned_user_id) await sendAssignment(data, req);
  return getComplaint(id, req.profile, req.user.id);
}

async function changeStatus(id, input, req) {
  const { complaint: before } = await getComplaint(id, req.profile, req.user.id);
  const status = text(input.status, 80);
  if (!STATUSES.includes(status)) throw fail("Select a valid complaint status.");
  const patch = { status, updated_by: req.user.id, updated_at: new Date().toISOString() };
  if (status === "Resolved") {
    for (const [field, label] of [["resolutionSummary","Resolution Summary"],["actionTaken","Action Taken"],["rootCause","Root Cause"]]) {
      if (!text(input[field])) throw fail(`${label} is required when resolving a complaint.`);
    }
    Object.assign(patch, {
      resolution_date: input.resolutionDate || new Date().toISOString().slice(0, 10),
      resolution_summary: text(input.resolutionSummary, 10000), action_taken: text(input.actionTaken, 10000),
      root_cause: text(input.rootCause, 200), corrective_action: text(input.correctiveAction, 10000) || null,
      preventive_action: text(input.preventiveAction, 10000) || null, resolved_by: req.user.id,
    });
  }
  if (status === "Closed") {
    if (before.status !== "Resolved") throw fail("A complaint must be Resolved before it can be Closed.");
    patch.closed_at = new Date().toISOString();
  }
  if (status === "Reopened") patch.reopen_count = Number(before.reopen_count || 0) + 1;
  const { data, error } = await supabaseAdmin.from("complaints").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  await addActivity(id, `Status changed to ${status}`, input.remarks || input.resolutionSummary || "", req, { status: before.status }, { status });
  return getComplaint(id, req.profile, req.user.id);
}

async function addNote(id, input, req) {
  await getComplaint(id, req.profile, req.user.id);
  const type = ["Client contacted","WhatsApp sent","Email sent","Attachment uploaded","Note added"].includes(input.type) ? input.type : "Note added";
  await addActivity(id, type, input.remarks, req, null, null, { channel: input.channel, recipient: input.recipient });
  return getComplaint(id, req.profile, req.user.id);
}

async function sendAssignment(complaint, req) {
  return notifyRegisterUser({
    recipientProfileId: complaint.assigned_user_id,
    eventKey: `complaint:assigned:${complaint.id}:${complaint.assigned_at || complaint.updated_at}`,
    eventType: "Complaint Assigned", title: complaint.complaint_no,
    message: `${complaint.complaint_no} — ${complaint.subject} has been assigned to you.`,
    route: `/?page=complaints&complaint=${complaint.id}`, category: "complaints", actor: actor(req),
  });
}

async function dashboard(profile, userId) {
  const list = await listComplaints({ page: 1, pageSize: 100 }, profile, userId);
  const rows = list.complaints;
  const now = Date.now();
  const month = new Date().toISOString().slice(0, 7);
  const resolved = rows.filter((row) => row.status === "Resolved" || row.status === "Closed");
  const avgHours = resolved.length ? resolved.reduce((sum, row) => sum + Math.max(0, Date.parse(row.updated_at) - Date.parse(row.created_at)), 0) / resolved.length / 3600000 : 0;
  const grouped = (key) => Object.entries(rows.reduce((totals, row) => {
    const label = row[key] || "Not specified"; totals[label] = (totals[label] || 0) + 1; return totals;
  }, {})).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  const byStaff = Object.entries(rows.reduce((totals, row) => {
    const label = row.assigned?.name || row.assigned_team || "Unassigned"; totals[label] = (totals[label] || 0) + 1; return totals;
  }, {})).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  const trend = Object.entries(rows.reduce((totals, row) => {
    const label = String(row.complaint_at || row.created_at || "").slice(0, 7) || "Unknown"; totals[label] = (totals[label] || 0) + 1; return totals;
  }, {})).map(([label, value]) => ({ label, value })).sort((a, b) => a.label.localeCompare(b.label)).slice(-12);
  return {
    total: list.total, open: rows.filter((row) => OPEN_STATUSES.includes(row.status)).length,
    high: rows.filter((row) => row.priority === "High").length, critical: rows.filter((row) => row.priority === "Critical").length,
    slaDueToday: rows.filter((row) => row.sla_due_at?.slice(0, 10) === new Date().toISOString().slice(0, 10) && OPEN_STATUSES.includes(row.status)).length,
    slaBreached: rows.filter((row) => row.sla_due_at && Date.parse(row.sla_due_at) < now && OPEN_STATUSES.includes(row.status)).length,
    resolvedThisMonth: rows.filter((row) => row.resolution_date?.startsWith(month)).length,
    reopened: rows.filter((row) => Number(row.reopen_count) > 0).length,
    averageResolutionHours: Number(avgHours.toFixed(1)), recent: rows.slice(0, 8),
    byCategory: grouped("category_name"), byService: grouped("service_type"), byStaff, trend,
    repeatedReasons: grouped("subject").filter((item) => item.value > 1),
  };
}

async function categories(includeInactive = false) {
  let query = supabaseAdmin.from("complaint_categories").select("*").order("display_order").order("name");
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function saveCategory(input, req) {
  const name = text(input.name, 160);
  if (!name) throw fail("Category name is required.");
  const payload = { name, is_active: input.isActive !== false, display_order: Number(input.displayOrder) || 100, updated_at: new Date().toISOString() };
  if (input.id) {
    const { data, error } = await supabaseAdmin.from("complaint_categories").update(payload).eq("id", input.id).select("*").single();
    if (error) throw error; return data;
  }
  const { data, error } = await supabaseAdmin.from("complaint_categories").insert({ ...payload, created_by: req.user.id }).select("*").single();
  if (error) throw error; return data;
}

async function saveSettings(input, req) {
  const payload = { updated_by: req.user.id, updated_at: new Date().toISOString() };
  ["sla_low_minutes","sla_normal_minutes","sla_high_minutes","sla_critical_minutes","acknowledgement_minutes","approaching_minutes","reopen_escalation_count"].forEach((key) => {
    if (input[key] !== undefined) payload[key] = Math.max(1, Number(input[key]) || 1);
  });
  const { data, error } = await supabaseAdmin.from("complaint_settings").update(payload).eq("id", "default").select("*").single();
  if (error) throw error; return data;
}

module.exports = { OPEN_STATUSES, addNote, categories, changeStatus, createComplaint, dashboard, getComplaint, isManager, listComplaints, saveCategory, saveSettings, settings, updateComplaint };
