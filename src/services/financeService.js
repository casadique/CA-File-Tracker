const crypto = require("crypto");
const { getAppState, patchAppState } = require("./appStateService");

const FINANCE_ACCOUNTS = Object.freeze([
  { key: "cash", name: "Cash in Hand", type: "cash", displayOrder: 1 },
  { key: "federal_bank", name: "Federal Bank", type: "bank", displayOrder: 2 },
  { key: "tmb", name: "TMB", type: "bank", displayOrder: 3 },
  { key: "unclassified_bank", name: "Unclassified Bank", type: "bank", displayOrder: 99, legacyOnly: true },
]);
const PAYMENT_METHODS = Object.freeze(["Cash", "Bank Transfer", "UPI", "Cheque", "Card", "Other"]);

function financeAccountName(key = "") {
  return FINANCE_ACCOUNTS.find((account) => account.key === key)?.name || "";
}

function normalizePaymentMethod(value = "") {
  const raw = String(value || "").trim();
  const key = raw.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  const aliases = {
    cash: "Cash", bank: "Bank Transfer", bank_transfer: "Bank Transfer",
    transfer: "Bank Transfer", neft: "Bank Transfer", rtgs: "Bank Transfer",
    imps: "Bank Transfer", upi: "UPI", cheque: "Cheque", check: "Cheque",
    card: "Card", debit_card: "Card", credit_card: "Card", other: "Other",
  };
  return aliases[key] || (PAYMENT_METHODS.includes(raw) ? raw : "Other");
}

function transactionAccount(payload = {}, paymentMethod = "Cash") {
  const accountKey = financeAccountOf(payload);
  if (paymentMethod === "Cash") {
    if (accountKey && accountKey !== "cash") {
      throw Object.assign(new Error("Cash transactions must use the Cash in Hand account."), { status: 400 });
    }
    return "cash";
  }
  if (!accountKey || accountKey === "unclassified_bank") {
    throw Object.assign(new Error("Select Federal Bank or TMB for this non-cash transaction."), { status: 400 });
  }
  if (!["cash", "federal_bank", "tmb"].includes(accountKey)) {
    throw Object.assign(new Error("Select a valid account."), { status: 400 });
  }
  return accountKey;
}

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
    const now = new Date();
    const before = (state.expenses || []).find((item) => item.id === id);
    state.expenses = (state.expenses || []).map((item) => item.id === id ? {
      ...item, status: "deleted", isDeleted: true, is_deleted: true, deletedAt: now.toISOString(), deleted_at: now.toISOString(),
      deletedBy: profile?.name || "", deleted_by: profile?.id || profile?.email || userId || "", updatedAt: now.toISOString(), updated_at: now.toISOString(),
    } : item);
    if (before) appendAudit(state, "Expense soft-deleted", before, profile, now);
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
    const linkedReceiptId = before.feeReceiptId || before.fee_receipt_id || before.sourceId || before.source_id || "";
    const linkedFeeReceipt = linkedFileId && (before.sourceType === "fee_receipt" || before.source_type === "fee_receipt");
    let linkedFile = null;
    if (linkedFeeReceipt) {
      state.feeReceipts = (state.feeReceipts || []).map((receipt) => {
        if (receipt.id !== linkedReceiptId && receipt.transactionId !== id && receipt.transaction_id !== id) return receipt;
        return {
          ...receipt,
          status: "reversed",
          isDeleted: true,
          is_deleted: true,
          deletedAt: now.toISOString(),
          deleted_at: now.toISOString(),
          deletedBy: profile?.name || "",
          deleted_by: profile?.id || profile?.email || "",
          updatedAt: now.toISOString(),
          updated_at: now.toISOString(),
        };
      });
      state.files = (state.files || []).map((file) => {
        if (file.id !== linkedFileId) return file;
        linkedFile = applyFeeReceiptSummary(file, state.feeReceipts || [], now, profile);
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
    const shouldPush = receiptPayload.pushToTransactions === true;
    const receivedAmount = Number(receiptPayload.receivedAmount || 0);
    if (!Number.isFinite(receivedAmount) || receivedAmount <= 0) {
      const error = new Error("Please enter a valid received amount.");
      error.status = 400;
      throw error;
    }
    const discountAmount = Number(receiptPayload.discountAmount || receiptPayload.discount_amount || receiptPayload.discount || 0);
    if (!Number.isFinite(discountAmount) || discountAmount < 0) {
      const error = new Error("Discount cannot be negative.");
      error.status = 400;
      throw error;
    }
    const receiptDate = normalizeDate(receiptPayload.receivedDate || receiptPayload.receiptDate);
    if (!receiptDate) {
      const error = new Error("Received Date is required.");
      error.status = 400;
      throw error;
    }
    const receiptId = receiptPayload.feeReceiptId || receiptPayload.id || crypto.randomUUID();
    const existingReceipt = (state.feeReceipts || []).find((item) => item.id === receiptId);
    const previousSummary = feeReceiptSummary(original, (state.feeReceipts || []).filter((item) => item.id !== receiptId));
    const billedAmount = Number(
      receiptPayload.billedAmount
      || receiptPayload.billed_amount
      || original.billedAmount
      || original.billed_amount
      || original.billAmount
      || original.feeAmount
      || original.amount
      || 0,
    );
    const outstandingAmount = Math.max(
      (Number.isFinite(billedAmount) ? billedAmount : 0)
      - Number(previousSummary.totalReceived || 0)
      - Number(previousSummary.totalDiscount || 0),
      0,
    );
    if (receivedAmount + discountAmount > outstandingAmount + 0.005) {
      const error = new Error(`Received amount and discount cannot exceed the outstanding balance of ${outstandingAmount.toFixed(2)}.`);
      error.status = 400;
      throw error;
    }
    let transactionId = existingReceipt?.transactionId || existingReceipt?.transaction_id || "";
    let pushStatus = existingReceipt?.pushStatus || existingReceipt?.push_status || "not_requested";
    let collection = null;
    const receiptPaymentMethod = normalizePaymentMethod(
      receiptPayload.paymentMethod
      || receiptPayload.paymentMode
      || receiptPayload.payment_method
      || receiptPayload.mode
      || "Cash",
    );
    const receiptAccountKey = transactionAccount(receiptPayload, receiptPaymentMethod);

    if (shouldPush) {
      const existingCollection = (state.otherCashCollections || []).find((item) => isActiveTransaction(item) && (
        item.feeReceiptId === receiptId || item.fee_receipt_id === receiptId
        || item.sourceId === receiptId || item.source_id === receiptId
      ));
      if (existingCollection) {
        collection = existingCollection;
        transactionId = existingCollection.id;
      } else {
        const incoming = normalizeCollection({
          ...collectionPayload,
          amount: receivedAmount,
          date: receiptDate,
          fileId,
          feeReceiptId: receiptId,
          sourceId: receiptId,
          sourceType: "fee_receipt",
        }, now, profile);
        transactionId = incoming.id || crypto.randomUUID();
        collection = {
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
          createdAt: now.toISOString(),
          created_at: now.toISOString(),
          updatedAt: now.toISOString(),
          updated_at: now.toISOString(),
        };
        state.otherCashCollections = upsertById(state.otherCashCollections || [], collection).sort(financeNewestFirst);
      }
      pushStatus = "pushed";
    }

    const receipt = {
      ...(existingReceipt || {}),
      id: receiptId,
      fileId,
      file_id: fileId,
      receiptDate,
      receipt_date: receiptDate,
      receivedAt: receiptPayload.receivedAt || existingReceipt?.receivedAt || existingReceipt?.received_at || now.toISOString(),
      received_at: receiptPayload.receivedAt || existingReceipt?.received_at || existingReceipt?.receivedAt || now.toISOString(),
      amount: receivedAmount,
      receivedAmount,
      received_amount: receivedAmount,
      discountAmount,
      discount_amount: discountAmount,
      discount: discountAmount,
      paymentMode: receiptPaymentMethod,
      payment_mode: receiptPaymentMethod,
      accountKey: receiptAccountKey,
      account_key: receiptAccountKey,
      accountName: financeAccountName(receiptAccountKey),
      account_name: financeAccountName(receiptAccountKey),
      remarks: String(receiptPayload.remarks || "").trim(),
      receivedBy: profile?.name || "",
      received_by: profile?.name || "",
      receivedByUserId: profile?.id || userId || "",
      received_by_user_id: profile?.id || userId || "",
      status: "active",
      isDeleted: false,
      is_deleted: false,
      pushToTransactions: shouldPush || pushStatus === "pushed",
      push_to_transactions: shouldPush || pushStatus === "pushed",
      pushStatus,
      push_status: pushStatus,
      transactionId,
      transaction_id: transactionId,
      pushedAt: pushStatus === "pushed" ? (existingReceipt?.pushedAt || existingReceipt?.pushed_at || now.toISOString()) : "",
      pushed_at: pushStatus === "pushed" ? (existingReceipt?.pushed_at || existingReceipt?.pushedAt || now.toISOString()) : "",
      pushedBy: pushStatus === "pushed" ? (profile?.name || "") : "",
      pushed_by: pushStatus === "pushed" ? (profile?.id || profile?.email || userId || "") : "",
      createdAt: existingReceipt?.createdAt || existingReceipt?.created_at || now.toISOString(),
      created_at: existingReceipt?.created_at || existingReceipt?.createdAt || now.toISOString(),
      updatedAt: now.toISOString(),
      updated_at: now.toISOString(),
    };
    state.feeReceipts = upsertById(state.feeReceipts || [], receipt).sort(financeNewestFirst);
    state.files[fileIndex] = applyFeeReceiptSummary(original, state.feeReceipts, now, profile, receiptPayload);
    appendAudit(state, shouldPush ? "Fee receipt saved with linked collection" : "Fee receipt saved", {
      ...receipt,
      clientName: original.name || "",
      serviceType: original.serviceType || "",
      billedAmount,
      outstandingBalance: Math.max(outstandingAmount - receivedAmount - discountAmount, 0),
      previousValue: {
        totalReceived: Number(previousSummary.totalReceived || 0),
        totalDiscount: Number(previousSummary.totalDiscount || 0),
        outstandingBalance: outstandingAmount,
      },
      newValue: {
        receivedAmount,
        discountAmount,
        totalReceived: Number(previousSummary.totalReceived || 0) + receivedAmount,
        totalDiscount: Number(previousSummary.totalDiscount || 0) + discountAmount,
        outstandingBalance: Math.max(outstandingAmount - receivedAmount - discountAmount, 0),
      },
    }, profile, now);
    return state;
  }, userId);
}

function feeCollectionLinkedTransaction(state, receipt = {}) {
  const receiptId = receipt.id || "";
  const transactionId = receipt.transactionId || receipt.transaction_id || "";
  return (state.otherCashCollections || []).find((item) => isActiveTransaction(item) && (
    (transactionId && item.id === transactionId)
    || (receiptId && (
      item.feeReceiptId === receiptId
      || item.fee_receipt_id === receiptId
      || item.sourceId === receiptId
      || item.source_id === receiptId
    ))
  )) || null;
}

function feeCollectionEditorPayload(state, receiptId) {
  const receipt = (state.feeReceipts || []).find((item) => item.id === receiptId && isValidFeeReceipt(item));
  if (!receipt) throw Object.assign(new Error("Fee receipt was not found or is no longer active."), { status: 404 });
  const fileId = receiptFileId(receipt);
  const file = (state.files || []).find((item) => item.id === fileId);
  if (!file) throw Object.assign(new Error("The file linked to this receipt was not found."), { status: 404 });
  const transaction = feeCollectionLinkedTransaction(state, receipt);
  const otherReceipts = (state.feeReceipts || []).filter((item) => (
    item.id !== receiptId && receiptFileId(item) === fileId && isValidFeeReceipt(item)
  ));
  const otherReceived = otherReceipts.reduce((sum, item) => sum + Math.max(Number(item.amount || item.receivedAmount || item.received_amount || 0), 0), 0);
  const otherDiscount = otherReceipts.reduce((sum, item) => sum + Math.max(Number(item.discountAmount || item.discount_amount || item.discount || 0), 0), 0);
  return {
    receipt,
    file: {
      id: file.id,
      name: file.name || "",
      pan: file.pan || file.panRegNo || file.pan_reg_no || "",
      serviceType: file.serviceType || "",
      fy: file.fy || "",
      careOf: file.careOf || file.care_of || "Direct",
      assignedStaff: file.assignedStaff || "Not Assigned",
      billNo: file.billNo || file.bill_number || file.invoiceNumber || file.invoiceNo || "",
      billDate: file.billDate || file.bill_date || file.billedDate || "",
      billedAmount: Number(file.billedAmount || file.billed_amount || file.billAmount || file.feeAmount || file.amount || 0),
      invoiceRemarks: file.invoiceRemarks || file.invoice_remarks || "",
    },
    transaction: transaction ? {
      id: transaction.id,
      date: transaction.date || transaction.collection_date || "",
      type: transaction.collectionType || transaction.collection_type || "fee_collection",
      paymentMode: transaction.paymentMethod || transaction.payment_method || transaction.mode || "",
      accountKey: financeAccountOf(transaction, ""),
      accountName: transaction.accountName || transaction.account_name || financeAccountName(financeAccountOf(transaction, "")),
      amount: Number(transaction.amount || 0),
      referenceNumber: transaction.reference_number || transaction.voucherNo || "",
      remarks: transaction.remarks || "",
      createdBy: transaction.createdBy || transaction.enteredBy || transaction.created_by || "",
      createdAt: transaction.createdAt || transaction.created_at || "",
    } : null,
    otherReceipts: { count: otherReceipts.length, totalReceived: otherReceived, totalDiscount: otherDiscount },
  };
}

async function getFeeCollectionEditor(receiptId) {
  return feeCollectionEditorPayload(await getAppState(), receiptId);
}

function feeCollectionChangeList(before, after) {
  const labels = {
    billNo: "Invoice Number", billDate: "Invoice Date", grossBillAmount: "Gross Bill Amount",
    invoiceRemarks: "Invoice Remarks", discountType: "Discount Type", discountAmount: "Discount Amount",
    discountPercentage: "Discount Percentage", discountReason: "Discount Reason", discountRemarks: "Discount Remarks",
    receivedDate: "Received Date", receivedAmount: "Received Amount", paymentMode: "Payment Mode",
    accountKey: "Payment Account", referenceNumber: "Reference Number", receiptRemarks: "Receipt Remarks",
    generalRemarks: "General Remarks",
  };
  return Object.keys(labels).filter((key) => String(before[key] ?? "") !== String(after[key] ?? "")).map((key) => ({
    key, label: labels[key], previousValue: before[key] ?? "", newValue: after[key] ?? "",
  }));
}

async function editFeeCollection(receiptId, payload, userId, profile) {
  return patchAppState((state) => {
    const now = new Date();
    const snapshot = feeCollectionEditorPayload(state, receiptId);
    const receipt = snapshot.receipt;
    const fileIndex = (state.files || []).findIndex((item) => item.id === snapshot.file.id);
    const originalFile = state.files[fileIndex];
    const linkedTransaction = feeCollectionLinkedTransaction(state, receipt);
    const wasLinked = Boolean(receipt.transactionId || receipt.transaction_id || receipt.pushStatus === "pushed" || receipt.push_status === "pushed");
    if (wasLinked && !linkedTransaction) {
      throw Object.assign(new Error("The linked transaction is missing. Restore it before editing this receipt."), { status: 409 });
    }

    const billNo = String(payload.billNo || payload.invoiceNumber || "").trim();
    if (billNo && !/^[A-Za-z0-9/-]+$/.test(billNo)) {
      throw Object.assign(new Error("Invoice Number can contain only letters, numbers, slash and hyphen."), { status: 400, field: "billNo" });
    }
    if (billNo && billNo.toLowerCase() !== String(snapshot.file.billNo || "").trim().toLowerCase() && (state.files || []).some((item) => item.id !== originalFile.id && String(item.billNo || item.bill_number || item.invoiceNumber || item.invoiceNo || "").trim().toLowerCase() === billNo.toLowerCase())) {
      throw Object.assign(new Error("This Invoice Number is already used by another file."), { status: 409, field: "billNo" });
    }
    const billDate = normalizeDate(payload.billDate || payload.invoiceDate);
    if (!billDate) throw Object.assign(new Error("Invoice Date is required."), { status: 400, field: "billDate" });
    const grossBillAmount = Number(payload.grossBillAmount ?? payload.billedAmount);
    if (!Number.isFinite(grossBillAmount) || grossBillAmount <= 0) {
      throw Object.assign(new Error("Gross Bill Amount must be greater than zero."), { status: 400, field: "grossBillAmount" });
    }

    const discountType = ["No Discount", "Fixed Amount", "Percentage"].includes(payload.discountType) ? payload.discountType : "No Discount";
    const discountPercentage = discountType === "Percentage" ? Number(payload.discountPercentage || 0) : 0;
    if (!Number.isFinite(discountPercentage) || discountPercentage < 0 || discountPercentage > 100) {
      throw Object.assign(new Error("Discount Percentage must be between 0 and 100."), { status: 400, field: "discountPercentage" });
    }
    const enteredDiscount = discountType === "No Discount" ? 0 : discountType === "Percentage"
      ? grossBillAmount * discountPercentage / 100
      : Number(payload.discountAmount || 0);
    const discountAmount = Number(enteredDiscount.toFixed(2));
    if (!Number.isFinite(discountAmount) || discountAmount < 0 || discountAmount > grossBillAmount) {
      throw Object.assign(new Error("Discount cannot be negative or exceed the Gross Bill Amount."), { status: 400, field: "discountAmount" });
    }
    const previousDiscount = Number(receipt.discountAmount || receipt.discount_amount || receipt.discount || 0);
    const discountReason = String(payload.discountReason || "").trim();
    if (discountAmount > previousDiscount + 0.005 && !discountReason) {
      throw Object.assign(new Error("A Discount Reason is required when increasing the discount."), { status: 400, field: "discountReason" });
    }

    const receivedDate = normalizeDate(payload.receivedDate || payload.receiptDate);
    if (!receivedDate) throw Object.assign(new Error("Received Date is required."), { status: 400, field: "receivedDate" });
    const receivedAmount = Number(payload.receivedAmount);
    if (!Number.isFinite(receivedAmount) || receivedAmount <= 0) {
      throw Object.assign(new Error("Received Amount must be greater than zero. Use Mark Not Received for reversals."), { status: 400, field: "receivedAmount" });
    }
    const paymentMode = normalizePaymentMethod(payload.paymentMode || "Cash");
    const accountKey = transactionAccount({ accountKey: payload.accountKey || payload.paymentAccount }, paymentMode);
    const totalDiscount = snapshot.otherReceipts.totalDiscount + discountAmount;
    const netBillAmount = grossBillAmount - totalDiscount;
    const totalReceived = snapshot.otherReceipts.totalReceived + receivedAmount;
    if (totalDiscount > grossBillAmount + 0.005) {
      throw Object.assign(new Error("Combined discounts cannot exceed the Gross Bill Amount."), { status: 400, field: "discountAmount" });
    }
    if (totalReceived > netBillAmount + 0.005) {
      throw Object.assign(new Error("Total received after this edit cannot exceed the Net Bill Amount."), { status: 400, field: "receivedAmount" });
    }

    const referenceNumber = String(payload.referenceNumber || "").trim();
    const receiptRemarks = String(payload.receiptRemarks || "").trim();
    const generalRemarks = String(payload.generalRemarks || "").trim();
    const invoiceRemarks = String(payload.invoiceRemarks || "").trim();
    const discountRemarks = String(payload.discountRemarks || "").trim();
    const before = {
      billNo: snapshot.file.billNo, billDate: normalizeDate(snapshot.file.billDate), grossBillAmount: snapshot.file.billedAmount,
      invoiceRemarks: snapshot.file.invoiceRemarks, discountType: receipt.discountType || receipt.discount_type || (previousDiscount > 0 ? "Fixed Amount" : "No Discount"),
      discountAmount: previousDiscount, discountPercentage: Number(receipt.discountPercentage || receipt.discount_percentage || 0),
      discountReason: receipt.discountReason || receipt.discount_reason || "", discountRemarks: receipt.discountRemarks || receipt.discount_remarks || "",
      receivedDate: normalizeDate(receipt.receiptDate || receipt.receipt_date || receipt.receivedDate || receipt.received_date),
      receivedAmount: Number(receipt.amount || receipt.receivedAmount || receipt.received_amount || 0),
      paymentMode: receipt.paymentMode || receipt.payment_mode || "Cash", accountKey: financeAccountOf(receipt, "cash"),
      referenceNumber: receipt.referenceNumber || receipt.reference_number || linkedTransaction?.reference_number || linkedTransaction?.voucherNo || "",
      receiptRemarks: receipt.receiptRemarks || receipt.receipt_remarks || receipt.remarks || "", generalRemarks: receipt.generalRemarks || receipt.general_remarks || "",
    };
    const after = { billNo, billDate, grossBillAmount, invoiceRemarks, discountType, discountAmount, discountPercentage, discountReason, discountRemarks, receivedDate, receivedAmount, paymentMode, accountKey, referenceNumber, receiptRemarks, generalRemarks };
    const changes = feeCollectionChangeList(before, after);

    const updatedReceipt = {
      ...receipt,
      receiptDate: receivedDate, receipt_date: receivedDate, receivedDate, received_date: receivedDate,
      amount: receivedAmount, receivedAmount, received_amount: receivedAmount,
      discountType, discount_type: discountType, discountAmount, discount_amount: discountAmount, discount: discountAmount,
      discountPercentage, discount_percentage: discountPercentage, discountReason, discount_reason: discountReason,
      discountRemarks, discount_remarks: discountRemarks,
      paymentMode, payment_mode: paymentMode,
      accountKey, account_key: accountKey, accountName: financeAccountName(accountKey), account_name: financeAccountName(accountKey),
      referenceNumber, reference_number: referenceNumber,
      remarks: receiptRemarks, receiptRemarks, receipt_remarks: receiptRemarks,
      generalRemarks, general_remarks: generalRemarks,
      updatedBy: profile?.name || "", updated_by: profile?.id || profile?.email || userId || "",
      updatedAt: now.toISOString(), updated_at: now.toISOString(),
    };
    state.feeReceipts = upsertById(state.feeReceipts || [], updatedReceipt).sort(feeReceiptNewestFirst);

    if (linkedTransaction) {
      const updatedTransaction = {
        ...linkedTransaction,
        date: receivedDate, collection_date: receivedDate,
        amount: receivedAmount,
        mode: paymentMode, paymentMethod: paymentMode, payment_method: paymentMode, collection_mode: paymentMode,
        accountKey, account_key: accountKey, accountName: financeAccountName(accountKey), account_name: financeAccountName(accountKey),
        voucherNo: referenceNumber, reference_number: referenceNumber,
        remarks: receiptRemarks || generalRemarks,
        billNo, bill_no: billNo, billDate, bill_date: billDate,
        updatedBy: profile?.name || "", updated_by: profile?.id || profile?.email || userId || "",
        updatedAt: now.toISOString(), updated_at: now.toISOString(),
      };
      state.otherCashCollections = upsertById(state.otherCashCollections || [], updatedTransaction).sort(financeNewestFirst);
    }

    const recalculated = applyFeeReceiptSummary(originalFile, state.feeReceipts, now, profile, { billedAmount: grossBillAmount, billDate, billNo });
    state.files[fileIndex] = {
      ...recalculated,
      billNo, bill_number: billNo, invoiceNumber: billNo, invoiceNo: billNo,
      billDate, bill_date: billDate, billedDate: billDate,
      billedAmount: grossBillAmount, billed_amount: grossBillAmount, billAmount: grossBillAmount, feeAmount: grossBillAmount, amount: grossBillAmount,
      invoiceRemarks, invoice_remarks: invoiceRemarks,
    };

    changes.forEach((change) => appendAudit(state, "Fee collection field updated", {
      id: receiptId,
      fileId: originalFile.id,
      receiptId,
      transactionId: linkedTransaction?.id || "",
      clientName: originalFile.name || "",
      serviceType: originalFile.serviceType || "",
      date: receivedDate,
      amount: receivedAmount,
      billedAmount: grossBillAmount,
      outstandingBalance: Math.max(netBillAmount - totalReceived, 0),
      paymentMode,
      accountKey,
      previousValue: { field: change.label, value: change.previousValue },
      newValue: { field: change.label, value: change.newValue },
      discountReason,
    }, profile, now));
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
    const receipt = (state.feeReceipts || [])
      .filter((item) => receiptFileId(item) === fileId && isValidFeeReceipt(item))
      .sort(feeReceiptNewestFirst)[0];
    const receiptId = receipt?.id || "";
    const transactionId = receipt?.transactionId || receipt?.transaction_id || "";
    const linkedCollection = (state.otherCashCollections || []).find((item) => isActiveTransaction(item) && (
      (transactionId && item.id === transactionId)
      || (receiptId && (
        item.feeReceiptId === receiptId
        || item.fee_receipt_id === receiptId
        || item.sourceId === receiptId
        || item.source_id === receiptId
      ))
    ));
    if (linkedCollection) {
      const error = new Error("This fee receipt has a linked collection. Delete the linked transaction to return the file to Fee Pending.");
      error.status = 409;
      throw error;
    }

    if (receipt) {
      state.feeReceipts = (state.feeReceipts || []).map((item) => item.id === receipt.id ? {
        ...item,
        status: "reversed",
        isDeleted: true,
        is_deleted: true,
        deletedAt: now.toISOString(),
        deleted_at: now.toISOString(),
        deletedBy: profile?.name || "",
        deleted_by: profile?.id || profile?.email || "",
        updatedAt: now.toISOString(),
        updated_at: now.toISOString(),
      } : item);
    }
    const reverted = receipt
      ? applyFeeReceiptSummary(file, state.feeReceipts || [], now, profile)
      : revertFeeReceipt(file, now, profile);
    state.files[fileIndex] = reverted;
    appendAudit(state, "Unlinked fee receipt reversed; file returned to Fee Pending", reverted, profile, now);
    return state;
  }, userId);
}

async function reverseFeeReceipt(receiptId, reason, userId, profile) {
  const reversalReason = String(reason || "").trim();
  if (!reversalReason) {
    const error = new Error("Reason for marking the receipt as Not Received is required.");
    error.status = 400;
    throw error;
  }

  return patchAppState((state) => {
    const now = new Date();
    const receiptIndex = (state.feeReceipts || []).findIndex((item) => item.id === receiptId);
    if (receiptIndex < 0) {
      const error = new Error("Fee receipt record was not found.");
      error.status = 404;
      throw error;
    }

    const originalReceipt = state.feeReceipts[receiptIndex];
    if (!isValidFeeReceipt(originalReceipt)) {
      const error = new Error("This fee receipt is already marked as Not Received or reversed.");
      error.status = 409;
      throw error;
    }

    const fileId = receiptFileId(originalReceipt);
    const fileIndex = (state.files || []).findIndex((file) => file.id === fileId);
    if (fileIndex < 0) {
      const error = new Error("The file linked to this fee receipt was not found.");
      error.status = 404;
      throw error;
    }

    const transactionId = originalReceipt.transactionId || originalReceipt.transaction_id || "";
    const collectionIndex = (state.otherCashCollections || []).findIndex((item) => {
      if (!isActiveTransaction(item)) return false;
      if (transactionId && item.id === transactionId) return true;
      return item.feeReceiptId === receiptId
        || item.fee_receipt_id === receiptId
        || item.sourceId === receiptId
        || item.source_id === receiptId;
    });
    const linkedCollection = collectionIndex >= 0 ? state.otherCashCollections[collectionIndex] : null;
    const actorName = profile?.name || profile?.email || "";
    const actorId = profile?.id || userId || "";
    const previousPushStatus = originalReceipt.pushStatus
      || originalReceipt.push_status
      || (linkedCollection ? "pushed" : "not_pushed");

    const reversedReceipt = {
      ...originalReceipt,
      status: "not_received",
      receiptStatus: "not_received",
      receipt_status: "not_received",
      isReversed: true,
      is_reversed: true,
      reversedAt: now.toISOString(),
      reversed_at: now.toISOString(),
      reversedBy: actorName,
      reversed_by: actorName,
      reversedByUserId: actorId,
      reversed_by_user_id: actorId,
      reversalReason,
      reversal_reason: reversalReason,
      previousPushStatus,
      previous_push_status: previousPushStatus,
      linkedTransactionStatus: linkedCollection ? "reversed" : "not_applicable",
      linked_transaction_status: linkedCollection ? "reversed" : "not_applicable",
      updatedAt: now.toISOString(),
      updated_at: now.toISOString(),
    };
    state.feeReceipts = (state.feeReceipts || []).map((item, index) => index === receiptIndex ? reversedReceipt : item);

    if (linkedCollection) {
      const reversedCollection = {
        ...linkedCollection,
        status: "reversed",
        transactionStatus: "reversed",
        transaction_status: "reversed",
        reversed: true,
        isReversed: true,
        is_reversed: true,
        reversedAt: now.toISOString(),
        reversed_at: now.toISOString(),
        reversedBy: actorName,
        reversed_by: actorName,
        reversedByUserId: actorId,
        reversed_by_user_id: actorId,
        reversalReason,
        reversal_reason: reversalReason,
        updatedAt: now.toISOString(),
        updated_at: now.toISOString(),
      };
      state.otherCashCollections = (state.otherCashCollections || []).map((item, index) => index === collectionIndex ? reversedCollection : item);
    }

    state.files[fileIndex] = applyFeeReceiptSummary(state.files[fileIndex], state.feeReceipts, now, profile);
    appendAudit(state, linkedCollection
      ? "Fee receipt marked Not Received and linked collection reversed"
      : "Fee receipt marked Not Received", {
      ...reversedReceipt,
      particulars: reversalReason,
      date: reversedReceipt.receiptDate || reversedReceipt.receipt_date,
      amount: reversedReceipt.amount || reversedReceipt.receivedAmount || reversedReceipt.received_amount,
    }, profile, now);
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

const INVALID_FEE_RECEIPT_STATUSES = new Set(["deleted", "cancelled", "canceled", "reversed", "not received", "not_received", "invalid", "failed"]);

function receiptFileId(receipt = {}) {
  return receipt.fileId || receipt.file_id || "";
}

function isValidFeeReceipt(receipt = {}) {
  const status = String(receipt.status || receipt.receiptStatus || receipt.receipt_status || "active").trim().toLowerCase();
  return receipt.isDeleted !== true
    && receipt.is_deleted !== true
    && receipt.isCancelled !== true
    && receipt.is_cancelled !== true
    && receipt.isReversed !== true
    && receipt.is_reversed !== true
    && !INVALID_FEE_RECEIPT_STATUSES.has(status);
}

function feeReceiptNewestFirst(a = {}, b = {}) {
  const aDate = normalizeDate(a.receiptDate || a.receipt_date || a.receivedDate || a.received_date) || "";
  const bDate = normalizeDate(b.receiptDate || b.receipt_date || b.receivedDate || b.received_date) || "";
  if (aDate !== bDate) return bDate.localeCompare(aDate);
  const aTime = Date.parse(a.receivedAt || a.received_at || a.createdAt || a.created_at || 0) || 0;
  const bTime = Date.parse(b.receivedAt || b.received_at || b.createdAt || b.created_at || 0) || 0;
  if (aTime !== bTime) return bTime - aTime;
  return String(b.id || "").localeCompare(String(a.id || ""));
}

function feeReceiptSummary(file = {}, receipts = []) {
  const fileReceipts = (receipts || []).filter((receipt) => receiptFileId(receipt) === file.id);
  const validReceipts = fileReceipts
    .filter(isValidFeeReceipt)
    .sort(feeReceiptNewestFirst);
  if (!validReceipts.length) {
    if (fileReceipts.length) {
      return { receipts: [], latest: null, totalReceived: 0, totalDiscount: 0, latestReceiptDate: "" };
    }
    const legacyAmount = Number(file.feeReceivedAmount || file.amountReceived || file.amount_received || 0);
    const legacyDate = normalizeDate(file.feeReceivedDate || file.receivedDate || file.received_date || file.receivedOn || file.received_on);
    return {
      receipts: [],
      latest: null,
      totalReceived: Number.isFinite(legacyAmount) ? Math.max(legacyAmount, 0) : 0,
      totalDiscount: 0,
      latestReceiptDate: legacyAmount > 0 ? legacyDate : "",
    };
  }
  return {
    receipts: validReceipts,
    latest: validReceipts[0],
    totalReceived: validReceipts.reduce((sum, receipt) => sum + Math.max(Number(receipt.amount || receipt.receivedAmount || receipt.received_amount || 0), 0), 0),
    totalDiscount: validReceipts.reduce((sum, receipt) => sum + Math.max(Number(
      receipt.discountAmount || receipt.discount_amount || receipt.discount || 0,
    ), 0), 0),
    latestReceiptDate: normalizeDate(validReceipts[0].receiptDate || validReceipts[0].receipt_date || validReceipts[0].receivedDate || validReceipts[0].received_date),
  };
}

function applyFeeReceiptSummary(file, receipts, now, profile, billingPayload = {}) {
  const summary = feeReceiptSummary(file, receipts);
  const latest = summary.latest || {};
  const billedAmount = Number(
    billingPayload.billedAmount
    || billingPayload.billed_amount
    || file.billedAmount
    || file.billed_amount
    || file.billAmount
    || file.feeAmount
    || file.amount
    || 0,
  );
  const totalReceived = Math.max(Number(summary.totalReceived || 0), 0);
  const totalDiscount = Math.max(Number(summary.totalDiscount || 0), 0);
  const settledAmount = totalReceived + totalDiscount;
  const balanceAmount = Math.max((Number.isFinite(billedAmount) ? billedAmount : 0) - settledAmount, 0);
  const fullyReceived = billedAmount > 0 && settledAmount >= billedAmount;
  const latestTransactionId = latest.transactionId || latest.transaction_id || "";
  const stages = { ...(file.stages || {}), Billed: true };
  return {
    ...file,
    billed: true,
    billingType: "Billable",
    billedDate: billingPayload.billDate || billingPayload.bill_date || file.billedDate || file.billDate || file.bill_date || "",
    billDate: billingPayload.billDate || billingPayload.bill_date || file.billDate || file.bill_date || file.billedDate || "",
    bill_date: billingPayload.billDate || billingPayload.bill_date || file.bill_date || file.billDate || file.billedDate || "",
    billNo: billingPayload.billNo || billingPayload.bill_number || file.billNo || file.bill_number || file.invoiceNumber || file.invoiceNo || "",
    bill_number: billingPayload.billNo || billingPayload.bill_number || file.bill_number || file.billNo || file.invoiceNumber || file.invoiceNo || "",
    billedAmount: Number.isFinite(billedAmount) ? billedAmount : 0,
    billed_amount: Number.isFinite(billedAmount) ? billedAmount : 0,
    billAmount: Number.isFinite(billedAmount) ? billedAmount : 0,
    feeAmount: Number.isFinite(billedAmount) ? billedAmount : 0,
    feeReceived: fullyReceived,
    feeReceivedDate: summary.latestReceiptDate,
    receivedDate: summary.latestReceiptDate,
    received_date: summary.latestReceiptDate,
    receivedOn: summary.latestReceiptDate,
    received_on: summary.latestReceiptDate,
    feeReceivedAt: latest.receivedAt || latest.received_at || "",
    fee_received_at: latest.received_at || latest.receivedAt || "",
    feeReceivedAmount: totalReceived,
    amountReceived: totalReceived,
    amount_received: totalReceived,
    discountAmount: totalDiscount,
    discount_amount: totalDiscount,
    balanceAmount,
    balance_amount: balanceAmount,
    paymentStatus: totalReceived <= 0 ? "Fee Not Received" : (fullyReceived ? "Fee Received" : "Partly Received"),
    payment_status: totalReceived <= 0 ? "Fee Not Received" : (fullyReceived ? "Fee Received" : "Partly Received"),
    paymentMode: latest.paymentMode || latest.payment_mode || "",
    receiptMode: latest.paymentMode || latest.payment_mode || "",
    feeReceiptRemarks: latest.remarks || "",
    receiptRemarks: latest.remarks || "",
    receipt_remarks: latest.remarks || "",
    feeReceiptId: latest.id || "",
    fee_receipt_id: latest.id || "",
    feeTransactionId: latestTransactionId,
    fee_transaction_id: latestTransactionId,
    transactionId: latestTransactionId,
    transaction_id: latestTransactionId,
    pushedToTransactions: Boolean(latestTransactionId),
    pushed_to_transactions: Boolean(latestTransactionId),
    feeReceivedBy: latest.receivedBy || latest.received_by || profile?.name || file.feeReceivedBy || "",
    stages,
    updatedAt: now.toISOString(),
    updated_at: now.toISOString(),
    lastUpdatedBy: profile?.name || file.lastUpdatedBy || "",
  };
}

function isActiveTransaction(item = {}) {
  const status = String(item.status || item.transactionStatus || item.transaction_status || "").trim().toLowerCase();
  return item.isDeleted !== true
    && item.is_deleted !== true
    && item.deleted !== true
    && item.cancelled !== true
    && item.reversed !== true
    && !["deleted", "cancelled", "canceled", "reversed", "void", "failed"].includes(status);
}

function normalizeFinanceAccount(value = "") {
  const key = String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (!key) return "";
  if (key === "cash" || key.includes("cash account") || key.includes("cash balance")) return "cash";
  if (key.includes("federal")) return "federal_bank";
  if (key === "tmb" || key.includes("tamilnad mercantile") || key.includes("tamil nad mercantile")) return "tmb";
  if (key === "bank" || key === "bank account" || key.includes("unclassified bank")) return "unclassified_bank";
  return "";
}

function financeAccountOf(item = {}, fallback = "") {
  const candidates = [
    item.accountKey, item.account_key, item.accountName, item.account_name,
    item.bankName, item.bank_name, item.bankAccount, item.bank_account,
    item.paymentAccount, item.payment_account, item.mode, item.paymentMode, item.payment_mode,
    item.particulars,
  ];
  for (const candidate of candidates) {
    const account = normalizeFinanceAccount(candidate);
    if (account) return account;
  }
  return fallback;
}

function financeDateOf(item = {}) {
  return normalizeDate(
    item.date || item.transactionDate || item.transaction_date || item.receiptDate || item.receipt_date
      || item.reconciliationDate || item.reconciliation_date || item.balanceDate || item.balance_date
      || item.effectiveDate || item.effective_date || item.createdAt || item.created_at,
  );
}

function approvedRecord(item = {}) {
  const status = String(item.approvalStatus || item.approval_status || item.status || "").trim().toLowerCase();
  return ["approved", "confirmed", "matched", "closed"].includes(status) || item.approved === true || item.confirmed === true;
}

function calculateDailyReportBalanceSummary(state, reportDate = "") {
  const asOfDate = normalizeDate(reportDate) || new Date().toISOString().slice(0, 10);
  const accountKeys = ["cash", "federal_bank", "tmb", "unclassified_bank"];
  const balances = Object.fromEntries(accountKeys.map((key) => [key, 0]));
  const openingDates = Object.fromEntries(accountKeys.map((key) => [key, ""]));

  accountKeys.forEach((account) => {
    const opening = [...(state.openingBalances || [])]
      .filter((item) => isActiveTransaction(item))
      .filter((item) => financeAccountOf(item, "cash") === account)
      .filter((item) => financeDateOf(item) && financeDateOf(item) <= asOfDate)
      .sort((a, b) => financeDateOf(b).localeCompare(financeDateOf(a))
        || String(b.updatedAt || b.updated_at || b.createdAt || b.created_at || "").localeCompare(String(a.updatedAt || a.updated_at || a.createdAt || a.created_at || "")))[0];
    if (opening) {
      balances[account] = Number(opening.amount ?? opening.openingBalance ?? opening.opening_balance ?? 0) || 0;
      openingDates[account] = financeDateOf(opening);
    } else if (account === "cash") {
      balances.cash = Number(state.openingCashBalance || 0) || 0;
    }
  });

  const afterOpening = (item, account) => {
    const date = financeDateOf(item);
    return date && date <= asOfDate && (!openingDates[account] || date >= openingDates[account]);
  };
  const applyMovement = (item, direction) => {
    if (!isActiveTransaction(item)) return;
    const amount = Number(item.amount ?? item.transactionAmount ?? item.transaction_amount ?? 0) || 0;
    if (!amount) return;
    const fromAccount = normalizeFinanceAccount(item.fromAccount || item.from_account || item.sourceAccount || item.source_account);
    const toAccount = normalizeFinanceAccount(item.toAccount || item.to_account || item.destinationAccount || item.destination_account);
    if (fromAccount && toAccount) {
      if (afterOpening(item, fromAccount)) balances[fromAccount] -= amount;
      if (afterOpening(item, toAccount)) balances[toAccount] += amount;
      return;
    }
    const account = financeAccountOf(item);
    if (account && afterOpening(item, account)) balances[account] += direction * amount;
  };

  (state.otherCashCollections || []).forEach((item) => applyMovement(item, 1));
  (state.expenses || []).forEach((item) => applyMovement(item, -1));
  (state.accountTransfers || []).forEach((item) => applyMovement(item, 0));

  (state.cashReconciliations || []).forEach((item) => {
    if (!isActiveTransaction(item) || !approvedRecord(item) || !afterOpening(item, "cash")) return;
    const amount = Number(item.adjustmentAmount ?? item.adjustment_amount ?? 0) || 0;
    const type = String(item.adjustmentType || item.adjustment_type || "").toLowerCase();
    if (type === "excess") balances.cash += amount;
    if (type === "shortage") balances.cash -= amount;
  });

  const confirmedRows = [
    ...(state.bankReconciliations || []),
    ...(state.accountReconciliations || []),
    ...(state.confirmedAccountBalances || []),
    ...(state.accountBalances || []),
  ];
  ["federal_bank", "tmb"].forEach((account) => {
    const confirmed = confirmedRows
      .filter((item) => isActiveTransaction(item) && approvedRecord(item) && financeAccountOf(item) === account)
      .filter((item) => financeDateOf(item) && financeDateOf(item) <= asOfDate)
      .sort((a, b) => financeDateOf(b).localeCompare(financeDateOf(a))
        || String(b.approvedAt || b.approved_at || b.updatedAt || b.updated_at || "").localeCompare(String(a.approvedAt || a.approved_at || a.updatedAt || a.updated_at || "")))[0];
    if (confirmed) {
      balances[account] = Number(
        confirmed.closingBalance ?? confirmed.closing_balance ?? confirmed.confirmedBalance
          ?? confirmed.confirmed_balance ?? confirmed.balance ?? 0,
      ) || 0;
    }
  });

  Object.keys(balances).forEach((key) => { balances[key] = Number(balances[key].toFixed(2)); });
  return {
    reportDate: asOfDate,
    cashBalance: balances.cash,
    federalBankBalance: balances.federal_bank,
    tmbBalance: balances.tmb,
    unclassifiedBankBalance: balances.unclassified_bank,
    totalBalance: Number((balances.cash + balances.federal_bank + balances.tmb).toFixed(2)),
  };
}

function accountSummary(state, reportDate = "") {
  const summary = calculateDailyReportBalanceSummary(state, reportDate);
  return {
    ...summary,
    accounts: FINANCE_ACCOUNTS,
    combinedBalance: summary.totalBalance,
  };
}

async function saveAccountTransfer(payload, userId, profile) {
  return patchAppState((state) => {
    const now = new Date();
    const amount = Number(payload.amount || 0);
    const date = normalizeDate(payload.date || payload.transfer_date);
    const fromAccount = normalizeFinanceAccount(payload.fromAccount || payload.from_account || payload.fromAccountKey || payload.from_account_key);
    const toAccount = normalizeFinanceAccount(payload.toAccount || payload.to_account || payload.toAccountKey || payload.to_account_key);
    const permitted = new Set(["cash", "federal_bank", "tmb"]);
    if (!date) throw Object.assign(new Error("Transfer date is required."), { status: 400 });
    if (!Number.isFinite(amount) || amount <= 0) throw Object.assign(new Error("Enter a valid transfer amount."), { status: 400 });
    if (!permitted.has(fromAccount) || !permitted.has(toAccount)) throw Object.assign(new Error("Select valid source and destination accounts."), { status: 400 });
    if (fromAccount === toAccount) throw Object.assign(new Error("Source and destination accounts must be different."), { status: 400 });
    const existing = (state.accountTransfers || []).find((item) => item.id === payload.id);
    const record = {
      ...(existing || {}), id: existing?.id || payload.id || crypto.randomUUID(), date,
      transferDate: date, transfer_date: date, amount,
      fromAccount, from_account: fromAccount, fromAccountKey: fromAccount, from_account_key: fromAccount,
      fromAccountName: financeAccountName(fromAccount),
      toAccount, to_account: toAccount, toAccountKey: toAccount, to_account_key: toAccount,
      toAccountName: financeAccountName(toAccount),
      referenceNo: String(payload.referenceNo || payload.reference_no || payload.reference || "").trim(),
      reference: String(payload.reference || payload.referenceNo || payload.reference_no || "").trim(),
      remarks: String(payload.remarks || "").trim(), status: "active", isDeleted: false, is_deleted: false,
      createdBy: existing?.createdBy || profile?.name || "", created_by: existing?.created_by || profile?.id || userId || "",
      createdAt: existing?.createdAt || existing?.created_at || now.toISOString(),
      created_at: existing?.created_at || existing?.createdAt || now.toISOString(),
      updatedAt: now.toISOString(), updated_at: now.toISOString(),
    };
    state.accountTransfers = upsertById(state.accountTransfers || [], record).sort(financeNewestFirst);
    appendAudit(state, existing ? "Account transfer updated" : "Account transfer saved", record, profile, now);
    return state;
  }, userId);
}

async function deleteAccountTransfer(id, userId, profile) {
  return patchAppState((state) => {
    const now = new Date();
    const existing = (state.accountTransfers || []).find((item) => item.id === id && isActiveTransaction(item));
    if (!existing) throw Object.assign(new Error("Account transfer not found."), { status: 404 });
    state.accountTransfers = (state.accountTransfers || []).map((item) => item.id === id ? {
      ...item, status: "deleted", isDeleted: true, is_deleted: true,
      deletedBy: profile?.name || "", deletedAt: now.toISOString(), updatedAt: now.toISOString(), updated_at: now.toISOString(),
    } : item);
    appendAudit(state, "Account transfer deleted", existing, profile, now);
    return state;
  }, userId);
}

async function classifyLegacyBankTransaction(payload, userId, profile) {
  return patchAppState((state) => {
    const now = new Date();
    const recordType = String(payload.recordType || payload.record_type || "").trim();
    const recordId = String(payload.recordId || payload.record_id || "").trim();
    const accountKey = normalizeFinanceAccount(payload.accountKey || payload.account_key);
    if (!recordId || !["expense", "collection", "fee_receipt"].includes(recordType)) {
      throw Object.assign(new Error("Select a valid legacy transaction."), { status: 400 });
    }
    if (!["federal_bank", "tmb"].includes(accountKey)) {
      throw Object.assign(new Error("Legacy Bank transactions can be classified only as Federal Bank or TMB."), { status: 400 });
    }
    const listKey = recordType === "expense" ? "expenses" : recordType === "collection" ? "otherCashCollections" : "feeReceipts";
    let changed = null;
    state[listKey] = (state[listKey] || []).map((item) => {
      if (item.id !== recordId) return item;
      if (financeAccountOf(item) !== "unclassified_bank") throw Object.assign(new Error("This transaction is not an unclassified legacy Bank record."), { status: 409 });
      changed = { ...item, accountKey, account_key: accountKey, accountName: financeAccountName(accountKey), account_name: financeAccountName(accountKey), classifiedBy: profile?.name || "", classifiedAt: now.toISOString(), updatedAt: now.toISOString(), updated_at: now.toISOString() };
      return changed;
    });
    if (!changed) throw Object.assign(new Error("Legacy transaction not found."), { status: 404 });
    appendAudit(state, "Legacy Bank transaction classified", changed, profile, now);
    return state;
  }, userId);
}

async function saveOpeningBalance(payload, userId, profile) {
  return patchAppState((state) => {
    const now = new Date();
    const incoming = normalizeOpeningBalance(payload, now, profile);
    const existing = (state.openingBalances || []).find((item) => isActiveTransaction(item)
      && item.date === incoming.date && financeAccountOf(item, "cash") === incoming.accountKey);
    if (existing) throw Object.assign(new Error(`${financeAccountName(incoming.accountKey)} already has an opening balance for ${incoming.date}. Choose another effective date.`), { status: 409 });
    const history = (state.openingBalances || []).filter((item) => isActiveTransaction(item) && financeAccountOf(item, "cash") === incoming.accountKey);
    const previous = history.filter((item) => financeDateOf(item) <= incoming.date).sort((a, b) => financeDateOf(b).localeCompare(financeDateOf(a)))[0];
    const record = {
      ...incoming,
      id: crypto.randomUUID(),
      version: history.length + 1,
      previousValue: previous ? Number(previous.amount || previous.opening_balance || 0) : null,
      newValue: Number(incoming.amount || 0),
      createdAt: now.toISOString(),
      created_at: now.toISOString(),
      updatedAt: now.toISOString(),
      updated_at: now.toISOString(),
    };
    state.openingBalances = upsertById(state.openingBalances || [], record).sort((a, b) => b.date.localeCompare(a.date));
    appendAudit(state, "Opening balance version saved", record, profile, now);
    return state;
  }, userId);
}

async function saveOpeningBalances(payloads = [], userId, profile, reason = "") {
  if (!Array.isArray(payloads) || payloads.length !== 3) {
    throw Object.assign(new Error("Provide opening balances for Cash, Federal Bank and TMB."), { status: 400 });
  }
  const changeReason = String(reason || "").trim();
  if (!changeReason) throw Object.assign(new Error("Opening balance remarks are required."), { status: 400 });
  return patchAppState((state) => {
    const now = new Date();
    const records = payloads.map((payload) => normalizeOpeningBalance(payload, now, profile));
    const requiredAccounts = new Set(["cash", "federal_bank", "tmb"]);
    if (new Set(records.map((record) => record.accountKey)).size !== 3 || records.some((record) => !requiredAccounts.has(record.accountKey))) {
      throw Object.assign(new Error("Opening balances must contain one entry for each recognised account."), { status: 400 });
    }
    const duplicate = records.find((record) => (state.openingBalances || []).some((item) => isActiveTransaction(item)
      && financeDateOf(item) === record.date && financeAccountOf(item, "cash") === record.accountKey));
    if (duplicate) {
      throw Object.assign(new Error(`${financeAccountName(duplicate.accountKey)} already has an opening balance for ${duplicate.date}. Choose another effective date.`), { status: 409 });
    }
    const activeHistory = (state.openingBalances || []).filter(isActiveTransaction);
    const versioned = records.map((record) => {
      const previous = activeHistory.filter((item) => financeAccountOf(item, "cash") === record.accountKey && financeDateOf(item) <= record.date)
        .sort((a, b) => financeDateOf(b).localeCompare(financeDateOf(a)))[0];
      return {
        ...record,
        id: crypto.randomUUID(),
        reason: changeReason,
        remarks: changeReason,
        version: activeHistory.filter((item) => financeAccountOf(item, "cash") === record.accountKey).length + 1,
        previousValue: previous ? Number(previous.amount || previous.opening_balance || 0) : null,
        newValue: Number(record.amount || 0),
        createdAt: now.toISOString(),
        created_at: now.toISOString(),
        updatedAt: now.toISOString(),
        updated_at: now.toISOString(),
      };
    });
    state.openingBalances = [...versioned, ...(state.openingBalances || [])].sort((a, b) => financeDateOf(b).localeCompare(financeDateOf(a)));
    versioned.forEach((record) => appendAudit(state, "Opening balance version saved", record, profile, now));
    return state;
  }, userId);
}

async function deleteOpeningBalance(id, userId, profile) {
  return patchAppState((state) => {
    const before = (state.openingBalances || []).find((item) => item.id === id);
    const now = new Date();
    state.openingBalances = (state.openingBalances || []).map((item) => item.id === id ? {
      ...item, isDeleted: true, is_deleted: true, deletedAt: now.toISOString(), deleted_at: now.toISOString(),
      deletedBy: profile?.name || "", deleted_by: profile?.id || profile?.email || userId || "", updatedAt: now.toISOString(), updated_at: now.toISOString(),
    } : item);
    if (before) appendAudit(state, "Opening balance soft-deleted", { ...before, previousValue: before.amount, newValue: null }, profile, now);
    return state;
  }, userId);
}

async function submitCashReconciliation(payload, userId, profile) {
  return patchAppState((state) => {
    const now = new Date();
    const from = normalizeDate(payload.from || payload.from_date) || "";
    const to = normalizeDate(payload.to || payload.to_date) || from || normalizeDate(now.toISOString().slice(0, 10));
    const periodKey = `${from || "opening"}:${to}`;
    const existing = (state.cashReconciliations || []).find((item) => item.periodKey === periodKey && item.isDeleted !== true);
    if (existing && !["draft", "rejected"].includes(String(existing.approvalStatus || "").toLowerCase())) {
      throw Object.assign(new Error("An active reconciliation already exists for this period."), { status: 409 });
    }
    const totals = calculateCashTotals(state, from, to);
    const physicalCashCount = Number(payload.physicalCashCount ?? payload.physical_cash_count);
    if (!Number.isFinite(physicalCashCount) || physicalCashCount < 0) {
      const error = new Error("Please enter a valid physical cash count.");
      error.status = 400;
      throw error;
    }
    const difference = Number((physicalCashCount - totals.expectedClosing).toFixed(2));
    const type = difference > 0 ? "excess" : difference < 0 ? "shortage" : "matched";
    const record = {
      ...(existing || {}),
      id: existing?.id || crypto.randomUUID(),
      periodKey,
      reconciliationDate: to,
      fromDate: from,
      toDate: to,
      adjustmentType: type,
      adjustmentAmount: Math.abs(difference),
      openingCashBalance: totals.opening,
      cashCollections: totals.collections,
      cashExpenses: totals.expenses,
      transfersIn: totals.transfersIn,
      transfersOut: totals.transfersOut,
      approvedNetAdjustments: totals.approvedAdjustment,
      systemClosingBalance: totals.expectedClosing,
      expectedCash: totals.expectedClosing,
      physicalCashCount,
      remarks: String(payload.remarks || "").trim(),
      submittedBy: profile?.name || "",
      submittedById: profile?.id || profile?.email || userId || "",
      submittedAt: now.toISOString(),
      verifiedBy: profile?.name || "",
      verificationDate: now.toISOString(),
      approvalStatus: "submitted",
      approvedBy: "",
      approvedAt: "",
      rejectionReason: "",
      updatedAt: now.toISOString(),
      createdAt: existing?.createdAt || now.toISOString(),
      revision: Number(existing?.revision || 0) + 1,
    };
    state.cashReconciliations = upsertById(state.cashReconciliations || [], record).sort(financeNewestFirst);
    appendAudit(state, "Cash reconciliation submitted", record, profile, now);
    return state;
  }, userId);
}

async function decideCashReconciliation(id, decision, payload, userId, profile) {
  return patchAppState((state) => {
    if (profile?.role !== "Admin") {
      const error = new Error("Only Admin can approve or reject a cash difference.");
      error.status = 403;
      throw error;
    }
    const now = new Date();
    const existing = (state.cashReconciliations || []).find((item) => item.id === id && item.isDeleted !== true);
    if (!existing) {
      const error = new Error("Cash reconciliation was not found.");
      error.status = 404;
      throw error;
    }
    if (decision === "approve" && existing.approvalStatus === "approved") return state;
    if (!["approve", "reject"].includes(decision)) throw Object.assign(new Error("Invalid reconciliation decision."), { status: 400 });
    const approvalRemarks = String(payload?.approvalRemarks || payload?.approval_remarks || payload?.reason || payload?.rejectionReason || "").trim();
    if (!approvalRemarks) throw Object.assign(new Error("Approval remarks are required."), { status: 400 });
    if (!["submitted", "pending_approval"].includes(String(existing.approvalStatus || "").toLowerCase())) {
      throw Object.assign(new Error("Only a submitted reconciliation can be approved or rejected."), { status: 409 });
    }
    const record = {
      ...existing,
      approvalStatus: decision === "approve" ? "approved" : "rejected",
      approvedBy: profile?.name || "",
      approvedById: profile?.id || profile?.email || userId || "",
      approvedAt: now.toISOString(),
      approvalRemarks,
      approval_remarks: approvalRemarks,
      rejectionReason: decision === "reject" ? approvalRemarks : "",
      adjustmentApplied: decision === "approve" && existing.adjustmentType !== "matched",
      adjustmentAppliedAt: decision === "approve" && existing.adjustmentType !== "matched" ? now.toISOString() : "",
      updatedAt: now.toISOString(),
    };
    state.cashReconciliations = upsertById(state.cashReconciliations || [], record).sort(financeNewestFirst);
    appendAudit(state, decision === "approve" ? "Cash reconciliation adjustment approved" : "Cash reconciliation rejected", record, profile, now);
    return state;
  }, userId);
}

function calculateCashTotals(state, from = "", to = "") {
  const target = from || to || new Date().toISOString().slice(0, 10);
  const openingEntry = [...(state.openingBalances || [])].filter((item) => isActiveTransaction(item) && item.date && item.date <= target && financeAccountOf(item, "cash") === "cash").sort((a, b) => b.date.localeCompare(a.date))[0];
  const effectiveFrom = from || openingEntry?.date || "";
  const effectiveTo = to || from || new Date().toISOString().slice(0, 10);
  const inRange = (date) => (!effectiveFrom || date >= effectiveFrom) && (!effectiveTo || date <= effectiveTo);
  const collections = (state.otherCashCollections || []).filter((item) => isActiveTransaction(item) && financeAccountOf(item, "cash") === "cash" && inRange(item.date)).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expenses = (state.expenses || []).filter((item) => isActiveTransaction(item) && financeAccountOf(item, "cash") === "cash" && inRange(item.date)).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const transfersIn = (state.accountTransfers || []).filter((item) => isActiveTransaction(item) && normalizeFinanceAccount(item.toAccount || item.to_account || item.toAccountKey || item.to_account_key) === "cash" && inRange(financeDateOf(item))).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const transfersOut = (state.accountTransfers || []).filter((item) => isActiveTransaction(item) && normalizeFinanceAccount(item.fromAccount || item.from_account || item.fromAccountKey || item.from_account_key) === "cash" && inRange(financeDateOf(item))).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const approvedAdjustment = (state.cashReconciliations || []).filter((item) => isActiveTransaction(item) && String(item.approvalStatus || "").toLowerCase() === "approved" && inRange(financeDateOf(item))).reduce((sum, item) => {
    const amount = Number(item.adjustmentAmount || item.adjustment_amount || 0);
    return sum + (String(item.adjustmentType || item.adjustment_type).toLowerCase() === "shortage" ? -amount : String(item.adjustmentType || item.adjustment_type).toLowerCase() === "excess" ? amount : 0);
  }, 0);
  const opening = Number(openingEntry?.amount ?? state.openingCashBalance ?? 0) || 0;
  const calculatedClosing = opening + collections + transfersIn - expenses - transfersOut;
  const expectedClosing = calculatedClosing + approvedAdjustment;
  return { opening, collections, expenses, transfersIn, transfersOut, approvedAdjustment, calculatedClosing, expectedClosing };
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
  const paymentMethod = normalizePaymentMethod(payload.paymentMethod || payload.payment_method || payload.mode || "Cash");
  const accountKey = transactionAccount(payload, paymentMethod);
  return {
    id: payload.id || "",
    date,
    expense_date: date,
    particulars: String(payload.particulars || payload.expenseItem || "").trim(),
    voucherNo: String(payload.voucherNo || payload.voucher_number || "").trim(),
    voucher_number: String(payload.voucherNo || payload.voucher_number || "").trim(),
    amount,
    mode: paymentMethod,
    paymentMethod,
    payment_method: paymentMethod,
    accountKey,
    account_key: accountKey,
    accountName: financeAccountName(accountKey),
    account_name: financeAccountName(accountKey),
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
  const paymentMethod = normalizePaymentMethod(payload.paymentMethod || payload.payment_method || payload.mode || "Cash");
  const accountKey = transactionAccount(payload, paymentMethod);
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
    mode: paymentMethod,
    paymentMethod,
    payment_method: paymentMethod,
    collection_mode: paymentMethod,
    accountKey,
    account_key: accountKey,
    accountName: financeAccountName(accountKey),
    account_name: financeAccountName(accountKey),
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
  const accountKey = financeAccountOf(payload, "cash");
  const accountLabels = { cash: "Cash in Hand", federal_bank: "Federal Bank", tmb: "TMB" };
  return {
    id: payload.id || "",
    particulars: `Opening ${accountLabels[accountKey] || "Cash"} Balance`,
    accountKey,
    account_key: accountKey,
    accountName: accountLabels[accountKey] || "Cash",
    account_name: accountLabels[accountKey] || "Cash",
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
  const isoDate = raw.match(/^(\d{4}-\d{2}-\d{2})[T\s]/);
  if (isoDate) return isoDate[1];
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
        fileId: record.fileId || record.file_id || "",
        receiptId: record.receiptId || record.receipt_id || record.id || "",
        transactionId: record.transactionId || record.transaction_id || "",
        clientName: record.clientName || record.client_name || "",
        serviceType: record.serviceType || record.service_type || "",
        date: record.date,
        amount: record.amount,
        billedAmount: record.billedAmount || record.billed_amount || 0,
        outstandingBalance: record.outstandingBalance || record.outstanding_balance || 0,
        paymentMode: record.paymentMode || record.payment_mode || record.mode || "",
        account: record.accountName || record.account_name || financeAccountName(record.accountKey || record.account_key || ""),
        previousValue: record.previousValue || record.previous_value || null,
        newValue: record.newValue || record.new_value || null,
        particulars: record.particulars,
        status: record.status || record.receiptStatus || record.receipt_status || "",
        previousPushStatus: record.previousPushStatus || record.previous_push_status || "",
        linkedTransactionStatus: record.linkedTransactionStatus || record.linked_transaction_status || "",
        reversedAt: record.reversedAt || record.reversed_at || "",
        reversedBy: record.reversedBy || record.reversed_by || "",
        reversalReason: record.reversalReason || record.reversal_reason || "",
        changeReason: record.changeReason || record.change_reason || record.discountReason || record.discount_reason || "",
        approvalRemarks: record.approvalRemarks || record.approval_remarks || "",
        approvedBy: record.approvedBy || record.approved_by || "",
        approvedAt: record.approvedAt || record.approved_at || "",
      },
      user: profile?.name || "",
      role: profile?.role || "",
      at: now.toISOString(),
    },
  ].slice(-1000);
}

function normalizedExpenseItem(value = "") {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function expenseItemIsUsed(expenses = [], value = "") {
  const key = normalizedExpenseItem(value).toLowerCase();
  return Boolean(key && (expenses || []).some((expense) => normalizedExpenseItem(expense.particulars || expense.expenseItem || expense.expense_item).toLowerCase() === key));
}

async function addExpenseItem(value, userId, profile = {}) {
  const expenseItem = normalizedExpenseItem(value);
  if (!expenseItem) throw Object.assign(new Error("Enter an expense item name."), { status: 400 });
  return patchAppState((state) => {
    const items = Array.isArray(state.expenseItems) ? state.expenseItems : [];
    if (items.some((item) => normalizedExpenseItem(item).toLowerCase() === expenseItem.toLowerCase())) return state;
    state.expenseItems = [...items, expenseItem]
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right, "en-IN", { sensitivity: "base" }));
    appendAudit(state, "Expense item added", { id: `expense-item:${expenseItem}`, particulars: expenseItem }, profile, new Date());
    return state;
  }, userId);
}

async function removeExpenseItem(value, userId, profile = {}) {
  const expenseItem = normalizedExpenseItem(value);
  if (!expenseItem) throw Object.assign(new Error("Select an expense item to remove."), { status: 400 });
  return patchAppState((state) => {
    const used = expenseItemIsUsed(state.expenses || [], expenseItem);
    if (used) {
      throw Object.assign(new Error("This expense item has corresponding expense entries and cannot be removed."), { status: 409 });
    }
    const items = Array.isArray(state.expenseItems) ? state.expenseItems : [];
    const exists = items.some((item) => normalizedExpenseItem(item).toLowerCase() === expenseItem.toLowerCase());
    if (!exists) throw Object.assign(new Error("Expense item was not found."), { status: 404 });
    state.expenseItems = items.filter((item) => normalizedExpenseItem(item).toLowerCase() !== expenseItem.toLowerCase());
    appendAudit(state, "Expense item removed", { id: `expense-item:${expenseItem}`, particulars: expenseItem }, profile, new Date());
    return state;
  }, userId);
}

module.exports = {
  FINANCE_ACCOUNTS,
  PAYMENT_METHODS,
  saveExpense,
  deleteExpense,
  saveCollection,
  saveFeeReceipt,
  getFeeCollectionEditor,
  editFeeCollection,
  reverseFeeReceipt,
  reverseUnlinkedFeeReceipt,
  deleteCollection,
  saveOpeningBalance,
  saveOpeningBalances,
  deleteOpeningBalance,
  submitCashReconciliation,
  decideCashReconciliation,
  calculateDailyReportBalanceSummary,
  accountSummary,
  saveAccountTransfer,
  deleteAccountTransfer,
  classifyLegacyBankTransaction,
  addExpenseItem,
  removeExpenseItem,
  expenseItemIsUsed,
};
