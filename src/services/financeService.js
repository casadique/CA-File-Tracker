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
    const existing = (state.otherCashCollections || []).find((item) => {
      if (incoming.id && item.id === incoming.id) return true;
      if (incoming.feeReceiptId && (item.feeReceiptId === incoming.feeReceiptId || item.fee_receipt_id === incoming.feeReceiptId)) return true;
      if (incoming.sourceId && (item.sourceId === incoming.sourceId || item.source_id === incoming.sourceId) && (item.sourceType === "fee_receipt" || item.source_type === "fee_receipt")) return true;
      return false;
    });
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
      isDeleted: false,
      is_deleted: false,
      deletedAt: "",
      deleted_at: "",
      deletedBy: "",
      deleted_by: "",
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
    const now = new Date();
    const before = (state.otherCashCollections || []).find((item) => item.id === id && isActiveTransaction(item));
    if (!before) {
      const error = new Error("Collection record not found or already deleted.");
      error.status = 404;
      throw error;
    }
    const linkedFileId = before.fileId || before.file_id || "";
    const linkedFeeReceipt = linkedFileId && (before.sourceType === "fee_receipt" || before.source_type === "fee_receipt");
    let linkedFile = null;
    if (linkedFeeReceipt) {
      state.files = (state.files || []).map((file) => {
        if (file.id !== linkedFileId) return file;
        linkedFile = revertFeeReceipt(file, now, profile);
        return linkedFile;
      });
    }
    const deleted = {
      ...before,
      isDeleted: true,
      is_deleted: true,
      deletedAt: now.toISOString(),
      deleted_at: now.toISOString(),
      deletedBy: profile?.name || "",
      deleted_by: profile?.id || profile?.email || "",
      updatedAt: now.toISOString(),
      updated_at: now.toISOString(),
    };
    state.otherCashCollections = (state.otherCashCollections || []).map((item) => item.id === id ? deleted : item);
    appendAudit(state, linkedFile ? "Linked fee collection deleted; file returned to Fee Pending" : "Collection deleted", before, profile, now);
    return state;
  }, userId);
}

async function saveFeeReceipt(fileId, receiptPayload, collectionPayload, userId, profile) {
  return patchAppState((state) => {
    const now = new Date();
    const fileIndex = (state.files || []).findIndex((file) => file.id === fileId);
    if (fileIndex < 0) {
      const error = new Error("Linked billed file was not found.");
      error.status = 404;
      throw error;
    }
    const original = state.files[fileIndex];
    const incoming = normalizeCollection({ ...collectionPayload, fileId, sourceType: "fee_receipt" }, now, profile);
    const existing = (state.otherCashCollections || []).find((item) => isActiveTransaction(item) && (
      (incoming.id && item.id === incoming.id)
      || (item.fileId === fileId || item.file_id === fileId) && (item.sourceType === "fee_receipt" || item.source_type === "fee_receipt")
    ));
    const transactionId = existing?.id || incoming.id || crypto.randomUUID();
    const receiptId = incoming.feeReceiptId || incoming.fee_receipt_id || original.feeReceiptId || original.fee_receipt_id || crypto.randomUUID();
    const collection = {
      ...(existing || {}),
      ...incoming,
      id: transactionId,
      fileId,
      file_id: fileId,
      feeReceiptId: receiptId,
      fee_receipt_id: receiptId,
      sourceType: "fee_receipt",
      source_type: "fee_receipt",
      sourceId: receiptId,
      source_id: receiptId,
      isDeleted: false,
      is_deleted: false,
      deletedAt: "",
      deleted_at: "",
      createdAt: existing?.createdAt || existing?.created_at || now.toISOString(),
      created_at: existing?.created_at || existing?.createdAt || now.toISOString(),
      updatedAt: now.toISOString(),
      updated_at: now.toISOString(),
    };
    const receivedAmount = Number(receiptPayload.receivedAmount || collection.amount || 0);
    const billedAmount = Number(receiptPayload.billedAmount || original.billedAmount || original.feeAmount || receivedAmount || 0);
    const balanceAmount = Math.max(billedAmount - receivedAmount, 0);
    const receivedAt = receiptPayload.receivedAt || now.toISOString();
    const updatedFile = {
      ...original,
      billed: true,
      billingType: "Billable",
      billedDate: receiptPayload.billDate || original.billedDate || "",
      billDate: receiptPayload.billDate || original.billDate || "",
      bill_date: receiptPayload.billDate || original.bill_date || "",
      billNo: receiptPayload.billNo || original.billNo || "",
      bill_number: receiptPayload.billNo || original.bill_number || "",
      invoiceNumber: receiptPayload.billNo || original.invoiceNumber || "",
      billedAmount,
      billed_amount: billedAmount,
      feeAmount: billedAmount,
      amount: billedAmount,
      feeReceived: balanceAmount <= 0,
      feeReceivedDate: receiptPayload.receivedDate || collection.date,
      feeReceivedAmount: receivedAmount,
      amount_received: receivedAmount,
      amountReceived: receivedAmount,
      balanceAmount,
      balance_amount: balanceAmount,
      paymentMode: receiptPayload.paymentMode || collection.mode,
      receiptMode: receiptPayload.paymentMode || collection.mode,
      feeCollectionMode: receiptPayload.paymentMode || collection.mode,
      feeReceiptRemarks: receiptPayload.remarks || collection.remarks || "",
      feeReceiptId: receiptId,
      fee_receipt_id: receiptId,
      feeTransactionId: transactionId,
      fee_transaction_id: transactionId,
      transactionId,
      transaction_id: transactionId,
      feeReceivedAt: receivedAt,
      fee_received_at: receivedAt,
      receivedAt,
      received_at: receivedAt,
      feeReceivedBy: profile?.name || "",
      paymentStatus: balanceAmount > 0 ? "Partly Received" : "Fee Received",
      payment_status: balanceAmount > 0 ? "Partly Received" : "Fee Received",
      updatedAt: now.toISOString(),
      updated_at: now.toISOString(),
    };
    state.files[fileIndex] = updatedFile;
    state.otherCashCollections = upsertById(state.otherCashCollections || [], collection).sort(financeNewestFirst);
    appendAudit(state, "Fee receipt saved with linked collection", collection, profile, now);
    return state;
  }, userId);
}

async function reverseUnlinkedFeeReceipt(fileId, userId, profile) {
  return patchAppState((state) => {
    const now = new Date();
    const fileIndex = (state.files || []).findIndex((file) => file.id === fileId);
    if (fileIndex < 0) {
      const error = new Error("Fee-received file was not found.");
      error.status = 404;
      throw error;
    }

    const file = state.files[fileIndex];
    const receiptId = file.feeReceiptId || file.fee_receipt_id || "";
    const transactionId = file.feeTransactionId || file.fee_transaction_id || file.transactionId || file.transaction_id || "";
    const linkedCollection = (state.otherCashCollections || []).find((item) => isActiveTransaction(item) && (
      (transactionId && item.id === transactionId)
      || (receiptId && (
        item.feeReceiptId === receiptId
        || item.fee_receipt_id === receiptId
        || item.sourceId === receiptId
        || item.source_id === receiptId
      ))
      || ((item.fileId === fileId || item.file_id === fileId)
        && (item.sourceType === "fee_receipt" || item.source_type === "fee_receipt"))
    ));
    if (linkedCollection) {
      const error = new Error("This fee receipt has a linked collection. Delete the linked transaction to return the file to Fee Pending.");
      error.status = 409;
      throw error;
    }

    const reverted = revertFeeReceipt(file, now, profile);
    state.files[fileIndex] = reverted;
    appendAudit(state, "Unlinked fee receipt reversed; file returned to Fee Pending", reverted, profile, now);
    return state;
  }, userId);
}

function revertFeeReceipt(file, now, profile) {
  const stages = { ...(file.stages || {}) };
  stages.Billed = true;
  return {
    ...file,
    billed: true,
    billingType: "Billable",
    feeReceived: false,
    feeReceivedDate: "",
    feeReceivedAt: "",
    fee_received_at: "",
    receivedAt: "",
    received_at: "",
    received_date: "",
    receivedDate: "",
    received_on: "",
    receivedOn: "",
    feeReceivedAmount: 0,
    amount_received: 0,
    amountReceived: 0,
    balanceAmount: Number(file.billedAmount || file.feeAmount || file.amount || 0),
    balance_amount: Number(file.billedAmount || file.feeAmount || file.amount || 0),
    paymentStatus: "Fee Not Received",
    payment_status: "Fee Not Received",
    paymentMode: "",
    payment_mode: "",
    receiptMode: "",
    receipt_mode: "",
    feeCollectionMode: "",
    fee_collection_mode: "",
    feeReceiptRemarks: "",
    fee_receipt_remarks: "",
    receiptRemarks: "",
    receipt_remarks: "",
    feeReceiptId: "",
    fee_receipt_id: "",
    feeTransactionId: "",
    fee_transaction_id: "",
    transactionId: "",
    transaction_id: "",
    feeReceivedBy: "",
    stages,
    updatedAt: now.toISOString(),
    updated_at: now.toISOString(),
    lastUpdatedBy: profile?.name || file.lastUpdatedBy || "",
  };
}

function isActiveTransaction(item = {}) {
  return item.isDeleted !== true && item.is_deleted !== true && String(item.status || "").toLowerCase() !== "deleted";
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
    fileId: payload.fileId || payload.file_id || "",
    file_id: payload.fileId || payload.file_id || "",
    feeReceiptId: payload.feeReceiptId || payload.fee_receipt_id || "",
    fee_receipt_id: payload.feeReceiptId || payload.fee_receipt_id || "",
    sourceType: payload.sourceType || payload.source_type || "",
    source_type: payload.sourceType || payload.source_type || "",
    sourceId: payload.sourceId || payload.source_id || payload.feeReceiptId || payload.fee_receipt_id || "",
    source_id: payload.sourceId || payload.source_id || payload.feeReceiptId || payload.fee_receipt_id || "",
    billNo: String(payload.billNo || payload.bill_no || payload.reference_number || "").trim(),
    bill_no: String(payload.billNo || payload.bill_no || payload.reference_number || "").trim(),
    billDate: normalizeDate(payload.billDate || payload.bill_date) || "",
    bill_date: normalizeDate(payload.billDate || payload.bill_date) || "",
    serviceType: String(payload.serviceType || payload.service_type || "").trim(),
    service_type: String(payload.serviceType || payload.service_type || "").trim(),
    fy: String(payload.fy || "").trim(),
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
  saveFeeReceipt,
  reverseUnlinkedFeeReceipt,
  deleteCollection,
  saveOpeningBalance,
  deleteOpeningBalance,
};
