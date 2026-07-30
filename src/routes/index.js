const express = require("express");

const authRoutes = require("./authRoutes");
const stateRoutes = require("./stateRoutes");
const fileRoutes = require("./fileRoutes");
const chatRoutes = require("./chatRoutes");
const userRoutes = require("./userRoutes");
const storageRoutes = require("./storageRoutes");
const exportRoutes = require("./exportRoutes");
const legacyRoutes = require("./legacyRoutes");
const { env } = require("../config/env");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({
    ok: true,
    app: "CA File Tracker",
    envReady: env.isConfigured,
    missingEnv: env.missing,
  });
});
router.use("/", legacyRoutes);
router.use("/auth", authRoutes);
router.use("/state", stateRoutes);
router.use("/files", fileRoutes);
router.use("/chat", chatRoutes);
router.use("/users", userRoutes);
router.use("/storage", storageRoutes);
router.use("/exports", exportRoutes);

module.exports = router;
