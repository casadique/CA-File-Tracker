const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const client = read("update-banner.js");
const styles = read("update-banner.css");
const routes = read("src/routes/index.js");
const releaseService = read("src/services/releaseService.js");
const index = read("index.html");

assert.match(routes, /router\.get\("\/release"[\s\S]*?Cache-Control[\s\S]*?applicationRelease/, "A non-cached release endpoint must expose the deployed build.");
assert.match(releaseService, /RENDER_GIT_COMMIT[\s\S]*?git[\s\S]*?rev-parse[\s\S]*?contentRelease/, "Release detection must use the deployment commit with safe fallbacks.");
assert.match(client, /setInterval\(checkForUpdate, POLL_INTERVAL_MS\)/, "Open sessions must periodically check for a newer release.");
assert.match(client, /addEventListener\("focus", checkForUpdate\)/, "Returning to the app must immediately check for an update.");
assert.match(client, /visibilitychange[\s\S]*?checkForUpdate/, "Visible background tabs must check for an update.");
assert.match(client, /cache:\s*"no-store"/, "Release checks must bypass browser caches.");
assert.match(client, /persistTransactionEntryDrafts/, "Reload must preserve transaction and expense drafts.");
assert.match(client, /window\.location\.reload\(\)/, "The update action must reload the latest app.");
assert.match(styles, /app-update-banner\[hidden\]/, "The update banner must stay hidden until a new release exists.");
assert.match(styles, /@media \(max-width: 700px\)/, "The update banner must remain usable on mobile.");
assert.ok(index.includes("update-banner.css?v=20261102-release-banner-v129"), "The production page must load the versioned banner styles.");
assert.ok(index.includes("update-banner.js?v=20261102-release-banner-v129"), "The production page must load the versioned update monitor.");

console.log("Application release detection and reload banner checks passed.");
