const crypto = require("crypto");
const { supabaseAdmin } = require("../config/supabase");
const { env } = require("../config/env");
const { notifyRegisterUser } = require("./registerNotificationService");

const MANAGE_PERMISSION = "manage_dsc";
const APPROVE_PERMISSION = "approve_dsc_handover";
const EXPORT_PERMISSION = "export_dsc";
const DSC_STATUSES = ["Fresh Issue Pending","Application in Progress","Verification Pending","Issued","Active","Expiring Soon","Renewal Initiated","Renewal in Progress","Renewed","Expired","In Office","Issued Out","Returned","Lost / Missing","Damaged","Revoked","Closed"];
const FRESH_STATUSES = ["New Request","Documents Pending","Documents Received","Application Prepared","Application Submitted","Payment Pending","Verification Pending","Video Verification Pending","Under Processing","Approved","Token Awaited","DSC Received","Handed Over","Completed","Rejected","Cancelled"];
const FORM_OPTION_TYPES = ["entity_name", "designation", "token_name", "authority", "box_name"];

function text(value, max = 5000) { return String(value ?? "").trim().slice(0, max); }
function fail(message, status = 400) { const error = new Error(message); error.status = status; return error; }
function permissions(profile = {}) { const raw = profile.permissions || []; return Array.isArray(raw) ? raw : Object.keys(raw || {}).filter((key) => raw[key]); }
function hasPermission(profile, permission) { return profile?.role === "Admin" || permissions(profile).includes(permission); }
function canViewAll(profile) { return ["Admin","Manager","Staff Manager"].includes(profile?.role) || hasPermission(profile, MANAGE_PERMISSION); }
function canManage(profile) { return hasPermission(profile, MANAGE_PERMISSION); }
function canApprove(profile) { return hasPermission(profile, APPROVE_PERMISSION); }
function canExport(profile) { return ["Admin","Manager","Staff Manager"].includes(profile?.role) || hasPermission(profile, EXPORT_PERMISSION); }
function assertManage(profile) { if (!canManage(profile)) throw fail("Authorized DSC Custodian permission is required.", 403); }
function assertApprove(profile) { if (!canApprove(profile)) throw fail("DSC handover approval permission is required.", 403); }
function actor(req) { return { authUserId: req.user.id, name: req.profile?.name, email: req.profile?.email }; }

function credentialKey() {
  const secret = String(env.clientCredentialsEncryptionKey || "");
  if (secret.length < 32) throw fail("DSC password encryption is not configured.", 503);
  return crypto.createHash("sha256").update(secret, "utf8").digest();
}
function encryptPassword(value) {
  const plain = String(value || "");
  if (!plain) return null;
  const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv("aes-256-gcm", credentialKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64")}.${cipher.getAuthTag().toString("base64")}.${encrypted.toString("base64")}`;
}
function addYears(dateText, years) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateText || ""))) return null;
  const date = new Date(`${dateText}T00:00:00Z`); date.setUTCFullYear(date.getUTCFullYear() + years); return date.toISOString().slice(0, 10);
}
function validityStatus(expiryDate) {
  const today = new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(expiryDate || ""))) return "Active";
  if (expiryDate < today) return "Expired";
  const warningDate = new Date(`${today}T00:00:00Z`); warningDate.setUTCDate(warningDate.getUTCDate() + 30);
  return expiryDate <= warningDate.toISOString().slice(0, 10) ? "Expiring Soon" : "Active";
}
function withoutPassword(record) {
  if (!record || typeof record !== "object") return record;
  const hasPasswordField = Object.prototype.hasOwnProperty.call(record, "password_encrypted");
  const { password_encrypted: _password, ...safe } = record;
  return hasPasswordField ? { ...safe, password_saved: Boolean(_password) } : safe;
}

function sanitizeActivity(activity) {
  return {
    ...activity,
    old_value: withoutPassword(activity?.old_value),
    new_value: withoutPassword(activity?.new_value),
  };
}

function applyVisibility(query, profile, userId) {
  if (canViewAll(profile)) return query;
  return query.or(`assigned_user_id.eq.${profile.id},created_by.eq.${userId}`);
}

async function listDsc(filters, profile, userId) {
  const page = Math.max(1, Number(filters.page) || 1);
  const pageSize = Math.min(100, Math.max(10, Number(filters.pageSize) || 25));
  let query = supabaseAdmin.from("dsc_master").select("*,box:dsc_boxes(id,box_code,box_name,location,capacity),assigned:app_users!dsc_master_assigned_user_id_fkey(id,name,email)", { count: "exact" });
  query = applyVisibility(query, profile, userId);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.boxId) query = query.eq("box_id", filters.boxId);
  if (filters.clientId) query = query.eq("client_id", filters.clientId);
  if (filters.expiryFrom) query = query.gte("expiry_date", filters.expiryFrom);
  if (filters.expiryTo) query = query.lte("expiry_date", filters.expiryTo);
  if (filters.view === "in-office") query = query.eq("current_custody", "Office");
  if (filters.view === "issued-out") query = query.eq("status", "Issued Out");
  if (filters.view === "expired") query = query.lt("expiry_date", new Date().toISOString().slice(0, 10));
  const search = text(filters.q, 120).replace(/[,%()]/g, " ");
  if (search) query = query.or(`dsc_id.ilike.%${search}%,client_name.ilike.%${search}%,pan.ilike.%${search}%,holder_name.ilike.%${search}%,token_name.ilike.%${search}%,token_serial.ilike.%${search}%,certificate_serial.ilike.%${search}%,slot_position.ilike.%${search}%`);
  const from = (page - 1) * pageSize;
  const { data, error, count } = await query.order("expiry_date", { ascending: true, nullsFirst: false }).range(from, from + pageSize - 1);
  if (error) throw error;
  return { records: (data || []).map(withoutPassword), total: count || 0, page, pageSize, pageCount: Math.max(1, Math.ceil((count || 0) / pageSize)) };
}

async function getDsc(id, profile, userId) {
  let query = supabaseAdmin.from("dsc_master").select("*,box:dsc_boxes(*),assigned:app_users!dsc_master_assigned_user_id_fkey(id,name,email)").eq("id", id);
  query = applyVisibility(query, profile, userId);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) throw fail("DSC record not found or access denied.", 404);
  const [activities, movements, requests, renewals] = await Promise.all([
    selectMany("dsc_activity", "dsc_id", id, "created_at"), selectMany("dsc_movements", "dsc_id", id, "movement_at"),
    selectMany("dsc_handover_requests", "dsc_id", id, "created_at"), selectMany("dsc_renewals", "existing_dsc_id", id, "created_at"),
  ]);
  return { record: withoutPassword(data), activities: activities.map(sanitizeActivity), movements, requests, renewals };
}

async function selectMany(table, column, id, order) {
  const { data, error } = await supabaseAdmin.from(table).select("*").eq(column, id).order(order, { ascending: false }).limit(200);
  if (error) throw error; return data || [];
}

function dscPayload(input, req, existing = {}) {
  const entityName = text(input.entityName ?? input.entity_name ?? existing.entity_name, 240);
  const clientName = text(input.clientName ?? input.client_name, 240) || entityName || text(existing.client_name, 240);
  const requestedClientId = input.clientId ?? input.client_id;
  const clientId = requestedClientId === "" || requestedClientId === null ? null : (requestedClientId || existing.client_id || null);
  const holderName = text(input.holderName ?? input.holder_name, 240);
  const tokenName = text(input.tokenName ?? input.token_name ?? existing.token_name, 240);
  if (!entityName || !holderName || !tokenName) throw fail("DSC Holder Name, Entity Name and Token Name are required.");
  const remarks = text(input.remarks, 5000);
  if (/(pin|password|passwd|pwd)\s*[:=]/i.test(remarks)) throw fail("Do not store a DSC PIN or password in Remarks.");
  const issuedDate = input.issuedDate || input.issued_date || existing.issued_date || null;
  const validFrom = input.validFrom || input.valid_from || existing.valid_from || issuedDate;
  const expiryDate = input.expiryDate || input.expiry_date || existing.expiry_date || addYears(validFrom, 2);
  const status = DSC_STATUSES.includes(input.status) ? input.status : (existing.status || validityStatus(expiryDate));
  return {
    client_id: clientId, client_name: clientName,
    pan: text(input.pan, 40) || null, entity_name: entityName,
    holder_name: holderName, holder_designation: text(input.holderDesignation ?? input.holder_designation, 160) || null,
    care_of: text(input.careOf ?? input.care_of, 160) || null,
    mobile: text(input.mobile, 40) || null, email: text(input.email, 240).toLowerCase() || null,
    dsc_type: ["Token","Other file"].includes(input.dscType ?? input.dsc_type) ? (input.dscType ?? input.dsc_type) : (existing.dsc_type || "Token"), certificate_class: text(input.certificateClass ?? input.certificate_class, 120) || null,
    holder_type: ["Individual","Organisation"].includes(input.holderType || input.holder_type) ? (input.holderType || input.holder_type) : null,
    token_name: tokenName, token_make: tokenName, token_serial: text(input.tokenSerial ?? input.token_serial ?? existing.token_serial, 240) || null,
    issued_date: issuedDate, valid_from: validFrom, expiry_date: expiryDate, status,
    current_custody: text(input.currentCustody ?? input.current_custody, 160) || existing.current_custody || "Office",
    current_location: text(input.currentLocation ?? input.current_location, 240) || null,
    box_id: input.boxId || input.box_id || null, box_type: text(input.boxType || input.box_type, 160) || null,
    slot_position: text(input.slotPosition ?? input.slot_position, 80) || null,
    assigned_user_id: input.assignedUserId || input.assigned_user_id || existing.assigned_user_id || null, remarks: remarks || null,
    updated_by: req.user.id, updated_at: new Date().toISOString(),
  };
}

async function audit(dscId, action, req, oldValue = null, newValue = null, remarks = "") {
  const { error } = await supabaseAdmin.from("dsc_activity").insert({ dsc_id: dscId, action, old_value: oldValue, new_value: newValue, remarks: text(remarks, 5000) || null, actor_user_id: req.user.id, actor_name: req.profile?.name || req.profile?.email });
  if (error) throw error;
}

async function createDsc(input, req) {
  assertManage(req.profile);
  const payload = { ...dscPayload(input, req), created_by: req.user.id };
  if (Object.prototype.hasOwnProperty.call(input, "password")) payload.password_encrypted = encryptPassword(input.password);
  const { data, error } = await supabaseAdmin.from("dsc_master").insert(payload).select("*").single();
  if (error?.code === "23505") throw fail("A DSC with this Token or Certificate Serial already exists.", 409);
  if (error) throw error;
  await audit(data.id, "Created", req, null, data);
  return getDsc(data.id, req.profile, req.user.id);
}

async function updateDsc(id, input, req) {
  assertManage(req.profile);
  const { record: before } = await getDsc(id, req.profile, req.user.id);
  const payload = dscPayload(input, req, before);
  if (Object.prototype.hasOwnProperty.call(input, "password") && String(input.password || "")) payload.password_encrypted = encryptPassword(input.password);
  const { data, error } = await supabaseAdmin.from("dsc_master").update(payload).eq("id", id).select("*").single();
  if (error?.code === "23505") throw fail("A DSC with this Token or Certificate Serial already exists.", 409);
  if (error) throw error;
  const action = before.box_id !== data.box_id || before.slot_position !== data.slot_position ? "Box changed" : "DSC updated";
  await audit(id, action, req, before, data);
  return getDsc(id, req.profile, req.user.id);
}

async function importDscRows(rows, req) {
  assertManage(req.profile);
  if (!Array.isArray(rows) || !rows.length) throw fail("The Excel file has no DSC rows.");
  if (rows.length > 2000) throw fail("Import a maximum of 2,000 DSC rows at a time.");
  const results = [];
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index] || {};
    try {
      const entityName = text(row.entityName, 240) || text(row.holderName, 240) || `Entity Not Provided - Row ${index + 2}`;
      const holderName = text(row.holderName, 240) || entityName;
      const tokenName = text(row.tokenName, 240) || `Not Provided - Row ${index + 2}`;
      const result = await createDsc({ ...row, entityName, clientName: entityName, holderName, tokenName }, req);
      results.push({ row: index + 2, created: true, id: result.record.id });
    } catch (error) {
      results.push({ row: index + 2, created: false, error: error.message });
    }
  }
  return { total: rows.length, created: results.filter((item) => item.created).length, failed: results.filter((item) => !item.created).length, results };
}

async function formOptions() {
  const { data, error } = await supabaseAdmin.from("dsc_form_options").select("id,option_type,value").eq("is_active", true).order("value");
  if (error) throw error;
  const result = { entityNames: [], designations: [], tokenNames: [], authorities: [], boxNames: [] };
  const keys = { entity_name: "entityNames", designation: "designations", token_name: "tokenNames", authority: "authorities", box_name: "boxNames" };
  for (const option of data || []) result[keys[option.option_type]].push({ id: option.id, value: option.value });
  return result;
}

async function addFormOption(kind, input, req) {
  assertManage(req.profile);
  if (!FORM_OPTION_TYPES.includes(kind)) throw fail("Select a valid DSC option type.");
  const value = text(input.value, 160);
  if (!value) throw fail("Enter a value to add.");
  const { data, error } = await supabaseAdmin.from("dsc_form_options").upsert({ option_type: kind, value, is_active: true, created_by: req.user.id }, { onConflict: "option_type,normalized_value" }).select("id,option_type,value").single();
  if (error) throw error;
  return data;
}

async function acceptedFormOption(kind, value, defaults) {
  const selected = text(value, 160);
  if (!selected) return null;
  if (defaults.includes(selected)) return selected;
  const { data, error } = await supabaseAdmin.from("dsc_form_options").select("value").eq("option_type", kind).eq("normalized_value", selected.toLowerCase()).eq("is_active", true).maybeSingle();
  if (error) throw error;
  if (!data) throw fail(`Select a valid ${kind.replace("_", " ")} option.`);
  return data.value;
}

async function boxes(includeInactive = false) {
  let query = supabaseAdmin.from("dsc_boxes").select("*").order("box_code");
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query; if (error) throw error;
  const ids = (data || []).map((row) => row.id);
  let counts = [];
  if (ids.length) { const result = await supabaseAdmin.from("dsc_master").select("box_id").in("box_id", ids); if (result.error) throw result.error; counts = result.data || []; }
  const byBox = counts.reduce((map, row) => map.set(row.box_id, (map.get(row.box_id) || 0) + 1), new Map());
  return (data || []).map((row) => ({ ...row, occupied: byBox.get(row.id) || 0, available: Math.max(0, row.capacity - (byBox.get(row.id) || 0)) }));
}

async function saveBox(input, req) {
  assertManage(req.profile);
  const payload = { box_code: text(input.boxCode ?? input.box_code, 80).toUpperCase(), box_name: text(input.boxName ?? input.box_name, 160) || null, cabinet: text(input.cabinet, 120) || null, shelf: text(input.shelf, 120) || null, location: text(input.location, 240), capacity: Math.max(1, Number(input.capacity) || 1), is_active: input.isActive !== false, updated_by: req.user.id, updated_at: new Date().toISOString() };
  if (!payload.box_code || !payload.location) throw fail("Box Code and Location are required.");
  if (input.id) { const { data, error } = await supabaseAdmin.from("dsc_boxes").update(payload).eq("id", input.id).select("*").single(); if (error) throw error; return data; }
  const { data, error } = await supabaseAdmin.from("dsc_boxes").insert({ ...payload, created_by: req.user.id }).select("*").single(); if (error) throw error; return data;
}

async function boxContents(id, profile) {
  if (!canViewAll(profile)) throw fail("You do not have permission to view box contents.", 403);
  const { data: box, error } = await supabaseAdmin.from("dsc_boxes").select("*").eq("id", id).single(); if (error) throw error;
  const { data: records, error: recordError } = await supabaseAdmin.from("dsc_master").select("id,dsc_id,client_name,holder_name,token_name,token_serial,expiry_date,status,slot_position").eq("box_id", id).order("slot_position"); if (recordError) throw recordError;
  return { box: { ...box, occupied: records.length, available: Math.max(0, box.capacity - records.length) }, records };
}

async function createHandover(input, req) {
  const { record } = await getDsc(input.dscId || input.dsc_id, req.profile, req.user.id);
  const handoverTo = text(input.handoverTo ?? input.handover_to, 240); const purpose = text(input.purpose, 1000);
  if (!handoverTo || !purpose || !input.proposedDate) throw fail("DSC, Handover To, Purpose and Date are required.");
  const { data, error } = await supabaseAdmin.from("dsc_handover_requests").insert({ dsc_id: record.id, handover_to: handoverTo, purpose, proposed_date: input.proposedDate, expected_return_date: input.expectedReturnDate || null, related_file_id: input.relatedFileId || null, related_work: text(input.relatedWork, 500) || null, remarks: text(input.remarks, 2000) || null, requested_by: req.user.id }).select("*").single();
  if (error) throw error;
  await audit(record.id, "Permission requested", req, null, data, purpose);
  const config = await settings();
  for (const recipientProfileId of config.approver_user_ids || []) {
    await notifyRegisterUser({ recipientProfileId, eventKey: `dsc:handover-request:${data.id}:${recipientProfileId}`, eventType: "DSC Handover Request", title: data.request_no, message: `Approval requested for ${record.holder_name} / ${record.client_name}, Token ${record.token_name || record.token_serial || "Not specified"}, for ${purpose}.`, route: `/?page=dsc&request=${data.id}`, category: "dsc", actor: actor(req) });
  }
  return { request: data };
}

async function listHandovers(filters, req) {
  const page = Math.max(1, Number(filters.page) || 1); const pageSize = Math.min(100, Math.max(10, Number(filters.pageSize) || 25));
  let query = supabaseAdmin.from("dsc_handover_requests").select("*,dsc:dsc_master(id,dsc_id,client_name,entity_name,holder_name,token_name,token_serial,status,expiry_date)", { count: "exact" });
  if (!canViewAll(req.profile) && !canApprove(req.profile)) query = query.eq("requested_by", req.user.id);
  if (filters.status) query = query.eq("status", filters.status);
  const from = (page - 1) * pageSize; const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, from + pageSize - 1); if (error) throw error;
  return { requests: data || [], total: count || 0, page, pageSize, pageCount: Math.max(1, Math.ceil((count || 0) / pageSize)) };
}

async function listMovements(filters, req) {
  const page = Math.max(1, Number(filters.page) || 1); const pageSize = Math.min(100, Math.max(10, Number(filters.pageSize) || 25));
  let query = supabaseAdmin.from("dsc_movements").select("*,dsc:dsc_master(id,dsc_id,client_name,entity_name,holder_name,token_name)", { count: "exact" });
  if (!canViewAll(req.profile)) query = query.eq("handled_by", req.user.id);
  if (filters.type) query = query.eq("movement_type", filters.type);
  const from = (page - 1) * pageSize; const { data, error, count } = await query.order("movement_at", { ascending: false }).range(from, from + pageSize - 1);
  if (error) throw error;
  return { movements: data || [], total: count || 0, page, pageSize, pageCount: Math.max(1, Math.ceil((count || 0) / pageSize)) };
}

async function decideHandover(id, input, req) {
  assertApprove(req.profile);
  const { data: request, error } = await supabaseAdmin.from("dsc_handover_requests").select("*,dsc:dsc_master(*)").eq("id", id).single(); if (error) throw error;
  if (!["Requested","Level 1 Approved"].includes(request.status)) throw fail("This request is no longer awaiting approval.", 409);
  const config = await settings(); const approved = input.decision === "Approved";
  const nextLevel = approved ? request.approval_level + 1 : request.approval_level;
  const status = !approved ? "Rejected" : (nextLevel >= config.approval_levels ? "Approved" : "Level 1 Approved");
  const { data, error: updateError } = await supabaseAdmin.from("dsc_handover_requests").update({ status, approval_level: nextLevel, approved_by: req.user.id, approval_at: new Date().toISOString(), approval_remarks: text(input.remarks, 2000) || null, updated_at: new Date().toISOString() }).eq("id", id).select("*").single(); if (updateError) throw updateError;
  await audit(request.dsc_id, status === "Rejected" ? "Handover rejected" : "Handover approved", req, { status: request.status }, { status }, input.remarks);
  return { request: data };
}

async function recordOut(id, input, req) {
  assertManage(req.profile);
  const { data: request, error } = await supabaseAdmin.from("dsc_handover_requests").select("*,dsc:dsc_master(*)").eq("id", id).single(); if (error) throw error;
  const config = await settings();
  if (config.approval_levels > 0 && request.status !== "Approved") throw fail("Approved handover permission is required before marking this DSC Issued Out.", 409);
  if (["Issued Out","Lost / Missing"].includes(request.dsc.status)) throw fail("This DSC cannot be issued out in its current status.", 409);
  const movement = { dsc_id: request.dsc_id, handover_request_id: id, movement_type: "OUT", movement_at: input.movementAt || new Date().toISOString(), issued_to: request.handover_to, purpose: request.purpose, related_file_id: request.related_file_id, expected_return_date: request.expected_return_date, approved_by: request.approved_by, handled_by: req.user.id, from_box_id: request.dsc.box_id, from_slot: request.dsc.slot_position, remarks: text(input.remarks, 2000) || null };
  const { data, error: movementError } = await supabaseAdmin.from("dsc_movements").insert(movement).select("*").single(); if (movementError) throw movementError;
  const now = new Date().toISOString();
  await Promise.all([
    supabaseAdmin.from("dsc_master").update({ status: "Issued Out", current_custody: request.handover_to, current_location: "Outside Office", box_id: null, slot_position: null, updated_by: req.user.id, updated_at: now }).eq("id", request.dsc_id),
    supabaseAdmin.from("dsc_handover_requests").update({ status: "Handed Over", updated_at: now }).eq("id", id),
  ]);
  await audit(request.dsc_id, "Issued out", req, request.dsc, movement, input.remarks);
  return { movement: data };
}

async function recordReturn(id, input, req) {
  assertManage(req.profile);
  const { data: record, error } = await supabaseAdmin.from("dsc_master").select("*").eq("id", id).single(); if (error) throw error;
  if (["Lost / Missing","Revoked","Closed"].includes(record.status)) throw fail("This DSC cannot be received in its current status.", 409);
  const boxName = input.boxName ? await acceptedFormOption("box_name", input.boxName, ["Blue","Black",record.box_type].filter(Boolean)) : null;
  const tokenName = input.tokenName ? await acceptedFormOption("token_name", input.tokenName, ["Hyperkey","Prox Key","Other",record.token_name].filter(Boolean)) : record.token_name;
  if ((!input.boxId && !boxName) || !text(input.slotPosition)) throw fail("Box Name and Slot No. are required.");
  const movement = { dsc_id: id, handover_request_id: input.requestId || null, movement_type: "RETURN", movement_at: input.returnAt || new Date().toISOString(), received_from: text(input.receivedFrom, 240) || null, received_mobile: text(input.mobile, 40) || null, handled_by: req.user.id, condition: text(input.condition, 120) || "Good", to_box_id: input.boxId || null, box_name: boxName, to_slot: text(input.slotPosition, 80), remarks: text(input.remarks, 2000) || null };
  const { data, error: movementError } = await supabaseAdmin.from("dsc_movements").insert(movement).select("*").single(); if (movementError) throw movementError;
  const now = new Date().toISOString();
  const update = { status: "In Office", current_custody: "Office", current_location: "Office Storage", box_id: input.boxId || null, box_type: boxName || record.box_type, slot_position: text(input.slotPosition, 80), mobile: text(input.mobile, 40) || record.mobile, certificate_class: ["Class II","Class III"].includes(input.certificateClass) ? input.certificateClass : record.certificate_class, token_name: tokenName, token_make: tokenName, expiry_date: /^\d{4}-\d{2}-\d{2}$/.test(String(input.expiryDate || "")) ? input.expiryDate : record.expiry_date, updated_by: req.user.id, updated_at: now };
  if (String(input.password || "")) update.password_encrypted = encryptPassword(input.password);
  await supabaseAdmin.from("dsc_master").update(update).eq("id", id);
  if (input.requestId) await supabaseAdmin.from("dsc_handover_requests").update({ status: "Returned", updated_at: now }).eq("id", input.requestId);
  await audit(id, "Returned", req, record, movement, input.remarks);
  return { movement: data };
}

async function addMovement(input, req) {
  assertManage(req.profile);
  const type = String(input.movementType || input.movement_type || "").toUpperCase();
  const dscId = input.dscId || input.dsc_id;
  if (!dscId || !["OUT","IN"].includes(type)) throw fail("Select a DSC and movement type.");
  if (type === "IN") return recordReturn(dscId, { ...input, returnAt: input.movementAt || input.returnAt }, req);
  if (input.handoverRequestId) {
    const { data: request, error } = await supabaseAdmin.from("dsc_handover_requests").select("id,dsc_id,status").eq("id", input.handoverRequestId).maybeSingle();
    if (error) throw error;
    if (!request || request.dsc_id !== dscId) throw fail("The approved handover request does not match the selected DSC.");
    return recordOut(request.id, { movementAt: input.movementAt, remarks: input.remarks }, req);
  }
  const config = await settings();
  if (config.approval_levels > 0) throw fail("Select an Approved Handover Request before recording an Out movement.", 409);
  const { record } = await getDsc(dscId, req.profile, req.user.id);
  if (["Issued Out","Lost / Missing"].includes(record.status)) throw fail("This DSC cannot be issued out in its current status.", 409);
  const issuedTo = text(input.issuedTo, 240); const purpose = text(input.purpose, 1000);
  if (!issuedTo || !purpose) throw fail("Issued To and Purpose are required for an Out movement.");
  const movement = { dsc_id: dscId, movement_type: "OUT", movement_at: input.movementAt || new Date().toISOString(), issued_to: issuedTo, purpose, expected_return_date: input.expectedReturnDate || null, handled_by: req.user.id, from_box_id: record.box_id, from_slot: record.slot_position, remarks: text(input.remarks, 2000) || null };
  const { data, error } = await supabaseAdmin.from("dsc_movements").insert(movement).select("*").single(); if (error) throw error;
  const { error: updateError } = await supabaseAdmin.from("dsc_master").update({ status: "Issued Out", current_custody: issuedTo, current_location: "Outside Office", box_id: null, slot_position: null, updated_by: req.user.id, updated_at: new Date().toISOString() }).eq("id", dscId); if (updateError) throw updateError;
  await audit(dscId, "Issued out", req, record, movement, input.remarks);
  return { movement: data };
}

async function markMissing(id, input, req) {
  assertManage(req.profile);
  const { record } = await getDsc(id, req.profile, req.user.id);
  if (!input.date || !text(input.remarks)) throw fail("Date and Remarks are required when marking a DSC missing.");
  const movement = { dsc_id: id, movement_type: "MISSING", movement_at: `${input.date}T00:00:00`, handled_by: req.user.id, from_box_id: record.box_id, from_slot: record.slot_position, remarks: text(input.remarks, 2000) };
  const { error } = await supabaseAdmin.from("dsc_movements").insert(movement); if (error) throw error;
  await supabaseAdmin.from("dsc_master").update({ status: "Lost / Missing", current_custody: text(input.lastKnownCustody, 200) || record.current_custody, updated_by: req.user.id, updated_at: new Date().toISOString() }).eq("id", id);
  await audit(id, "Missing", req, record, movement, input.remarks);
  const { data: admins } = await supabaseAdmin.from("app_users").select("id").eq("role", "Admin").eq("is_active", true);
  for (const admin of admins || []) await notifyRegisterUser({ recipientProfileId: admin.id, eventKey: `dsc:missing:${id}:${input.date}:${admin.id}`, eventType: "DSC Missing", title: record.dsc_id, message: `${record.holder_name} / ${record.client_name} has been marked missing.`, route: `/?page=dsc&record=${id}`, category: "dsc", actor: actor(req) });
  return getDsc(id, req.profile, req.user.id);
}

async function settings() { const { data, error } = await supabaseAdmin.from("dsc_settings").select("*").eq("id", "default").single(); if (error) throw error; return data; }
async function saveSettings(input, req) { if (req.profile?.role !== "Admin") throw fail("Admin permission is required.", 403); const payload = { approval_levels: Math.min(2, Math.max(0, Number(input.approvalLevels ?? input.approval_levels) || 0)), reminder_days: (Array.isArray(input.reminderDays || input.reminder_days) ? (input.reminderDays || input.reminder_days) : [90,60,30,15,7,0]).map(Number).filter((n) => n >= 0), approver_user_ids: Array.isArray(input.approverUserIds || input.approver_user_ids) ? (input.approverUserIds || input.approver_user_ids) : [], updated_by: req.user.id, updated_at: new Date().toISOString() }; const { data, error } = await supabaseAdmin.from("dsc_settings").update(payload).eq("id", "default").select("*").single(); if (error) throw error; return data; }

async function listGeneric(table, filters, req, dateColumn = "created_at") {
  const page = Math.max(1, Number(filters.page) || 1); const pageSize = Math.min(100, Math.max(10, Number(filters.pageSize) || 25));
  let query = supabaseAdmin.from(table).select("*", { count: "exact" });
  if (!canViewAll(req.profile)) query = query.or(`assigned_user_id.eq.${req.profile.id},created_by.eq.${req.user.id}`);
  if (filters.status) query = query.eq("status", filters.status);
  const from = (page - 1) * pageSize; const { data, error, count } = await query.order(dateColumn, { ascending: false }).range(from, from + pageSize - 1); if (error) throw error;
  const records = table === "dsc_fresh_issues" ? (data || []).map(withoutPassword) : (data || []);
  return { records, total: count || 0, page, pageSize, pageCount: Math.max(1, Math.ceil((count || 0) / pageSize)) };
}

async function activeStaffId(value) {
  const id = text(value, 80);
  if (!id) return null;
  const { data, error } = await supabaseAdmin.from("app_users").select("id").eq("id", id).eq("is_active", true).maybeSingle();
  if (error) throw error;
  if (!data) throw fail("Select an active staff member for Work By.");
  return data.id;
}

async function createFresh(input, req) {
  assertManage(req.profile);
  const applicationNo = text(input.applicationId ?? input.applicationNo, 120);
  const holderName = text(input.clientName ?? input.holderName, 240);
  const organizationName = text(input.organizationName, 240);
  if (!applicationNo || !holderName || !organizationName) throw fail("Client Name, Organization Name and Application ID are required.");
  const keepInCustody = input.keepInCustody === true || input.keepInCustody === "true" || input.keepInCustody === "Yes";
  const tokenName = await acceptedFormOption("token_name", input.tokenName, ["HyperKey","Proxkey","Others"]);
  const authority = await acceptedFormOption("authority", input.authority, ["XtraTrust","Vsign","Emudhra"]);
  const workByUserId = await activeStaffId(input.workByUserId ?? input.assignedUserId);
  if (!workByUserId) throw fail("Work By is required.");
  let custodyBoxName = null;
  if (keepInCustody) {
    if (!input.boxName || !text(input.slotPosition, 80)) throw fail("Box Name and Slot Position are required when the DSC is kept in custody.");
    custodyBoxName = await acceptedFormOption("box_name", input.boxName, ["Blue","Black"]);
  }
  const issuedDate = input.issuedDate || null;
  const validFrom = input.validFrom || issuedDate;
  const validTo = input.validTo || addYears(validFrom, 2);
  const payload = {
    application_no: applicationNo, client_id: input.clientId || null, client_name: organizationName, organization_name: organizationName,
    holder_name: holderName, designation: text(input.designation, 160) || null, pan: text(input.pan, 40) || null,
    mobile: text(input.mobile, 40) || null, email: text(input.email, 240).toLowerCase() || null, aadhaar_no: text(input.aadhaarNo, 24) || null,
    application_date: input.workDate || new Date().toISOString().slice(0,10), status: FRESH_STATUSES.includes(input.status) ? input.status : "New Request",
    token_name: tokenName, authority, provider_vendor: authority,
    class_type: ["Class II","Class III"].includes(input.classType) ? input.classType : null,
    password_encrypted: Object.prototype.hasOwnProperty.call(input, "password") ? encryptPassword(input.password) : null,
    actual_issue_date: issuedDate, valid_from: validFrom, valid_to: validTo, keep_in_custody: keepInCustody,
    box_id: null, box_name: custodyBoxName,
    slot_position: keepInCustody ? text(input.slotPosition, 80) : null, assigned_user_id: workByUserId, remarks: text(input.remarks),
    created_by: req.user.id, updated_by: req.user.id,
  };
  const { data, error } = await supabaseAdmin.from("dsc_fresh_issues").insert(payload).select("*").single();
  if (error?.code === "23505") throw fail("This Application ID already exists.", 409);
  if (error) throw error;
  return { record: withoutPassword(data) };
}
async function addFreshToMaster(id, input, req) {
  assertManage(req.profile);
  const { data: fresh, error } = await supabaseAdmin.from("dsc_fresh_issues").select("*").eq("id", id).single(); if (error) throw error;
  if (fresh.status !== "DSC Received") throw fail("Fresh Issue must be at DSC Received before adding it to DSC Master.", 409);
  const result = await createDsc({ ...input, clientId: fresh.client_id, clientName: fresh.organization_name || fresh.client_name, entityName: fresh.organization_name || fresh.client_name, holderName: fresh.holder_name, holderDesignation: fresh.designation, pan: fresh.pan, mobile: fresh.mobile, email: fresh.email, tokenName: fresh.token_name || "Not Provided", certificateClass: fresh.class_type, boxType: fresh.keep_in_custody ? fresh.box_name : null, issuedDate: fresh.actual_issue_date, validFrom: fresh.valid_from, expiryDate: fresh.valid_to, slotPosition: fresh.keep_in_custody ? fresh.slot_position : null, status: fresh.keep_in_custody ? "In Office" : "Active", assignedUserId: fresh.assigned_user_id }, req);
  if (fresh.password_encrypted) await supabaseAdmin.from("dsc_master").update({ password_encrypted: fresh.password_encrypted }).eq("id", result.record.id);
  await supabaseAdmin.from("dsc_fresh_issues").update({ linked_dsc_id: result.record.id, updated_by: req.user.id, updated_at: new Date().toISOString() }).eq("id", id);
  return result;
}
async function startRenewal(id, input, req) { assertManage(req.profile); const { record } = await getDsc(id, req.profile, req.user.id); const { data, error } = await supabaseAdmin.from("dsc_renewals").insert({ existing_dsc_id: id, expiry_date: record.expiry_date, initiated_date: input.initiatedDate || new Date().toISOString().slice(0,10), assigned_user_id: input.assignedUserId || record.assigned_user_id, documents_pending: text(input.documentsPending), status: "Renewal Initiated", remarks: text(input.remarks), created_by: req.user.id, updated_by: req.user.id }).select("*").single(); if (error) throw error; await supabaseAdmin.from("dsc_master").update({ status: "Renewal Initiated", updated_by: req.user.id, updated_at: new Date().toISOString() }).eq("id", id); await audit(id, "Renewal initiated", req, null, data); return { renewal: data }; }

async function dashboard(profile, userId) {
  const result = await listDsc({ page: 1, pageSize: 100 }, profile, userId); const rows = result.records; const today = new Date(); const todayText = today.toISOString().slice(0,10); const in30 = new Date(today.getTime() + 30*86400000).toISOString().slice(0,10);
  const requestContext = { profile, user: { id: userId } };
  const [pendingHandovers, activeHandovers, freshIssues] = await Promise.all([
    listHandovers({ page: 1, pageSize: 100, status: "Requested" }, requestContext),
    listHandovers({ page: 1, pageSize: 100, status: "Handed Over" }, requestContext),
    listGeneric("dsc_fresh_issues", { page: 1, pageSize: 100 }, requestContext, "application_date"),
  ]);
  return { totalActive: rows.filter((r) => !["Expired","Revoked","Closed"].includes(r.status)).length, inOffice: rows.filter((r) => r.current_custody === "Office").length, issuedOut: rows.filter((r) => r.status === "Issued Out").length, returnOverdue: activeHandovers.requests.filter((r) => r.expected_return_date && r.expected_return_date < todayText).length, expiring30: rows.filter((r) => r.expiry_date >= todayText && r.expiry_date <= in30).length, expired: rows.filter((r) => r.expiry_date && r.expiry_date < todayText).length, renewalPending: rows.filter((r) => ["Renewal Initiated","Renewal in Progress"].includes(r.status)).length, freshPending: freshIssues.records.filter((r) => !["Completed","Rejected","Cancelled"].includes(r.status)).length, approvalPending: pendingHandovers.total, missingDamaged: rows.filter((r) => ["Lost / Missing","Damaged"].includes(r.status)).length, upcoming: rows.filter((r) => r.expiry_date >= todayText).slice(0,8) };
}

module.exports = { APPROVE_PERMISSION, EXPORT_PERMISSION, MANAGE_PERMISSION, addFormOption, addFreshToMaster, addMovement, boxContents, boxes, canApprove, canExport, canManage, createDsc, createFresh, createHandover, dashboard, decideHandover, formOptions, getDsc, importDscRows, listDsc, listGeneric, listHandovers, listMovements, markMissing, recordOut, recordReturn, saveBox, saveSettings, settings, startRenewal, updateDsc };
