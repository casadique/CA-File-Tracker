const express = require("express");

const authRoutes = require("./authRoutes");
const stateRoutes = require("./stateRoutes");
const fileRoutes = require("./fileRoutes");
const userRoutes = require("./userRoutes");
const storageRoutes = require("./storageRoutes");
const exportRoutes = require("./exportRoutes");
const legacyRoutes = require("./legacyRoutes");

const router = express.Router();

router.get("/health", (_req, res) => res.json({ ok: true, app: "CA File Tracker" }));
router.use("/", legacyRoutes);
router.use("/auth", authRoutes);
router.use("/state", stateRoutes);
router.use("/files", fileRoutes);
router.use("/users", userRoutes);
router.use("/storage", storageRoutes);
router.use("/exports", exportRoutes);

module.exports = router;
