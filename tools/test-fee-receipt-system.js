const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

process.env.SUPABASE_URL ||= "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-service-role-key";
process.env.CLIENT_CREDENTIALS_ENCRYPTION_KEY ||= "test-client-credential-key-32-bytes-minimum";

const root = path.resolve(__dirname, "..");
const {
  issueReceiptRecord,
  markReceiptReversed,
  drawReceiptPdf,
  safeReceiptFilename,
} = require(path.join(root, "src", "services", "receiptService"));

function payment(id, amount, date = "2026-08-06") {
  return { id, fileId: "file-1", receiptDate: date, amount, receivedAmount: amount, discountAmount: 0, paymentMode: "Cash", accountName: "Cash in Hand", receivedBy: "CA Sadique", status: "active" };
}

const profile = { id: "user-1", name: "CA Sadique", role: "Admin" };
const file = { id: "file-1", name: "ABC Private Limited", serviceType: "ITR Filing", fy: "2026-27", billed: true, billedAmount: 10000, billNo: "BOS/1", billDate: "2026-08-05", pan: "ABCDE1234F", careOf: "Direct" };
const state = { feeReceipts: [], receiptSequences: [], receiptEvents: [], invoices: [], invoiceSettings: { legalName: "Muhammad & Associates", professionalDescription: "Chartered Accountants", gstin: "32AVFPM0043F2Z6" } };

const first = issueReceiptRecord(state, payment("payment-1", 4000), file, null, profile, new Date("2026-08-06T08:00:00Z"));
assert.equal(first.receiptNumber, "MR/2026-27/0001");
assert.equal(first.receiptType, "Payment Receipt");
assert.equal(first.paymentStatus, "Partially Paid");
assert.equal(first.outstandingBalance, 6000);
assert.equal(first.receiptSnapshot.summary.discount, 0);
state.feeReceipts.push(first);

const duplicate = issueReceiptRecord(state, first, file, null, profile, new Date("2026-08-06T08:01:00Z"));
assert.equal(duplicate.receiptNumber, first.receiptNumber, "Idempotent replay must keep the same receipt number");
assert.equal(state.receiptSequences[0].lastUsedNumber, 1, "Idempotent replay must not consume a second number");

const secondInput = { ...payment("payment-2", 5500), discountAmount: 500 };
const second = issueReceiptRecord(state, secondInput, file, null, profile, new Date("2026-08-06T09:00:00Z"));
assert.equal(second.receiptNumber, "MR/2026-27/0002");
assert.equal(second.receiptSnapshot.summary.previousReceived, 4000);
assert.equal(second.receiptSnapshot.summary.amountReceived, 5500);
assert.equal(second.receiptSnapshot.summary.discount, 500);
assert.equal(second.receiptSnapshot.summary.outstanding, 0);
assert.equal(second.paymentStatus, "Paid in Full");
assert.equal(safeReceiptFilename(second), "Receipt-MR-2026-27-0002-06-08-2026.pdf");

const advanceState = { feeReceipts: [], receiptSequences: [], receiptEvents: [], invoices: [], invoiceSettings: state.invoiceSettings };
const advanceFile = { id: "advance-file", name: "Advance Client", serviceType: "Tax Consultation", fy: "2026-27", billed: false };
const advance = issueReceiptRecord(advanceState, { ...payment("advance-1", 2500), fileId: "advance-file" }, advanceFile, null, profile, new Date("2026-08-06T10:00:00Z"));
assert.equal(advance.receiptType, "Receipt Voucher");
assert.equal(advance.paymentStatus, "Advance Received");
assert.equal(advance.receiptSnapshot.summary.unadjustedAdvance, 2500);

const reversed = markReceiptReversed(state, first, profile, "Incorrect payment", new Date("2026-08-06T11:00:00Z"));
assert.equal(reversed.documentStatus, "Reversed");
assert.equal(first.receiptNumber, "MR/2026-27/0001", "Reversal must preserve the original number");

const serviceSource = fs.readFileSync(path.join(root, "src", "services", "receiptService.js"), "utf8");
const financeSource = fs.readFileSync(path.join(root, "src", "services", "financeService.js"), "utf8");
const routeSource = fs.readFileSync(path.join(root, "src", "routes", "financeRoutes.js"), "utf8");
const clientSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
assert.match(financeSource, /patchAppStateAtomic[\s\S]*?issueReceiptRecord\(state, receipt, original, collection/);
assert.match(routeSource, /receipts\/:receiptId\/pdf/);
assert.match(routeSource, /receipts\/historical\/generate/);
assert.match(routeSource, /receipts\/:receiptId\/generate-historical/);
assert.match(clientSource, /Payment Recorded Successfully[\s\S]*?Download PDF[\s\S]*?Print/);
assert.doesNotMatch(serviceSource, /if \(snapshot\.historicalNote\)/, "Historical generation note must not print on receipts");
assert.match(serviceSource, /fontSize\(6\)\.text\(pdfMoney\(snapshot\.payment\.amountReceived\)/, "Main received figure must use the reduced font size");
assert.match(serviceSource, /For \$\{firm\.legalName[\s\S]*?lineBreak: false/, "Firm signature name must remain on one line");
assert.match(serviceSource, /Receipt Voucher[\s\S]*?Advance Received/);

drawReceiptPdf(second).then((pdf) => {
  assert.equal(pdf.subarray(0, 4).toString(), "%PDF");
  assert.ok(pdf.length > 5000, "Receipt PDF should contain a complete rendered document");
  assert.equal((pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) || []).length, 1, "Receipt PDF must remain a single page");
  console.log("Fee receipt numbering, idempotency, partial payments, voucher rules, reversal, UI wiring and PDF checks passed.");
}).catch((error) => { console.error(error); process.exitCode = 1; });
