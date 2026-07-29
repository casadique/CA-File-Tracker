const express = require("express");
const { createSupabaseClient } = require("../config/supabase");
const { env } = require("../config/env");
const { requireAuth } = require("../middleware/auth");
const { profileForAuthUser, recoverAdminUser } = require("../services/userService");

const router = express.Router();

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }
    const profile = await profileForAuthUser(data.user);
    if (!profile || profile.is_active === false) {
      res.status(403).json({ error: "User access is inactive or not linked. Ask Admin to activate this user." });
      return;
    }
    res.json({
      session: data.session,
      user: data.user,
      profile,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/recover-admin", async (req, res, next) => {
  try {
    if (!env.adminRecoveryToken) {
      res.status(404).json({ error: "Admin recovery is not enabled." });
      return;
    }
    const token = req.get("x-admin-recovery-token") || req.body?.token || "";
    if (token !== env.adminRecoveryToken) {
      res.status(403).json({ error: "Invalid admin recovery token." });
      return;
    }
    const { email = "casadique@gmail.com", password, name = "CA Sadique" } = req.body || {};
    const result = await recoverAdminUser({ email, password, name });
    res.json({
      ok: true,
      email: result.authUser.email,
      role: result.profile.role,
      isActive: result.profile.is_active,
      warning: result.legacyWarning || "",
    });
  } catch (error) {
    console.error("Admin recovery failed", error);
    res.status(Number(error.status || error.statusCode || 500)).json({
      error: error.message || "Admin recovery failed.",
      code: error.code || "",
      details: error.details || "",
      hint: error.hint || "",
    });
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user, profile: req.profile });
});

router.post("/logout", (_req, res) => {
  res.json({ ok: true });
});

module.exports = router;
