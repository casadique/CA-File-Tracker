const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const { createUser, updateUser, setUserActive, sendPasswordReset } = require("../services/userService");
const { supabaseAdmin } = require("../config/supabase");

const router = express.Router();

router.get("/directory", requireAuth, async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("app_users")
      .select("id,auth_user_id,email,name,role,permissions,is_active")
      .eq("is_active", true)
      .order("name");
    if (error) throw error;
    res.json({ users: data || [] });
  } catch (error) { next(error); }
});

router.post("/", requireAuth, requireRole("Admin"), async (req, res, next) => {
  try {
    res.status(201).json({ user: await createUser(req.body) });
  } catch (error) {
    next(error);
  }
});

router.patch("/:authUserId", requireAuth, requireRole("Admin"), async (req, res, next) => {
  try {
    res.json({ user: await updateUser(req.params.authUserId, req.body) });
  } catch (error) {
    next(error);
  }
});

router.post("/:authUserId/activation", requireAuth, requireRole("Admin"), async (req, res, next) => {
  try {
    res.json({ user: await setUserActive(req.params.authUserId, req.body.isActive) });
  } catch (error) {
    next(error);
  }
});

router.post("/password-reset", requireAuth, requireRole("Admin"), async (req, res, next) => {
  try {
    res.json(await sendPasswordReset(req.body.email));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
