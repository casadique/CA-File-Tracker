const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env"), override: true });
require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const compression = require("compression");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const { env } = require("./src/config/env");
const apiRoutes = require("./src/routes");
const { errorHandler, notFoundHandler } = require("./src/middleware/error");

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
app.use(rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
}));
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));

app.use("/api", apiRoutes);
app.use(["/src", "/database", "/tools", "/Backups", "/data"], (_req, res) => {
  res.status(404).send("Not found");
});
app.use(express.static(publicRoot, {
  extensions: ["html"],
  dotfiles: "deny",
  maxAge: env.isProduction ? "10m" : 0,
}));

app.get("*", (_req, res) => {
  res.sendFile(path.join(publicRoot, "index.html"));
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`CA File Tracker running on port ${env.port}`);
});
