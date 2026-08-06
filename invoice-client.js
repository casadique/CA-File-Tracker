(function invoiceClientModule() {
  "use strict";

  const TEST_GSTIN = "32AVFPM0043F1Z7";
  let workspace = null;
  let lineSeed = 0;

  function e(value = "") { return typeof escapeHtml === "function" ? escapeHtml(String(value ?? "")) : String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]); }
  function amount(value) { const number = Number(value); return Number.isFinite(number) ? Math.round((number + Number.EPSILON) * 100) / 100 : 0; }
  function currency(value) { return `₹${amount(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
  function byName(scope, name) {
    if (!scope) return null;
    return scope.elements?.namedItem?.(name)
      || scope.querySelector?.(`[name="${String(name).replace(/["\\]/g, "\\$&")}"]`)
      || null;
  }
  function value(scope, name) { return String(byName(scope, name)?.value || "").trim(); }
  function closeModal(id) { document.querySelector(`#${id}`)?.remove(); document.querySelector("#backdrop")?.classList.remove("show"); }
  function showBackdrop() { document.querySelector("#backdrop")?.classList.add("show"); }
  function role() { return typeof normalizeRole === "function" ? normalizeRole(state.currentRole) : state.currentRole; }
  function canWrite() { return ["Admin", "Manager"].includes(role()); }
  function canConfigure() { return role() === "Admin"; }

  async function request(path, options = {}) {
    if (!isSupabaseMode()) throw new Error("Invoice actions require a central login.");
    return apiJson(path, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  }

  async function fetchPdf(path, options = {}) {
    const response = await fetch(path, { ...options, headers: { Authorization: `Bearer ${apiToken()}`, "Content-Type": "application/json", ...(options.headers || {}) } });
    if (!response.ok) {
      let message = "Unable to generate the invoice PDF.";
      try { message = (await response.json()).error || message; } catch {}
      throw new Error(message);
    }
    return response.blob();
  }

  function reservePdfWindow() {
    const target = window.open("", "_blank");
    if (target) {
      target.document.title = "Preparing invoice PDF";
      target.document.body.innerHTML = "<p style='font:600 15px Arial;padding:24px;color:#17345d'>Preparing invoice PDF&hellip;</p>";
    }
    return target;
  }

  function showPdfBlob(blob, target = null) {
    const url = URL.createObjectURL(blob);
    if (target && !target.closed) target.location.replace(url);
    else {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.target = "_blank";
      anchor.rel = "noopener";
      anchor.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  function statusForFile(file = {}) {
    const status = String(file.invoiceStatus || file.invoice_status || "").trim();
    if (["Draft", "Issued", "Cancelled", "Credit Note Issued"].includes(status)) return status;
    return file.billed ? "Not Issued" : "Not Issued";
  }

  function statusBadge(file = {}) {
    const status = statusForFile(file);
    return `<span class="invoice-status-badge is-${status.toLowerCase().replace(/\s+/g, "-")}">${e(status)}</span>`;
  }

  function actionMarkup(file = {}) {
    const status = statusForFile(file);
    const fileId = e(file.id || "");
    const invoiceId = e(file.invoiceId || file.invoice_id || "");
    if (status === "Issued" && invoiceId) return `<button type="button" class="billed-primary-action invoice-action issued" data-invoice-view="${invoiceId}"><span>View Invoice</span></button>`;
    if (status === "Draft") return `<button type="button" class="billed-primary-action invoice-action draft" data-invoice-open="${fileId}"><span>Continue Draft</span></button>`;
    if (status === "Cancelled") return `<button type="button" class="billed-primary-action invoice-action cancelled" data-invoice-history="${invoiceId}"><span>Invoice History</span></button>`;
    return canWrite() ? `<button type="button" class="billed-primary-action invoice-action" data-invoice-open="${fileId}"><span>Issue Invoice</span></button>` : `<span class="invoice-status-badge is-not-issued">Not Issued</span>`;
  }

  function menuItems(file = {}) {
    const status = statusForFile(file);
    const invoiceId = e(file.invoiceId || file.invoice_id || "");
    const fileId = e(file.id || "");
    if (status === "Issued" && invoiceId) return [
      billedActionMenuItem({ label: "View Invoice", icon: "transaction", attrs: `data-invoice-view="${invoiceId}"` }),
      billedActionMenuItem({ label: "Download PDF", icon: "transaction", attrs: `data-invoice-download="${invoiceId}"` }),
      billedActionMenuItem({ label: "Print", icon: "transaction", attrs: `data-invoice-print="${invoiceId}"` }),
      billedActionMenuItem({ label: "View Invoice History", icon: "transaction", attrs: `data-invoice-history="${invoiceId}"` }),
      ...(canConfigure() ? [billedActionMenuItem({ label: "Cancel Invoice", icon: "reverse", attrs: `data-invoice-cancel="${invoiceId}"`, danger: true, divider: true })] : []),
    ];
    if (status === "Draft") return [billedActionMenuItem({ label: "Continue Draft", icon: "edit", attrs: `data-invoice-open="${fileId}"` }), ...(invoiceId ? [billedActionMenuItem({ label: "Download Draft PDF", icon: "transaction", attrs: `data-invoice-download="${invoiceId}"` }), billedActionMenuItem({ label: "View Invoice History", icon: "transaction", attrs: `data-invoice-history="${invoiceId}"` })] : [])];
    if (status === "Cancelled" && invoiceId) return [billedActionMenuItem({ label: "View Cancelled Invoice", icon: "transaction", attrs: `data-invoice-view="${invoiceId}"` }), billedActionMenuItem({ label: "View Invoice History", icon: "transaction", attrs: `data-invoice-history="${invoiceId}"` })];
    return canWrite() ? [billedActionMenuItem({ label: "Issue Invoice", icon: "transaction", attrs: `data-invoice-open="${fileId}"` })] : [];
  }

  function field(label, name, inputValue = "", type = "text", attributes = "") {
    return `<label class="invoice-field"><span>${e(label)}</span><input type="${e(type)}" name="${e(name)}" value="${e(inputValue)}" ${attributes}></label>`;
  }

  function selectField(label, name, inputValue, options) {
    return `<label class="invoice-field"><span>${e(label)}</span><select name="${e(name)}">${options.map((option) => `<option value="${e(option)}" ${String(option) === String(inputValue) ? "selected" : ""}>${e(option)}</option>`).join("")}</select></label>`;
  }

  function lineMarkup(line = {}, index = 0) {
    const id = line.id || `line-${++lineSeed}`;
    return `<div class="invoice-line" data-invoice-line="${e(id)}">
      <div class="invoice-line-number">${index + 1}</div>
      ${field("Description", "lineDescription", line.description, "text", "required")}
      ${field("Service FY", "linePeriod", line.servicePeriod)}
      ${field("SAC", "lineSac", line.sac, "text", "required")}
      ${field("Qty", "lineQuantity", line.quantity || 1, "number", "min='0.01' step='0.01' required")}
      ${field("Unit", "lineUnit", line.unit || "Service")}
      ${field("Rate", "lineRate", line.rate, "number", "min='0' step='0.01' required")}
      ${field("Discount", "lineDiscount", line.discount || 0, "number", "min='0' step='0.01'")}
      ${field("GST %", "lineGstRate", line.gstRate ?? workspace?.settings?.defaultGstRate ?? 18, "number", "min='0' max='100' step='0.01' required")}
      <button type="button" class="invoice-line-remove" aria-label="Remove service line" ${index === 0 ? "disabled" : ""}>&times;</button>
    </div>`;
  }

  function issueModalMarkup(data) {
    const invoice = data.invoice || {};
    const recipient = invoice.recipient || invoice.recipientSnapshot || {};
    const settings = data.settings || {};
    return `<div class="invoice-modal-shell" id="invoiceIssueModal" role="dialog" aria-modal="true" aria-labelledby="invoiceIssueTitle">
      <div class="invoice-modal invoice-issue-modal">
        <header class="invoice-modal-head"><div><span class="invoice-eyebrow">${e(invoice.status === "Draft" ? invoice.draftReference : "OPTIONAL INVOICE")}</span><h2 id="invoiceIssueTitle">${invoice.status === "Draft" ? "Continue Invoice Draft" : "Issue Invoice"}</h2><p>${e(data.file.name)} · ${e(data.file.serviceType)}${data.file.fy ? ` · FY ${e(data.file.fy)}` : ""}</p></div><button type="button" class="invoice-close" data-invoice-close aria-label="Close">&times;</button></header>
        ${data.warning ? `<div class="invoice-test-warning"><strong>Test configuration</strong><span>${e(data.warning)}</span></div>` : ""}
        <form id="invoiceIssueForm" class="invoice-form">
          <section class="invoice-section"><div class="invoice-section-title"><span>1</span><div><h3>Invoice Identification</h3><p>Final number is assigned only when issued.</p></div></div><div class="invoice-grid invoice-grid-4">
            ${field("Invoice Reference", "invoiceReference", invoice.invoiceNumber || invoice.draftReference || "Assigned on issue", "text", "disabled")}
            ${field("Invoice Date", "invoiceDate", invoice.invoiceDate, "date", "required")}
            ${field("Due Date", "dueDate", invoice.dueDate, "date")}
            ${field("Financial Year", "financialYear", invoice.financialYear, "text", "disabled")}
            ${selectField("Document Type", "documentType", invoice.documentType || settings.documentType, ["Tax Invoice", "Bill of Supply"])}
            ${field("Place of Supply", "placeOfSupply", invoice.placeOfSupply || recipient.state, "text", "required")}
            ${field("Place State Code", "placeOfSupplyStateCode", recipient.stateCode || settings.stateCode, "text", "maxlength='2' pattern='[0-9]{2}' required")}
            ${selectField("Reverse Charge", "reverseCharge", invoice.reverseCharge || "No", ["No", "Yes"])}
            ${selectField("Tax Mode", "taxMode", invoice.taxMode || settings.defaultTaxMode, ["Exclusive", "Inclusive"])}
            ${field("File / Reference ID", "fileReference", invoice.fileReference || data.file.id)}
          </div></section>
          <section class="invoice-section"><div class="invoice-section-title"><span>2</span><div><h3>Recipient Details</h3><p>Prefilled from Client Master/file data. Changes apply only to this invoice.</p></div></div><div class="invoice-grid invoice-grid-4">
            ${selectField("GST Registration", "gstRegistration", recipient.gstRegistration || "Unregistered", ["Registered", "Unregistered", "SEZ"])}
            ${field("Billing / Registered Name", "billingName", recipient.billingName || recipient.clientName, "text", "required")}
            ${field("GSTIN", "recipientGstin", recipient.gstin, "text", "maxlength='15' autocapitalize='characters'")}
            ${field("PAN / Registration No.", "panRegNo", recipient.panRegNo)}
            <label class="invoice-field invoice-field-wide"><span>Billing Address</span><textarea name="billingAddress" rows="2">${e(recipient.billingAddress)}</textarea></label>
            ${field("Place", "recipientPlace", recipient.place)}${field("District", "recipientDistrict", recipient.district)}${field("State", "recipientState", recipient.state, "text", "required")}${field("State Code", "recipientStateCode", recipient.stateCode, "text", "maxlength='2' pattern='[0-9]{2}' required")}${field("PIN Code", "recipientPinCode", recipient.pinCode)}${field("Contact Person", "contactPerson", recipient.contactPerson)}${field("Mobile", "recipientMobile", recipient.mobile)}${field("Email", "recipientEmail", recipient.email, "email")}${field("C/o", "careOf", recipient.careOf)}
          </div><label class="invoice-check"><input type="checkbox" name="updateClientMaster"><span>Update Client Master with these corrected invoice details</span></label></section>
          <section class="invoice-section invoice-lines-section"><div class="invoice-section-title"><span>3</span><div><h3>Service Lines</h3><p>Confirm the SAC and GST rate before issuing.</p></div><button type="button" class="invoice-add-line" id="invoiceAddLine">+ Add Service Line</button></div><div id="invoiceLines">${(invoice.lines || []).map(lineMarkup).join("")}</div></section>
          <section class="invoice-section"><div class="invoice-section-title"><span>4</span><div><h3>Adjustments and Totals</h3><p>Payment remains independent from invoice issuance.</p></div></div><div class="invoice-adjustment-grid">
            ${field("Invoice-level Discount", "invoiceDiscount", invoice.invoiceDiscount || 0, "number", "min='0' step='0.01'")}${field("Other Valid Charges", "otherCharges", invoice.otherCharges || 0, "number", "min='0' step='0.01'")}${field("Advance / Already Received", "advanceReceived", invoice.advanceReceived || 0, "number", "min='0' step='0.01' readonly")}
            <label class="invoice-field invoice-field-wide"><span>Invoice Notes / Billing Remarks</span><textarea name="notes" rows="2">${e(invoice.notes || data.file.billingRemarks || "")}</textarea></label>
          </div><div class="invoice-totals" id="invoiceTotals" aria-live="polite"></div></section>
          ${settings.isTestGstin ? `<label class="invoice-check invoice-test-confirm"><input type="checkbox" name="confirmTestGstin"><span>I understand that <strong>${e(TEST_GSTIN)}</strong> is a TEST GSTIN and must be replaced before production invoicing.</span></label>` : ""}
        </form>
        <footer class="invoice-modal-actions"><button type="button" class="secondary-button" data-invoice-close>Cancel</button><button type="button" class="secondary-button" id="invoiceSaveDraft">Save Draft</button><button type="button" class="secondary-button" id="invoicePreview">Preview Invoice</button><button type="button" class="primary-button" id="invoiceIssue">Issue Invoice</button></footer>
      </div></div>`;
  }

  function collectLines(form) {
    return [...form.querySelectorAll("[data-invoice-line]")].map((row) => ({
      id: row.dataset.invoiceLine,
      description: value(row, "lineDescription"), servicePeriod: value(row, "linePeriod"), sac: value(row, "lineSac"), quantity: amount(value(row, "lineQuantity")), unit: value(row, "lineUnit"), rate: amount(value(row, "lineRate")), discount: amount(value(row, "lineDiscount")), gstRate: amount(value(row, "lineGstRate")),
    }));
  }

  function collectInvoice() {
    const form = document.querySelector("#invoiceIssueForm");
    return {
      invoiceDate: value(form, "invoiceDate"), dueDate: value(form, "dueDate"), documentType: value(form, "documentType"), placeOfSupply: value(form, "placeOfSupply"), placeOfSupplyStateCode: value(form, "placeOfSupplyStateCode"), reverseCharge: value(form, "reverseCharge"), taxMode: value(form, "taxMode"), fileReference: value(form, "fileReference"),
      recipient: { ...workspace.invoice.recipient, gstRegistration: value(form, "gstRegistration"), billingName: value(form, "billingName"), gstin: value(form, "recipientGstin").toUpperCase(), panRegNo: value(form, "panRegNo").toUpperCase(), billingAddress: value(form, "billingAddress"), place: value(form, "recipientPlace"), district: value(form, "recipientDistrict"), state: value(form, "recipientState"), stateCode: value(form, "recipientStateCode"), pinCode: value(form, "recipientPinCode"), contactPerson: value(form, "contactPerson"), mobile: value(form, "recipientMobile"), email: value(form, "recipientEmail"), careOf: value(form, "careOf") },
      lines: collectLines(form), invoiceDiscount: amount(value(form, "invoiceDiscount")), otherCharges: amount(value(form, "otherCharges")), advanceReceived: amount(value(form, "advanceReceived")), notes: value(form, "notes"), updateClientMaster: Boolean(byName(form, "updateClientMaster")?.checked), confirmTestGstin: Boolean(byName(form, "confirmTestGstin")?.checked),
    };
  }

  function calculateClient(invoice) {
    const inclusive = invoice.taxMode === "Inclusive";
    const interstate = invoice.placeOfSupplyStateCode && workspace.settings.stateCode && invoice.placeOfSupplyStateCode !== workspace.settings.stateCode;
    const prepared = invoice.lines.map((line) => { const gross = amount(line.quantity * line.rate); const discount = Math.min(Math.max(line.discount, 0), gross); return { ...line, gross, discount, base: amount(gross - discount) }; });
    const base = amount(prepared.reduce((sum, line) => sum + line.base, 0));
    const invoiceDiscount = Math.min(Math.max(invoice.invoiceDiscount, 0), base);
    const lines = prepared.map((line) => { const share = amount(base ? invoiceDiscount * line.base / base : 0); const afterDiscount = amount(line.base - share); const taxable = inclusive && line.gstRate > 0 ? amount(afterDiscount / (1 + line.gstRate / 100)) : afterDiscount; const tax = amount(inclusive ? afterDiscount - taxable : taxable * line.gstRate / 100); return { ...line, taxable, tax }; });
    const gross = amount(lines.reduce((sum, line) => sum + line.gross, 0)); const lineDiscount = amount(lines.reduce((sum, line) => sum + line.discount, 0)); const taxable = amount(lines.reduce((sum, line) => sum + line.taxable, 0)); const tax = amount(lines.reduce((sum, line) => sum + line.tax, 0)); const before = amount(taxable + tax + invoice.otherCharges); const round = workspace.settings.roundOffPreference === "Nearest Rupee" ? amount(Math.round(before) - before) : 0; const total = amount(before + round); const payable = amount(Math.max(total - invoice.advanceReceived, 0));
    return { gross, discount: amount(lineDiscount + invoiceDiscount), taxable, tax, cgst: interstate ? 0 : amount(tax / 2), sgst: interstate ? 0 : amount(tax - amount(tax / 2)), igst: interstate ? tax : 0, round, total, payable, interstate };
  }

  function updateTotals() {
    const target = document.querySelector("#invoiceTotals");
    if (!target) return;
    try {
      const totals = calculateClient(collectInvoice());
      target.innerHTML = `<div><span>Gross Amount</span><strong>${currency(totals.gross)}</strong></div><div><span>Total Discount</span><strong>${currency(totals.discount)}</strong></div><div><span>Taxable Value</span><strong>${currency(totals.taxable)}</strong></div><div><span>${totals.interstate ? "IGST" : "CGST + SGST"}</span><strong>${currency(totals.tax)}</strong></div><div><span>Round Off</span><strong>${currency(totals.round)}</strong></div><div class="invoice-total-final"><span>Invoice Total</span><strong>${currency(totals.total)}</strong></div><div class="invoice-payable-final"><span>Net Amount Payable</span><strong>${currency(totals.payable)}</strong></div>`;
    } catch (error) {
      console.error("Invoice total calculation failed", error);
      target.innerHTML = `<p>${e(error?.message || "Complete the service lines to calculate totals.")}</p>`;
    }
  }

  function bindIssueModal(fileId) {
    document.querySelectorAll("[data-invoice-close]").forEach((button) => { button.onclick = () => closeModal("invoiceIssueModal"); });
    const form = document.querySelector("#invoiceIssueForm");
    form.addEventListener("input", updateTotals);
    form.addEventListener("change", updateTotals);
    document.querySelector("#invoiceAddLine").onclick = () => { const container = document.querySelector("#invoiceLines"); const index = container.children.length; container.insertAdjacentHTML("beforeend", lineMarkup({ quantity: 1, unit: "Service", gstRate: workspace.settings.defaultGstRate }, index)); bindLineRemoval(); updateTotals(); };
    bindLineRemoval(); updateTotals();
    document.querySelector("#invoiceSaveDraft").onclick = () => executeInvoiceButton("invoiceSaveDraft", "Saving…", async () => {
      const result = await request(`/api/invoices/file/${encodeURIComponent(fileId)}/draft`, { method: "POST", body: JSON.stringify({ invoice: collectInvoice() }) });
      toast(result.warning || `Invoice draft ${result.invoice.draftReference} saved.`); await loadStateFromApi(); closeModal("invoiceIssueModal"); renderAll();
    });
    document.querySelector("#invoicePreview").onclick = () => {
      const pdfWindow = reservePdfWindow();
      executeInvoiceButton("invoicePreview", "Preparing…", async () => {
        try {
          const blob = await fetchPdf(`/api/invoices/file/${encodeURIComponent(fileId)}/preview`, { method: "POST", body: JSON.stringify({ invoice: collectInvoice() }) });
          showPdfBlob(blob, pdfWindow);
        } catch (error) {
          pdfWindow?.close();
          throw error;
        }
      });
    };
    document.querySelector("#invoiceIssue").onclick = () => {
      let invoice;
      let totals;
      try {
        invoice = collectInvoice();
        totals = calculateClient(invoice);
      } catch (error) {
        toast(error?.message || "Please complete the invoice details before issuing.");
        return;
      }
      const confirmation = `Issue Tax Invoice?\n\nA final invoice number will be assigned. After issue, financial values cannot be directly overwritten.\n\nClient: ${invoice.recipient.billingName}\nService: ${invoice.lines.map((line) => line.description).join(", ")}\nTaxable Value: ${currency(totals.taxable)}\nGST: ${currency(totals.tax)}\nInvoice Total: ${currency(totals.total)}`;
      if (!window.confirm(confirmation)) return;
      const pdfWindow = reservePdfWindow();
      executeInvoiceButton("invoiceIssue", "Issuing…", async () => {
        try {
          const result = await request(`/api/invoices/file/${encodeURIComponent(fileId)}/issue`, { method: "POST", body: JSON.stringify({ invoice }) });
          toast(result.warning || `Invoice ${result.invoiceNumber} issued successfully.`); await loadStateFromApi(); closeModal("invoiceIssueModal"); renderAll(); await viewInvoice(result.invoiceId, false, pdfWindow);
        } catch (error) {
          pdfWindow?.close();
          throw error;
        }
      });
    };
  }

  function bindLineRemoval() { document.querySelectorAll(".invoice-line-remove:not(:disabled)").forEach((button) => { button.onclick = () => { button.closest("[data-invoice-line]")?.remove(); [...document.querySelectorAll(".invoice-line")].forEach((line, index) => { line.querySelector(".invoice-line-number").textContent = String(index + 1); }); updateTotals(); }; }); }
  async function executeInvoiceButton(id, loadingText, action) { const button = document.querySelector(`#${id}`); if (!button || button.disabled) return; const original = button.textContent; button.disabled = true; button.textContent = loadingText; try { await action(); } catch (error) { toast(error.message || "Invoice action failed."); } finally { if (button.isConnected) { button.disabled = false; button.textContent = original; } } }

  async function open(fileId) {
    if (!canWrite()) return toast("Only Admin or Manager can create or issue invoices.");
    try {
      workspace = await request(`/api/invoices/file/${encodeURIComponent(fileId)}`);
      document.body.insertAdjacentHTML("beforeend", issueModalMarkup(workspace)); showBackdrop(); bindIssueModal(fileId); document.querySelector("#invoiceIssueModal input:not([disabled])")?.focus();
    } catch (error) { toast(error.message || "Unable to open invoice details."); }
  }

  async function viewInvoice(invoiceId, download = false, reservedWindow = null) {
    const pdfWindow = download ? null : (reservedWindow || reservePdfWindow());
    try {
      const blob = await fetchPdf(`/api/invoices/${encodeURIComponent(invoiceId)}/pdf${download ? "?download=1" : ""}`);
      const url = URL.createObjectURL(blob);
      if (download) { const anchor = document.createElement("a"); anchor.href = url; anchor.download = "invoice.pdf"; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 30000); }
      else { if (pdfWindow && !pdfWindow.closed) pdfWindow.location.replace(url); else showPdfBlob(blob); setTimeout(() => URL.revokeObjectURL(url), 60000); }
    } catch (error) { pdfWindow?.close(); toast(error.message || "Unable to open invoice PDF."); }
  }

  async function printInvoice(invoiceId) {
    try { const blob = await fetchPdf(`/api/invoices/${encodeURIComponent(invoiceId)}/pdf`); const frame = document.createElement("iframe"); frame.style.display = "none"; frame.src = URL.createObjectURL(blob); document.body.appendChild(frame); frame.onload = () => { frame.contentWindow?.focus(); frame.contentWindow?.print(); setTimeout(() => frame.remove(), 60000); }; } catch (error) { toast(error.message || "Unable to print invoice."); }
  }

  async function showHistory(invoiceId) {
    try {
      const data = await request(`/api/invoices/${encodeURIComponent(invoiceId)}/history`);
      document.body.insertAdjacentHTML("beforeend", `<div class="invoice-modal-shell" id="invoiceHistoryModal" role="dialog" aria-modal="true"><div class="invoice-modal invoice-history-modal"><header class="invoice-modal-head"><div><span class="invoice-eyebrow">AUDIT TRAIL</span><h2>Invoice History</h2></div><button type="button" class="invoice-close" data-history-close>&times;</button></header><div class="invoice-history-list">${data.events.length ? data.events.map((event) => `<article><span>${e(new Date(event.dateTime).toLocaleString("en-IN"))}</span><strong>${e(event.action)}</strong><p>${e(event.invoiceNumber || event.remarks || "")}</p><small>${e(event.user?.name || event.user || "System")} · ${e(event.user?.role || event.role || "")}</small></article>`).join("") : "<p>No invoice history recorded.</p>"}</div><footer class="invoice-modal-actions"><button class="secondary-button" data-history-close>Close</button></footer></div></div>`); showBackdrop(); document.querySelectorAll("[data-history-close]").forEach((button) => { button.onclick = () => closeModal("invoiceHistoryModal"); });
    } catch (error) { toast(error.message || "Unable to load invoice history."); }
  }

  async function cancel(invoiceId) { const reason = window.prompt("Enter the reason for cancelling this issued invoice. The invoice number will remain permanently reserved:"); if (!reason?.trim()) return; try { await request(`/api/invoices/${encodeURIComponent(invoiceId)}/cancel`, { method: "POST", body: JSON.stringify({ reason: reason.trim() }) }); toast("Invoice cancelled. Its number remains in the register and will not be reused."); await loadStateFromApi(); renderAll(); } catch (error) { toast(error.message || "Unable to cancel invoice."); } }

  const SETTINGS_FIELDS = [
    ["Legal Name", "legalName"], ["Trade Name", "tradeName"], ["Professional Description", "professionalDescription"], ["Registered Address", "address", "textarea"], ["District", "district"], ["State", "state"], ["State Code", "stateCode"], ["PIN Code", "pinCode"], ["GSTIN", "gstin"], ["PAN", "pan"], ["Email", "email", "email"], ["Mobile Number", "mobile"], ["Website", "website"], ["Firm Logo URL / Data URL", "firmLogo"], ["Invoice Prefix", "invoicePrefix"], ["Numbering Format", "numberingFormat"], ["Number Padding", "numberPadding", "number"], ["Default SAC", "defaultSac"], ["Default GST Rate", "defaultGstRate", "number"], ["Authorised Signatory", "authorisedSignatory"], ["Signature Image URL / Data URL", "signatureImage"], ["Bank Name", "bankName"], ["Account Name", "accountName"], ["Account Number", "accountNumber"], ["IFSC", "ifsc"], ["Branch", "branch"], ["UPI ID", "upiId"], ["Payment Terms", "paymentTerms"], ["Payment Terms Days", "paymentTermsDays", "number"], ["Default Declaration", "declaration", "textarea"], ["Invoice Footer", "invoiceFooter", "textarea"],
  ];

  async function settings() {
    if (!canConfigure()) return toast("Only Admin can configure Invoice Settings.");
    try {
      const data = await request("/api/invoices/settings"); const current = data.settings;
      document.body.insertAdjacentHTML("beforeend", `<div class="invoice-modal-shell" id="invoiceSettingsModal" role="dialog" aria-modal="true"><div class="invoice-modal invoice-settings-modal"><header class="invoice-modal-head"><div><span class="invoice-eyebrow">ADMIN ONLY</span><h2>Invoice Settings</h2><p>Supplier identity, numbering, tax and payment defaults.</p></div><button type="button" class="invoice-close" data-settings-close>&times;</button></header>${current.isTestGstin ? `<div class="invoice-test-warning"><strong>TEST GSTIN</strong><span>Replace with the actual registered GSTIN before issuing production invoices.</span></div>` : ""}<form id="invoiceSettingsForm" class="invoice-settings-grid">${SETTINGS_FIELDS.map(([label, name, type]) => type === "textarea" ? `<label class="invoice-field invoice-field-wide"><span>${e(label)}</span><textarea name="${e(name)}" rows="2">${e(current[name])}</textarea></label>` : field(label, name, current[name], type || "text")).join("")}${selectField("Default Tax Mode", "defaultTaxMode", current.defaultTaxMode, ["Exclusive", "Inclusive"])}${selectField("Default Document Type", "documentType", current.documentType, ["Tax Invoice", "Bill of Supply"])}${selectField("Round-off Preference", "roundOffPreference", current.roundOffPreference, ["None", "Nearest Rupee"])}</form><footer class="invoice-modal-actions"><button class="secondary-button" data-settings-close>Cancel</button><button class="primary-button" id="invoiceSettingsSave">Save Settings</button></footer></div></div>`); showBackdrop(); document.querySelectorAll("[data-settings-close]").forEach((button) => { button.onclick = () => closeModal("invoiceSettingsModal"); }); document.querySelector("#invoiceSettingsSave").onclick = () => executeInvoiceButton("invoiceSettingsSave", "Saving…", async () => { const form = document.querySelector("#invoiceSettingsForm"); const payload = Object.fromEntries(new FormData(form)); await request("/api/invoices/settings", { method: "PUT", body: JSON.stringify({ settings: payload }) }); toast("Invoice Settings saved."); closeModal("invoiceSettingsModal"); });
    } catch (error) { toast(error.message || "Unable to open Invoice Settings."); }
  }

  async function register() {
    try {
      const data = await request("/api/invoices/register");
      const years = [...new Set(data.invoices.map((row) => row.financialYear).filter(Boolean))].sort().reverse();
      document.body.insertAdjacentHTML("beforeend", `<div class="invoice-modal-shell" id="invoiceRegisterModal" role="dialog" aria-modal="true"><div class="invoice-modal invoice-register-modal"><header class="invoice-modal-head"><div><span class="invoice-eyebrow">FINANCIAL REGISTER</span><h2>Invoice Register</h2><p>Draft, issued and cancelled invoices with payment position.</p></div><button type="button" class="invoice-close" data-register-close>&times;</button></header><div class="invoice-register-filters"><input type="search" id="invoiceRegisterSearch" placeholder="Search invoice, client, GSTIN or service"><input type="date" id="invoiceRegisterFrom" aria-label="Invoice date from"><input type="date" id="invoiceRegisterTo" aria-label="Invoice date to"><select id="invoiceRegisterFy"><option value="">All FY</option>${years.map((year) => `<option>${e(year)}</option>`).join("")}</select><select id="invoiceRegisterStatus"><option value="">All statuses</option><option>Draft</option><option>Issued</option><option>Cancelled</option></select><select id="invoiceRegisterPayment"><option value="">All payments</option><option>Pending</option><option>Partially Received</option><option>Received</option></select><button class="secondary-button" id="invoiceRegisterExport">Export Excel</button><button class="secondary-button" id="invoiceRegisterPdf">Export PDF</button></div><div class="invoice-register-wrap"><table><thead><tr><th>Invoice</th><th>Date</th><th>Client / GSTIN</th><th>Service</th><th>Taxable</th><th>CGST</th><th>SGST</th><th>IGST</th><th>Total</th><th>Received</th><th>Outstanding</th><th>Status</th><th>Created By</th><th>Actions</th></tr></thead><tbody id="invoiceRegisterRows"></tbody></table></div><footer class="invoice-modal-actions"><button class="secondary-button" data-register-close>Close</button></footer></div></div>`); showBackdrop();
      const filteredRows = () => { const search = document.querySelector("#invoiceRegisterSearch").value.toLowerCase(); const status = document.querySelector("#invoiceRegisterStatus").value; const from = document.querySelector("#invoiceRegisterFrom").value; const to = document.querySelector("#invoiceRegisterTo").value; const fy = document.querySelector("#invoiceRegisterFy").value; const payment = document.querySelector("#invoiceRegisterPayment").value; return data.invoices.filter((row) => (!status || row.status === status) && (!fy || row.financialYear === fy) && (!payment || row.paymentStatus === payment) && (!from || row.invoiceDate >= from) && (!to || row.invoiceDate <= to) && (!search || [row.invoiceNumber, row.draftReference, row.clientName, row.gstin, row.service].join(" ").toLowerCase().includes(search))); };
      const render = () => { const rows = filteredRows(); document.querySelector("#invoiceRegisterRows").innerHTML = rows.length ? rows.map((row) => `<tr><td><strong>${e(row.invoiceNumber || row.draftReference)}</strong></td><td>${e(row.invoiceDate ? displayDate(row.invoiceDate) : "-")}</td><td><strong>${e(row.clientName)}</strong><span>${e(row.gstin || "Unregistered")}</span></td><td>${e(row.service)}</td><td>${currency(row.taxableAmount)}</td><td>${currency(row.cgstAmount)}</td><td>${currency(row.sgstAmount)}</td><td>${currency(row.igstAmount)}</td><td><strong>${currency(row.invoiceTotal)}</strong></td><td>${currency(row.advanceReceived)}</td><td>${currency(row.outstandingAmount)}</td><td><span class="invoice-status-badge is-${e(row.status.toLowerCase())}">${e(row.status)}</span></td><td>${e(row.createdBy)}</td><td><button type="button" class="invoice-table-action" data-invoice-view="${e(row.invoiceId)}">View</button></td></tr>`).join("") : `<tr><td colspan="14" class="invoice-register-empty">No invoices match the selected filters.</td></tr>`; bind(document.querySelector("#invoiceRegisterModal")); };
      document.querySelector("#invoiceRegisterSearch").oninput = render; ["invoiceRegisterFrom", "invoiceRegisterTo", "invoiceRegisterFy", "invoiceRegisterStatus", "invoiceRegisterPayment"].forEach((id) => { document.querySelector(`#${id}`).onchange = render; }); document.querySelectorAll("[data-register-close]").forEach((button) => { button.onclick = () => closeModal("invoiceRegisterModal"); }); document.querySelector("#invoiceRegisterExport").onclick = async () => { const rows = filteredRows().map((row, index) => ({ SN: index + 1, "Invoice Number": row.invoiceNumber || row.draftReference, "Invoice Date": row.invoiceDate, Client: row.clientName, GSTIN: row.gstin, Service: row.service, "Taxable Value": row.taxableAmount, CGST: row.cgstAmount, SGST: row.sgstAmount, IGST: row.igstAmount, "Invoice Total": row.invoiceTotal, Received: row.advanceReceived, Outstanding: row.outstandingAmount, Status: row.status, "Created By": row.createdBy })); if (typeof downloadXlsxRows === "function") await downloadXlsxRows("Invoice-Register", rows, "Invoice Register"); else toast("Excel export is unavailable."); }; document.querySelector("#invoiceRegisterPdf").onclick = async () => { try { const params = new URLSearchParams({ search: document.querySelector("#invoiceRegisterSearch").value, from: document.querySelector("#invoiceRegisterFrom").value, to: document.querySelector("#invoiceRegisterTo").value, financialYear: document.querySelector("#invoiceRegisterFy").value, status: document.querySelector("#invoiceRegisterStatus").value, paymentStatus: document.querySelector("#invoiceRegisterPayment").value }); const blob = await fetchPdf(`/api/invoices/register/pdf?${params}`); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "Invoice-Register.pdf"; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 30000); } catch (error) { toast(error.message); } }; render();
    } catch (error) { toast(error.message || "Unable to load Invoice Register."); }
  }

  function displayDate(value) { const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/); return match ? `${match[3]}-${match[2]}-${match[1]}` : value || "-"; }

  function bind(scope = document) {
    scope.querySelectorAll?.("[data-invoice-open]").forEach((button) => { button.onclick = (event) => { event.preventDefault(); event.stopPropagation(); closeBilledActionMenus?.(); open(button.dataset.invoiceOpen); }; });
    scope.querySelectorAll?.("[data-invoice-view]").forEach((button) => { button.onclick = (event) => { event.preventDefault(); event.stopPropagation(); closeBilledActionMenus?.(); viewInvoice(button.dataset.invoiceView); }; });
    scope.querySelectorAll?.("[data-invoice-download]").forEach((button) => { button.onclick = (event) => { event.preventDefault(); event.stopPropagation(); closeBilledActionMenus?.(); viewInvoice(button.dataset.invoiceDownload, true); }; });
    scope.querySelectorAll?.("[data-invoice-print]").forEach((button) => { button.onclick = (event) => { event.preventDefault(); event.stopPropagation(); closeBilledActionMenus?.(); printInvoice(button.dataset.invoicePrint); }; });
    scope.querySelectorAll?.("[data-invoice-history]").forEach((button) => { button.onclick = (event) => { event.preventDefault(); event.stopPropagation(); closeBilledActionMenus?.(); showHistory(button.dataset.invoiceHistory); }; });
    scope.querySelectorAll?.("[data-invoice-cancel]").forEach((button) => { button.onclick = (event) => { event.preventDefault(); event.stopPropagation(); closeBilledActionMenus?.(); cancel(button.dataset.invoiceCancel); }; });
    scope.querySelectorAll?.("[data-invoice-settings]").forEach((button) => { button.onclick = settings; });
    scope.querySelectorAll?.("[data-invoice-register]").forEach((button) => { button.onclick = register; });
  }

  window.InvoiceUI = { bind, open, viewInvoice, settings, register, statusForFile, statusBadge, actionMarkup, menuItems };
}());
