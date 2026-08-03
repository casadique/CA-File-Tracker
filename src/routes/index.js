const express = require("express");

const authRoutes = require("./authRoutes");
const stateRoutes = require("./stateRoutes");
const fileRoutes = require("./fileRoutes");
const chatRoutes = require("./chatRoutes");
const financeRoutes = require("./financeRoutes");
const visitorRoutes = require("./visitorRoutes");
const userRoutes = require("./userRoutes");
const storageRoutes = require("./storageRoutes");
const exportRoutes = require("./exportRoutes");
const legacyRoutes = require("./legacyRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const clientRoutes = require("./clientRoutes");
const notificationRoutes = require("./notificationRoutes");
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
router.use("/dashboard", dashboardRoutes);
router.use("/clients", clientRoutes);
router.use("/notifications", notificationRoutes);
router.use("/files", fileRoutes);
router.use("/chat", chatRoutes);
router.use("/finance", financeRoutes);
router.use("/visitors", visitorRoutes);
router.use("/users", userRoutes);
router.use("/storage", storageRoutes);
router.use("/exports", exportRoutes);

module.exports = router;
