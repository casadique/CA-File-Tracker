const crypto = require("crypto");
const { patchAppState } = require("./appStateService");

async function saveExpense(payload, userId, profile) {
  return patchAppState((state) => {
    const now = new Date();
    const incoming = normalizeExpense(payload, now, profile);
    const existing = (state.expenses || []).find((item) => item.id === incoming.id);
    const record = {
      ...(existing || {}),
      ...incoming,
      id: incoming.id || crypto.randomUUID(),
      createdAt: existing?.createdAt || incoming.createdAt || now.toISOString(),
      created_at: existing?.created_at || incoming.created_at || now.toISOString(),
      createdBy: existing?.createdBy || incoming.createdBy,
      created_by: existing?.created_by || incoming.created_by,
      updatedAt: now.toISOString(),
      updated_at: now.toISOString(),
    };
    state.expenses = upsertById(state.expenses || [], record).sort(financeNewestFirst);
    appendAudit(state, "Expense saved", record, profile, now);
    return state;
  }, userId);
}

async function deleteExpense(id, userId, profile) {
  return patchAppState((state) => {
    const before = (state.expenses || []).find((item) => item.id === id);
    state.expenses = (state.expenses || []).filter((item) => item.id !== id);
    if (before) appendAudit(state, "Expense deleted", before, profile, new Date());
    return state;
  }, userId);
}

async function saveCollection(payload, userId, profile) {
  return patchAppState((state) => {
    const now = new Date();
    const incoming = normalizeCollection(payload, now, profile);
    const existing = (state.otherCashCollections || []).find((item) => item.id === incoming.id);
    const record = {
      ...(existing || {}),
      ...incoming,
      id: incoming.id || crypto.randomUUID(),
      createdAt: existing?.createdAt || incoming.createdAt || now.toISOString(),
      created_at: existing?.created_at || incoming.created_at || now.toISOString(),
      createdBy: existing?.createdBy || incoming.createdBy,
      created_by: existing?.created_by || incoming.created_by,
      updatedAt: now.toISOString(),
      updated_at: now.toISOString(),
    };
    state.otherCashCollections = upsertById(state.otherCashCollections || [], record).sort(financeNewestFirst);
    state.otherCashCollectionSources = [...new Set([
      ...(state.otherCashCollectionSources || []),
      record.receivedFrom,
    ].filter(Boolean))].sort((a, b) => a.localeCompare(b));
    appendAudit(state, "Collection saved", record, profile, now);
    return state;
  }, userId);
}

async function deleteCollection(id, userId, profile) {
  return patchAppState((state) => {
    const before = (state.otherCashCollections || []).find((item) => item.id === id);
    state.otherCashCollections = (state.otherCashCollections || []).filter((item) => item.id !== id);
    if (before) appendAudit(state, "Collection deleted", before, profile, new Date());
    return state;
  }, userId);
}

async function saveOpeningBalance(payload, userId, profile) {
  return patchAppState((state) => {
    const now = new Date();
    const incoming = normalizeOpeningBalance(payload, now, profile);
    const existing = (state.openingBalances || []).find((item) => item.id === incoming.id || item.date === incoming.date);
    const record = {
      ...(existing || {}),
      ...incoming,
      id: existing?.id || incoming.id || crypto.randomUUID(),
      createdAt: existing?.createdAt || incoming.createdAt || now.toISOString(),
      created_at: existing?.created_at || incoming.created_at || now.toISOString(),
      enteredBy: existing?.enteredBy || incoming.enteredBy,
      entered_by_user_name: existing?.entered_by_user_name || incoming.entered_by_user_name,
      updatedAt: now.toISOString(),
      updated_at: now.toISOString(),
    };
    state.openingBalances = upsertById(state.openingBalances || [], record).sort((a, b) => b.date.localeCompare(a.date));
    appendAudit(state, existing ? "Opening balance updated" : "Opening balance saved", record, profile, now);
    return state;
  }, userId);
}

async function deleteOpeningBalance(id, userId, profile) {
  return patchAppState((state) => {
    const before = (state.openingBalances || []).find((item) => item.id === id);
    state.openingBalances = (state.openingBalances || []).filter((item) => item.id !== id);
    if (before) appendAudit(state, "Opening balance deleted", before, profile, new Date());
    return state;
  }, userId);
}

function normalizeExpense(payload = {}, now, profile = {}) {
  const amount = Number(payload.amount || 0);
  if (!amount || amount < 0) {
    const error = new Error("Please enter a valid expense amount.");
    error.status = 400;
    throw error;
  }
  const date = normalizeDate(payload.date || payload.expense_date);
  if (!date) {
    const error = new Error("Expense date is required.");
    error.status = 400;
    throw error;
  }
  return {
    id: payload.id || "",
    date,
    expense_date: date,
    particulars: String(payload.particulars || payload.expenseItem || "").trim(),
    voucherNo: String(payload.voucherNo || payload.voucher_number || "").trim(),
    voucher_number: String(payload.voucherNo || payload.voucher_number || "").trim(),
    amount,
    mode: String(payload.mode || payload.payment_mode || "Cash").trim(),
    payment_mode: String(payload.mode || payload.payment_mode || "Cash").trim(),
    paidTo: String(payload.paidTo || payload.paid_to || "").trim(),
    paid_to: String(payload.paidTo || payload.paid_to || "").trim(),
    remarks: String(payload.remarks || "").trim(),
    attachment: payload.attachment || null,
    attachmentName: payload.attachmentName || payload.attachment?.name || "",
    createdBy: profile.name || "",
    created_by: profile.id || profile.email || "",
    updatedAt: now.toISOString(),
    updated_at: now.toISOString(),
  };
}

function normalizeCollection(payload = {}, now, profile = {}) {
  const amount = Number(payload.amount || 0);
  if (!amount || amount < 0) {
    const error = new Error("Please enter a valid collection amount.");
    error.status = 400;
    throw error;
  }
  const date = normalizeDate(payload.date || payload.collection_date);
  if (!date) {
    const error = new Error("Collection date is required.");
    error.status = 400;
    throw error;
  }
  return {
    id: payload.id || "",
    date,
    collection_date: date,
    particulars: String(payload.particulars || "").trim(),
    voucherNo: String(payload.voucherNo || payload.reference_number || "").trim(),
    reference_number: String(payload.voucherNo || payload.reference_number || "").trim(),
    collectionType: normalizeCollectionType(payload.collectionType || payload.collection_type),
    collection_type: normalizeCollectionType(payload.collectionType || payload.collection_type),
    amount,
    mode: String(payload.mode || payload.collection_mode || "Cash").trim(),
    collection_mode: String(payload.mode || payload.collection_mode || "Cash").trim(),
    receivedFrom: String(payload.receivedFrom || payload.received_from || "").trim(),
    received_from: String(payload.receivedFrom || payload.received_from || "").trim(),
    remarks: String(payload.remarks || "").trim(),
    attachment: payload.attachment || null,
    attachmentName: payload.attachmentName || payload.attachment?.name || "",
    createdBy: profile.name || "",
    created_by: profile.id || profile.email || "",
    updatedAt: now.toISOString(),
    updated_at: now.toISOString(),
  };
}

function normalizeCollectionType(value = "") {
  const raw = String(value || "").trim();
  const key = raw.toLowerCase().replace(/[\s-]+/g, "_");
  const aliases = {
    fee_collection: "fee_collection",
    other_cash_collection: "other_cash_collection",
    cash_collection: "other_cash_collection",
    bank_collection: "other_bank_collection",
    other_bank_collection: "other_bank_collection",
    other_collection: "other",
    refund: "refund",
    other: "other",
  };
  return aliases[key] || "";
}

function normalizeOpeningBalance(payload = {}, now, profile = {}) {
  const amount = Number(payload.amount ?? payload.opening_balance ?? 0);
  if (Number.isNaN(amount)) {
    const error = new Error("Please enter a valid opening balance amount.");
    error.status = 400;
    throw error;
  }
  const date = normalizeDate(payload.date || payload.balance_date);
  if (!date) {
    const error = new Error("Opening balance date is required.");
    error.status = 400;
    throw error;
  }
  return {
    id: payload.id || "",
    particulars: "Opening Cash Balance",
    date,
    balance_date: date,
    amount,
    opening_balance: amount,
    enteredBy: profile.name || payload.enteredBy || "",
    entered_by_user_name: profile.name || payload.entered_by_user_name || "",
    entered_by_user_id: profile.id || profile.email || "",
    updatedAt: now.toISOString(),
    updated_at: now.toISOString(),
  };
}

function normalizeDate(value) {
  const raw = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const match = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (!match) return "";
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  return `${year}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

function upsertById(rows, record) {
  const index = rows.findIndex((item) => item.id === record.id);
  if (index < 0) return [record, ...rows];
  return rows.map((item) => item.id === record.id ? record : item);
}

function financeNewestFirst(a, b) {
  const aTime = Date.parse(a.updated_at || a.updatedAt || a.date || 0) || 0;
  const bTime = Date.parse(b.updated_at || b.updatedAt || b.date || 0) || 0;
  return bTime - aTime;
}

function appendAudit(state, action, record, profile, now) {
  state.auditLog = [
    ...(state.auditLog || []),
    {
      id: crypto.randomUUID(),
      action,
      details: {
        id: record.id,
        date: record.date,
        amount: record.amount,
        particulars: record.particulars,
      },
      user: profile?.name || "",
      role: profile?.role || "",
      at: now.toISOString(),
    },
  ].slice(-1000);
}

module.exports = {
  saveExpense,
  deleteExpense,
  saveCollection,
  deleteCollection,
  saveOpeningBalance,
  deleteOpeningBalance,
};
