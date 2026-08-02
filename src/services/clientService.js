const crypto = require("crypto");
const { supabaseAdmin } = require("../config/supabase");
const { getAppState, patchAppState } = require("./appStateService");

const CLIENT_FIELDS = "id,client_code,code_prefix,client_name,normalized_name,pan_reg_no,normalized_pan,aadhaar_no,client_type,constitution,contact_person,contact_number,email,address,place,district,care_of,category,status,remarks,created_at,updated_at";

function cleanText(value = "") {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function normalizeName(value = "") {
  return cleanText(value).toLocaleLowerCase("en-IN").replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizePan(value = "") {
  return cleanText(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function validateClientContact(input = {}) {
  const email = cleanText(input.email).toLowerCase();
  const contact = cleanText(input.contactNumber || input.contact_number);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw validationError("Enter a valid email address.");
  const contactDigits = contact.replace(/\D/g, "");
  if (contact && (contactDigits.length < 7 || contactDigits.length > 15)) throw validationError("Contact Number must contain 7 to 15 digits.");
}

function clientPrefix(payload = {}) {
  const haystack = `${payload.category || ""} ${payload.clientType || payload.client_type || ""}`.toLowerCase();
  if (/audit/.test(haystack)) return "AU";
  if (/itr|income tax/.test(haystack)) return "ITR";
  return "OTR";
}

function clientPayload(input = {}) {
  const clientName = cleanText(input.clientName || input.client_name);
  if (!clientName) throw validationError("Client Name is required.");
  validateClientContact(input);
  const pan = normalizePan(input.panRegNo || input.pan_reg_no);
  return {
    client_name: clientName,
    normalized_name: normalizeName(clientName),
    pan_reg_no: pan || null,
    normalized_pan: pan || null,
    aadhaar_no: cleanText(input.aadhaarNo || input.aadhaar_no) || null,
    client_type: cleanText(input.clientType || input.client_type || "Other"),
    constitution: cleanText(input.constitution) || null,
    contact_person: cleanText(input.contactPerson || input.contact_person) || null,
    contact_number: cleanText(input.contactNumber || input.contact_number) || null,
    email: cleanText(input.email).toLowerCase() || null,
    address: cleanText(input.address) || null,
    place: cleanText(input.place) || null,
    district: cleanText(input.district) || null,
    care_of: cleanText(input.careOf || input.care_of) || null,
    category: cleanText(input.category) || null,
    status: input.status === "Inactive" ? "Inactive" : "Active",
    remarks: cleanText(input.remarks) || null,
  };
}

async function listClients({ search = "", status = "Active", page = 1, pageSize = 20 } = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeSize = Math.min(100, Math.max(1, Number(pageSize) || 20));
  let query = supabaseAdmin.from("clients").select(CLIENT_FIELDS, { count: "exact" });
  if (status && status !== "All") query = query.eq("status", status);
  const term = cleanText(search).replace(/[%_,]/g, "");
  if (term) {
    const normalized = normalizePan(term);
    query = query.or(`client_name.ilike.%${term}%,normalized_pan.ilike.%${normalized}%,contact_person.ilike.%${term}%,contact_number.ilike.%${term}%,email.ilike.%${term}%,client_code.ilike.%${term}%`);
  }
  const from = (safePage - 1) * safeSize;
  const { data, error, count } = await query.order("updated_at", { ascending: false }).order("id", { ascending: false }).range(from, from + safeSize - 1);
  if (error) throw databaseError(error);
  return { clients: data || [], total: count || 0, page: safePage, pageSize: safeSize };
}

async function allClients({ search = "", status = "All" } = {}) {
  const rows = [];
  let page = 1;
  while (true) {
    const result = await listClients({ search, status, page, pageSize: 100 });
    rows.push(...result.clients);
    if (rows.length >= result.total) break;
    page += 1;
  }
  return rows;
}

async function getClient(id) {
  const { data, error } = await supabaseAdmin.from("clients").select(CLIENT_FIELDS).eq("id", id).single();
  if (error) throw databaseError(error);
  return data;
}

async function duplicateWarnings(payload, excludeId = "") {
  const normalizedPan = normalizePan(payload.panRegNo || payload.pan_reg_no);
  if (normalizedPan) {
    let panQuery = supabaseAdmin.from("clients").select("id,client_code,client_name").eq("normalized_pan", normalizedPan);
    if (excludeId) panQuery = panQuery.neq("id", excludeId);
    const { data, error } = await panQuery.limit(1);
    if (error) throw databaseError(error);
    if (data?.length) throw validationError(`PAN/Registration Number already belongs to ${data[0].client_name} (${data[0].client_code}).`);
  }
  const normalizedName = normalizeName(payload.clientName || payload.client_name);
  const contact = cleanText(payload.contactNumber || payload.contact_number);
  const email = cleanText(payload.email).toLowerCase();
  const checks = [["normalized_name", normalizedName]];
  if (contact) checks.push(["contact_number", contact]);
  if (email) checks.push(["email", email]);
  const matches = new Map();
  for (const [column, value] of checks) {
    let query = supabaseAdmin.from("clients").select("id,client_code,client_name,contact_number,email").eq(column, value);
    if (excludeId) query = query.neq("id", excludeId);
    const { data, error } = await query.limit(5);
    if (error) throw databaseError(error);
    for (const row of data || []) matches.set(row.id, row);
  }
  return [...matches.values()].map((row) => ({ type: "similar_client", message: `Similar client, contact number or email exists: ${row.client_name} (${row.client_code}).`, client: row }));
}

async function nextClientCode(prefix) {
  const { data, error } = await supabaseAdmin.from("clients").select("client_code").eq("code_prefix", prefix).order("client_code", { ascending: false }).limit(1);
  if (error) throw databaseError(error);
  const last = Number(String(data?.[0]?.client_code || "").split("/")[1]) || 0;
  return `${prefix}/${String(last + 1).padStart(3, "0")}`;
}

async function createClient(input, actorId, options = {}) {
  const warnings = await duplicateWarnings(input);
  if (warnings.length && !options.acceptWarnings) {
    const error = validationError("A similar client already exists. Confirm before creating another client.");
    error.warnings = warnings;
    throw error;
  }
  const payload = clientPayload(input);
  const prefix = clientPrefix(input);
  let inserted;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const row = { ...payload, code_prefix: prefix, client_code: await nextClientCode(prefix), created_by: actorId, updated_by: actorId };
    const { data, error } = await supabaseAdmin.from("clients").insert(row).select(CLIENT_FIELDS).single();
    if (!error) { inserted = data; break; }
    if (error.code !== "23505") throw databaseError(error);
  }
  if (!inserted) throw validationError("Unable to allocate a unique Client ID. Please retry.");
  await auditClient(inserted.id, actorId, "Client created", { clientCode: inserted.client_code });
  return { client: inserted, warnings };
}

async function importClients(rows = [], actorId) {
  const summary = { total: rows.length, added: 0, skipped: 0, warnings: [] };
  const importedCareOf = new Set();
  for (let index = 0; index < rows.length; index += 1) {
    try {
      const result = await createClient(rows[index], actorId, { acceptWarnings: true });
      if (result.client.care_of) importedCareOf.add(result.client.care_of);
      summary.added += 1;
    } catch (error) {
      summary.skipped += 1;
      summary.warnings.push({ row: index + 2, message: error.message });
    }
  }
  if (importedCareOf.size) {
    await patchAppState((state) => {
      const values = new Map((state.careOfList || []).map((value) => [normalizeName(value), cleanText(value)]));
      for (const value of importedCareOf) if (!values.has(normalizeName(value))) values.set(normalizeName(value), value);
      state.careOfList = [...values.values()].sort((a, b) => a.localeCompare(b));
      return state;
    }, actorId);
  }
  summary.masterValues = { careOfAdded: importedCareOf.size };
  return summary;
}

async function restoreClients(rows = [], actorId) {
  if (!Array.isArray(rows) || !rows.length) return { restored: 0 };
  const cleanRows = rows.map((row) => ({
    ...clientPayload(row),
    id: row.id || crypto.randomUUID(),
    client_code: cleanText(row.client_code || row.clientCode),
    code_prefix: cleanText(row.code_prefix || row.codePrefix || clientPrefix(row)),
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
    updated_by: actorId,
  })).filter((row) => row.client_code);
  const { error } = await supabaseAdmin.from("clients").upsert(cleanRows, { onConflict: "id" });
  if (error) throw databaseError(error);
  return { restored: cleanRows.length };
}

async function updateClient(id, input, actorId, options = {}) {
  const before = await getClient(id);
  const updateInput = { ...input, status: input.status || before.status };
  const warnings = await duplicateWarnings(updateInput, id);
  if (warnings.length && !options.acceptWarnings) {
    const error = validationError("A similar client already exists. Confirm before saving.");
    error.warnings = warnings;
    throw error;
  }
  const { data, error } = await supabaseAdmin.from("clients").update({ ...clientPayload(updateInput), updated_by: actorId, updated_at: new Date().toISOString() }).eq("id", id).select(CLIENT_FIELDS).single();
  if (error) throw databaseError(error);
  await auditClient(id, actorId, "Client updated", { before, after: data });
  return { client: data, warnings };
}

async function setClientStatus(id, status, actorId) {
  if (!["Active", "Inactive"].includes(status)) throw validationError("Invalid client status.");
  const { data, error } = await supabaseAdmin.from("clients").update({ status, updated_by: actorId, updated_at: new Date().toISOString() }).eq("id", id).select(CLIENT_FIELDS).single();
  if (error) throw databaseError(error);
  await auditClient(id, actorId, `Client ${status.toLowerCase()}`, {});
  return data;
}

function fileClientId(file = {}) { return file.clientId || file.client_id || ""; }
function filePan(file = {}) { return normalizePan(file.pan || file.panRegNo || file.pan_reg_no); }

async function clientProfile(id) {
  const client = await getClient(id);
  const state = await getAppState();
  const files = (state.files || []).filter((file) => fileClientId(file) === id || (!fileClientId(file) && client.normalized_pan && filePan(file) === client.normalized_pan));
  const now = Date.now();
  const completed = files.filter((file) => file.filed || file.stages?.Completed);
  const active = files.filter((file) => !file.removed && !file.stages?.Removed && !(file.filed || file.stages?.Completed));
  return {
    client,
    summary: {
      totalFiles: files.length,
      activeFiles: active.length,
      completedFiles: completed.length,
      overdueFiles: active.filter((file) => file.dueDate && Date.parse(file.dueDate) < now).length,
      nonBilledFiles: completed.filter((file) => !file.billed).length,
      feePendingFiles: files.filter((file) => file.billed && !file.feeReceived).length,
    },
    recentFiles: [...files].sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0)).slice(0, 20),
  };
}

async function migrationPreview() {
  const state = await getAppState();
  const groups = new Map();
  for (const file of state.files || []) {
    const pan = filePan(file);
    const name = cleanText(file.name);
    const key = pan ? `pan:${pan}` : `name:${normalizeName(name)}`;
    if (!name || key === "name:") continue;
    const existing = groups.get(key) || { key, clientName: name, panRegNo: pan, files: 0, names: new Set() };
    existing.files += 1; existing.names.add(name); groups.set(key, existing);
  }
  const candidates = [...groups.values()].map((item) => ({ ...item, names: [...item.names] }));
  return { files: state.files?.length || 0, candidates, conflicts: candidates.filter((item) => item.names.length > 1) };
}

async function applyMigration(actorId, confirmation) {
  if (confirmation !== "GENERATE CLIENT MASTER") throw validationError("Type GENERATE CLIENT MASTER to continue.");
  const state = await getAppState();
  const { data: backup, error: backupError } = await supabaseAdmin.from("client_migration_backups").insert({ created_by: actorId, file_state: { files: state.files || [] } }).select("id").single();
  if (backupError) throw databaseError(backupError);
  const linked = new Map();
  const preview = await migrationPreview();
  for (const candidate of preview.candidates) {
    let client = null;
    if (candidate.panRegNo) {
      const { data } = await supabaseAdmin.from("clients").select(CLIENT_FIELDS).eq("normalized_pan", candidate.panRegNo).maybeSingle();
      client = data;
    }
    if (!client) {
      const { data } = await supabaseAdmin.from("clients").select(CLIENT_FIELDS).eq("normalized_name", normalizeName(candidate.clientName)).limit(1);
      client = data?.[0] || null;
    }
    if (!client) client = (await createClient({ clientName: candidate.clientName, panRegNo: candidate.panRegNo, clientType: "Other" }, actorId, { acceptWarnings: true })).client;
    linked.set(candidate.key, client);
  }
  const saved = await patchAppState((next) => {
    next.files = (next.files || []).map((file) => {
      if (fileClientId(file)) return file;
      const key = filePan(file) ? `pan:${filePan(file)}` : `name:${normalizeName(file.name)}`;
      const client = linked.get(key);
      return client ? { ...file, clientId: client.id, client_id: client.id, contactNo: file.contactNo || file.contact_no || client.contact_number || "", contact_no: file.contact_no || file.contactNo || client.contact_number || "", clientSnapshot: snapshot(client), client_snapshot: snapshot(client) } : file;
    });
    return next;
  }, actorId);
  return { backupId: backup.id, clientsLinked: linked.size, filesLinked: (saved.files || []).filter((file) => fileClientId(file)).length };
}

async function linkUnlinkedFiles(actorId) {
  const state = await getAppState();
  const existingClients = await allClients({ status: "All" });
  const byPan = new Map(existingClients.filter((row) => row.normalized_pan).map((row) => [row.normalized_pan, row]));
  const byName = new Map(existingClients.map((row) => [row.normalized_name, row]));
  const cache = new Map();
  let created = 0;
  for (const file of state.files || []) {
    if (fileClientId(file)) continue;
    const pan = filePan(file);
    const name = cleanText(file.name);
    if (!name) continue;
    const key = pan ? `pan:${pan}` : `name:${normalizeName(name)}`;
    let client = cache.get(key) || byPan.get(pan) || byName.get(normalizeName(name));
    if (!client) {
      client = (await createClient({ clientName: name, panRegNo: pan, clientType: file.clientType || "Other", careOf: file.careOf }, actorId, { acceptWarnings: true })).client;
      created += 1;
    }
    cache.set(key, client);
  }
  let linked = 0;
  await patchAppState((next) => {
    next.files = (next.files || []).map((file) => {
      if (fileClientId(file)) return file;
      const pan = filePan(file);
      const key = pan ? `pan:${pan}` : `name:${normalizeName(file.name)}`;
      const client = cache.get(key) || byPan.get(pan) || byName.get(normalizeName(file.name));
      if (!client) return file;
      linked += 1;
      return { ...file, clientId: client.id, client_id: client.id, contactNo: file.contactNo || file.contact_no || client.contact_number || "", contact_no: file.contact_no || file.contactNo || client.contact_number || "", clientSnapshot: snapshot(client), client_snapshot: snapshot(client) };
    });
    return next;
  }, actorId);
  return { linked, created };
}

async function syncClientToActiveFiles(clientId, actorId) {
  const client = await getClient(clientId);
  let updated = 0;
  await patchAppState((state) => {
    state.files = (state.files || []).map((file) => {
      if (fileClientId(file) !== clientId || file.removed || file.stages?.Removed || file.filed || file.stages?.Completed || file.billed) return file;
      updated += 1;
      return { ...file, name: client.client_name, pan: client.pan_reg_no || "", careOf: client.care_of || file.careOf, contactNo: file.contactNo || file.contact_no || client.contact_number || "", contact_no: file.contact_no || file.contactNo || client.contact_number || "", clientSnapshot: snapshot(client), client_snapshot: snapshot(client), updatedAt: Date.now() };
    });
    return state;
  }, actorId);
  await auditClient(clientId, actorId, "Latest client details synced to active files", { updated });
  return { updated };
}

function snapshot(client) {
  return { clientCode: client.client_code, clientName: client.client_name, panRegNo: client.pan_reg_no || "", clientType: client.client_type, contactPerson: client.contact_person || "", contactNumber: client.contact_number || "", email: client.email || "", place: client.place || "", careOf: client.care_of || "", capturedAt: new Date().toISOString() };
}

async function auditClient(clientId, actorId, action, details) {
  const { error } = await supabaseAdmin.from("client_audit_events").insert({ client_id: clientId, actor_user_id: actorId, action, details });
  if (error) throw databaseError(error);
}

async function clientAudit(id) {
  const { data, error } = await supabaseAdmin.from("client_audit_events").select("id,action,details,created_at,actor_user_id").eq("client_id", id).order("created_at", { ascending: false }).limit(100);
  if (error) throw databaseError(error);
  const actorIds = [...new Set((data || []).map((event) => event.actor_user_id).filter(Boolean))];
  const actors = new Map();
  if (actorIds.length) {
    const { data: profiles, error: profileError } = await supabaseAdmin.from("app_users").select("auth_user_id,name,email").in("auth_user_id", actorIds);
    if (profileError) throw databaseError(profileError);
    for (const profile of profiles || []) actors.set(profile.auth_user_id, profile);
  }
  return (data || []).map((event) => ({ ...event, actor_name: actors.get(event.actor_user_id)?.name || "System", actor_email: actors.get(event.actor_user_id)?.email || "" }));
}

async function recordClientSelection(id, actorId, context = "Add File") {
  await getClient(id);
  await auditClient(id, actorId, "Client selected", { context: cleanText(context) || "Add File" });
  return { ok: true };
}

function validationError(message) { const error = new Error(message); error.status = 400; return error; }
function databaseError(error) { if (error?.code === "42P01") { const next = new Error("Client Master database migration is required."); next.status = 503; return next; } return error; }

module.exports = { listClients, allClients, getClient, createClient, importClients, restoreClients, updateClient, setClientStatus, clientProfile, clientAudit, recordClientSelection, migrationPreview, applyMigration, linkUnlinkedFiles, syncClientToActiveFiles, cleanText, normalizeName, normalizePan, clientPayload, snapshot };
