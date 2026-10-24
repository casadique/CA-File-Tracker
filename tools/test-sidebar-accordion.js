const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const client = read("sidebar-accordion.js");
const styles = read("sidebar-accordion.css");
const index = read("index.html");

assert.match(client, /OPEN_GROUP_KEY/, "Sidebar must remember the expanded accordion section.");
assert.match(client, /activeGroup[\s\S]+savedOpenGroup/, "The current route must automatically open its section.");
assert.match(client, /groups\.forEach[\s\S]+setGroupState\(other, willOpen && other === group\)/, "Only one major accordion section may remain open.");
assert.match(client, /aria-expanded/, "Accordion headers must expose aria-expanded.");
assert.match(client, /aria-current/, "The active navigation item must expose aria-current.");
assert.match(client, /window\.innerWidth <= 880[\s\S]+closeMobileSidebar/, "Mobile navigation must close after selection.");
assert.match(styles, /overflow-y:auto; overflow-x:hidden/, "Sidebar navigation must scroll independently without horizontal scrolling.");
assert.match(styles, /prefers-reduced-motion:reduce/, "Sidebar animation must respect reduced-motion preferences.");
assert.match(styles, /--sidebar-width: 276px/, "Desktop sidebar must use the readable BidLoft-style width.");
assert.match(styles, /grid-template-rows:0fr/, "Collapsed sections must hide content without loading module data.");
assert.match(styles, /box-shadow:\s*inset 3px 0 0 var\(--sidebar-accent\)/, "Expanded sections must have the teal BidLoft-style accent.");
assert.match(styles, /nav-group-items-inner::before/, "Expanded sections must show a nested-item guide line.");
assert.match(styles, /border-bottom:\s*1px solid var\(--sidebar-border\)/, "Major sidebar sections must be visually separated.");
assert.ok(index.includes("20261024-bidloft-sidebar-v128"), "Production must load the new sidebar assets without a stale browser cache.");
assert.ok(index.includes("sidebar-accordion.css") && index.includes("sidebar-accordion.js"), "Sidebar component assets must load in production.");

console.log("Modern accessible sidebar accordion checks passed.");
