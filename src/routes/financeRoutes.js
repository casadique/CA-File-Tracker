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
  deleteOpeningBalance,
  submitCashReconciliation,
  decideCashReconciliation,
  calculateDailyReportBalanceSummary,
  FINANCE_ACCOUNTS,
  PAYMENT_METHODS,
  accountSummary,
  saveAccountTransfer,
  deleteAccountTransfer,
  classifyLegacyBankTransaction,
} = require("../services/financeService");

const router = express.Router();
const financeRoles = ["Admin", "Manager"];

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
    const state = await saveExpense(req.body.expense || req.body, req.user.id, req.profile);
    res.json({ ok: true, expenses: state.expenses || [] });
  } catch (error) {
    next(error);
  }
});

router.delete("/expenses/:id", requireAuth, requireRole(...financeRoles), async (req, res, next) => {
  try {
    const state = await deleteExpense(req.params.id, req.user.id, req.profile);
    res.json({ ok: true, expenses: state.expenses || [] });
  } catch (error) {
    next(error);
  }
});

router.post("/collections", requireAuth, requireRole(...financeRoles), async (req, res, next) => {
  try {
    const state = await saveCollection(req.body.collection || req.body, req.user.id, req.profile);
    res.json({
      ok: true,
      otherCashCollections: (state.otherCashCollections || []).filter((item) => item.isDeleted !== true && item.is_deleted !== true),
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
