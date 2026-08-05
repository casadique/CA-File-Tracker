const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

const actions = source.match(/function nonBilledFileActions[\s\S]*?(?=\nfunction fileRowActions)/)?.[0] || "";
assert.ok(actions, "Missing modern Non-Billed actions renderer");
for (const requirement of [
  /billed-primary-action/,
  /data-billed-menu-toggle/,
  /data-edit/,
  /data-billable/,
  /data-mark-billed/,
  /data-delete/,
  /aria-haspopup="menu"/,
  /aria-expanded="false"/,
]) assert.match(actions, requirement);

assert.match(source, /state\.filters\.listView === "nonBilled" && isNonBilledFile\(file\)\) return nonBilledFileActions\(file\)/);
assert.match(source, /const actionsColumnClass = isBilledView \? "billed-actions-column" : isNonBilledView \? "non-billed-actions-column"/);
assert.match(source, /document\.querySelectorAll\("\[data-billed-menu-toggle\]"\)/,
  "Non-Billed three-dot menus must use the shared functional action portal");
assert.match(source, /document\.querySelectorAll\("\[data-billable\]"\)/);
assert.match(source, /document\.querySelectorAll\("\[data-mark-billed\]"\)/);
assert.match(source, /document\.querySelectorAll\("\[data-delete\]"\)/);

assert.match(styles, /\.non-billed-actions-column\s*\{[\s\S]*?position:\s*sticky[\s\S]*?right:\s*0/);
assert.match(styles, /\.non-billed-actions\s*\{[\s\S]*?flex-wrap:\s*nowrap/);

console.log("Non-Billed contextual primary action, three-dot menu and handler wiring checks passed.");
