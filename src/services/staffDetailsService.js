const crypto = require("crypto");

const IMPORTABLE_STAFF_FIELDS = [
  "linkedUserId",
  "staffName",
  "staffCode",
  "position",
  "department",
  "employmentType",
  "dateOfJoining",
  "employmentStatus",
  "dateOfBirth",
  "gender",
  "bloodGroup",
  "mobile",
  "email",
  "address",
  "emergencyContactName",
  "emergencyContactNumber",
  "emergencyContactRelationship",
  "qualifications",
  "remarks",
  "profilePhotoUrl",
  "deactivatedAt",
];

function mergeStaffDetailsImport(state = {}, importedRecords = [], actor = {}) {
  if (!Array.isArray(importedRecords) || !importedRecords.length) {
    const error = new Error("No staff records were supplied for import.");
    error.status = 400;
    throw error;
  }
  if (importedRecords.length > 2000) {
    const error = new Error("A maximum of 2,000 staff records can be imported at once.");
    error.status = 400;
    throw error;
  }

  const existingRows = Array.isArray(state.staffDetails) ? state.staffDetails : [];
  const byId = new Map(existingRows.map((row) => [String(row.id || ""), row]));
  const byCode = new Map(existingRows.map((row) => [staffCodeKey(row.staffCode), row]).filter(([key]) => key));
  const mergedById = new Map(existingRows.map((row) => [String(row.id || ""), row]));
  const seenImportCodes = new Set();
  const now = Date.now();
  let created = 0;
  let updated = 0;
  const rejected = [];

  importedRecords.forEach((incoming) => {
    const code = cleanText(incoming?.staffCode);
    const name = cleanText(incoming?.staffName);
    if (!code || !name) {
      rejected.push({ id: String(incoming?.id || ""), staffCode: code, reason: "Employee ID and Staff Name are required" });
      return;
    }
    const codeKey = staffCodeKey(code);
    if (seenImportCodes.has(codeKey)) {
      rejected.push({ id: String(incoming?.id || ""), staffCode: code, reason: `Employee ID ${code} appears more than once in the import` });
      return;
    }
    seenImportCodes.add(codeKey);

    const current = byId.get(String(incoming.id || "")) || byCode.get(codeKey) || null;
    const importedFields = pickImportableFields(incoming);
    const id = String(current?.id || incoming.id || `staff-${crypto.randomUUID()}`);
    const record = {
      ...(current || {}),
      ...importedFields,
      id,
      staffCode: code,
      staffName: name,
      createdAt: current?.createdAt || incoming.createdAt || now,
      createdByUserId: current?.createdByUserId || incoming.createdByUserId || actor.id || "",
      createdByUserName: current?.createdByUserName || incoming.createdByUserName || actor.name || "",
      updatedAt: now,
      updatedByUserName: actor.name || incoming.updatedByUserName || "",
    };
    mergedById.set(id, record);
    byId.set(id, record);
    byCode.set(codeKey, record);
    if (current) updated += 1;
    else created += 1;
  });

  if (!created && !updated) {
    const error = new Error("No valid staff records were available to import. Employee ID and Staff Name are required.");
    error.status = 400;
    throw error;
  }

  const staffDetails = [...mergedById.values()];
  const auditLog = [...(Array.isArray(state.auditLog) ? state.auditLog : []), {
    id: crypto.randomUUID(),
    action: "Staff Excel import completed",
    details: { created, updated, skipped: rejected.length, records: importedRecords.length, source: actor.source || "" },
    user: actor.name || "System",
    role: actor.role || "Admin",
    at: new Date(now).toISOString(),
  }].slice(-1000);

  return { state: { ...state, staffDetails, auditLog }, created, updated, rejected };
}

function pickImportableFields(row = {}) {
  return Object.fromEntries(IMPORTABLE_STAFF_FIELDS
    .filter((key) => Object.prototype.hasOwnProperty.call(row, key))
    .map((key) => [key, row[key]]));
}

function cleanText(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function staffCodeKey(value) {
  return cleanText(value).toLowerCase();
}

module.exports = { mergeStaffDetailsImport };
