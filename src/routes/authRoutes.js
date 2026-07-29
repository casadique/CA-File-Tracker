const express = require("express");
const { createSupabaseClient } = require("../config/supabase");
const { requireAuth } = require("../middleware/auth");
const { profileForAuthUser } = require("../services/userService");

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

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user, profile: req.profile });
});

router.post("/logout", (_req, res) => {
  res.json({ ok: true });
});

module.exports = router;
