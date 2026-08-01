const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const { getAppState } = require("../services/appStateService");
const {
  saveExpense,
  deleteExpense,
  saveCollection,
  saveFeeReceipt,
  reverseUnlinkedFeeReceipt,
  deleteCollection,
  saveOpeningBalance,
  deleteOpeningBalance,
} = require("../services/financeService");

const router = express.Router();
const financeRoles = ["Admin", "Manager"];

router.get("/", requireAuth, requireRole(...financeRoles), async (_req, res, next) => {
  try {
    const state = await getAppState();
    res.json({
      ok: true,
      expenses: state.expenses || [],
      otherCashCollections: (state.otherCashCollections || []).filter((item) => item.isDeleted !== true && item.is_deleted !== true),
      openingBalances: state.openingBalances || [],
      otherCashCollectionSources: state.otherCashCollectionSources || [],
      expenseItems: state.expenseItems || [],
    });
  } catch (error) {
    next(error);
  }
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
      otherCashCollections: (state.otherCashCollections || []).filter((item) => item.isDeleted !== true && item.is_deleted !== true),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/fee-receipts/:fileId/reverse-unlinked", requireAuth, requireRole(...financeRoles), async (req, res, next) => {
  try {
    const state = await reverseUnlinkedFeeReceipt(req.params.fileId, req.user.id, req.profile);
    res.json({ ok: true, files: state.files || [] });
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

module.exports = router;
