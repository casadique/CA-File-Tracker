const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const {
  getInvoiceWorkspace,
  getInvoiceSettings,
  saveInvoiceSettings,
  saveInvoiceDraft,
  issueInvoice,
  cancelInvoice,
  queryInvoices,
  invoiceById,
  previewInvoice,
  invoicePdf,
  safeInvoiceFilename,
  invoiceHistory,
  invoiceRegisterPdf,
} = require("../services/invoiceService");

const router = express.Router();
const viewRoles = ["Admin", "Manager", "Staff Manager", "Viewer"];
const writeRoles = ["Admin", "Manager"];

router.get("/settings", requireAuth, requireRole(...viewRoles), async (_req, res, next) => {
  try { res.json({ ok: true, settings: await getInvoiceSettings() }); } catch (error) { next(error); }
});

router.put("/settings", requireAuth, requireRole("Admin"), async (req, res, next) => {
  try {
    const state = await saveInvoiceSettings(req.body.settings || req.body, req.user.id, req.profile);
    res.json({ ok: true, settings: state.invoiceSettings || {} });
  } catch (error) { next(error); }
});

router.get("/register/pdf", requireAuth, requireRole(...viewRoles), async (req, res, next) => {
  try {
    const pdf = await invoiceRegisterPdf(req.query || {});
    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", "attachment; filename=Invoice-Register.pdf");
    res.send(pdf);
  } catch (error) { next(error); }
});

router.get("/register", requireAuth, requireRole(...viewRoles), async (req, res, next) => {
  try { res.json({ ok: true, invoices: await queryInvoices(req.query || {}) }); } catch (error) { next(error); }
});

router.get("/file/:fileId", requireAuth, requireRole(...viewRoles), async (req, res, next) => {
  try { res.json({ ok: true, ...(await getInvoiceWorkspace(req.params.fileId)) }); } catch (error) { next(error); }
});

router.post("/file/:fileId/draft", requireAuth, requireRole(...writeRoles), async (req, res, next) => {
  try {
    const result = await saveInvoiceDraft(req.params.fileId, req.body.invoice || req.body, req.user.id, req.profile);
    res.json({ ok: true, invoice: result.invoice, clientMasterUpdated: result.clientMasterUpdated, warning: result.clientMasterWarning, summary: { invoiceId: result.invoice.invoiceId, draftReference: result.invoice.draftReference, status: result.invoice.status } });
  } catch (error) { next(error); }
});

router.post("/file/:fileId/preview", requireAuth, requireRole(...writeRoles), async (req, res, next) => {
  try {
    const result = await previewInvoice(req.params.fileId, req.body.invoice || req.body);
    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", "inline; filename=Draft-Bill-of-Supply-Preview.pdf");
    res.send(result.pdf);
  } catch (error) { next(error); }
});

router.post("/file/:fileId/issue", requireAuth, requireRole(...writeRoles), async (req, res, next) => {
  try {
    const result = await issueInvoice(req.params.fileId, req.body.invoice || req.body, req.user.id, req.profile);
    res.status(201).json({ ok: true, invoice: result.invoice, invoiceId: result.invoice.invoiceId, invoiceNumber: result.invoice.invoiceNumber, status: result.invoice.status, clientMasterUpdated: result.clientMasterUpdated, warning: result.clientMasterWarning });
  } catch (error) { next(error); }
});

router.get("/:invoiceId", requireAuth, requireRole(...viewRoles), async (req, res, next) => {
  try { res.json({ ok: true, invoice: await invoiceById(req.params.invoiceId) }); } catch (error) { next(error); }
});

router.get("/:invoiceId/history", requireAuth, requireRole(...viewRoles), async (req, res, next) => {
  try { res.json({ ok: true, events: await invoiceHistory(req.params.invoiceId) }); } catch (error) { next(error); }
});

router.get("/:invoiceId/pdf", requireAuth, requireRole(...viewRoles), async (req, res, next) => {
  try {
    const result = await invoicePdf(req.params.invoiceId);
    const disposition = req.query.download === "1" ? "attachment" : "inline";
    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", `${disposition}; filename="${safeInvoiceFilename(result.invoice)}"`);
    res.send(result.pdf);
  } catch (error) { next(error); }
});

router.post("/:invoiceId/cancel", requireAuth, requireRole("Admin"), async (req, res, next) => {
  try {
    const result = await cancelInvoice(req.params.invoiceId, req.body.reason, req.user.id, req.profile);
    res.json({ ok: true, invoice: result.invoice });
  } catch (error) { next(error); }
});

module.exports = router;
