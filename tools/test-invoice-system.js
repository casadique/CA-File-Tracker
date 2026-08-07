const assert = require("assert/strict");
const fs = require("fs");
const path = require("path");
const {
  DEFAULT_GSTIN,
  TEST_GSTIN,
  PRESUMPTIVE_TAX_DECLARATION,
  BILL_OF_SUPPLY_PAYMENT_DETAILS,
  defaultInvoiceSettings,
  calculateInvoice,
  amountInWords,
  financialYearForDate,
  drawInvoicePdf,
  validateInvoice,
} = require("../src/services/invoiceService");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const client = fs.readFileSync(path.join(root, "invoice-client.js"), "utf8");
const routes = fs.readFileSync(path.join(root, "src/routes/invoiceRoutes.js"), "utf8");
const service = fs.readFileSync(path.join(root, "src/services/invoiceService.js"), "utf8");

const settings = { ...defaultInvoiceSettings(), stateCode: "32", roundOffPreference: "None" };
assert.equal(settings.documentType, "Bill of Supply");
assert.equal(settings.defaultGstRate, 0);
assert.equal(settings.declaration, PRESUMPTIVE_TAX_DECLARATION);
assert.equal(settings.address, "3rd Floor, Grand Mall,\nRly Station Road, Keloth,\nPayyanur");
assert.equal(settings.district, "Kannur");
assert.equal(settings.pinCode, "670307");
assert.equal(settings.email, "info@muhammadandassociates.com");
assert.equal(settings.mobile, "+91 8089 190 842");
assert.equal(settings.accountName, "MUHAMMAD AND ASSOCIATES");
assert.equal(settings.bankName, "FEDERAL BANK");
assert.equal(settings.accountNumber, "11260200015193");
assert.equal(settings.branch, "PAYYANUR");
assert.equal(settings.ifsc, "FDRL0001126");
assert.deepEqual(BILL_OF_SUPPLY_PAYMENT_DETAILS, {
  accountName: "MUHAMMAD AND ASSOCIATES",
  bankName: "FEDERAL BANK",
  accountNumber: "11260200015193",
  branch: "PAYYANUR",
  ifsc: "FDRL0001126",
});
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
assert.equal(DEFAULT_GSTIN, "32AVFPM0043F2Z6");
const billTotals = calculateInvoice({ ...base, lines: [{ ...base.lines[0], gstRate: 0 }] }, settings);
assert.equal(billTotals.invoiceTotal, 10000);
assert.equal(billTotals.cgstAmount + billTotals.sgstAmount + billTotals.igstAmount, 0);
const unregisteredPreview = { ...base, invoiceDate: "2026-08-06", documentType: "Tax Invoice", placeOfSupply: "Kerala", recipient: { billingName: "Test Client", gstRegistration: "Unregistered", state: "Kerala", stateCode: "32" } };
assert.doesNotThrow(() => validateInvoice(unregisteredPreview, settings, { issuing: false }),
  "draft preview must work for an unregistered recipient without GSTIN or billing address");
assert.throws(() => validateInvoice(unregisteredPreview, settings, { issuing: true }), /Invoice Settings/,
  "final issue must still require complete supplier settings");

for (const marker of ["Billing Details", "Issue Bill of Supply", "Save as Billed", "Continue to Issue Bill of Supply", 'invoiceStatus: "Not Issued"']) assert.match(app, new RegExp(marker));
for (const marker of ["Save Draft", "Preview Bill", "Issue Bill of Supply", "Invoice Register", "Invoice Settings", "confirmTestGstin", "Update Client Master", "Download PDF", "View Invoice History", "Bank Account Details"]) assert.match(client, new RegExp(marker));
assert.match(client, /scope\.elements\?\.namedItem\?\.\(name\)[\s\S]*scope\.querySelector\?/,
  "invoice line readers must support both forms and service-line containers");
assert.match(client, /const pdfWindow = reservePdfWindow\(\);[\s\S]*showPdfBlob\(blob, pdfWindow\)/,
  "invoice preview should reserve its PDF window before the async request");
assert.match(client, /Final issue requires Invoice Settings/);
assert.match(client, /showPdfError\(pdfWindow, error\?\.message\)/);
for (const route of ["/settings", "/register", "/file/:fileId/draft", "/file/:fileId/preview", "/file/:fileId/issue", "/:invoiceId/pdf", "/:invoiceId/cancel"]) assert.match(routes, new RegExp(route.replace(/[/:]/g, "\\$&")));
assert.match(service, /patchAppStateAtomic/);
assert.match(service, /nextInvoiceNumber/);
assert.match(service, /invoiceSequences/);
assert.match(service, /status: "Cancelled"/);
assert.match(service, /frozenAt/);
assert.doesNotMatch(service, /Reverse Charge:.*File Reference:/, "internal file UUID must not be printed on the Bill of Supply");

(async () => {
  const invoice = {
    invoiceId: "test", draftReference: "DRAFT-TEST", status: "Draft", documentType: "Bill of Supply", invoiceDate: "2026-08-06", dueDate: "2026-08-06", financialYear: "2026-27", placeOfSupply: "Kerala", reverseCharge: "No", fileReference: "FILE-1",
    supplierSnapshot: { ...settings, legalName: "Muhammad & Associates", professionalDescription: "Chartered Accountants", gstin: TEST_GSTIN, pan: "AVFPM0043F" },
    recipientSnapshot: { billingName: "Test Client", billingAddress: "Client address", state: "Kerala", stateCode: "32", gstin: "32ABCDE1234F1Z5" },
    items: billTotals.lines, ...billTotals,
    discountAmount: billTotals.totalDiscount, outstandingAmount: billTotals.netAmountPayable,
  };
  const pdf = await drawInvoicePdf(invoice, { draft: true });
  if (process.env.INVOICE_TEST_OUTPUT) fs.writeFileSync(process.env.INVOICE_TEST_OUTPUT, pdf);
  assert.equal(pdf.subarray(0, 4).toString(), "%PDF");
  assert.ok(pdf.length > 5000, "Professional invoice PDF should contain rendered content");
  const pageCount = (pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) || []).length;
  assert.equal(pageCount, 1, "a normal Bill of Supply must render on one A4 page without a blank trailing page");
  console.log("Invoice billing separation, GST calculations, draft/final controls, PDF and register checks passed.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
