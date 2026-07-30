const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const { createUser, updateUser, setUserActive, sendPasswordReset } = require("../services/userService");

const router = express.Router();

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
