const express = require("express");
const XLSX = require("xlsx");
const PDFDocument = require("pdfkit");
const { requireAuth } = require("../middleware/auth");
const dsc = require("../services/dscService");

const router = express.Router();
router.use(requireAuth);

router.get("/dashboard", async (req, res, next) => { try { res.json(await dsc.dashboard(req.profile, req.user.id)); } catch (error) { next(error); } });
router.get("/settings", async (req, res, next) => { try { if (req.profile.role !== "Admin") return res.status(403).json({ error: "Admin permission is required." }); res.json({ settings: await dsc.settings() }); } catch (error) { next(error); } });
router.put("/settings", async (req, res, next) => { try { res.json({ settings: await dsc.saveSettings(req.body || {}, req) }); } catch (error) { next(error); } });
router.get("/form-options", async (_req, res, next) => { try { res.json(await dsc.formOptions()); } catch (error) { next(error); } });
router.post("/form-options/:kind", async (req, res, next) => { try { res.status(201).json({ option: await dsc.addFormOption(req.params.kind, req.body || {}, req) }); } catch (error) { next(error); } });
router.get("/boxes", async (req, res, next) => { try { res.json({ boxes: await dsc.boxes(req.query.all === "true") }); } catch (error) { next(error); } });
router.post("/boxes", async (req, res, next) => { try { res.status(201).json({ box: await dsc.saveBox(req.body || {}, req) }); } catch (error) { next(error); } });
router.put("/boxes/:id", async (req, res, next) => { try { res.json({ box: await dsc.saveBox({ ...req.body, id: req.params.id }, req) }); } catch (error) { next(error); } });
router.get("/boxes/:id", async (req, res, next) => { try { res.json(await dsc.boxContents(req.params.id, req.profile)); } catch (error) { next(error); } });
router.get("/movements", async (req, res, next) => { try { res.json(await dsc.listMovements(req.query || {}, req)); } catch (error) { next(error); } });
router.post("/movements", async (req, res, next) => { try { res.status(201).json(await dsc.addMovement(req.body || {}, req)); } catch (error) { next(error); } });
router.get("/handovers", async (req, res, next) => { try { res.json(await dsc.listHandovers(req.query || {}, req)); } catch (error) { next(error); } });
router.post("/handovers", async (req, res, next) => { try { res.status(201).json(await dsc.createHandover(req.body || {}, req)); } catch (error) { next(error); } });
router.post("/handovers/:id/decision", async (req, res, next) => { try { res.json(await dsc.decideHandover(req.params.id, req.body || {}, req)); } catch (error) { next(error); } });
router.post("/handovers/:id/out", async (req, res, next) => { try { res.json(await dsc.recordOut(req.params.id, req.body || {}, req)); } catch (error) { next(error); } });
router.get("/fresh-issues", async (req, res, next) => { try { res.json(await dsc.listGeneric("dsc_fresh_issues", req.query || {}, req, "application_date")); } catch (error) { next(error); } });
router.post("/fresh-issues", async (req, res, next) => { try { res.status(201).json(await dsc.createFresh(req.body || {}, req)); } catch (error) { next(error); } });
router.post("/fresh-issues/:id/add-to-master", async (req, res, next) => { try { res.status(201).json(await dsc.addFreshToMaster(req.params.id, req.body || {}, req)); } catch (error) { next(error); } });
router.get("/renewals", async (req, res, next) => { try { res.json(await dsc.listGeneric("dsc_renewals", req.query || {}, req, "initiated_date")); } catch (error) { next(error); } });
router.get("/export/:format", async (req, res, next) => { try { if (!dsc.canExport(req.profile)) return res.status(403).json({ error: "DSC export permission is required." }); await exportDsc(req, res); } catch (error) { next(error); } });
router.post("/import", async (req, res, next) => { try { res.json(await dsc.importDscRows(req.body.rows || [], req)); } catch (error) { next(error); } });
router.get("/", async (req, res, next) => { try { res.json(await dsc.listDsc(req.query || {}, req.profile, req.user.id)); } catch (error) { next(error); } });
router.post("/", async (req, res, next) => { try { res.status(201).json(await dsc.createDsc(req.body || {}, req)); } catch (error) { next(error); } });
router.get("/:id", async (req, res, next) => { try { res.json(await dsc.getDsc(req.params.id, req.profile, req.user.id)); } catch (error) { next(error); } });
router.put("/:id", async (req, res, next) => { try { res.json(await dsc.updateDsc(req.params.id, req.body || {}, req)); } catch (error) { next(error); } });
router.post("/:id/return", async (req, res, next) => { try { res.json(await dsc.recordReturn(req.params.id, req.body || {}, req)); } catch (error) { next(error); } });
router.post("/:id/missing", async (req, res, next) => { try { res.json(await dsc.markMissing(req.params.id, req.body || {}, req)); } catch (error) { next(error); } });
router.post("/:id/start-renewal", async (req, res, next) => { try { res.status(201).json(await dsc.startRenewal(req.params.id, req.body || {}, req)); } catch (error) { next(error); } });

async function exportDsc(req, res) {
  const rows = [];
  for (let page = 1; page <= 100; page += 1) {
    const result = await dsc.listDsc({ ...req.query, page, pageSize: 100 }, req.profile, req.user.id);
    rows.push(...result.records); if (page >= result.pageCount) break;
  }
  const exportRows = rows.map((row) => ({
    "DSC Holder Name": row.holder_name, "Entity Name": row.entity_name || row.client_name, Designation: row.holder_designation || "",
    "C/O": row.care_of || "", PAN: row.pan || "", "Mobile No": row.mobile || "", Email: row.email || "",
    "DSC Type": row.dsc_type || "", "DSC Class": row.certificate_class || "", "Token Name": row.token_name || row.token_make || "",
    "Box Type": row.box_type || "", "Slot Position": row.slot_position || "", "Issue Date": row.issued_date || "",
    "Valid From": row.valid_from || "", "Valid To": row.expiry_date || "", Status: row.status || "", Remarks: row.remarks || "",
  }));
  if (req.params.format === "xlsx") {
    const worksheet = XLSX.utils.json_to_sheet(exportRows); worksheet["!cols"] = Object.keys(exportRows[0] || { Message: "" }).map((key) => ({ wch: Math.min(35, Math.max(12, key.length + 2)) }));
    const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "DSC Register");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    res.set({ "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": "attachment; filename=DSC-Register.xlsx", "Cache-Control": "no-store" }); return res.send(buffer);
  }
  if (req.params.format === "pdf") {
    res.set({ "Content-Type": "application/pdf", "Content-Disposition": "attachment; filename=DSC-Register.pdf", "Cache-Control": "no-store" });
    const doc = new PDFDocument({ margin: 36, size: "A4", layout: "landscape" }); doc.pipe(res);
    doc.fontSize(16).text("Muhammad & Associates", { align: "center" }); doc.fontSize(10).text("Chartered Accountants", { align: "center" }); doc.fontSize(13).text("DSC Register", { align: "center" }); doc.moveDown();
    exportRows.forEach((row) => { doc.fontSize(8).text(`${row["DSC Holder Name"]} | ${row["Entity Name"]} | ${row["Token Name"]} | ${row["Valid To"]} | ${row["Box Type"]} ${row["Slot Position"]}`); doc.moveDown(0.35); });
    return doc.end();
  }
  res.status(400).json({ error: "Export format must be xlsx or pdf." });
}

module.exports = router;
