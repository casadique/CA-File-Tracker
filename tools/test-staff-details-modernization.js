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
assert.match(source, /staff-action-menu-portal/);
assert.match(source, /document\.body\.appendChild\(portal\)/);
assert.match(source, /trigger\.getBoundingClientRect\(\)/);
assert.match(source, /aria-haspopup="menu"/);
assert.match(source, /aria-expanded="false"/);
assert.match(source, /window\.addEventListener\("resize", positionStaffActionMenu\)/);
assert.match(source, /document\.addEventListener\("scroll", positionStaffActionMenu, true\)/);
assert.match(styles, /\.staff-filter-heading/);
assert.match(styles, /\.staff-directory-mobile/);
assert.match(styles, /\.staff-actions-cell[\s\S]*?position: sticky/);
assert.match(styles, /\.staff-menu-toggle\s*\{[\s\S]*?width:\s*44px[\s\S]*?height:\s*44px/);
assert.match(styles, /\.staff-action-menu-portal\s*\{[\s\S]*?position:\s*fixed[\s\S]*?z-index:\s*16000/);

assert.doesNotMatch(staffPage, /staffProfilePanel|renderStaffProfile\(\)/, "Profiles must not be appended below the staff list");
assert.match(source, /function openStaffProfileModal/);
assert.match(source, /document\.body\.style\.overflow = "hidden"/);
assert.match(source, /role="dialog" aria-modal="true"/);
assert.match(source, /if \(event\.key === "Escape"\)/);
assert.match(source, /returnFocus\?\.isConnected/);
assert.match(source, /Not Recorded/);
assert.match(styles, /\.staff-profile-backdrop\s*\{[\s\S]*?position:\s*fixed[\s\S]*?z-index:\s*15000/);
assert.match(styles, /@media \(max-width: 760px\)[\s\S]*?\.staff-profile-dialog\s*\{[^}]*height:\s*100dvh/);

const table = block("function renderStaffDetailsTable", "\nfunction staffDetailsActions");
const expectedHeaders = ["SN", "Staff", "Position / Department", "Employment Type / Status", "DOJ / DOB", "Contact", "Blood Group / Gender", "Actions"];
for (const header of expectedHeaders) assert.ok(table.includes(`"${header}"`), `Missing Staff Details header: ${header}`);
const columns = [...table.matchAll(/<td data-column="([^"]+)"/g)].map((match) => match[1]);
assert.deepEqual(columns, ["sn", "staff", "position_department", "employment_status", "doj_dob", "contact", "blood_gender", "actions"]);
assert.equal(columns.length, 8, "Every desktop Staff Details row must render exactly eight cells");
assert.match(table, /<colgroup><col class="col-sn"><col class="col-staff"><col class="col-position"><col class="col-employment"><col class="col-dates"><col class="col-contact"><col class="col-personal"><col class="col-actions"><\/colgroup>/);
assert.match(styles, /\.staff-details-table\.staff-table \{[\s\S]*?min-width: 1540px;[\s\S]*?table-layout: fixed;/);
assert.match(styles, /\.staff-details-table \.col-sn \{ width: 55px; \}/);
assert.match(styles, /\.staff-details-table \.col-staff \{ width: 300px; \}/);
assert.doesNotMatch(styles, /\.staff-details-table tr\s*\{[^}]*display:\s*(?:grid|flex|block)/);

console.log("Staff Details eight-column structure, responsive view, date correction, PDF and Excel modernization checks passed.");
