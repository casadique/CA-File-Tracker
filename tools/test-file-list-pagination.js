const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.resolve(__dirname, "..", "app.js"), "utf8");

assert.match(appSource, /const fileListPageUi = \{/);
assert.match(appSource, /pageSize: 50/);
assert.match(appSource, /files\.slice\(offset, offset \+ pageSize\)/);
assert.match(appSource, /Rows per page/);
assert.match(appSource, /\[25, 50, 100\]/);
assert.match(appSource, /data-file-page=/);
assert.match(appSource, /updateFileListPagination\(pageData, refreshFileResults\)/);
assert.match(appSource, /updateFileListPagination\(pageData, refreshBilledFileResults\)/);
assert.match(appSource, /updateFileListPagination\(pageData, \(\) => refreshConfiguredFinancialResults\(config\)\)/);
assert.match(appSource, /bindFileListPagination\(renderStaffFilesPage\)/);
assert.match(appSource, /exportStaffPageExcel\(listView, allFiles\)/, "Staff exports must use all filtered files, not only the visible page");
assert.match(appSource, /const sourceFiles = sortFilesForDisplay\(filteredFiles\(\)\)/, "Exports must continue using the complete filtered dataset");

console.log("File List and Active Files render-pagination checks passed.");
