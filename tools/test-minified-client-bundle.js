const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const minified = fs.readFileSync(path.join(root, "app.min.js"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");

assert.match(index, /app\.min\.js\?v=20260830-[a-z0-9-]+/);
assert.ok(minified.length < source.length * 0.8, `Minified bundle is unexpectedly large: ${minified.length}/${source.length}`);
assert.match(minified, /deferredHistoryExcluded/);
assert.match(minified, /FILE_SNAPSHOT_USER_KEY/);

console.log(`Minified client bundle checks passed: ${source.length} -> ${minified.length} bytes.`);
