const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.resolve(__dirname, "..", "app.js"), "utf8");
const styles = fs.readFileSync(path.resolve(__dirname, "..", "styles.css"), "utf8");

function block(start, end) {
  const match = source.match(new RegExp(`${start}[\\s\\S]*?(?=${end})`));
  assert.ok(match, `Missing source block: ${start}`);
  return match[0];
}

const shared = block("const sharedTableScrollPositions", "\\nfunction renderBilledFileTable");
for (const requirement of [
  /function sharedTableScrollRegion/,
  /data-shared-table-scroll/,
  /tabindex="0"/,
  /role="region"/,
  /aria-label=/,
  /sharedTableScrollPositions/,
  /requestAnimationFrame/,
  /region\.scrollLeft/,
  /region\.scrollTop/,
  /event\.shiftKey/,
  /passive: false/,
  /event\.key === "Home"/,
  /event\.key === "End"/,
  /scheduleBilledActionMenuPosition/,
]) assert.match(shared, requirement);

const renderers = {
  billed: block("function renderBilledFileTable", "\\nfunction masterFileActions"),
  fileList: block("function renderMasterFileTable", "\\nfunction activeFileActions"),
  active: block("function renderActiveFileTable", "\\nfunction completedBillingBadge"),
  completed: block("function renderCompletedFileTable", "\\nfunction renderFileTable"),
  notChecked: block("function renderNotCheckedFileTable", "\\nfunction renderFeePendingFileTable"),
  feePending: block("function renderFeePendingFileTable", "\\nfunction renderReAssignedFileTable"),
  feeReceived: block("function renderFeeReceivedFileTable", "\\nfunction feeReceiptIdForFile"),
};
Object.entries(renderers).forEach(([key, renderer]) => {
  assert.match(renderer, new RegExp(`sharedTableScrollRegion\\("${key}"`), `${key} must use the shared scroll region`);
});

for (const requirement of [
  /\.shared-table-scroll\s*\{[\s\S]*?max-height: clamp\(360px, 72vh, 820px\)/,
  /scrollbar-gutter: stable/,
  /overscroll-behavior: contain/,
  /scrollbar-color: #7895b8 #e8eef6/,
  /\.shared-table-scroll::-webkit-scrollbar/,
  /\.shared-table-scroll::-webkit-scrollbar-thumb:hover/,
  /\.shared-table-scroll table thead th[\s\S]*?position: sticky/,
  /\.fee-pending-table-wrap \.fee-pending-actions-column[\s\S]*?position: sticky[\s\S]*?right: 0/,
  /\.fee-received-modern-table \.fee-received-actions-column[\s\S]*?position: sticky[\s\S]*?right: 0/,
  /\.shared-table-scroll-has-cards[\s\S]*?overflow: visible/,
]) assert.match(styles, requirement);

assert.match(source, /document\.body\.appendChild\(menu\)/, "Actions menu must use the existing body portal");
assert.match(source, /document\.addEventListener\("scroll", scheduleBilledActionMenuPosition, true\)/);
assert.match(source, /bindSharedTableScrollRegions\(document\.querySelector\("#fileResults"\)/);
assert.match(source, /resetSharedTableScrollPosition\(fileTableScrollKey\(\)\)/);

console.log("Shared Billed Files table scrolling, sticky columns, accessibility, menu portal and position preservation checks passed.");
