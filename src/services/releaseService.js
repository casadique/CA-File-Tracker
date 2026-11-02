const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const APP_ROOT = path.resolve(__dirname, "..", "..");
const RELEASE_ENV_KEYS = ["RENDER_GIT_COMMIT", "SOURCE_COMMIT", "GIT_COMMIT", "VERCEL_GIT_COMMIT_SHA"];

function environmentRelease() {
  for (const key of RELEASE_ENV_KEYS) {
    const value = String(process.env[key] || "").trim();
    if (value) return value;
  }
  return "";
}

function repositoryRelease() {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: APP_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 2000,
    }).trim();
  } catch {
    return "";
  }
}

function contentRelease() {
  const hash = crypto.createHash("sha256");
  ["package-lock.json", "server.js", "index.html", "app.min.js"].forEach((relativePath) => {
    const filePath = path.join(APP_ROOT, relativePath);
    if (fs.existsSync(filePath)) hash.update(fs.readFileSync(filePath));
  });
  return hash.digest("hex");
}

const releaseId = environmentRelease() || repositoryRelease() || contentRelease();

function applicationRelease() {
  return {
    app: "CA File Tracker",
    release: releaseId,
  };
}

module.exports = { applicationRelease };
