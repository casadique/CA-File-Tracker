const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const { getAppState } = require("../services/appStateService");
const {
  saveExpense,
  deleteExpense,
  saveCollection,
  deleteCollection,
} = require("../services/financeService");

const router = express.Router();
const financeRoles = ["Admin", "Manager"];

router.get("/", requireAuth, requireRole(...financeRoles), async (_req, res, next) => {
  try {
    const state = await getAppState();
    res.json({
      ok: true,
      expenses: state.expenses || [],
      otherCashCollections: state.otherCashCollections || [],
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
      otherCashCollections: state.otherCashCollections || [],
      otherCashCollectionSources: state.otherCashCollectionSources || [],
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/collections/:id", requireAuth, requireRole(...financeRoles), async (req, res, next) => {
  try {
    const state = await deleteCollection(req.params.id, req.user.id, req.profile);
    res.json({ ok: true, otherCashCollections: state.otherCashCollections || [] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
