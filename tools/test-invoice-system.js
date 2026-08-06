const assert = require("assert/strict");
const fs = require("fs");
const path = require("path");
const {
  TEST_GSTIN,
  defaultInvoiceSettings,
  calculateInvoice,
  amountInWords,
  financialYearForDate,
  drawInvoicePdf,
} = require("../src/services/invoiceService");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const client = fs.readFileSync(path.join(root, "invoice-client.js"), "utf8");
const routes = fs.readFileSync(path.join(root, "src/routes/invoiceRoutes.js"), "utf8");
const service = fs.readFileSync(path.join(root, "src/services/invoiceService.js"), "utf8");

const settings = { ...defaultInvoiceSettings(), stateCode: "32", roundOffPreference: "None" };
const base = {
  taxMode: "Exclusive", placeOfSupplyStateCode: "32", recipient: { stateCode: "32" },
  lines: [{ description: "ITR Filing for FY 2025-26", sac: "998221", quantity: 1, unit: "Service", rate: 10000, discount: 0, gstRate: 18 }],
  invoiceDiscount: 0, otherCharges: 0, advanceReceived: 0,
};

const intra = calculateInvoice(base, settings);
assert.equal(intra.taxableAmount, 10000);
assert.equal(intra.cgstAmount, 900);
assert.equal(intra.sgstAmount, 900);
assert.equal(intra.igstAmount, 0);
assert.equal(intra.invoiceTotal, 11800);

const inter = calculateInvoice({ ...base, placeOfSupplyStateCode: "29", recipient: { stateCode: "29" } }, settings);
assert.equal(inter.cgstAmount, 0);
assert.equal(inter.sgstAmount, 0);
assert.equal(inter.igstAmount, 1800);

const inclusive = calculateInvoice({ ...base, taxMode: "Inclusive", lines: [{ ...base.lines[0], rate: 11800 }] }, settings);
assert.equal(inclusive.taxableAmount, 10000);
assert.equal(inclusive.invoiceTotal, 11800);

const discounted = calculateInvoice({ ...base, lines: [{ ...base.lines[0], rate: 12000, discount: 1000 }], invoiceDiscount: 1000 }, settings);
assert.equal(discounted.taxableAmount, 10000);
assert.equal(discounted.totalDiscount, 2000);
assert.equal(discounted.invoiceTotal, 11800);

const multiple = calculateInvoice({ ...base, lines: [base.lines[0], { ...base.lines[0], description: "GST Filing", rate: 5000, gstRate: 18 }] }, settings);
assert.equal(multiple.lines.length, 2);
assert.equal(multiple.invoiceTotal, 17700);
assert.equal(amountInWords(11800), "Rupees Eleven Thousand Eight Hundred Only");
assert.equal(financialYearForDate("2026-04-01"), "2026-27");
assert.equal(financialYearForDate("2027-03-31"), "2026-27");
assert.equal(TEST_GSTIN, "32AVFPM0043F1Z7");

for (const marker of ["Billing Details", "Issue Invoice", "Save as Billed", "Continue to Issue Invoice", 'invoiceStatus: "Not Issued"']) assert.match(app, new RegExp(marker));
for (const marker of ["Save Draft", "Preview Invoice", "Issue Invoice", "Invoice Register", "Invoice Settings", "confirmTestGstin", "Update Client Master", "Download PDF", "View Invoice History"]) assert.match(client, new RegExp(marker));
assert.match(client, /scope\.elements\?\.namedItem\?\.\(name\)[\s\S]*scope\.querySelector\?/,
  "invoice line readers must support both forms and service-line containers");
assert.match(client, /const pdfWindow = reservePdfWindow\(\);[\s\S]*showPdfBlob\(blob, pdfWindow\)/,
  "invoice preview should reserve its PDF window before the async request");
for (const route of ["/settings", "/register", "/file/:fileId/draft", "/file/:fileId/preview", "/file/:fileId/issue", "/:invoiceId/pdf", "/:invoiceId/cancel"]) assert.match(routes, new RegExp(route.replace(/[/:]/g, "\\$&")));
assert.match(service, /patchAppStateAtomic/);
assert.match(service, /nextInvoiceNumber/);
assert.match(service, /invoiceSequences/);
assert.match(service, /status: "Cancelled"/);
assert.match(service, /frozenAt/);

(async () => {
  const invoice = {
    invoiceId: "test", draftReference: "DRAFT-TEST", status: "Draft", documentType: "Tax Invoice", invoiceDate: "2026-08-06", dueDate: "2026-08-06", financialYear: "2026-27", placeOfSupply: "Kerala", reverseCharge: "No", fileReference: "FILE-1",
    supplierSnapshot: { legalName: "Muhammad & Associates", professionalDescription: "Chartered Accountants", address: "Test address", state: "Kerala", pinCode: "670001", gstin: TEST_GSTIN, pan: "AVFPM0043F", invoiceFooter: "This is a system-generated invoice." },
    recipientSnapshot: { billingName: "Test Client", billingAddress: "Client address", state: "Kerala", stateCode: "32", gstin: "32ABCDE1234F1Z5" },
    items: intra.lines, ...intra,
    discountAmount: intra.totalDiscount, outstandingAmount: intra.netAmountPayable,
  };
  const pdf = await drawInvoicePdf(invoice, { draft: true });
  assert.equal(pdf.subarray(0, 4).toString(), "%PDF");
  assert.ok(pdf.length > 5000, "Professional invoice PDF should contain rendered content");
  console.log("Invoice billing separation, GST calculations, draft/final controls, PDF and register checks passed.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
