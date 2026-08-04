const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const compression = require("compression");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const { env } = require("./src/config/env");
const apiRoutes = require("./src/routes");
const { errorHandler, notFoundHandler } = require("./src/middleware/error");
const { migrateDisplayNames, migrateServiceTypes, migrateNotificationRetention } = require("./src/services/appStateService");
const { dispatchDueReminders } = require("./src/services/pushNotificationService");

const app = express();
const publicRoot = __dirname;

app.set("trust proxy", 1);
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: env.corsOrigin,
  credentials: true,
}));
app.use(compression());
const apiRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: Math.max(env.rateLimitMax, 3000),
  standardHeaders: true,
  legacyHeaders: false,
});
const loginRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));

app.use("/api/auth/login", loginRateLimiter);
app.use("/api", apiRateLimiter, apiRoutes);
app.use(["/src", "/database", "/tools", "/Backups", "/data"], (_req, res) => {
  res.status(404).send("Not found");
});
app.use((req, res, next) => {
  if (req.path === "/service-worker.js" || req.path === "/manifest.webmanifest") {
    res.set("Cache-Control", "no-cache, must-revalidate");
  } else if (req.path === "/" || req.path.endsWith(".html")) {
    res.set("Cache-Control", "no-store");
  } else if (req.path.endsWith(".js") || req.path.endsWith(".css")) {
    res.set("Cache-Control", req.query.v ? "public, max-age=31536000, immutable" : "no-cache, must-revalidate");
  }
  next();
});
app.use(express.static(publicRoot, {
  extensions: ["html"],
  dotfiles: "deny",
  etag: true,
  maxAge: 0,
}));

app.get("*", (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.sendFile(path.join(publicRoot, "index.html"));
});

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    const migration = await migrateDisplayNames();
    if (migration.changed) console.log("Staff display-name migration applied.");
    const serviceMigration = await migrateServiceTypes();
    if (serviceMigration.changed) console.log("Service-type migration applied.");
    const notificationMigration = await migrateNotificationRetention();
    if (notificationMigration.changed) console.log("Existing notifications archived and seven-day retention enabled.");
  } catch (error) {
    console.error("Startup data migration failed:", error.message);
  }
  app.listen(env.port, () => {
    console.log(`CA File Tracker running on port ${env.port}`);
  });
  const runDueReminders = () => dispatchDueReminders().catch((error) => console.error("Due reminder dispatch failed:", error.message));
  setTimeout(runDueReminders, 15000).unref();
  setInterval(runDueReminders, 60 * 60 * 1000).unref();
}

startServer();
