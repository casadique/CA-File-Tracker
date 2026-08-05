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

assert.match(source, /STAFF_DATE_CORRECTION_VERSION = "staff-dob-doj-plus-one-day-2026-08-05"/);
const shift = block("function shiftStaffDateByDays", "\\nfunction applyStaffDateCorrection");
assert.match(shift, /Date\.UTC\(year, month - 1, day \+ days\)/);
const vm = require("node:vm");
const dateContext = { normalizeImportDate: (value) => value, result: null };
vm.runInNewContext(`${shift}\nresult = [shiftStaffDateByDays("2018-12-31"), shiftStaffDateByDays("1988-11-25")];`, dateContext);
assert.deepEqual([...dateContext.result], ["2019-01-01", "1988-11-26"]);
const correction = block("function applyStaffDateCorrection", "\\nfunction mergeStaffDetailsByLatestChange");
assert.match(correction, /dateOfJoining: row\.dateOfJoining \? shiftStaffDateByDays/);
assert.match(correction, /dateOfBirth: row\.dateOfBirth \? shiftStaffDateByDays/);
assert.match(correction, /staffDateCorrectionVersion = STAFF_DATE_CORRECTION_VERSION/);
const staffPage = block("function renderStaffDetailsPage", "\nfunction staffDetailsActions");
assert.doesNotMatch(staffPage, /applyStaffDateCorrection|fullRemote/);

const reportRows = block("function staffDetailsReportRows", "\\nconst staffReportColumns");
assert.match(reportRows, /DOJ: dateValue\(row\.dateOfJoining\)/);
assert.match(reportRows, /DOB: dateValue\(row\.dateOfBirth\)/);
assert.doesNotMatch(reportRows, /App User Email|Date of Joining|Date of Birth/);
const reportColumns = block("const staffReportColumns", "\\nconst staffWorkbookColumns");
assert.match(reportColumns, /"DOJ"/);
assert.match(reportColumns, /"DOB"/);
assert.doesNotMatch(reportColumns, /App User Email|Date of Joining|Date of Birth/);

const excel = block("async function exportStaffDetailsWorkbook", "\\nasync function downloadStaffDetailsSample");
for (const requirement of [/STAFF DETAILS REPORT/, /XLSX\.utils\.aoa_to_sheet/, /worksheet|sheet\["!merges"\]/, /sheet\["!autofilter"\]/, /sheet\["!freeze"\]/, /dd-mm-yyyy/, /cellStyles: true/]) assert.match(excel, requirement);

const pdf = block("async function createStaffDetailsPdfDocument", "\\nasync function exportStaffDetailsPdf");
for (const heading of ["Staff Details", "Position / Department", "EMP Type", "DOJ", "DOB", "Contact", "Email ID", "BG", "Status", "Qualification", "Remarks"]) assert.match(pdf, new RegExp(`header: "${heading.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}"`));
assert.doesNotMatch(pdf, /App User Email|Date of Joining|Date of Birth|GMT\+0530/);
assert.match(pdf, /drawBilledPdfCards/);
assert.match(pdf, /drawBilledPdfFooters/);

assert.match(source, /function staffDetailsActions/);
assert.match(source, /function staffDetailsMobileCard/);
assert.match(source, /staff-action-menu/);
assert.match(styles, /\.staff-filter-heading/);
assert.match(styles, /\.staff-directory-mobile/);
assert.match(styles, /\.staff-actions-cell[\s\S]*?position: sticky/);
assert.match(styles, /\.staff-action-menu summary[\s\S]*?width: 40px[\s\S]*?height: 40px/);

console.log("Staff Details date correction, responsive view, PDF and Excel modernization checks passed.");
