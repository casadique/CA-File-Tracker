const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { getAppState, patchAppState, patchAppStateAtomic } = require("./appStateService");
const { getClient, updateClient } = require("./clientService");

const TEST_GSTIN = "32AVFPM0043F1Z7";
const GSTIN_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const INVOICE_STATUSES = new Set(["Not Issued", "Draft", "Issued", "Cancelled", "Credit Note Issued"]);

function httpError(message, status = 400, details = null) {
  const error = new Error(message);
  error.status = status;
  if (details) error.details = details;
  return error;
}

function text(value = "") {
  return String(value ?? "").trim();
}

function money(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round((amount + Number.EPSILON) * 100) / 100 : 0;
}

function isoDate(value = new Date()) {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, "0")}-${String(parsed.getUTCDate()).padStart(2, "0")}`;
}

function displayDate(value) {
  const normalized = isoDate(value);
  if (!normalized) return "-";
  const [year, month, day] = normalized.split("-");
  return `${day}-${month}-${year}`;
}

function financialYearForDate(value) {
  const normalized = isoDate(value);
  if (!normalized) return "";
  const [year, month] = normalized.split("-").map(Number);
  const start = month >= 4 ? year : year - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

function defaultInvoiceSettings() {
  return {
    legalName: "Muhammad & Associates",
    tradeName: "",
    professionalDescription: "Chartered Accountants",
    address: "",
    district: "",
    state: "Kerala",
    stateCode: "32",
    pinCode: "",
    gstin: TEST_GSTIN,
    pan: "",
    email: "",
    mobile: "",
    website: "",
    firmLogo: "",
    invoicePrefix: "MA",
    numberingFormat: "{PREFIX}/{FY}/{NUMBER}",
    numberPadding: 4,
    defaultSac: "998221",
    defaultGstRate: 18,
    defaultTaxMode: "Exclusive",
    documentType: "Tax Invoice",
    authorisedSignatory: "",
    signatureImage: "",
    bankName: "",
    accountName: "Muhammad & Associates",
    accountNumber: "",
    ifsc: "",
    branch: "",
    upiId: "",
    paymentTerms: "Due on receipt",
    paymentTermsDays: 0,
    declaration: "We declare that this invoice shows the actual price of the services described and that all particulars are true and correct.",
    invoiceFooter: "This is a system-generated invoice.",
    roundOffPreference: "None",
    updatedAt: "",
    updatedBy: "",
  };
}

function normalizedSettings(value = {}) {
  const defaults = defaultInvoiceSettings();
  const merged = { ...defaults, ...(value || {}) };
  merged.stateCode = text(merged.stateCode).padStart(2, "0").slice(-2);
  merged.gstin = text(merged.gstin).toUpperCase();
  merged.pan = text(merged.pan).toUpperCase() || (GSTIN_PATTERN.test(merged.gstin) ? merged.gstin.slice(2, 12) : "");
  merged.invoicePrefix = text(merged.invoicePrefix || "MA").replace(/[^A-Za-z0-9-]/g, "").toUpperCase() || "MA";
  merged.defaultGstRate = money(merged.defaultGstRate);
  merged.numberPadding = Math.min(8, Math.max(3, Number(merged.numberPadding) || 4));
  merged.paymentTermsDays = Math.max(0, Math.floor(Number(merged.paymentTermsDays) || 0));
  merged.defaultTaxMode = /inclusive/i.test(merged.defaultTaxMode) ? "Inclusive" : "Exclusive";
  merged.documentType = /bill of supply/i.test(merged.documentType) ? "Bill of Supply" : "Tax Invoice";
  merged.roundOffPreference = /nearest/i.test(merged.roundOffPreference) ? "Nearest Rupee" : "None";
  merged.isTestGstin = merged.gstin === TEST_GSTIN;
  return merged;
}

function invoiceActor(profile = {}, userId = "") {
  return {
    id: userId || profile.auth_user_id || profile.id || "",
    name: profile.name || profile.full_name || profile.email || "Unknown User",
    role: profile.role || "Unknown",
  };
}

function recipientSnapshot(file = {}) {
  const snapshot = file.clientSnapshot || file.client_snapshot || {};
  const gstin = text(file.gstNo || file.gst_no || snapshot.gstNo || snapshot.gst_no).toUpperCase();
  return {
    clientId: file.clientId || file.client_id || "",
    clientName: text(file.name || file.clientName || snapshot.clientName || snapshot.client_name),
    billingName: text(file.billingName || file.billing_name || file.name || snapshot.billingName || snapshot.clientName),
    billingAddress: text(file.clientAddress || file.address || snapshot.address || snapshot.billingAddress),
    place: text(file.clientPlace || file.place || snapshot.place),
    district: text(file.clientDistrict || file.district || snapshot.district),
    state: text(file.clientState || file.state || snapshot.state || "Kerala"),
    stateCode: text(file.clientStateCode || file.stateCode || snapshot.stateCode || snapshot.state_code || "32").padStart(2, "0").slice(-2),
    pinCode: text(file.clientPinCode || file.pinCode || snapshot.pinCode || snapshot.pin_code),
    gstRegistration: gstin ? "Registered" : "Unregistered",
    gstin,
    panRegNo: text(file.pan || file.panRegNo || file.regNo || snapshot.panRegNo || snapshot.pan_reg_no),
    contactPerson: text(file.contactPerson || snapshot.contactPerson || snapshot.contact_person),
    mobile: text(file.contactNo || file.contact_no || snapshot.contactNumber || snapshot.contact_number || snapshot.mobile),
    email: text(file.clientEmail || file.email || snapshot.email),
    careOf: text(file.careOf || file.care_of || snapshot.careOf || "Direct"),
  };
}

function supplierSnapshot(settings) {
  return {
    legalName: settings.legalName,
    tradeName: settings.tradeName,
    professionalDescription: settings.professionalDescription,
    address: settings.address,
    district: settings.district,
    state: settings.state,
    stateCode: settings.stateCode,
    pinCode: settings.pinCode,
    gstin: settings.gstin,
    pan: settings.pan,
    email: settings.email,
    mobile: settings.mobile,
    website: settings.website,
    firmLogo: settings.firmLogo,
    authorisedSignatory: settings.authorisedSignatory,
    signatureImage: settings.signatureImage,
    bankName: settings.bankName,
    accountName: settings.accountName,
    accountNumber: settings.accountNumber,
    ifsc: settings.ifsc,
    branch: settings.branch,
    upiId: settings.upiId,
    paymentTerms: settings.paymentTerms,
    declaration: settings.declaration,
    invoiceFooter: settings.invoiceFooter,
  };
}

function activeReceiptAmount(state, fileId) {
  return money((state.feeReceipts || []).filter((row) => {
    const id = row.fileId || row.file_id;
    const status = text(row.status || row.transactionStatus).toLowerCase();
    return id === fileId && row.isReversed !== true && row.is_reversed !== true && !["reversed", "cancelled", "deleted", "void", "failed"].includes(status);
  }).reduce((sum, row) => sum + Math.max(money(row.amount || row.receivedAmount || row.received_amount), 0), 0));
}

function defaultInvoicePayload(state, file, existing = null) {
  const settings = normalizedSettings(state.invoiceSettings);
  const invoiceDate = isoDate(existing?.invoiceDate || file.billDate || file.billedDate || new Date());
  const billedAmount = money(file.billedAmount || file.billed_amount || file.billAmount || file.feeAmount || 0);
  const recipient = { ...recipientSnapshot(file), ...(existing?.recipientSnapshot || {}) };
  const days = settings.paymentTermsDays;
  const due = new Date(`${invoiceDate}T00:00:00.000Z`);
  due.setUTCDate(due.getUTCDate() + days);
  return {
    invoiceId: existing?.invoiceId || existing?.id || "",
    draftReference: existing?.draftReference || "",
    invoiceNumber: existing?.invoiceNumber || "",
    status: existing?.status || file.invoiceStatus || "Not Issued",
    documentType: existing?.documentType || settings.documentType,
    invoiceDate,
    dueDate: existing?.dueDate || isoDate(due),
    financialYear: existing?.financialYear || financialYearForDate(invoiceDate),
    placeOfSupply: existing?.placeOfSupply || recipient.state || settings.state,
    reverseCharge: existing?.reverseCharge || "No",
    taxMode: existing?.taxMode || settings.defaultTaxMode,
    fileReference: existing?.fileReference || file.fileNumber || file.referenceNo || file.id,
    serviceFy: existing?.serviceFy || file.fy || "",
    recipient,
    lines: existing?.lines?.length ? existing.lines : [{
      id: crypto.randomUUID(),
      serviceId: file.serviceId || "",
      description: `${text(file.serviceType || "Professional Services")}${file.fy ? ` for FY ${file.fy}` : ""}`,
      servicePeriod: file.fy || "",
      sac: file.sac || settings.defaultSac,
      quantity: 1,
      unit: "Service",
      rate: billedAmount,
      discount: 0,
      gstRate: settings.defaultGstRate,
    }],
    invoiceDiscount: money(existing?.invoiceDiscount),
    otherCharges: money(existing?.otherCharges),
    advanceReceived: activeReceiptAmount(state, file.id),
    notes: existing?.notes || file.billingRemarks || "",
    updateClientMaster: false,
    irn: existing?.irn || "",
    acknowledgementNumber: existing?.acknowledgementNumber || "",
    acknowledgementDate: existing?.acknowledgementDate || "",
    eInvoiceStatus: existing?.eInvoiceStatus || "Not Applicable",
  };
}

function calculateInvoice(input = {}, settingsInput = {}) {
  const settings = normalizedSettings(settingsInput);
  const taxInclusive = /inclusive/i.test(input.taxMode);
  const supplierState = text(settings.stateCode);
  const recipientState = text(input.recipient?.stateCode);
  const placeState = text(input.placeOfSupplyStateCode || input.recipient?.stateCode);
  const interstate = Boolean(placeState && supplierState && placeState !== supplierState) || Boolean(recipientState && supplierState && recipientState !== supplierState);
  const rawLines = Array.isArray(input.lines) ? input.lines : [];
  if (!rawLines.length) throw httpError("Add at least one invoice service line.");
  const prepared = rawLines.map((line, index) => {
    const quantity = money(line.quantity || 0);
    const rate = money(line.rate || 0);
    const grossAmount = money(quantity * rate);
    const discount = Math.min(Math.max(money(line.discount), 0), grossAmount);
    const netBeforeInvoiceDiscount = money(grossAmount - discount);
    if (!text(line.description)) throw httpError(`Service description is required for line ${index + 1}.`);
    if (!text(line.sac)) throw httpError(`SAC is required for line ${index + 1}.`);
    if (quantity <= 0 || rate < 0) throw httpError(`Enter a valid quantity and rate for line ${index + 1}.`);
    const gstRate = money(line.gstRate);
    if (gstRate < 0 || gstRate > 100) throw httpError(`Enter a valid GST rate for line ${index + 1}.`);
    return { ...line, quantity, rate, grossAmount, discount, netBeforeInvoiceDiscount, gstRate };
  });
  const baseAfterLineDiscounts = money(prepared.reduce((sum, line) => sum + line.netBeforeInvoiceDiscount, 0));
  const invoiceDiscount = Math.min(Math.max(money(input.invoiceDiscount), 0), baseAfterLineDiscounts);
  const lines = prepared.map((line, index) => {
    const share = index === prepared.length - 1
      ? money(invoiceDiscount - prepared.slice(0, -1).reduce((sum, previous) => sum + money(baseAfterLineDiscounts ? invoiceDiscount * previous.netBeforeInvoiceDiscount / baseAfterLineDiscounts : 0), 0))
      : money(baseAfterLineDiscounts ? invoiceDiscount * line.netBeforeInvoiceDiscount / baseAfterLineDiscounts : 0);
    const discounted = money(line.netBeforeInvoiceDiscount - share);
    const taxableValue = taxInclusive && line.gstRate > 0 ? money(discounted / (1 + line.gstRate / 100)) : discounted;
    const taxAmount = money(taxInclusive ? discounted - taxableValue : taxableValue * line.gstRate / 100);
    const cgstAmount = interstate ? 0 : money(taxAmount / 2);
    const sgstAmount = interstate ? 0 : money(taxAmount - cgstAmount);
    const igstAmount = interstate ? taxAmount : 0;
    const lineTotal = money(taxableValue + cgstAmount + sgstAmount + igstAmount);
    return {
      ...line,
      invoiceDiscountShare: share,
      taxableValue,
      cgstRate: interstate ? 0 : money(line.gstRate / 2),
      cgstAmount,
      sgstRate: interstate ? 0 : money(line.gstRate / 2),
      sgstAmount,
      igstRate: interstate ? line.gstRate : 0,
      igstAmount,
      lineTotal,
    };
  });
  const grossAmount = money(lines.reduce((sum, line) => sum + line.grossAmount, 0));
  const lineDiscount = money(lines.reduce((sum, line) => sum + line.discount, 0));
  const totalDiscount = money(lineDiscount + invoiceDiscount);
  const taxableAmount = money(lines.reduce((sum, line) => sum + line.taxableValue, 0));
  const cgstAmount = money(lines.reduce((sum, line) => sum + line.cgstAmount, 0));
  const sgstAmount = money(lines.reduce((sum, line) => sum + line.sgstAmount, 0));
  const igstAmount = money(lines.reduce((sum, line) => sum + line.igstAmount, 0));
  const otherCharges = money(input.otherCharges);
  const beforeRoundOff = money(taxableAmount + cgstAmount + sgstAmount + igstAmount + otherCharges);
  const roundOff = settings.roundOffPreference === "Nearest Rupee" ? money(Math.round(beforeRoundOff) - beforeRoundOff) : 0;
  const invoiceTotal = money(beforeRoundOff + roundOff);
  const advanceReceived = Math.max(money(input.advanceReceived), 0);
  const netAmountPayable = money(Math.max(invoiceTotal - advanceReceived, 0));
  if (taxableAmount < 0 || invoiceTotal < 0) throw httpError("Invoice totals cannot be negative.");
  return { lines, grossAmount, lineDiscount, invoiceDiscount, totalDiscount, taxableAmount, cgstAmount, sgstAmount, igstAmount, otherCharges, roundOff, invoiceTotal, advanceReceived, netAmountPayable, interstate, taxInclusive };
}

function validateInvoice(input, settings, { issuing = false } = {}) {
  const errors = [];
  const recipient = input.recipient || {};
  if (issuing) {
    for (const [label, value] of [["Legal name", settings.legalName], ["Registered address", settings.address], ["State", settings.state], ["State code", settings.stateCode], ["PIN code", settings.pinCode], ["GSTIN", settings.gstin], ["PAN", settings.pan]]) {
      if (!text(value)) errors.push(`${label} is missing in Invoice Settings.`);
    }
  }
  if (settings.gstin && !GSTIN_PATTERN.test(settings.gstin)) errors.push("Supplier GSTIN format is invalid.");
  if (!isoDate(input.invoiceDate)) errors.push("Invoice date is required.");
  if (!text(input.placeOfSupply)) errors.push("Place of supply is required.");
  if (!text(recipient.billingName || recipient.clientName)) errors.push("Recipient billing name is required.");
  const recipientRegistration = text(recipient.gstRegistration).toLowerCase();
  if (["registered", "sez"].includes(recipientRegistration)) {
    if (!GSTIN_PATTERN.test(text(recipient.gstin).toUpperCase())) errors.push("A valid recipient GSTIN is required for a registered recipient.");
    if (!text(recipient.billingAddress)) errors.push("Recipient billing address is required.");
    if (!text(recipient.state) || !text(recipient.stateCode)) errors.push("Recipient state and state code are required.");
  } else if (recipient.gstin && !GSTIN_PATTERN.test(text(recipient.gstin).toUpperCase())) {
    errors.push("Recipient GSTIN format is invalid.");
  }
  if (issuing && settings.isTestGstin && input.confirmTestGstin !== true) errors.push("Confirm the TEST GSTIN warning before issuing.");
  if (issuing && /tax invoice/i.test(input.documentType || settings.documentType) && money(settings.defaultGstRate) > 0 && !settings.gstin) errors.push("A Tax Invoice requires supplier GSTIN.");
  const gstRates = (input.lines || input.items || []).map((line) => money(line.gstRate));
  if (/bill of supply/i.test(input.documentType || "") && gstRates.some((rate) => rate > 0)) errors.push("Bill of Supply service lines must not apply GST. Set GST rate to 0 or use Tax Invoice.");
  if (issuing && /tax invoice/i.test(input.documentType || "") && gstRates.length && gstRates.every((rate) => rate === 0)) errors.push("Use Bill of Supply for wholly exempt or non-taxable service lines.");
  if (errors.length) throw httpError(errors.join(" "), 400, { errors });
}

function sanitizedInvoiceInput(state, file, raw = {}, existing = null) {
  const defaults = defaultInvoicePayload(state, file, existing);
  const recipient = { ...defaults.recipient, ...(raw.recipient || {}) };
  recipient.gstin = text(recipient.gstin).toUpperCase();
  recipient.stateCode = text(recipient.stateCode).padStart(2, "0").slice(-2);
  const input = {
    ...defaults,
    ...raw,
    recipient,
    invoiceDate: isoDate(raw.invoiceDate || defaults.invoiceDate),
    dueDate: isoDate(raw.dueDate || defaults.dueDate),
    financialYear: financialYearForDate(raw.invoiceDate || defaults.invoiceDate),
    reverseCharge: raw.reverseCharge === "Yes" ? "Yes" : "No",
    taxMode: /inclusive/i.test(raw.taxMode) ? "Inclusive" : "Exclusive",
    documentType: /bill of supply/i.test(raw.documentType) ? "Bill of Supply" : "Tax Invoice",
    lines: (raw.lines || defaults.lines).map((line) => ({ ...line, id: line.id || crypto.randomUUID() })),
    confirmTestGstin: raw.confirmTestGstin === true,
  };
  const calculation = calculateInvoice(input, state.invoiceSettings);
  return { ...input, ...calculation };
}

function invoiceForFile(state, fileId) {
  return [...(state.invoices || [])]
    .filter((invoice) => invoice.fileId === fileId)
    .sort((a, b) => Date.parse(b.updatedAt || b.createdAt || 0) - Date.parse(a.updatedAt || a.createdAt || 0))[0] || null;
}

function invoiceSummary(invoice = {}) {
  if (!invoice) return null;
  return {
    invoiceId: invoice.invoiceId || invoice.id,
    draftReference: invoice.draftReference || "",
    invoiceNumber: invoice.invoiceNumber || "",
    invoiceDate: invoice.invoiceDate || "",
    financialYear: invoice.financialYear || "",
    status: INVOICE_STATUSES.has(invoice.status) ? invoice.status : "Not Issued",
    documentType: invoice.documentType || "Tax Invoice",
    clientName: invoice.recipientSnapshot?.billingName || invoice.recipientSnapshot?.clientName || "",
    gstin: invoice.recipientSnapshot?.gstin || "",
    service: invoice.items?.map((item) => item.description).join("; ") || "",
    taxableAmount: money(invoice.taxableAmount),
    cgstAmount: money(invoice.cgstAmount),
    sgstAmount: money(invoice.sgstAmount),
    igstAmount: money(invoice.igstAmount),
    invoiceTotal: money(invoice.invoiceTotal),
    advanceReceived: money(invoice.advanceReceived),
    outstandingAmount: money(invoice.outstandingAmount),
    createdBy: invoice.createdBy?.name || "",
    issuedAt: invoice.issuedAt || "",
    cancelledAt: invoice.cancelledAt || "",
  };
}

async function getInvoiceWorkspace(fileId) {
  const state = await getAppState();
  const file = (state.files || []).find((row) => row.id === fileId);
  if (!file) throw httpError("File record not found.", 404);
  const existing = invoiceForFile(state, fileId);
  return {
    settings: normalizedSettings(state.invoiceSettings),
    file: { id: file.id, name: file.name, serviceType: file.serviceType, fy: file.fy, billed: Boolean(file.billed), billedAmount: money(file.billedAmount || file.billAmount || file.feeAmount), billDate: file.billDate || file.billedDate || "", billingRemarks: file.billingRemarks || "" },
    invoice: existing ? { ...defaultInvoicePayload(state, file, existing), ...existing, recipient: existing.recipientSnapshot, lines: existing.items } : defaultInvoicePayload(state, file),
    summary: invoiceSummary(existing),
    warning: normalizedSettings(state.invoiceSettings).isTestGstin ? "TEST GSTIN — Replace with the actual registered GSTIN before issuing production invoices." : "",
  };
}

async function getInvoiceSettings() {
  const state = await getAppState();
  return normalizedSettings(state.invoiceSettings);
}

async function saveInvoiceSettings(input, userId, profile) {
  const actor = invoiceActor(profile, userId);
  return patchAppState((state) => {
    const before = normalizedSettings(state.invoiceSettings);
    const next = normalizedSettings({ ...before, ...(input || {}), updatedAt: new Date().toISOString(), updatedBy: actor.name });
    if (next.gstin && !GSTIN_PATTERN.test(next.gstin)) throw httpError("Enter a valid 15-character GSTIN.");
    state.invoiceSettings = next;
    state.invoiceAuditEvents = [...(state.invoiceAuditEvents || []), { id: crypto.randomUUID(), action: "Invoice Settings Updated", previousValue: before, newValue: next, user: actor, dateTime: new Date().toISOString() }];
    state.auditLog = [...(state.auditLog || []), { id: crypto.randomUUID(), action: "Invoice Settings Updated", user: actor.name, role: actor.role, at: new Date().toISOString() }].slice(-1000);
    return state;
  }, userId);
}

function draftRecord(state, file, raw, existing, actor, now) {
  const settings = normalizedSettings(state.invoiceSettings);
  const calculated = sanitizedInvoiceInput(state, file, raw, existing);
  return {
    invoiceId: existing?.invoiceId || existing?.id || crypto.randomUUID(),
    billingRecordId: file.id,
    fileId: file.id,
    clientId: file.clientId || file.client_id || "",
    draftReference: existing?.draftReference || `DRAFT-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
    invoiceNumber: "",
    financialYear: calculated.financialYear,
    invoiceDate: calculated.invoiceDate,
    dueDate: calculated.dueDate,
    documentType: calculated.documentType,
    status: "Draft",
    placeOfSupply: calculated.placeOfSupply,
    reverseCharge: calculated.reverseCharge,
    taxMode: calculated.taxMode,
    supplierSnapshot: supplierSnapshot(settings),
    recipientSnapshot: calculated.recipient,
    items: calculated.lines,
    grossAmount: calculated.grossAmount,
    discountAmount: calculated.totalDiscount,
    invoiceDiscount: calculated.invoiceDiscount,
    taxableAmount: calculated.taxableAmount,
    cgstAmount: calculated.cgstAmount,
    sgstAmount: calculated.sgstAmount,
    igstAmount: calculated.igstAmount,
    otherCharges: calculated.otherCharges,
    roundOff: calculated.roundOff,
    invoiceTotal: calculated.invoiceTotal,
    advanceReceived: calculated.advanceReceived,
    outstandingAmount: calculated.netAmountPayable,
    notes: text(calculated.notes),
    fileReference: text(calculated.fileReference || file.id),
    serviceFy: text(calculated.serviceFy || file.fy),
    irn: text(calculated.irn),
    acknowledgementNumber: text(calculated.acknowledgementNumber),
    acknowledgementDate: isoDate(calculated.acknowledgementDate),
    eInvoiceStatus: text(calculated.eInvoiceStatus || "Not Applicable"),
    pdfStorageReference: `generated:${existing?.invoiceId || existing?.id || file.id}`,
    createdBy: existing?.createdBy || actor,
    createdAt: existing?.createdAt || now,
    updatedBy: actor,
    updatedAt: now,
  };
}

async function updateClientMasterIfRequested(file, raw, userId) {
  const clientId = file.clientId || file.client_id;
  if (raw?.updateClientMaster !== true || !clientId) return false;
  const before = await getClient(clientId);
  const recipient = raw.recipient || {};
  await updateClient(clientId, {
    clientName: recipient.billingName || recipient.clientName || before.client_name,
    panRegNo: recipient.panRegNo || before.pan_reg_no,
    tan: before.tan,
    gstNo: recipient.gstin || before.gst_no,
    cin: before.cin,
    otherRegnNo: before.other_regn_no,
    clientTypes: before.client_types || before.client_type,
    constitution: before.constitution,
    contactPerson: recipient.contactPerson || before.contact_person,
    contactNumber: recipient.mobile || before.contact_number,
    email: recipient.email || before.email,
    address: recipient.billingAddress || before.address,
    place: recipient.place || before.place,
    careOf: recipient.careOf || before.care_of,
    status: before.status,
    remarks: before.remarks,
  }, userId, { acceptWarnings: true });
  return true;
}

async function saveInvoiceDraft(fileId, raw, userId, profile) {
  const actor = invoiceActor(profile, userId);
  let savedInvoice;
  const state = await patchAppStateAtomic((next) => {
    const file = (next.files || []).find((row) => row.id === fileId);
    if (!file) throw httpError("File record not found.", 404);
    if (!file.billed) throw httpError("Save the file as billed before saving an invoice draft.");
    const existing = invoiceForFile(next, fileId);
    if (existing?.status === "Issued" || existing?.status === "Cancelled") throw httpError("Issued or cancelled invoices cannot be overwritten.", 409);
    const now = new Date().toISOString();
    savedInvoice = draftRecord(next, file, raw, existing, actor, now);
    next.invoices = [...(next.invoices || []).filter((invoice) => invoice.fileId !== fileId || invoice.status === "Cancelled"), savedInvoice];
    Object.assign(file, { invoiceId: savedInvoice.invoiceId, invoiceStatus: "Draft", invoiceIssued: false, updatedAt: now, updated_at: now });
    const audit = { id: crypto.randomUUID(), invoiceId: savedInvoice.invoiceId, fileId, clientId: savedInvoice.clientId, action: existing ? "Invoice Draft Updated" : "Invoice Draft Created", previousValue: existing ? invoiceSummary(existing) : null, newValue: invoiceSummary(savedInvoice), taxableValue: savedInvoice.taxableAmount, gst: money(savedInvoice.cgstAmount + savedInvoice.sgstAmount + savedInvoice.igstAmount), invoiceTotal: savedInvoice.invoiceTotal, user: actor, dateTime: now };
    next.invoiceAuditEvents = [...(next.invoiceAuditEvents || []), audit];
    next.auditLog = [...(next.auditLog || []), { ...audit, user: actor.name, role: actor.role, at: now }].slice(-1000);
    return next;
  }, userId);
  const file = (state.files || []).find((row) => row.id === fileId) || {};
  let clientMasterUpdated = false;
  let clientMasterWarning = "";
  try { clientMasterUpdated = await updateClientMasterIfRequested(file, raw, userId); } catch (error) { clientMasterWarning = `Draft saved, but Client Master was not updated: ${error.message}`; }
  return { state, invoice: savedInvoice, clientMasterUpdated, clientMasterWarning };
}

function nextInvoiceNumber(state, settings, financialYear) {
  const series = settings.invoicePrefix;
  const sequences = Array.isArray(state.invoiceSequences) ? state.invoiceSequences : [];
  const existing = sequences.find((row) => row.financialYear === financialYear && row.invoiceSeries === series);
  const nextNumber = Number(existing?.lastUsedNumber || 0) + 1;
  const number = String(nextNumber).padStart(settings.numberPadding, "0");
  const invoiceNumber = text(settings.numberingFormat || "{PREFIX}/{FY}/{NUMBER}")
    .replaceAll("{PREFIX}", series).replaceAll("{FY}", financialYear).replaceAll("{NUMBER}", number);
  if ((state.invoices || []).some((invoice) => invoice.invoiceNumber === invoiceNumber)) throw httpError("Invoice number collision detected. Please retry.", 409);
  state.invoiceSequences = [...sequences.filter((row) => row !== existing), { financialYear, invoiceSeries: series, lastUsedNumber: nextNumber, updatedAt: new Date().toISOString() }];
  return invoiceNumber;
}

async function issueInvoice(fileId, raw, userId, profile) {
  const actor = invoiceActor(profile, userId);
  let issuedInvoice;
  const state = await patchAppStateAtomic((next) => {
    const file = (next.files || []).find((row) => row.id === fileId);
    if (!file) throw httpError("File record not found.", 404);
    if (!file.billed) throw httpError("Save the file as billed before issuing an invoice.");
    const current = invoiceForFile(next, fileId);
    if (current?.status === "Issued") throw httpError(`Invoice ${current.invoiceNumber} is already issued for this billing record.`, 409);
    if (current?.status === "Cancelled") throw httpError("This billing record has a cancelled invoice. Use an authorised revised-document workflow.", 409);
    const now = new Date().toISOString();
    const settings = normalizedSettings(next.invoiceSettings);
    const draft = draftRecord(next, file, { ...raw, confirmTestGstin: raw.confirmTestGstin === true }, current, actor, now);
    validateInvoice({ ...raw, ...draft, recipient: draft.recipientSnapshot, lines: draft.items, confirmTestGstin: raw.confirmTestGstin === true }, settings, { issuing: true });
    const invoiceNumber = nextInvoiceNumber(next, settings, draft.financialYear);
    issuedInvoice = { ...draft, invoiceNumber, draftReference: draft.draftReference, status: "Issued", issuedBy: actor, issuedAt: now, frozenAt: now, updatedAt: now, pdfStorageReference: `generated:${draft.invoiceId}` };
    next.invoices = [...(next.invoices || []).filter((invoice) => invoice.fileId !== fileId || invoice.status === "Cancelled"), issuedInvoice];
    Object.assign(file, {
      invoiceId: issuedInvoice.invoiceId,
      invoiceStatus: "Issued",
      invoiceIssued: true,
      invoiceIssuedAt: now,
      issuedInvoiceNumber: invoiceNumber,
      invoiceTotal: issuedInvoice.invoiceTotal,
      invoiceOutstandingAmount: issuedInvoice.outstandingAmount,
      balanceAmount: issuedInvoice.outstandingAmount,
      balance_amount: issuedInvoice.outstandingAmount,
      paymentStatus: issuedInvoice.advanceReceived <= 0 ? "Fee Not Received" : (issuedInvoice.outstandingAmount > 0 ? "Partly Received" : "Fee Received"),
      payment_status: issuedInvoice.advanceReceived <= 0 ? "Fee Not Received" : (issuedInvoice.outstandingAmount > 0 ? "Partly Received" : "Fee Received"),
      updatedAt: now,
      updated_at: now,
    });
    const audit = { id: crypto.randomUUID(), invoiceId: issuedInvoice.invoiceId, billingRecordId: file.id, fileId, clientId: issuedInvoice.clientId, invoiceNumber, action: "Invoice Issued", previousValue: current ? invoiceSummary(current) : null, newValue: invoiceSummary(issuedInvoice), taxableValue: issuedInvoice.taxableAmount, gst: money(issuedInvoice.cgstAmount + issuedInvoice.sgstAmount + issuedInvoice.igstAmount), invoiceTotal: issuedInvoice.invoiceTotal, user: actor, dateTime: now };
    next.invoiceAuditEvents = [...(next.invoiceAuditEvents || []), audit];
    next.auditLog = [...(next.auditLog || []), { ...audit, user: actor.name, role: actor.role, at: now }].slice(-1000);
    return next;
  }, userId);
  const file = (state.files || []).find((row) => row.id === fileId) || {};
  let clientMasterUpdated = false;
  let clientMasterWarning = "";
  try { clientMasterUpdated = await updateClientMasterIfRequested(file, raw, userId); } catch (error) { clientMasterWarning = `Invoice issued, but Client Master was not updated: ${error.message}`; }
  return { state, invoice: issuedInvoice, clientMasterUpdated, clientMasterWarning };
}

async function cancelInvoice(invoiceId, reason, userId, profile) {
  if (!text(reason)) throw httpError("Cancellation reason is required.");
  const actor = invoiceActor(profile, userId);
  let cancelled;
  const state = await patchAppStateAtomic((next) => {
    const index = (next.invoices || []).findIndex((invoice) => (invoice.invoiceId || invoice.id) === invoiceId);
    if (index < 0) throw httpError("Invoice not found.", 404);
    const before = next.invoices[index];
    if (before.status !== "Issued") throw httpError("Only an issued invoice can be cancelled.", 409);
    if (money(before.advanceReceived) > 0) throw httpError("Reverse or legally adjust linked receipts before cancelling this invoice. Use a credit note when required.", 409);
    const now = new Date().toISOString();
    cancelled = { ...before, status: "Cancelled", cancelledBy: actor, cancelledAt: now, cancellationReason: text(reason), updatedAt: now };
    next.invoices[index] = cancelled;
    const file = (next.files || []).find((row) => row.id === before.fileId);
    if (file) Object.assign(file, { invoiceStatus: "Cancelled", invoiceIssued: false, updatedAt: now, updated_at: now });
    const audit = { id: crypto.randomUUID(), invoiceId, fileId: before.fileId, clientId: before.clientId, invoiceNumber: before.invoiceNumber, action: "Invoice Cancelled", previousValue: invoiceSummary(before), newValue: invoiceSummary(cancelled), taxableValue: before.taxableAmount, gst: money(before.cgstAmount + before.sgstAmount + before.igstAmount), invoiceTotal: before.invoiceTotal, user: actor, dateTime: now, remarks: text(reason) };
    next.invoiceAuditEvents = [...(next.invoiceAuditEvents || []), audit];
    next.auditLog = [...(next.auditLog || []), { ...audit, user: actor.name, role: actor.role, at: now }].slice(-1000);
    return next;
  }, userId);
  return { state, invoice: cancelled };
}

function listInvoices(state, filters = {}) {
  const search = text(filters.search).toLowerCase();
  const rows = (state.invoices || []).filter((invoice) => {
    if (filters.status && invoice.status !== filters.status) return false;
    if (filters.financialYear && invoice.financialYear !== filters.financialYear) return false;
    if (filters.from && isoDate(invoice.invoiceDate) < isoDate(filters.from)) return false;
    if (filters.to && isoDate(invoice.invoiceDate) > isoDate(filters.to)) return false;
    if (search && ![invoice.invoiceNumber, invoice.draftReference, invoice.recipientSnapshot?.billingName, invoice.recipientSnapshot?.gstin, ...(invoice.items || []).map((item) => item.description)].join(" ").toLowerCase().includes(search)) return false;
    const paymentStatus = money(invoice.outstandingAmount) <= 0 ? "Received" : money(invoice.advanceReceived) > 0 ? "Partially Received" : "Pending";
    if (filters.paymentStatus && filters.paymentStatus !== paymentStatus) return false;
    return true;
  }).sort((a, b) => Date.parse(b.issuedAt || b.updatedAt || b.createdAt || 0) - Date.parse(a.issuedAt || a.updatedAt || a.createdAt || 0));
  return rows.map((invoice) => ({ ...invoiceSummary(invoice), paymentStatus: money(invoice.outstandingAmount) <= 0 ? "Received" : money(invoice.advanceReceived) > 0 ? "Partially Received" : "Pending" }));
}

async function queryInvoices(filters = {}) {
  const state = await getAppState();
  return listInvoices(state, filters);
}

function drawInvoiceRegisterPdf(rows = [], filters = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margins: { top: 34, left: 28, right: 28, bottom: 36 }, bufferPages: true });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk)); doc.on("end", () => resolve(Buffer.concat(chunks))); doc.on("error", reject);
    const regularPath = path.join(__dirname, "../../assets/DejaVuSans.ttf"); const boldPath = path.join(__dirname, "../../assets/DejaVuSans-Bold.ttf");
    if (fs.existsSync(regularPath)) doc.registerFont("RegisterRegular", regularPath); if (fs.existsSync(boldPath)) doc.registerFont("RegisterBold", boldPath);
    const regular = fs.existsSync(regularPath) ? "RegisterRegular" : "Helvetica"; const bold = fs.existsSync(boldPath) ? "RegisterBold" : "Helvetica-Bold";
    const pageWidth = doc.page.width - 56; const widths = [24, 86, 52, 118, 120, 59, 52, 52, 52, 62, 60, 55, 52];
    const headers = ["SN", "Invoice", "Date", "Client / GSTIN", "Service", "Taxable", "CGST", "SGST", "IGST", "Total", "Received", "Balance", "Status"];
    const header = () => {
      doc.font(bold).fillColor("#163A70").fontSize(17).text("INVOICE REGISTER", 28, 28, { width: pageWidth, align: "center" });
      doc.font(regular).fillColor("#64748B").fontSize(8).text(`Generated ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}${filters.status ? ` · Status: ${filters.status}` : ""}`, 28, 50, { width: pageWidth, align: "center" });
      const y = 70; doc.rect(28, y, pageWidth, 24).fill("#E8EEF7"); let x = 28;
      headers.forEach((label, index) => { doc.font(bold).fillColor("#17345D").fontSize(6.5).text(label, x + 3, y + 8, { width: widths[index] - 6, align: index >= 5 && index <= 11 ? "right" : "left" }); x += widths[index]; });
      doc.y = y + 24;
    };
    header();
    rows.forEach((row, index) => {
      if (doc.y + 36 > doc.page.height - 38) { doc.addPage(); header(); }
      const y = doc.y; if (index % 2) doc.rect(28, y, pageWidth, 34).fill("#F8FAFD");
      const values = [index + 1, row.invoiceNumber || row.draftReference, displayDate(row.invoiceDate), `${row.clientName || "-"}\n${row.gstin || "Unregistered"}`, row.service || "-", pdfMoney(row.taxableAmount), pdfMoney(row.cgstAmount), pdfMoney(row.sgstAmount), pdfMoney(row.igstAmount), pdfMoney(row.invoiceTotal), pdfMoney(row.advanceReceived), pdfMoney(row.outstandingAmount), row.status];
      let x = 28; values.forEach((value, column) => { doc.font(column === 1 || column === 3 ? bold : regular).fillColor("#1E293B").fontSize(6.5).text(String(value), x + 3, y + 7, { width: widths[column] - 6, height: 25, ellipsis: true, align: column >= 5 && column <= 11 ? "right" : "left" }); x += widths[column]; });
      doc.moveTo(28, y + 34).lineTo(28 + pageWidth, y + 34).strokeColor("#D7E2F0").stroke(); doc.y = y + 34;
    });
    if (!rows.length) doc.font(regular).fillColor("#64748B").fontSize(10).text("No invoices match the selected filters.", 28, 115, { width: pageWidth, align: "center" });
    const pages = doc.bufferedPageRange(); for (let page = pages.start; page < pages.start + pages.count; page += 1) { doc.switchToPage(page); doc.font(regular).fillColor("#64748B").fontSize(7).text(`CA File Tracker · Invoice Register · Page ${page + 1} of ${pages.count}`, 28, doc.page.height - 25, { width: pageWidth, align: "center" }); }
    doc.end();
  });
}

async function invoiceRegisterPdf(filters = {}) {
  const rows = await queryInvoices(filters);
  return drawInvoiceRegisterPdf(rows, filters);
}

async function invoiceById(invoiceId) {
  const state = await getAppState();
  const invoice = (state.invoices || []).find((row) => (row.invoiceId || row.id) === invoiceId);
  if (!invoice) throw httpError("Invoice not found.", 404);
  return invoice;
}

const SMALL_NUMBERS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
function belowThousand(value) {
  let number = value;
  const parts = [];
  if (number >= 100) { parts.push(`${SMALL_NUMBERS[Math.floor(number / 100)]} Hundred`); number %= 100; }
  if (number >= 20) { parts.push(TENS[Math.floor(number / 10)]); number %= 10; }
  if (number > 0) parts.push(SMALL_NUMBERS[number]);
  return parts.join(" ");
}
function amountInWords(value) {
  let whole = Math.floor(Math.abs(money(value)));
  const paise = Math.round((Math.abs(money(value)) - whole) * 100);
  if (!whole && !paise) return "Rupees Zero Only";
  const parts = [];
  for (const [unit, divisor] of [["Crore", 10000000], ["Lakh", 100000], ["Thousand", 1000]]) {
    const chunk = Math.floor(whole / divisor);
    if (chunk) { parts.push(`${belowThousand(chunk)} ${unit}`); whole %= divisor; }
  }
  if (whole) parts.push(belowThousand(whole));
  return `Rupees ${parts.join(" ")}${paise ? ` and ${belowThousand(paise)} Paise` : ""} Only`;
}

function pdfMoney(value) {
  return `₹${money(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function configuredImage(value) {
  const raw = text(value);
  const match = raw.match(/^data:image\/(?:png|jpe?g);base64,([A-Za-z0-9+/=]+)$/i);
  if (match) { try { return Buffer.from(match[1], "base64"); } catch { return null; } }
  if (raw && path.isAbsolute(raw) && fs.existsSync(raw)) return raw;
  return null;
}

function drawInvoicePdf(invoice, { draft = false } = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margins: { top: 32, left: 36, right: 36, bottom: 42 }, bufferPages: true });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    const regular = path.join(__dirname, "../../assets/DejaVuSans.ttf");
    const bold = path.join(__dirname, "../../assets/DejaVuSans-Bold.ttf");
    if (fs.existsSync(regular)) doc.registerFont("InvoiceRegular", regular);
    if (fs.existsSync(bold)) doc.registerFont("InvoiceBold", bold);
    const regularFont = fs.existsSync(regular) ? "InvoiceRegular" : "Helvetica";
    const boldFont = fs.existsSync(bold) ? "InvoiceBold" : "Helvetica-Bold";
    const blue = "#163A70";
    const light = "#E8EEF7";
    const supplier = invoice.supplierSnapshot || {};
    const recipient = invoice.recipientSnapshot || {};
    const pageWidth = doc.page.width - 72;
    const heading = invoice.documentType === "Bill of Supply" ? "BILL OF SUPPLY" : "TAX INVOICE";
    const ensureSpace = (height) => { if (doc.y + height > doc.page.height - 70) doc.addPage(); };
    const line = (y) => doc.moveTo(36, y).lineTo(doc.page.width - 36, y).strokeColor("#AFC0D8").stroke();
    const logo = configuredImage(supplier.firmLogo);
    if (logo) { try { doc.image(logo, 36, 34, { fit: [52, 48], align: "center", valign: "center" }); } catch {} }
    const supplierX = logo ? 98 : 36;
    doc.font(boldFont).fillColor(blue).fontSize(18).text(supplier.legalName || "Firm Name", supplierX, 35, { width: 366 - supplierX });
    doc.font(regularFont).fillColor("#334155").fontSize(9).text(supplier.professionalDescription || "", supplierX, 58, { width: 366 - supplierX });
    doc.font(boldFont).fillColor(blue).fontSize(15).text(heading, 390, 38, { width: 168, align: "right" });
    doc.font(regularFont).fillColor("#475569").fontSize(8).text([supplier.address, supplier.district, supplier.state && `${supplier.state} - ${supplier.pinCode || ""}`, supplier.gstin && `GSTIN: ${supplier.gstin}`, supplier.pan && `PAN: ${supplier.pan}`, [supplier.email, supplier.mobile].filter(Boolean).join(" | ")].filter(Boolean).join("\n"), 36, 76, { width: pageWidth });
    doc.y = Math.max(doc.y, 126); line(doc.y); doc.moveDown(0.8);
    const infoY = doc.y;
    doc.font(boldFont).fillColor(blue).fontSize(9).text("INVOICE DETAILS", 36, infoY);
    doc.font(regularFont).fillColor("#1e293b").fontSize(8).text(`Invoice No: ${invoice.invoiceNumber || invoice.draftReference || "DRAFT"}\nInvoice Date: ${displayDate(invoice.invoiceDate)}\nDue Date: ${displayDate(invoice.dueDate)}\nFinancial Year: ${invoice.financialYear || "-"}`, 36, infoY + 17, { width: 250 });
    doc.font(boldFont).fillColor(blue).fontSize(9).text("BILL TO", 310, infoY);
    doc.font(regularFont).fillColor("#1e293b").fontSize(8).text([recipient.billingName || recipient.clientName, recipient.billingAddress, [recipient.place, recipient.district, recipient.state, recipient.pinCode].filter(Boolean).join(", "), recipient.gstin && `GSTIN: ${recipient.gstin}`, recipient.panRegNo && `PAN/Reg No: ${recipient.panRegNo}`, [recipient.mobile, recipient.email].filter(Boolean).join(" | ")].filter(Boolean).join("\n"), 310, infoY + 17, { width: 248 });
    doc.y = Math.max(doc.y, infoY + 94); line(doc.y); doc.moveDown(0.5);
    doc.font(regularFont).fontSize(8).fillColor("#334155").text(`Place of Supply: ${invoice.placeOfSupply || "-"}    Reverse Charge: ${invoice.reverseCharge || "No"}    File Reference: ${invoice.fileReference || "-"}`, 36, doc.y, { width: pageWidth });
    doc.moveDown(0.7);
    const columns = [24, 178, 52, 48, 57, 57, 57];
    const headers = ["SN", "Description / SAC", "Qty", "Rate", "Taxable", "GST", "Total"];
    const tableHeader = () => {
      const y = doc.y;
      doc.rect(36, y, pageWidth, 22).fill(light);
      let x = 36;
      headers.forEach((header, index) => { doc.font(boldFont).fillColor(blue).fontSize(7.5).text(header, x + 3, y + 7, { width: columns[index] - 6, align: index >= 2 ? "right" : "left" }); x += columns[index]; });
      doc.y = y + 22;
    };
    tableHeader();
    (invoice.items || []).forEach((item, index) => {
      ensureSpace(46);
      if (doc.y < 70) tableHeader();
      const y = doc.y;
      const height = Math.max(36, doc.heightOfString(`${item.description}\nSAC: ${item.sac}${item.servicePeriod ? ` | FY ${item.servicePeriod}` : ""}`, { width: 172 }) + 10);
      let x = 36;
      const values = [String(index + 1), `${item.description}\nSAC: ${item.sac}${item.servicePeriod ? ` | FY ${item.servicePeriod}` : ""}`, `${item.quantity} ${item.unit || ""}`, pdfMoney(item.rate), pdfMoney(item.taxableValue), pdfMoney(money(item.cgstAmount + item.sgstAmount + item.igstAmount)), pdfMoney(item.lineTotal)];
      values.forEach((value, column) => { doc.font(column === 1 ? boldFont : regularFont).fillColor("#1e293b").fontSize(7.5).text(value, x + 3, y + 7, { width: columns[column] - 6, align: column >= 2 ? "right" : "left" }); x += columns[column]; });
      doc.rect(36, y, pageWidth, height).strokeColor("#CBD5E1").stroke();
      doc.y = y + height;
    });
    ensureSpace(180);
    doc.moveDown(0.8);
    const totalsX = 342;
    const totalRows = [["Gross Amount", invoice.grossAmount], ["Discount", invoice.discountAmount], ["Taxable Value", invoice.taxableAmount], ["CGST", invoice.cgstAmount], ["SGST", invoice.sgstAmount], ["IGST", invoice.igstAmount], ["Round Off", invoice.roundOff], ["Invoice Total", invoice.invoiceTotal], ["Advance Received", invoice.advanceReceived], ["Net Amount Payable", invoice.outstandingAmount]];
    totalRows.forEach(([label, value], index) => {
      const y = doc.y;
      const important = index >= totalRows.length - 3;
      if (important) doc.rect(totalsX, y - 2, 216, 17).fill(index === totalRows.length - 1 ? blue : "#F4F7FB");
      doc.font(important ? boldFont : regularFont).fillColor(index === totalRows.length - 1 ? "white" : "#1e293b").fontSize(8).text(label, totalsX + 5, y + 2, { width: 115 });
      doc.text(pdfMoney(value), totalsX + 123, y + 2, { width: 90, align: "right" });
      doc.y = y + 17;
    });
    doc.font(boldFont).fillColor(blue).fontSize(8).text("Amount in words", 36, doc.y - 35, { width: 285 });
    doc.font(regularFont).fillColor("#1e293b").fontSize(8).text(amountInWords(invoice.invoiceTotal), 36, doc.y - 21, { width: 285 });
    doc.moveDown(0.8); line(doc.y); doc.moveDown(0.6);
    doc.font(boldFont).fillColor(blue).fontSize(8).text("Payment Details", 36, doc.y);
    doc.font(regularFont).fillColor("#334155").fontSize(7.5).text([supplier.bankName && `Bank: ${supplier.bankName}`, supplier.accountName && `Account Name: ${supplier.accountName}`, supplier.accountNumber && `Account No: ${supplier.accountNumber}`, supplier.ifsc && `IFSC: ${supplier.ifsc}`, supplier.branch && `Branch: ${supplier.branch}`, supplier.upiId && `UPI: ${supplier.upiId}`].filter(Boolean).join(" | ") || "Payment details not configured", 36, doc.y + 14, { width: pageWidth });
    doc.moveDown(2.2);
    doc.font(boldFont).fontSize(8).fillColor(blue).text("Declaration / Terms", 36, doc.y);
    doc.font(regularFont).fontSize(7.3).fillColor("#475569").text([supplier.declaration, supplier.paymentTerms && `Payment Terms: ${supplier.paymentTerms}`].filter(Boolean).join("\n"), 36, doc.y + 12, { width: 350 });
    doc.font(boldFont).fillColor("#1e293b").fontSize(8).text(`For ${supplier.legalName || "the Firm"}\n\nAuthorised Signatory${supplier.authorisedSignatory ? `\n${supplier.authorisedSignatory}` : ""}`, 390, doc.y - 10, { width: 168, align: "right" });
    const watermark = draft ? "DRAFT" : (invoice.status === "Cancelled" ? "CANCELLED" : "");
    if (watermark) {
      const pages = doc.bufferedPageRange();
      for (let page = pages.start; page < pages.start + pages.count; page += 1) {
        doc.switchToPage(page);
        doc.save();
        doc.rotate(-35, { origin: [doc.page.width / 2, doc.page.height / 2] });
        doc.font(boldFont).fontSize(watermark === "DRAFT" ? 78 : 62).fillColor(watermark === "DRAFT" ? "#D9E2EF" : "#F2C6C6").opacity(0.32).text(watermark, 55, doc.page.height / 2 - 45, { width: 490, align: "center" });
        doc.restore(); doc.opacity(1);
      }
    }
    const pages = doc.bufferedPageRange();
    for (let page = pages.start; page < pages.start + pages.count; page += 1) {
      doc.switchToPage(page);
      doc.font(regularFont).fontSize(7).fillColor("#64748B").text(`${supplier.invoiceFooter || "This is a system-generated invoice."}    Page ${page + 1} of ${pages.count}`, 36, doc.page.height - 29, { width: pageWidth, align: "center" });
    }
    doc.end();
  });
}

async function previewInvoice(fileId, raw) {
  const state = await getAppState();
  const file = (state.files || []).find((row) => row.id === fileId);
  if (!file) throw httpError("File record not found.", 404);
  const existing = invoiceForFile(state, fileId);
  const now = new Date().toISOString();
  const draft = draftRecord(state, file, raw, existing, { name: "Preview", role: "Preview" }, now);
  validateInvoice({ ...draft, recipient: draft.recipientSnapshot, lines: draft.items }, normalizedSettings(state.invoiceSettings), { issuing: false });
  return { invoice: draft, pdf: await drawInvoicePdf(draft, { draft: true }) };
}

async function invoicePdf(invoiceId) {
  const invoice = await invoiceById(invoiceId);
  return { invoice, pdf: await drawInvoicePdf(invoice, { draft: invoice.status === "Draft" }) };
}

function safeInvoiceFilename(invoice) {
  const client = text(invoice.recipientSnapshot?.billingName || invoice.recipientSnapshot?.clientName || "Client").replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  const reference = text(invoice.invoiceNumber || invoice.draftReference || "Draft").replace(/[^A-Za-z0-9_-]+/g, "-");
  return `${invoice.status === "Draft" ? "Draft-Invoice" : "Tax-Invoice"}-${reference}-${client || "Client"}.pdf`;
}

async function invoiceHistory(invoiceId) {
  const state = await getAppState();
  return (state.invoiceAuditEvents || []).filter((event) => event.invoiceId === invoiceId).sort((a, b) => Date.parse(b.dateTime || 0) - Date.parse(a.dateTime || 0));
}

module.exports = {
  TEST_GSTIN,
  GSTIN_PATTERN,
  defaultInvoiceSettings,
  normalizedSettings,
  financialYearForDate,
  calculateInvoice,
  amountInWords,
  getInvoiceWorkspace,
  getInvoiceSettings,
  saveInvoiceSettings,
  saveInvoiceDraft,
  issueInvoice,
  cancelInvoice,
  queryInvoices,
  invoiceRegisterPdf,
  invoiceById,
  previewInvoice,
  invoicePdf,
  safeInvoiceFilename,
  invoiceHistory,
  drawInvoicePdf,
  validateInvoice,
};
