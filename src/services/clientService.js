const crypto = require("crypto");
const { supabaseAdmin } = require("../config/supabase");
const { env } = require("../config/env");
const { getAppState, patchAppState } = require("./appStateService");

const CLIENT_FIELDS = "id,client_code,code_prefix,client_name,normalized_name,pan_reg_no,normalized_pan,tan,normalized_tan,gst_no,normalized_gst_no,cin,normalized_cin,other_regn_no,normalized_other_regn_no,client_type,constitution,contact_person,contact_number,email,address,place,care_of,status,remarks,created_by,created_at,updated_by,updated_at";
const CREDENTIAL_COLUMNS = {
  itPassword: "it_password_encrypted",
  gstPassword: "gst_password_encrypted",
  tracesLogin: "traces_login_encrypted",
  tracesPassword: "traces_password_encrypted",
};

function cleanText(value = "") {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function normalizeName(value = "") {
  return cleanText(value).toLocaleLowerCase("en-IN").replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizePan(value = "") {
  return cleanText(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function normalizeRegistration(value = "") {
  return cleanText(value).toUpperCase().replace(/\s+/g, "");
}

function validateRegistration(label, value, pattern) {
  if (value && !isRegistrationPlaceholder(value) && !pattern.test(value)) throw validationError(`Enter a valid ${label}.`);
}

function isRegistrationPlaceholder(value = "") {
  return ["NA", "N/A", "NOTAVAILABLE", "NOTAPPLICABLE", "NONE", "-"].includes(normalizeRegistration(value));
}

function credentialKey() {
  const secret = String(env.clientCredentialsEncryptionKey || "");
  if (secret.length < 32) throw serviceError("Client credential encryption is not configured.", 503);
  return crypto.createHash("sha256").update(secret, "utf8").digest();
}

function encryptCredential(value) {
  const text = String(value || "");
  if (!text) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", credentialKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

function decryptCredential(value) {
  if (!value) return "";
  const [version, ivText, tagText, cipherText] = String(value).split(".");
  if (version !== "v1" || !ivText || !tagText || !cipherText) throw serviceError("Stored credential cannot be decrypted.", 500);
  const decipher = crypto.createDecipheriv("aes-256-gcm", credentialKey(), Buffer.from(ivText, "base64"));
  decipher.setAuthTag(Buffer.from(tagText, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(cipherText, "base64")), decipher.final()]).toString("utf8");
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
  const panInput = normalizePan(input.panRegNo || input.pan_reg_no);
  const tanInput = normalizeRegistration(input.tan);
  const gstInput = normalizeRegistration(input.gstNo || input.gst_no);
  const cinInput = normalizeRegistration(input.cin);
  const pan = isRegistrationPlaceholder(panInput) ? "" : panInput;
  const tan = isRegistrationPlaceholder(tanInput) ? "" : tanInput;
  const gst = isRegistrationPlaceholder(gstInput) ? "" : gstInput;
  const cin = isRegistrationPlaceholder(cinInput) ? "" : cinInput;
  const otherRegn = cleanText(input.otherRegnNo || input.other_regn_no);
  validateRegistration("PAN", pan, /^[A-Z]{5}[0-9]{4}[A-Z]$/);
  validateRegistration("TAN", tan, /^[A-Z]{4}[0-9]{5}[A-Z]$/);
  validateRegistration("GST No.", gst, /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/);
  validateRegistration("CIN", cin, /^[A-Z][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/);
  const suppliedTypes = input.clientTypes ?? input.client_types ?? input.clientType ?? input.client_type;
  const clientTypes = parseClientTypes(suppliedTypes === undefined ? "Other Client" : suppliedTypes);
  if (!clientTypes.length) throw validationError("Select at least one Client Type.");
  return {
    client_name: clientName,
    normalized_name: normalizeName(clientName),
    pan_reg_no: pan || null,
    normalized_pan: pan || null,
    tan: tan || null,
    normalized_tan: tan || null,
    gst_no: gst || null,
    normalized_gst_no: gst || null,
    cin: cin || null,
    normalized_cin: cin || null,
    other_regn_no: otherRegn || null,
    normalized_other_regn_no: normalizeRegistration(otherRegn) || null,
    client_type: clientTypes.join(" | "),
    constitution: cleanText(input.constitution) || null,
    contact_person: cleanText(input.contactPerson || input.contact_person) || null,
    contact_number: cleanText(input.contactNumber || input.contact_number) || null,
    email: cleanText(input.email).toLowerCase() || null,
    address: cleanText(input.address) || null,
    place: cleanText(input.place) || null,
    care_of: cleanText(input.careOf || input.care_of) || null,
    status: input.status === "Inactive" ? "Inactive" : "Active",
    remarks: cleanText(input.remarks) || null,
  };
}

function parseClientTypes(value) {
  const values = Array.isArray(value) ? value : String(value || "").split(/\s*\|\s*|\s*,\s*/);
  return [...new Map(values.map(cleanText).filter(Boolean).map((item) => [normalizeName(item), item])).values()];
}

function credentialInput(input = {}) {
  return Object.fromEntries(Object.entries(CREDENTIAL_COLUMNS).filter(([key]) => Object.prototype.hasOwnProperty.call(input, key)).map(([key, column]) => [column, encryptCredential(input[key])]));
}

async function replaceClientTypes(clientId, values = []) {
  const names = parseClientTypes(values);
  const rows = [];
  for (const name of names) {
    const normalized = normalizeName(name);
    const { data, error } = await supabaseAdmin.from("client_types").upsert({ name, normalized_name: normalized, updated_at: new Date().toISOString() }, { onConflict: "normalized_name" }).select("id,name").single();
    if (error) throw databaseError(error);
    rows.push({ client_id: clientId, client_type_id: data.id });
  }
  const { error: deleteError } = await supabaseAdmin.from("client_type_assignments").delete().eq("client_id", clientId);
  if (deleteError) throw databaseError(deleteError);
  if (!rows.length) return;
  const { error: insertError } = await supabaseAdmin.from("client_type_assignments").insert(rows);
  if (insertError) throw databaseError(insertError);
}

async function hydrateClientTypes(clients = []) {
  if (!clients.length) return clients;
  const ids = clients.map((item) => item.id);
  const { data, error } = await supabaseAdmin.from("client_type_assignments").select("client_id,client_types(id,name,is_active,display_order)").in("client_id", ids);
  if (error) throw databaseError(error);
  const map = new Map();
  for (const row of data || []) {
    const item = row.client_types;
    if (!item) continue;
    const values = map.get(row.client_id) || [];
    values.push(item); map.set(row.client_id, values);
  }
  return clients.map((client) => ({ ...client, client_types: (map.get(client.id) || []).sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name)).map((item) => item.name) }));
}

async function listClients({ search = "", status = "Active", clientType = "", constitution = "", careOf = "", place = "", page = 1, pageSize = 20 } = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeSize = Math.min(100, Math.max(1, Number(pageSize) || 20));
  let query = supabaseAdmin.from("clients").select(CLIENT_FIELDS, { count: "exact" });
  if (status && status !== "All") query = query.eq("status", status);
  if (cleanText(clientType)) query = query.ilike("client_type", `%${cleanText(clientType).replace(/[%_,]/g, "")}%`);
  if (cleanText(constitution)) query = query.eq("constitution", cleanText(constitution));
  if (cleanText(careOf)) query = query.eq("care_of", cleanText(careOf));
  if (cleanText(place)) query = query.ilike("place", `%${cleanText(place).replace(/[%_,]/g, "")}%`);
  const term = cleanText(search).replace(/[%_,]/g, "");
  if (term) {
    const normalized = normalizePan(term);
    query = query.or(`client_name.ilike.%${term}%,client_type.ilike.%${term}%,care_of.ilike.%${term}%,constitution.ilike.%${term}%,place.ilike.%${term}%,normalized_pan.ilike.%${normalized}%,normalized_tan.ilike.%${normalized}%,normalized_gst_no.ilike.%${normalized}%,normalized_cin.ilike.%${normalized}%,normalized_other_regn_no.ilike.%${normalized}%,contact_person.ilike.%${term}%,contact_number.ilike.%${term}%,email.ilike.%${term}%,client_code.ilike.%${term}%`);
  }
  const from = (safePage - 1) * safeSize;
  const { data, error, count } = await query.order("updated_at", { ascending: false }).order("id", { ascending: false }).range(from, from + safeSize - 1);
  if (error) throw databaseError(error);
  return { clients: await hydrateClientTypes(data || []), total: count || 0, page: safePage, pageSize: safeSize };
}

async function allClients({ search = "", status = "All", clientType = "", constitution = "", careOf = "", place = "" } = {}) {
  const rows = [];
  let page = 1;
  while (true) {
    const result = await listClients({ search, status, clientType, constitution, careOf, place, page, pageSize: 100 });
    rows.push(...result.clients);
    if (rows.length >= result.total) break;
    page += 1;
  }
  return rows;
}

async function getClient(id) {
  const { data, error } = await supabaseAdmin.from("clients").select(CLIENT_FIELDS).eq("id", id).single();
  if (error) throw databaseError(error);
  return (await hydrateClientTypes([data]))[0];
}

async function duplicateWarnings(payload, excludeId = "") {
  const normalizedPan = normalizePan(payload.panRegNo || payload.pan_reg_no);
  if (normalizedPan && !isRegistrationPlaceholder(normalizedPan)) {
    let panQuery = supabaseAdmin.from("clients").select("id,client_code,client_name").eq("normalized_pan", normalizedPan);
    if (excludeId) panQuery = panQuery.neq("id", excludeId);
    const { data, error } = await panQuery.limit(1);
    if (error) throw databaseError(error);
    if (data?.length) throw validationError(`PAN/Registration Number already belongs to ${data[0].client_name} (${data[0].client_code}).`);
  }
  for (const [label, column, value] of [
    ["TAN", "normalized_tan", normalizeRegistration(payload.tan)],
    ["GST No.", "normalized_gst_no", normalizeRegistration(payload.gstNo || payload.gst_no)],
    ["CIN", "normalized_cin", normalizeRegistration(payload.cin)],
  ]) {
    if (!value || isRegistrationPlaceholder(value)) continue;
    let query = supabaseAdmin.from("clients").select("id,client_code,client_name").eq(column, value);
    if (excludeId) query = query.neq("id", excludeId);
    const { data, error } = await query.limit(1);
    if (error) throw databaseError(error);
    if (data?.length) throw validationError(`${label} already belongs to ${data[0].client_name} (${data[0].client_code}).`);
  }
  const normalizedName = normalizeName(payload.clientName || payload.client_name);
  const contact = cleanText(payload.contactNumber || payload.contact_number);
  const email = cleanText(payload.email).toLowerCase();
  const otherRegn = normalizeRegistration(payload.otherRegnNo || payload.other_regn_no);
  const checks = [["normalized_name", normalizedName]];
  if (contact) checks.push(["contact_number", contact]);
  if (email) checks.push(["email", email]);
  if (otherRegn && !isRegistrationPlaceholder(otherRegn)) checks.push(["normalized_other_regn_no", otherRegn]);
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
    const row = { ...payload, ...credentialInput(input), code_prefix: prefix, client_code: await nextClientCode(prefix), created_by: actorId, updated_by: actorId };
    const { data, error } = await supabaseAdmin.from("clients").insert(row).select(CLIENT_FIELDS).single();
    if (!error) { inserted = data; break; }
    if (error.code !== "23505") throw databaseError(error);
  }
  if (!inserted) throw validationError("Unable to allocate a unique Client ID. Please retry.");
  await replaceClientTypes(inserted.id, input.clientTypes || input.clientType || inserted.client_type);
  await ensureCareOfMaster(inserted.care_of, actorId);
  if (inserted.constitution) await saveClientMasterValue("constitution", { name: inserted.constitution });
  inserted = await getClient(inserted.id);
  await auditClient(inserted.id, actorId, "Client created", { clientCode: inserted.client_code });
  return { client: inserted, warnings };
}

async function importClients(rows = [], actorId) {
  const mastersBefore = await listClientMasters();
  const beforeTypes = new Set(mastersBefore.clientTypes.map((item) => normalizeName(item.name)));
  const beforeConstitutions = new Set(mastersBefore.constitutions.map((item) => normalizeName(item.name)));
  const beforeCareOf = new Set(mastersBefore.careOf.map(normalizeName));
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
  const mastersAfter = await listClientMasters();
  summary.masterValues = {
    clientTypesAdded: mastersAfter.clientTypes.filter((item) => !beforeTypes.has(normalizeName(item.name))).length,
    constitutionsAdded: mastersAfter.constitutions.filter((item) => !beforeConstitutions.has(normalizeName(item.name))).length,
    careOfAdded: mastersAfter.careOf.filter((item) => !beforeCareOf.has(normalizeName(item))).length,
  };
  return summary;
}

async function restoreClients(rows = [], actorId) {
  if (!Array.isArray(rows) || !rows.length) return { restored: 0 };
  const restorePairs = rows.map((source) => ({ source, clean: {
    ...clientPayload(source),
    ...Object.fromEntries(Object.values(CREDENTIAL_COLUMNS).filter((column) => source[column]).map((column) => [column, source[column]])),
    id: source.id || crypto.randomUUID(),
    client_code: cleanText(source.client_code || source.clientCode),
    code_prefix: cleanText(source.code_prefix || source.codePrefix || clientPrefix(source)),
    created_at: source.created_at || new Date().toISOString(),
    updated_at: source.updated_at || new Date().toISOString(),
    updated_by: actorId,
  } })).filter(({ clean }) => clean.client_code);
  const cleanRows = restorePairs.map(({ clean }) => clean);
  const { error } = await supabaseAdmin.from("clients").upsert(cleanRows, { onConflict: "id" });
  if (error) throw databaseError(error);
  for (const { source, clean } of restorePairs) {
    await replaceClientTypes(clean.id, source.client_types || source.clientTypes || source.client_type || "Other Client");
  }
  return { restored: cleanRows.length };
}

async function backupClientsSecure() {
  const fields = `${CLIENT_FIELDS},${Object.values(CREDENTIAL_COLUMNS).join(",")}`;
  const { data, error } = await supabaseAdmin.from("clients").select(fields).order("created_at", { ascending: true });
  if (error) throw databaseError(error);
  return hydrateClientTypes(data || []);
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
  const credentialChanges = credentialInput(input);
  const { data, error } = await supabaseAdmin.from("clients").update({ ...clientPayload(updateInput), ...credentialChanges, updated_by: actorId, updated_at: new Date().toISOString() }).eq("id", id).select(CLIENT_FIELDS).single();
  if (error) throw databaseError(error);
  await replaceClientTypes(id, input.clientTypes || input.clientType || data.client_type);
  await ensureCareOfMaster(data.care_of, actorId);
  if (data.constitution) await saveClientMasterValue("constitution", { name: data.constitution });
  const changedFields = Object.keys(data).filter((key) => !["updated_at", "updated_by"].includes(key) && String(before[key] ?? "") !== String(data[key] ?? ""));
  await auditClient(id, actorId, "Client updated", { changedFields });
  if (Object.keys(credentialChanges).length) await auditClient(id, actorId, "Client credentials changed", { credentialTypes: Object.keys(credentialChanges).map((column) => column.replace("_encrypted", "")) });
  return { client: await getClient(id), warnings };
}

async function getClientCredentials(id, actorId, serviceType = "") {
  const { data, error } = await supabaseAdmin.from("clients").select(`id,client_name,pan_reg_no,tan,gst_no,other_regn_no,${Object.values(CREDENTIAL_COLUMNS).join(",")}`).eq("id", id).single();
  if (error) throw databaseError(error);
  const credentials = {};
  const service = normalizeName(serviceType);
  const includeIt = !service || /income tax|itr|audit/.test(service);
  const includeGst = !service || /gst/.test(service);
  const includeTraces = !service || /tds|tcs|tan|trace/.test(service);
  if (includeIt) { credentials.pan = data.pan_reg_no || ""; credentials.itPassword = decryptCredential(data.it_password_encrypted); }
  if (includeGst) { credentials.gstNo = data.gst_no || ""; credentials.gstPassword = decryptCredential(data.gst_password_encrypted); }
  if (includeTraces) { credentials.tan = data.tan || ""; credentials.tracesLogin = decryptCredential(data.traces_login_encrypted); credentials.tracesPassword = decryptCredential(data.traces_password_encrypted); }
  if (!service || /epf|esi|other/.test(service)) credentials.otherRegnNo = data.other_regn_no || "";
  await auditClient(id, actorId, "Client credentials accessed", { credentialTypes: Object.keys(credentials), serviceType: cleanText(serviceType) || "All" });
  return { clientId: id, clientName: data.client_name, credentials };
}

async function updateClientCredentials(id, input, actorId) {
  await getClient(id);
  const changes = credentialInput(input);
  if (!Object.keys(changes).length) throw validationError("No credential changes were supplied.");
  const { error } = await supabaseAdmin.from("clients").update({ ...changes, updated_by: actorId, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw databaseError(error);
  await auditClient(id, actorId, "Client credentials changed", { credentialTypes: Object.keys(changes).map((column) => column.replace("_encrypted", "")) });
  return { ok: true };
}

async function listClientMasters() {
  const [{ data: clientTypes, error: typeError }, { data: constitutions, error: constitutionError }] = await Promise.all([
    supabaseAdmin.from("client_types").select("id,name,is_active,display_order").order("display_order").order("name"),
    supabaseAdmin.from("client_constitutions").select("id,name,is_active,display_order").order("display_order").order("name"),
  ]);
  if (typeError) throw databaseError(typeError); if (constitutionError) throw databaseError(constitutionError);
  const state = await getAppState();
  return { clientTypes: clientTypes || [], constitutions: constitutions || [], careOf: state.careOfList || [] };
}

async function saveClientMasterValue(kind, input = {}) {
  if (!["client-type", "constitution"].includes(kind)) throw validationError("Invalid client master type.");
  const table = kind === "constitution" ? "client_constitutions" : "client_types";
  const name = cleanText(input.name); if (!name) throw validationError("Name is required.");
  const row = { name, normalized_name: normalizeName(name), is_active: input.isActive !== false, display_order: Number(input.displayOrder) || 100, updated_at: new Date().toISOString() };
  const query = input.id ? supabaseAdmin.from(table).update(row).eq("id", input.id) : supabaseAdmin.from(table).upsert(row, { onConflict: "normalized_name" });
  const { data, error } = await query.select("id,name,is_active,display_order").single(); if (error) throw databaseError(error); return data;
}

async function ensureCareOfMaster(value, actorId) {
  const name = cleanText(value);
  if (!name) return;
  await patchAppState((state) => {
    const values = new Map((state.careOfList || []).map((item) => [normalizeName(item), cleanText(item)]));
    if (!values.has(normalizeName(name))) values.set(normalizeName(name), name);
    state.careOfList = [...values.values()].sort((a, b) => a.localeCompare(b));
    return state;
  }, actorId);
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
    if (!client) client = (await createClient({ clientName: candidate.clientName, panRegNo: candidate.panRegNo, clientType: "Other Client" }, actorId, { acceptWarnings: true })).client;
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
      client = (await createClient({ clientName: name, panRegNo: pan, clientType: file.clientType || "Other Client", careOf: file.careOf }, actorId, { acceptWarnings: true })).client;
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
      return {
        ...file,
        name: client.client_name,
        pan: client.pan_reg_no || "",
        careOf: client.care_of || file.careOf,
        contactNo: client.contact_number || "",
        contact_no: client.contact_number || "",
        contactPerson: client.contact_person || "",
        clientEmail: client.email || "",
        clientPlace: client.place || "",
        clientAddress: client.address || "",
        clientSnapshot: snapshot(client),
        client_snapshot: snapshot(client),
        updatedAt: Date.now(),
      };
    });
    return state;
  }, actorId);
  await auditClient(clientId, actorId, "Latest client details synced to active files", { updated });
  return { updated };
}

function snapshot(client) {
  return {
    clientCode: client.client_code,
    clientName: client.client_name,
    panRegNo: client.pan_reg_no || "",
    tan: client.tan || "",
    gstNo: client.gst_no || "",
    cin: client.cin || "",
    otherRegnNo: client.other_regn_no || "",
    clientTypes: client.client_types || parseClientTypes(client.client_type),
    constitution: client.constitution || "",
    contactPerson: client.contact_person || "",
    contactNumber: client.contact_number || "",
    email: client.email || "",
    place: client.place || "",
    address: client.address || "",
    careOf: client.care_of || "",
    status: client.status || "Active",
    remarks: client.remarks || "",
    capturedAt: new Date().toISOString(),
  };
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
function serviceError(message, status) { const error = new Error(message); error.status = status; return error; }
function databaseError(error) { if (["42P01", "42703"].includes(error?.code)) { const next = new Error("Client Master secure database migration is required."); next.status = 503; return next; } return error; }

module.exports = { listClients, allClients, backupClientsSecure, getClient, createClient, importClients, restoreClients, updateClient, setClientStatus, clientProfile, clientAudit, recordClientSelection, migrationPreview, applyMigration, linkUnlinkedFiles, syncClientToActiveFiles, getClientCredentials, updateClientCredentials, listClientMasters, saveClientMasterValue, cleanText, normalizeName, normalizePan, normalizeRegistration, parseClientTypes, clientPayload, snapshot };
