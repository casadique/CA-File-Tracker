const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const { getAppState } = require("../services/appStateService");
const {
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
  updateOpeningBalances,
  deleteOpeningBalance,
  submitCashReconciliation,
  decideCashReconciliation,
  calculateDailyReportBalanceSummary,
  FINANCE_ACCOUNTS,
  PAYMENT_METHODS,
  accountSummary,
  queryFinanceTransactions,
  saveAccountTransfer,
  deleteAccountTransfer,
  classifyLegacyBankTransaction,
  addExpenseItem,
  removeExpenseItem,
} = require("../services/financeService");
const {
  receiptById,
  receiptPdf,
  receiptHistory,
  safeReceiptFilename,
  historicalReceiptPreview,
  generateHistoricalReceipts,
} = require("../services/receiptService");

const router = express.Router();
const financeRoles = ["Admin", "Manager"];
const receiptViewRoles = ["Admin", "Manager", "Staff Manager", "Staff", "Viewer"];

router.get("/", requireAuth, requireRole(...financeRoles), async (req, res, next) => {
  try {
    const state = await getAppState();
    res.json({
      ok: true,
      expenses: state.expenses || [],
      otherCashCollections: (state.otherCashCollections || []).filter((item) => item.isDeleted !== true && item.is_deleted !== true),
      feeReceipts: state.feeReceipts || [],
      openingBalances: state.openingBalances || [],
      otherCashCollectionSources: state.otherCashCollectionSources || [],
      expenseItems: state.expenseItems || [],
      cashReconciliations: state.cashReconciliations || [],
      accountTransfers: (state.accountTransfers || []).filter((item) => item.isDeleted !== true && item.is_deleted !== true),
      accounts: FINANCE_ACCOUNTS,
      paymentMethods: PAYMENT_METHODS,
      accountSummary: accountSummary(state, req.query.date),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/daily-report-summary", requireAuth, requireRole(...financeRoles), async (req, res, next) => {
  try {
    const state = await getAppState();
    res.json({ ok: true, summary: calculateDailyReportBalanceSummary(state, req.query.date) });
  } catch (error) {
    next(error);
  }
});

router.get("/transactions", requireAuth, requireRole(...financeRoles), async (req, res, next) => {
  try {
    const state = await getAppState();
    res.json({ ok: true, ...queryFinanceTransactions(state, req.query || {}) });
  } catch (error) { next(error); }
});

router.post("/reconciliations", requireAuth, requireRole(...financeRoles), async (req, res, next) => {
  try {
    const state = await submitCashReconciliation(req.body.reconciliation || req.body, req.user.id, req.profile);
    res.json({ ok: true, cashReconciliations: state.cashReconciliations || [] });
  } catch (error) { next(error); }
});

router.post("/reconciliations/:id/approve", requireAuth, requireRole("Admin"), async (req, res, next) => {
  try {
    const state = await decideCashReconciliation(req.params.id, "approve", req.body || {}, req.user.id, req.profile);
    res.json({ ok: true, cashReconciliations: state.cashReconciliations || [] });
  } catch (error) { next(error); }
});

router.post("/reconciliations/:id/reject", requireAuth, requireRole("Admin"), async (req, res, next) => {
  try {
    const state = await decideCashReconciliation(req.params.id, "reject", req.body || {}, req.user.id, req.profile);
    res.json({ ok: true, cashReconciliations: state.cashReconciliations || [] });
  } catch (error) { next(error); }
});

router.post("/expenses", requireAuth, requireRole(...financeRoles), async (req, res, next) => {
  try {
    const incoming = req.body.expense || req.body;
    const state = await saveExpense(incoming, req.user.id, req.profile);
    const expense = (state.expenses || []).find((row) => row.id === incoming.id) || null;
    res.json({ ok: true, expense });
  } catch (error) {
    next(error);
  }
});

router.post("/expense-items", requireAuth, requireRole(...financeRoles), async (req, res, next) => {
  try {
    const state = await addExpenseItem(req.body?.item, req.user.id, req.profile);
    res.json({ ok: true, expenseItems: state.expenseItems || [] });
  } catch (error) { next(error); }
});

router.delete("/expense-items", requireAuth, requireRole(...financeRoles), async (req, res, next) => {
  try {
    const state = await removeExpenseItem(req.body?.item, req.user.id, req.profile);
    res.json({ ok: true, expenseItems: state.expenseItems || [] });
  } catch (error) { next(error); }
});

router.delete("/expenses/:id", requireAuth, requireRole(...financeRoles), async (req, res, next) => {
  try {
    await deleteExpense(req.params.id, req.user.id, req.profile);
    res.json({ ok: true, deletedExpenseId: req.params.id });
  } catch (error) {
    next(error);
  }
});

router.post("/collections", requireAuth, requireRole(...financeRoles), async (req, res, next) => {
  try {
    const incoming = req.body.collection || req.body;
    const state = await saveCollection(incoming, req.user.id, req.profile);
    res.json({
      ok: true,
      collection: (state.otherCashCollections || []).find((item) => item.id === incoming.id) || null,
      otherCashCollectionSources: state.otherCashCollectionSources || [],
    });
  } catch (error) {
    next(error);
  }
});

router.post("/fee-receipts/:fileId", requireAuth, requireRole(...financeRoles), async (req, res, next) => {
  try {
    const state = await saveFeeReceipt(
      req.params.fileId,
      req.body.receipt || {},
      req.body.collection || {},
      req.user.id,
      req.profile,
    );
    const requestedReceiptId = req.body.receipt?.feeReceiptId || req.body.receipt?.id || "";
    const issuedReceipt = (state.feeReceipts || []).find((receipt) => receipt.id === requestedReceiptId) || null;
    const linkedCollection = issuedReceipt ? (state.otherCashCollections || []).find((item) =>
      item.id === issuedReceipt.transactionId
      || item.id === issuedReceipt.transaction_id
      || item.feeReceiptId === issuedReceipt.id
      || item.fee_receipt_id === issuedReceipt.id
    ) || null : null;
    res.json({
      ok: true,
      receipt: issuedReceipt,
      file: (state.files || []).find((file) => file.id === req.params.fileId) || null,
      collection: linkedCollection,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/receipts/historical/preview", requireAuth, requireRole("Admin"), async (_req, res, next) => {
  try { res.json({ ok: true, ...(await historicalReceiptPreview()) }); } catch (error) { next(error); }
});

router.post("/receipts/historical/generate", requireAuth, requireRole("Admin"), async (req, res, next) => {
  try {
    if (String(req.body.confirmation || "").trim() !== "GENERATE HISTORICAL RECEIPTS") {
      return res.status(400).json({ error: "Type GENERATE HISTORICAL RECEIPTS to confirm." });
    }
    const state = await generateHistoricalReceipts(req.user.id, req.profile);
    res.json({ ok: true, result: state.lastHistoricalReceiptRun || {}, feeReceipts: state.feeReceipts || [] });
  } catch (error) { next(error); }
});

router.post("/receipts/:receiptId/generate-historical", requireAuth, requireRole("Admin"), async (req, res, next) => {
  try {
    const state = await generateHistoricalReceipts(req.user.id, req.profile, req.params.receiptId);
    const receipt = (state.feeReceipts || []).find((row) => row.id === req.params.receiptId) || null;
    res.json({ ok: true, receipt, feeReceipts: state.feeReceipts || [] });
  } catch (error) { next(error); }
});

router.get("/receipts/:receiptId/history", requireAuth, requireRole(...receiptViewRoles), async (req, res, next) => {
  try { res.json({ ok: true, events: await receiptHistory(req.params.receiptId) }); } catch (error) { next(error); }
});

router.get("/receipts/:receiptId/pdf", requireAuth, requireRole(...receiptViewRoles), async (req, res, next) => {
  try {
    const result = await receiptPdf(req.params.receiptId);
    const disposition = req.query.download === "1" ? "attachment" : "inline";
    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", `${disposition}; filename="${safeReceiptFilename(result.receipt)}"`);
    res.send(result.pdf);
  } catch (error) { next(error); }
});

router.get("/receipts/:receiptId", requireAuth, requireRole(...receiptViewRoles), async (req, res, next) => {
  try { res.json({ ok: true, ...(await receiptById(req.params.receiptId)) }); } catch (error) { next(error); }
});

router.get("/fee-receipts/receipt/:receiptId/editor", requireAuth, requireRole(...financeRoles), async (req, res, next) => {
  try {
    res.json({ ok: true, ...(await getFeeCollectionEditor(req.params.receiptId)) });
  } catch (error) {
    next(error);
  }
});

router.patch("/fee-receipts/receipt/:receiptId", requireAuth, requireRole(...financeRoles), async (req, res, next) => {
  try {
    const state = await editFeeCollection(req.params.receiptId, req.body.collection || req.body, req.user.id, req.profile);
    res.json({
      ok: true,
      files: state.files || [],
      feeReceipts: state.feeReceipts || [],
      otherCashCollections: (state.otherCashCollections || []).filter((item) => item.isDeleted !== true && item.is_deleted !== true),
      cashReconciliations: state.cashReconciliations || [],
      auditLog: state.auditLog || [],
    });
  } catch (error) {
    next(error);
  }
});

router.post("/fee-receipts/:fileId/reverse-unlinked", requireAuth, requireRole(...financeRoles), async (req, res, next) => {
  try {
    const state = await reverseUnlinkedFeeReceipt(req.params.fileId, req.user.id, req.profile);
    res.json({ ok: true, files: state.files || [], feeReceipts: state.feeReceipts || [] });
  } catch (error) {
    next(error);
  }
});

router.post("/fee-receipts/receipt/:receiptId/not-received", requireAuth, requireRole(...financeRoles), async (req, res, next) => {
  try {
    const state = await reverseFeeReceipt(
      req.params.receiptId,
      req.body.reason,
      req.user.id,
      req.profile,
    );
    res.json({
      ok: true,
      files: state.files || [],
      feeReceipts: state.feeReceipts || [],
      otherCashCollections: (state.otherCashCollections || []).filter((item) => item.isDeleted !== true && item.is_deleted !== true),
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/collections/:id", requireAuth, requireRole(...financeRoles), async (req, res, next) => {
  try {
    const state = await deleteCollection(req.params.id, req.user.id, req.profile);
    res.json({
      ok: true,
      files: state.files || [],
      feeReceipts: state.feeReceipts || [],
      otherCashCollections: (state.otherCashCollections || []).filter((item) => item.isDeleted !== true && item.is_deleted !== true),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/opening-balances", requireAuth, requireRole("Admin"), async (req, res, next) => {
  try {
    const state = await saveOpeningBalance(req.body.openingBalance || req.body, req.user.id, req.profile);
    res.json({ ok: true, openingBalances: state.openingBalances || [] });
  } catch (error) {
    next(error);
  }
});

router.post("/opening-balances/batch", requireAuth, requireRole("Admin"), async (req, res, next) => {
  try {
    const state = await saveOpeningBalances(req.body.openingBalances || [], req.user.id, req.profile, req.body.reason);
    res.json({ ok: true, openingBalances: state.openingBalances || [], auditLog: state.auditLog || [] });
  } catch (error) { next(error); }
});

router.put("/opening-balances/batch/:date", requireAuth, requireRole("Admin"), async (req, res, next) => {
  try {
    const state = await updateOpeningBalances(req.params.date, req.body.openingBalances || [], req.user.id, req.profile, req.body.reason);
    res.json({ ok: true, openingBalances: state.openingBalances || [], auditLog: state.auditLog || [] });
  } catch (error) { next(error); }
});

router.delete("/opening-balances/:id", requireAuth, requireRole("Admin"), async (req, res, next) => {
  try {
    const state = await deleteOpeningBalance(req.params.id, req.user.id, req.profile);
    res.json({ ok: true, openingBalances: state.openingBalances || [] });
  } catch (error) {
    next(error);
  }
});

router.post("/transfers", requireAuth, requireRole(...financeRoles), async (req, res, next) => {
  try {
    const state = await saveAccountTransfer(req.body.transfer || req.body, req.user.id, req.profile);
    res.json({ ok: true, accountTransfers: (state.accountTransfers || []).filter((item) => item.isDeleted !== true && item.is_deleted !== true), accountSummary: accountSummary(state) });
  } catch (error) { next(error); }
});

router.delete("/transfers/:id", requireAuth, requireRole(...financeRoles), async (req, res, next) => {
  try {
    const state = await deleteAccountTransfer(req.params.id, req.user.id, req.profile);
    res.json({ ok: true, accountTransfers: (state.accountTransfers || []).filter((item) => item.isDeleted !== true && item.is_deleted !== true), accountSummary: accountSummary(state) });
  } catch (error) { next(error); }
});

router.post("/classify-legacy-bank", requireAuth, requireRole("Admin"), async (req, res, next) => {
  try {
    const state = await classifyLegacyBankTransaction(req.body || {}, req.user.id, req.profile);
    res.json({ ok: true, expenses: state.expenses || [], otherCashCollections: (state.otherCashCollections || []).filter((item) => item.isDeleted !== true && item.is_deleted !== true), feeReceipts: state.feeReceipts || [], accountSummary: accountSummary(state) });
  } catch (error) { next(error); }
});

module.exports = router;
