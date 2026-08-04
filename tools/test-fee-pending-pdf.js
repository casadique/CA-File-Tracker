const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appPath = path.join(__dirname, "..", "app.js");
const source = fs.readFileSync(appPath, "utf8");

function functionSource(name, nextName) {
  const end = nextName ? `(?=\\nfunction ${nextName})` : "(?=\\n(?:async )?function )";
  const match = source.match(new RegExp(`function ${name}[\\s\\S]*?${end}`));
  assert.ok(match, `${name} must exist`);
  return match[0].trim();
}

const financialSource = functionSource("billedPdfFinancialValues", "billedPdfReceiptMode");
const paymentStatusSource = functionSource("billedPdfPaymentStatus", "billedPdfFinancialValues");
const billedPdfPaymentStatus = Function(`return (${paymentStatusSource})`)();
const billedPdfFinancialValues = Function("billedPdfPaymentStatus", `return (${financialSource})`)(billedPdfPaymentStatus);

const example = billedPdfFinancialValues({
  grossBilledAmount: 1000,
  approvedDiscountAmount: 50,
  totalReceivedAmount: 500,
});
assert.deepEqual(example, {
  grossBilledAmount: 1000,
  discountAmount: 50,
  netBillAmount: 950,
  receivedAmount: 500,
  balanceAmount: 450,
  paymentStatus: "Partially Received",
});
assert.equal(billedPdfFinancialValues({ grossBilledAmount: 1000, approvedDiscountAmount: 1000, totalReceivedAmount: 0 }).balanceAmount, 0);
assert.equal(billedPdfFinancialValues({ grossBilledAmount: 1000, approvedDiscountAmount: 0, totalReceivedAmount: 1000 }).balanceAmount, 0);

const agingSource = functionSource("feePendingPdfAging", "feePendingPdfStaff");
const agingBuckets = [
  { label: "0–15 Days", min: 0, max: 15 },
  { label: "16–30 Days", min: 16, max: 30 },
  { label: "31–60 Days", min: 31, max: 60 },
  { label: "61–90 Days", min: 61, max: 90 },
  { label: "Above 90 Days", min: 91, max: Number.POSITIVE_INFINITY },
];
const normalizeImportDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) ? String(value) : "";
const feePendingPdfAging = Function(
  "normalizeImportDate", "indiaTodayDate", "MS_DAY", "FEE_PENDING_PDF_AGING_BUCKETS",
  `return (${agingSource})`,
)(normalizeImportDate, () => "2026-08-04", 86400000, agingBuckets);
assert.equal(feePendingPdfAging("2026-08-04").category, "0–15 Days");
assert.equal(feePendingPdfAging("2026-07-19").category, "16–30 Days");
assert.equal(feePendingPdfAging("2026-06-30").category, "31–60 Days");
assert.equal(feePendingPdfAging("2026-05-20").category, "61–90 Days");
assert.equal(feePendingPdfAging("2026-04-01").category, "Above 90 Days");
assert.equal(feePendingPdfAging("").category, "Date Not Recorded");

const staffNameSource = functionSource("feePendingStaffName", "feePendingReportRow");
const feePendingStaffName = Function(
  "filePdfText", `return (${staffNameSource})`,
)((value, fallback = "") => String(value || fallback).trim() || fallback);
assert.equal(feePendingStaffName({ assignedStaff: "Rabiyath", completedBy: "Another Staff" }), "Rabiyath");
assert.equal(feePendingStaffName({ completedBy: "Munazza Abdul Muthalib" }), "Munazza Abdul Muthalib");
assert.equal(feePendingStaffName({}), "Not Assigned");

const eligibilitySource = functionSource("feePendingPdfBillingIsActive", "feePendingPdfContact");
const feePendingPdfBillingIsActive = Function(
  "isBilledFile", "isRemovedFileRecord", `return (${eligibilitySource})`,
)((file) => Boolean(file.billed), (file) => Boolean(file.isRemoved));
assert.equal(feePendingPdfBillingIsActive({ billed: true }), true);
assert.equal(feePendingPdfBillingIsActive({ billed: true, billingType: "Non-Billable" }), false);
assert.equal(feePendingPdfBillingIsActive({ billed: true, billingStatus: "Reversed" }), false);
assert.equal(feePendingPdfBillingIsActive({ billed: true, billingCancelled: true }), false);
assert.equal(feePendingPdfBillingIsActive({ billed: true, isRemoved: true }), false);

const recordsSource = functionSource("feePendingPdfRecords", "feePendingPdfSummary");
const feePendingPdfRecords = Function(
  "feePendingPdfBillingIsActive", "feePendingPdfRecord", "indiaTodayDate", `return (${recordsSource})`,
)(
  (file) => file.active !== false,
  (file) => ({ id: file.id, balanceAmount: file.balanceAmount, netBillAmount: file.netBillAmount }),
  () => "2026-08-04",
);
assert.deepEqual(feePendingPdfRecords([]), []);
assert.deepEqual(feePendingPdfRecords([{ id: "one", balanceAmount: 450, netBillAmount: 950 }]), [
  { id: "one", balanceAmount: 450, netBillAmount: 950, index: 1 },
]);
assert.deepEqual(feePendingPdfRecords([
  { id: "settled", balanceAmount: 0, netBillAmount: 950 },
  { id: "fully-discounted", balanceAmount: 0, netBillAmount: 0 },
  { id: "invalid", active: false, balanceAmount: 500, netBillAmount: 500 },
  { id: "partial", balanceAmount: 450, netBillAmount: 950 },
  { id: "unpaid", balanceAmount: 1000, netBillAmount: 1000 },
]).map((record) => record.id), ["partial", "unpaid"]);

assert.match(source, /async function createFeePendingFilesPdfDocument/);
assert.match(source, /function feePendingStaffName/);
assert.match(source, /Staff: feePendingStaffName\(file\)/);
assert.doesNotMatch(source.match(/function feePendingPdfStaff[\s\S]*?(?=\nfunction feePendingPdfRecord)/)?.[0] || "", /Assigned:|Done By:/);
assert.match(source, /new jsPDF\(\{ orientation: "landscape", unit: "pt", format: "a4"/);
assert.match(source, /showHead: "everyPage"/);
assert.match(source, /rowPageBreak: "avoid"/);
assert.match(source, /drawFeePendingPdfFinalSummary\(doc, context\)/);
assert.match(source, /STAFF-WISE OUTSTANDING/);
assert.match(source, /AGING SUMMARY/);
assert.match(source, /Fee Pending Files PDF downloaded/);
assert.match(source, /if \(feePendingPdf\) \{[\s\S]*createFeePendingFilesPdfDocument\(sourceFiles\)/);

console.log("Fee Pending PDF financial, eligibility, aging, layout and export checks passed.");
