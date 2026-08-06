const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const styles = fs.readFileSync(path.resolve(__dirname, "..", "styles.css"), "utf8");

assert.match(styles, /\.balance-opening-summary-grid \.opening-balance-entry-wrap\s*\{[\s\S]*?width:\s*min\(100%, 560px\)[\s\S]*?max-width:\s*560px/,
  "Opening balance entry area should use a compact content-sized width");
assert.match(styles, /\.opening-balance-entry-table \.opening-date-column\s*\{\s*width:\s*190px/);
assert.match(styles, /\.opening-balance-entry-table \.opening-account-column\s*\{\s*width:\s*150px/);
assert.match(styles, /\.opening-balance-entry-table \.opening-amount-column\s*\{\s*width:\s*170px/);
assert.match(styles, /\.opening-balance-entry-table\s*\{[\s\S]*?min-width:\s*0[\s\S]*?table-layout:\s*fixed/,
  "Opening balance columns must retain their compact geometry");
assert.doesNotMatch(styles, /\.opening-balance-entry-table\s*\{\s*min-width:\s*620px/,
  "Mobile opening balances must not force a horizontal scrollbar");
assert.match(styles, /@media \(max-width: 760px\)[\s\S]*?\.opening-balance-entry-table \.opening-date-column\s*\{\s*width:\s*44%[\s\S]*?\.opening-account-column\s*\{\s*width:\s*29%[\s\S]*?\.opening-amount-column\s*\{\s*width:\s*27%/,
  "Mobile columns must fit the available card width");

console.log("Opening balance compact column and responsive overflow checks passed.");
