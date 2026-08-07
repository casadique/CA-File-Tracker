const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { getAppState, patchAppStateAtomic } = require("./appStateService");
const { normalizedSettings, amountInWords, financialYearForDate } = require("./invoiceService");

const RECEIPT_SERIES = "MR";
const RECEIPT_DECLARATION = "This receipt acknowledges payment received. It is not a Tax Invoice or Bill of Supply.";
const RECEIPT_FOOTER = "This receipt acknowledges payment only and does not replace the applicable Bill of Supply or Tax Invoice.";

function text(value = "") { return String(value ?? "").trim(); }
function money(value) { const number = Number(value); return Number.isFinite(number) ? Math.round((number + Number.EPSILON) * 100) / 100 : 0; }
function isoDate(value = new Date()) {
  const raw = text(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
function displayDate(value) { const date = isoDate(value); return date ? `${date.slice(8, 10)}-${date.slice(5, 7)}-${date.slice(0, 4)}` : "-"; }
function isActiveReceipt(receipt = {}) {
  const status = text(receipt.documentStatus || receipt.receiptDocumentStatus || receipt.status || "active").toLowerCase();
  return !receipt.isDeleted && !receipt.is_deleted && !receipt.isReversed && !receipt.is_reversed && !["reversed", "cancelled", "not_received"].includes(status);
}
function fileIdOf(receipt = {}) { return receipt.fileId || receipt.file_id || ""; }
function actor(profile = {}, userId = "") { return { id: userId || profile.id || profile.auth_user_id || "", name: profile.name || profile.email || "Unknown User", role: profile.role || "Unknown" }; }

function nextReceiptNumber(state, financialYear) {
  const sequences = Array.isArray(state.receiptSequences) ? state.receiptSequences : [];
  const existing = sequences.find((row) => row.financialYear === financialYear && row.series === RECEIPT_SERIES);
  const next = Number(existing?.lastUsedNumber || 0) + 1;
  const updated = { financialYear, series: RECEIPT_SERIES, lastUsedNumber: next, updatedAt: new Date().toISOString() };
  state.receiptSequences = existing
    ? sequences.map((row) => row === existing ? updated : row)
    : [...sequences, updated];
  return `${RECEIPT_SERIES}/${financialYear}/${String(next).padStart(4, "0")}`;
}

function issuedInvoiceForFile(state, fileId) {
  return (state.invoices || []).find((invoice) => (invoice.fileId || invoice.file_id) === fileId && invoice.status === "Issued") || null;
}

function buildReceiptSnapshot(state, receipt, file, transaction, profile, now, historical = false) {
  const paymentDate = isoDate(receipt.receiptDate || receipt.receipt_date || receipt.receivedDate || receipt.received_date || now);
  const issueDate = isoDate(now);
  const financialYear = financialYearForDate(paymentDate || issueDate);
  const invoice = issuedInvoiceForFile(state, file.id);
  const billNumber = text(invoice?.invoiceNumber || file.invoiceNumber || file.billNo || file.bill_number);
  const billDate = isoDate(invoice?.invoiceDate || file.billDate || file.bill_date || file.billedDate);
  const billValue = money(invoice?.invoiceTotal || file.billedAmount || file.billed_amount || file.billAmount || file.feeAmount || file.amount);
  const prior = (state.feeReceipts || []).filter((item) => item.id !== receipt.id && fileIdOf(item) === file.id && isActiveReceipt(item));
  const previousReceived = money(prior.reduce((sum, item) => sum + money(item.amount || item.receivedAmount || item.received_amount), 0));
  const previousDiscount = money(prior.reduce((sum, item) => sum + money(item.discountAmount || item.discount_amount || item.discount), 0));
  const amountReceived = money(receipt.amount || receipt.receivedAmount || receipt.received_amount);
  const discount = money(receipt.discountAmount || receipt.discount_amount || receipt.discount);
  const adjustment = money(receipt.adjustmentAmount || receipt.adjustment_amount);
  const outstanding = money(Math.max(billValue - previousReceived - previousDiscount - amountReceived - discount - adjustment, 0));
  const client = file.clientSnapshot || file.client_snapshot || {};
  const payerName = text(receipt.receivedFrom || receipt.received_from || file.receivedFrom || file.name);
  const firm = normalizedSettings(state.invoiceSettings || {});
  const receiptType = billNumber || billValue > 0 || file.billed ? "Payment Receipt" : "Receipt Voucher";
  const paymentStatus = receiptType === "Receipt Voucher" ? "Advance Received" : outstanding <= 0.005 ? "Paid in Full" : "Partially Paid";
  const reference = text(receipt.paymentReference || receipt.payment_reference || receipt.referenceNumber || receipt.reference_number || transaction?.reference_number || transaction?.voucherNo);
  const snapshot = {
    receiptType,
    receiptNumber: receipt.receiptNumber,
    financialYear,
    issueDate,
    paymentDate,
    documentStatus: "Issued",
    firm: {
      legalName: firm.legalName, professionalDescription: firm.professionalDescription, address: firm.address,
      district: firm.district, state: firm.state, stateCode: firm.stateCode, pinCode: firm.pinCode,
      gstin: firm.gstin, pan: firm.pan, mobile: firm.mobile, email: firm.email, firmLogo: firm.firmLogo,
      declaration: firm.declaration, authorisedSignatory: firm.authorisedSignatory,
    },
    client: {
      id: file.clientId || file.client_id || "", name: text(file.name || client.clientName || client.client_name),
      billingName: text(file.billingName || file.billing_name || client.billingName || file.name),
      address: text(file.clientAddress || client.address), gstin: text(file.gstNo || file.gst_no || client.gstNo || client.gst_no),
      panRegNo: text(file.pan || file.panRegNo || client.panRegNo || client.pan_reg_no), contact: text(file.contactNo || file.contact_no || client.contactNumber),
      email: text(file.clientEmail || client.email), careOf: text(file.careOf || file.care_of),
    },
    payer: { name: payerName, billingName: text(receipt.billingName || receipt.billing_name), onBehalfOf: payerName && payerName !== file.name ? text(file.name) : "" },
    service: { name: text(file.serviceType || file.service_type), financialYear: text(file.fy), fileReference: text(file.id) },
    billing: { documentType: invoice?.documentType || (billNumber ? "Bill of Supply" : ""), number: billNumber, date: billDate, remarks: text(invoice?.notes || file.invoiceRemarks || file.invoice_remarks) },
    payment: {
      amountReceived, amountInWords: amountInWords(amountReceived), mode: text(receipt.paymentMode || receipt.payment_mode || "Cash"),
      account: text(receipt.accountName || receipt.account_name || transaction?.accountName || transaction?.account_name), reference,
      utrNumber: text(receipt.utrNumber || receipt.utr_number), chequeNumber: text(receipt.chequeNumber || receipt.cheque_number),
      chequeDate: isoDate(receipt.chequeDate || receipt.cheque_date), bankName: text(receipt.bankName || receipt.bank_name),
      chequeStatus: text(receipt.chequeStatus || receipt.cheque_status), upiReference: text(receipt.upiReference || receipt.upi_reference),
      transactionReference: text(transaction?.id || receipt.transactionId || receipt.transaction_id), collectedBy: text(receipt.receivedBy || receipt.received_by || profile?.name),
      remarks: text(receipt.remarks),
    },
    summary: { billValue, previousReceived, amountReceived, discount, adjustment, outstanding, paymentStatus, totalReceived: money(previousReceived + amountReceived), unadjustedAdvance: receiptType === "Receipt Voucher" ? amountReceived : 0 },
    historicalNote: historical ? `Receipt generated on ${displayDate(issueDate)} for payment recorded on ${displayDate(paymentDate)}.` : "",
  };
  return snapshot;
}

function issueReceiptRecord(state, receipt, file, transaction, profile, now = new Date(), { historical = false } = {}) {
  if (receipt.receiptNumber && receipt.receiptSnapshot) return receipt;
  const paymentDate = isoDate(receipt.receiptDate || receipt.receipt_date || now);
  const financialYear = financialYearForDate(paymentDate || now);
  const receiptNumber = nextReceiptNumber(state, financialYear);
  const verificationReference = crypto.createHash("sha256").update(`${receipt.id}|${receiptNumber}|${money(receipt.amount || receipt.receivedAmount)}`).digest("hex").slice(0, 20).toUpperCase();
  const base = { ...receipt, receiptNumber, receipt_number: receiptNumber };
  const snapshot = buildReceiptSnapshot(state, base, file, transaction, profile, now, historical);
  const issued = {
    ...base, receiptType: snapshot.receiptType, receipt_type: snapshot.receiptType,
    financialYear, financial_year: financialYear, receiptIssueDate: snapshot.issueDate, receipt_issue_date: snapshot.issueDate,
    paymentDate: snapshot.paymentDate, payment_date: snapshot.paymentDate, paymentStatus: snapshot.summary.paymentStatus, payment_status: snapshot.summary.paymentStatus,
    outstandingBalance: snapshot.summary.outstanding, outstanding_balance: snapshot.summary.outstanding,
    previousAmountReceived: snapshot.summary.previousReceived, previous_amount_received: snapshot.summary.previousReceived,
    amountInWords: snapshot.payment.amountInWords, amount_in_words: snapshot.payment.amountInWords,
    receiptSnapshot: snapshot, receipt_snapshot: snapshot, documentStatus: "Issued", document_status: "Issued",
    pdfStatus: "ready", pdf_status: "ready", verificationReference, verification_reference: verificationReference,
    issuedAt: now.toISOString(), issued_at: now.toISOString(), issuedBy: actor(profile).name, issued_by: actor(profile).id,
    historical: Boolean(historical), idempotencyKey: receipt.id, idempotency_key: receipt.id,
  };
  state.receiptEvents = [...(state.receiptEvents || []), {
    id: crypto.randomUUID(), receiptId: receipt.id, receiptNumber, action: historical ? "Historical receipt issued" : "Receipt issued",
    previousValue: null, newValue: { amount: snapshot.payment.amountReceived, status: "Issued" }, user: actor(profile).name,
    userId: actor(profile).id, dateTime: now.toISOString(), reason: historical ? "Historical valid payment" : "Payment successfully recorded",
  }].slice(-3000);
  return issued;
}

function markReceiptReversed(state, receipt, profile, reason, now = new Date()) {
  const updated = { ...receipt, documentStatus: "Reversed", document_status: "Reversed" };
  state.receiptEvents = [...(state.receiptEvents || []), {
    id: crypto.randomUUID(), receiptId: receipt.id, receiptNumber: receipt.receiptNumber || "", action: "Receipt reversed",
    previousValue: { status: receipt.documentStatus || "Issued" }, newValue: { status: "Reversed" }, user: actor(profile).name,
    userId: actor(profile).id, dateTime: now.toISOString(), reason: text(reason),
  }].slice(-3000);
  return updated;
}

async function receiptById(receiptId) {
  const state = await getAppState();
  const receipt = (state.feeReceipts || []).find((row) => row.id === receiptId);
  if (!receipt) throw Object.assign(new Error("Receipt not found."), { status: 404 });
  const file = (state.files || []).find((row) => row.id === fileIdOf(receipt)) || null;
  const transaction = (state.otherCashCollections || []).find((row) => row.id === (receipt.transactionId || receipt.transaction_id)) || null;
  return { receipt, file, transaction, events: (state.receiptEvents || []).filter((event) => event.receiptId === receiptId).sort((a, b) => String(b.dateTime).localeCompare(String(a.dateTime))) };
}

function pdfMoney(value) { return `₹${money(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function configuredImage(value) { const raw = text(value); const match = raw.match(/^data:image\/(?:png|jpe?g);base64,([A-Za-z0-9+/=]+)$/i); if (match) { try { return Buffer.from(match[1], "base64"); } catch { return null; } } return raw && path.isAbsolute(raw) && fs.existsSync(raw) ? raw : null; }

function drawReceiptPdf(receipt) {
  return new Promise((resolve, reject) => {
    const snapshot = receipt.receiptSnapshot || receipt.receipt_snapshot;
    if (!snapshot) return reject(Object.assign(new Error("Receipt snapshot is unavailable. Generate a historical receipt first."), { status: 409 }));
    const doc = new PDFDocument({ size: "A5", margins: { top: 22, left: 24, right: 24, bottom: 28 }, bufferPages: true });
    const chunks = []; doc.on("data", (chunk) => chunks.push(chunk)); doc.on("end", () => resolve(Buffer.concat(chunks))); doc.on("error", reject);
    const regularPath = path.join(__dirname, "../../assets/DejaVuSans.ttf"); const boldPath = path.join(__dirname, "../../assets/DejaVuSans-Bold.ttf");
    if (fs.existsSync(regularPath)) doc.registerFont("ReceiptRegular", regularPath); if (fs.existsSync(boldPath)) doc.registerFont("ReceiptBold", boldPath);
    const regular = fs.existsSync(regularPath) ? "ReceiptRegular" : "Helvetica"; const bold = fs.existsSync(boldPath) ? "ReceiptBold" : "Helvetica-Bold";
    const navy = "#163A70"; const green = "#087F5B"; const light = "#EEF4FB"; const width = doc.page.width - 48; const firm = snapshot.firm || {};
    const bundledLogo = path.join(__dirname, "../../assets/ca-india-logo.png"); const logo = configuredImage(firm.firmLogo) || (fs.existsSync(bundledLogo) ? bundledLogo : null);
    if (logo) { try { doc.image(logo, 24, 22, { fit: [38, 38] }); } catch {} }
    const firmX = logo ? 70 : 24;
    doc.font(bold).fillColor(navy).fontSize(13).text(firm.legalName || "Muhammad & Associates", firmX, 22, { width: 220 });
    doc.font(regular).fillColor("#475569").fontSize(7).text(firm.professionalDescription || "Chartered Accountants", firmX, 40, { width: 220 });
    doc.font(bold).fillColor(navy).fontSize(11).text(String(snapshot.receiptType || "Payment Receipt").toUpperCase(), 292, 25, { width: 105, align: "right" });
    doc.font(regular).fontSize(6.5).fillColor("#475569").text([firm.address, [firm.district, firm.pinCode].filter(Boolean).join(" - "), firm.gstin && `GSTIN: ${firm.gstin}`, firm.pan && `PAN: ${firm.pan}`, [firm.mobile, firm.email].filter(Boolean).join(" | ")].filter(Boolean).join("\n"), 24, 66, { width });
    doc.y = Math.max(doc.y, 106); doc.moveTo(24, doc.y).lineTo(doc.page.width - 24, doc.y).strokeColor("#AFC0D8").stroke(); doc.moveDown(0.7);
    const infoY = doc.y; doc.roundedRect(24, infoY, width, 42, 5).fill(light);
    const info = [["Receipt No.", snapshot.receiptNumber], ["Issue Date", displayDate(snapshot.issueDate)], ["Payment Date", displayDate(snapshot.paymentDate)], ["Status", receipt.documentStatus === "Reversed" ? "REVERSED" : snapshot.summary?.paymentStatus]];
    info.forEach(([label, value], index) => { const x = 32 + index * (width / 4); doc.font(regular).fillColor("#64748B").fontSize(5.8).text(label, x, infoY + 8, { width: width / 4 - 8 }); doc.font(bold).fillColor(index === 3 ? green : "#172554").fontSize(7.2).text(value || "-", x, infoY + 21, { width: width / 4 - 8 }); });
    doc.y = infoY + 50;
    const payer = snapshot.payer || {}; const client = snapshot.client || {}; const service = snapshot.service || {};
    doc.font(regular).fillColor("#1E293B").fontSize(7.4).text(`Received with thanks from ${payer.name || client.name || "-"}${payer.onBehalfOf ? `, on behalf of ${payer.onBehalfOf}` : ""}, a sum of ${pdfMoney(snapshot.payment.amountReceived)} (${snapshot.payment.amountInWords}) towards professional services relating to ${service.name || "professional services"}${service.financialYear ? ` for FY ${service.financialYear}` : ""}.`, 24, doc.y, { width, lineGap: 1.5 });
    doc.moveDown(0.8); const amountY = doc.y; doc.roundedRect(24, amountY, width, 54, 5).strokeColor("#9FC8BA").stroke();
    doc.font(regular).fillColor("#64748B").fontSize(6).text("AMOUNT RECEIVED NOW", 34, amountY + 9); doc.font(bold).fillColor(green).fontSize(18).text(pdfMoney(snapshot.payment.amountReceived), 34, amountY + 23, { width: 155 });
    const paymentDetails = [["Mode", snapshot.payment.mode], ["Account", snapshot.payment.account], ["Reference", snapshot.payment.reference || snapshot.payment.transactionReference], ["Collected by", snapshot.payment.collectedBy]].filter(([, value]) => value);
    paymentDetails.slice(0, 4).forEach(([label, value], index) => { const x = 210 + (index % 2) * 95; const y = amountY + 8 + Math.floor(index / 2) * 22; doc.font(regular).fillColor("#64748B").fontSize(5.5).text(label, x, y, { width: 88 }); doc.font(bold).fillColor("#1E293B").fontSize(6.7).text(value, x, y + 8, { width: 88, ellipsis: true }); });
    doc.y = amountY + 62;
    const bill = snapshot.billing || {}; if (bill.number || snapshot.receiptType === "Receipt Voucher") { doc.font(bold).fillColor(navy).fontSize(7).text("BILLING REFERENCE", 24, doc.y); doc.font(regular).fillColor("#334155").fontSize(6.8).text(bill.number ? `${bill.documentType || "Bill"}: ${bill.number} dated ${displayDate(bill.date)} | ${service.name || "-"} | FY ${service.financialYear || "-"}` : `Advance received towards ${service.name || "professional services"}`, 24, doc.y + 10, { width }); doc.moveDown(1.8); }
    const summary = snapshot.summary || {}; const rows = [["Bill Value", summary.billValue], ["Previous Amount Received", summary.previousReceived], ["Amount Received Now", summary.amountReceived], ["Discount / Adjustment", money(summary.discount) + money(summary.adjustment)], ["Balance Outstanding", summary.outstanding]];
    doc.font(bold).fillColor(navy).fontSize(7).text("PAYMENT AND BALANCE SUMMARY", 24, doc.y); doc.moveDown(0.6);
    rows.forEach(([label, value], index) => { const y = doc.y; if (index === rows.length - 1) doc.rect(24, y - 2, width, 16).fill(light); doc.font(index === rows.length - 1 ? bold : regular).fillColor("#1E293B").fontSize(6.8).text(label, 30, y + 2, { width: 220 }); doc.text(pdfMoney(value), 285, y + 2, { width: 105, align: "right" }); doc.y = y + 16; });
    doc.moveDown(0.5); const declaration = snapshot.receiptType === "Receipt Voucher" ? firm.declaration : RECEIPT_DECLARATION;
    doc.font(bold).fillColor(navy).fontSize(6.5).text("Declaration", 24, doc.y); doc.font(regular).fillColor("#475569").fontSize(6.2).text(declaration, 24, doc.y + 9, { width }); doc.moveDown(2.2);
    if (snapshot.historicalNote) { doc.font(regular).fillColor("#7C2D12").fontSize(6).text(snapshot.historicalNote, 24, doc.y, { width }); doc.moveDown(1); }
    if (snapshot.payment.remarks) { doc.font(bold).fillColor(navy).fontSize(6.3).text("Remarks", 24, doc.y); doc.font(regular).fillColor("#334155").fontSize(6.2).text(snapshot.payment.remarks, 24, doc.y + 9, { width: 245, height: 25, ellipsis: true }); }
    doc.font(bold).fillColor("#1E293B").fontSize(6.5).text(`For ${firm.legalName || "the Firm"}\n\nAuthorised Signatory`, 290, doc.y - 2, { width: 107, align: "right" });
    if (receipt.documentStatus === "Reversed" || receipt.document_status === "Reversed" || receipt.status === "not_received") { doc.save(); doc.rotate(-35, { origin: [doc.page.width / 2, doc.page.height / 2] }); doc.font(bold).fontSize(48).fillColor("#EF4444").opacity(0.18).text("REVERSED", 35, doc.page.height / 2 - 25, { width: 350, align: "center" }); doc.restore(); doc.opacity(1); }
    const pages = doc.bufferedPageRange(); for (let page = pages.start; page < pages.start + pages.count; page += 1) { doc.switchToPage(page); doc.font(regular).fillColor("#64748B").fontSize(5.4).text(`${RECEIPT_FOOTER}\nVerification: ${receipt.verificationReference || receipt.verification_reference || "-"} | System-generated receipt | Page ${page + 1} of ${pages.count}`, 24, doc.page.height - 24, { width, align: "center", lineBreak: false }); }
    doc.end();
  });
}

async function receiptPdf(receiptId) { const { receipt } = await receiptById(receiptId); return { receipt, pdf: await drawReceiptPdf(receipt) }; }
function safeReceiptFilename(receipt) { return `Money-Receipt-${text(receipt.receiptNumber || receipt.id).replace(/[^A-Za-z0-9_-]+/g, "-")}.pdf`; }
async function receiptHistory(receiptId) { return (await receiptById(receiptId)).events; }

async function historicalReceiptPreview() {
  const state = await getAppState(); const eligible = (state.feeReceipts || []).filter((row) => isActiveReceipt(row) && !row.receiptNumber);
  return { eligible: eligible.length, review: eligible.filter((row) => !fileIdOf(row)).length };
}
async function generateHistoricalReceipts(userId, profile, onlyReceiptId = "") {
  return patchAppStateAtomic((state) => {
    const now = new Date(); let generated = 0; let review = 0;
    state.feeReceipts = (state.feeReceipts || []).map((receipt) => {
      if (onlyReceiptId && receipt.id !== onlyReceiptId) return receipt;
      if (!isActiveReceipt(receipt) || receipt.receiptNumber) return receipt;
      const file = (state.files || []).find((row) => row.id === fileIdOf(receipt));
      if (!file) { review += 1; return receipt; }
      const transaction = (state.otherCashCollections || []).find((row) => row.id === (receipt.transactionId || receipt.transaction_id)) || null;
      generated += 1; return issueReceiptRecord(state, receipt, file, transaction, profile, now, { historical: true });
    });
    state.lastHistoricalReceiptRun = { generated, review, at: now.toISOString(), by: actor(profile, userId).name };
    return state;
  }, userId);
}

module.exports = { RECEIPT_SERIES, RECEIPT_DECLARATION, RECEIPT_FOOTER, issueReceiptRecord, markReceiptReversed, receiptById, receiptPdf, receiptHistory, safeReceiptFilename, drawReceiptPdf, historicalReceiptPreview, generateHistoricalReceipts, isActiveReceipt };
