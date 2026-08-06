const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const server = fs.readFileSync(path.join(root, "server.js"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const standalone = fs.readFileSync(path.join(root, "CA File Tracker.html"), "utf8");

assert.match(server, /req\.path === "\/app\.js" \|\| req\.path === "\/styles\.css"[\s\S]*?"no-cache, must-revalidate"/,
  "First-party app assets must revalidate instead of remaining immutable for a year");

function assetVersions(html, label) {
  const css = html.match(/styles\.css\?v=([^"']+)/)?.[1];
  const js = html.match(/app\.js\?v=([^"']+)/)?.[1];
  assert.ok(css && js, `${label} must version both main assets`);
  assert.equal(css, js, `${label} must use the same app and stylesheet version`);
  assert.notEqual(js, "20260805-status-sort-v55", `${label} must not reuse the stale v55 bundle`);
  return js;
}

assert.equal(assetVersions(index, "index.html"), assetVersions(standalone, "CA File Tracker.html"),
  "Both entry documents must reference the same asset release");

console.log("First-party asset revalidation and release-version checks passed.");
