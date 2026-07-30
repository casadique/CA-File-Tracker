const crypto = require("crypto");
const { patchAppState } = require("./appStateService");

async function saveVisitors(payload, userId, profile) {
  const rows = Array.isArray(payload) ? payload : [payload];
  return patchAppState((state) => {
    const now = new Date();
    const visitors = state.visitors || [];
    for (const row of rows) {
      const record = normalizeVisitor(row, now, profile);
      const index = visitors.findIndex((item) => item.id === record.id);
      if (index >= 0) visitors[index] = { ...visitors[index], ...record, updatedAt: now.toISOString(), updated_at: now.toISOString() };
      else visitors.unshift(record);
    }
    state.visitors = sortVisitors(visitors);
    state.auditLog = [
      ...(state.auditLog || []),
      {
        id: crypto.randomUUID(),
        action: rows.length > 1 ? "Visitors saved" : "Visitor saved",
        details: { count: rows.length },
        user: profile?.name || "",
        role: profile?.role || "",
        at: now.toISOString(),
      },
    ].slice(-1000);
    return state;
  }, userId);
}

async function deleteVisitor(id, userId, profile) {
  return patchAppState((state) => {
    const existing = (state.visitors || []).find((item) => item.id === id);
    state.visitors = (state.visitors || []).filter((item) => item.id !== id);
    state.deletedVisitorIds = [...new Set([...(state.deletedVisitorIds || []), id])];
    if (existing) {
      state.auditLog = [
        ...(state.auditLog || []),
        {
          id: crypto.randomUUID(),
          action: "Visitor deleted",
          details: { id, visitorName: existing.visitorName || existing.visitor_name },
          user: profile?.name || "",
          role: profile?.role || "",
          at: new Date().toISOString(),
        },
      ].slice(-1000);
    }
    return state;
  }, userId);
}

function normalizeVisitor(row = {}, now, profile = {}) {
  const date = normalizeDate(row.date || row.visit_date);
  const visitorName = String(row.visitorName || row.visitor_name || row.name || "").trim();
  const purpose = String(row.purpose || "").trim();
  const metWhom = String(row.metWhom || row.met_whom || "").trim();
  if (!date || !visitorName || !purpose || !metWhom) {
    const error = new Error("Visit date, visitor name, purpose and met whom are required.");
    error.status = 400;
    throw error;
  }
  const id = row.id || crypto.randomUUID();
  const visitTime = String(row.visitTime || row.visit_time || "").trim();
  const createdAt = row.created_at || row.createdAt || now.toISOString();
  return {
    ...row,
    id,
    date,
    visit_date: date,
    visitTime,
    visit_time: visitTime,
    visitorName,
    visitor_name: visitorName,
    mobileNumber: String(row.mobileNumber || row.mobile_number || "").trim(),
    mobile_number: String(row.mobileNumber || row.mobile_number || "").trim(),
    company: String(row.company || row.company_or_organisation || "").trim(),
    company_or_organisation: String(row.company || row.company_or_organisation || "").trim(),
    purpose,
    metWhom,
    met_whom: metWhom,
    remarks: String(row.remarks || row.followUp || row.followup || "").trim(),
    followUp: String(row.followUp || row.remarks || "").trim(),
    enteredBy: row.enteredBy || row.entered_by_user_name || profile?.name || "",
    entered_by_user_name: row.entered_by_user_name || row.enteredBy || profile?.name || "",
    entered_by_user_id: row.entered_by_user_id || profile?.id || profile?.email || "",
    createdAt,
    created_at: createdAt,
    updatedAt: now.toISOString(),
    updated_at: now.toISOString(),
  };
}

function sortVisitors(rows = []) {
  return [...rows].sort((a, b) => {
    const aDate = String(a.date || a.visit_date || "");
    const bDate = String(b.date || b.visit_date || "");
    if (bDate !== aDate) return bDate.localeCompare(aDate);
    const aTime = String(a.visitTime || a.visit_time || "");
    const bTime = String(b.visitTime || b.visit_time || "");
    if (bTime !== aTime) return bTime.localeCompare(aTime);
    return (Date.parse(b.created_at || b.createdAt || "") || 0) - (Date.parse(a.created_at || a.createdAt || "") || 0);
  });
}

function normalizeDate(value) {
  const raw = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const match = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (!match) return "";
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  return `${year}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

module.exports = { saveVisitors, deleteVisitor, sortVisitors };
