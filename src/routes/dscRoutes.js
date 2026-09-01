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
  const report = await buildExportReport(req);
  const exportRows = report.rows;
  if (req.params.format === "xlsx") {
    const worksheet = XLSX.utils.json_to_sheet(exportRows.length ? exportRows : [report.emptyRow]);
    const headers = Object.keys(exportRows[0] || report.emptyRow);
    worksheet["!cols"] = headers.map((key) => ({ wch: Math.min(35, Math.max(12, key.length + 2, ...exportRows.slice(0, 100).map((row) => String(row[key] ?? "").length + 2))) }));
    worksheet["!autofilter"] = { ref: worksheet["!ref"] || `A1:${XLSX.utils.encode_col(Math.max(0, headers.length - 1))}1` };
    worksheet["!freeze"] = { xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft", state: "frozen" };
    const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, report.sheetName);
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    res.set({ "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename=${report.fileName}.xlsx`, "Cache-Control": "no-store" }); return res.send(buffer);
  }
  if (req.params.format === "pdf") {
    res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename=${report.fileName}.pdf`, "Cache-Control": "no-store" });
    const doc = new PDFDocument({ margin: 24, size: "A4", layout: "landscape" }); doc.pipe(res);
    drawPdfReport(doc, report);
    return doc.end();
  }
  res.status(400).json({ error: "Export format must be xlsx or pdf." });
}

async function collectExportPages(fetchPage, recordsKey) {
  const rows = [];
  for (let page = 1; page <= 100; page += 1) {
    const result = await fetchPage(page);
    rows.push(...(result[recordsKey] || []));
    if (page >= result.pageCount) break;
  }
  return rows;
}

function movementName(value) {
  if (value === "RETURN") return "IN";
  if (value === "BOX_CHANGE") return "TRANSFER";
  return value || "";
}

async function buildExportReport(req) {
  const type = String(req.query.report || "master").toLowerCase();
  const mapMasterRow = (row) => ({
    "DSC Holder Name": row.holder_name, "Entity Name": row.entity_name || row.client_name, Designation: row.holder_designation || "",
    "C/O": row.care_of || "", PAN: row.pan || "", "Mobile No": row.mobile || "", Email: row.email || "",
    "DSC Type": row.dsc_type || "", "DSC Class": row.certificate_class || "", "Token Name": row.token_name || row.token_make || "",
    "Box Type": row.box_type || "", "Slot Position": row.slot_position || "", "Issue Date": row.issued_date || "",
    "Valid From": row.valid_from || "", "Valid To": row.expiry_date || "", Status: row.status || "", Remarks: row.remarks || "",
  });
  if (type === "movements") {
    const rows = await collectExportPages((page) => dsc.listMovements({ ...req.query, page, pageSize: 100 }, req), "movements");
    const mapped = rows.map((row, index) => ({
      SN: index + 1, "Date & Time": row.movement_at || "", Movement: movementName(row.movement_type), "DSC Name": row.dsc?.holder_name || "",
      Organisation: row.dsc?.entity_name || row.dsc?.client_name || "", "Token Name": row.dsc?.token_name || "", Authority: row.authority || "",
      "Issued To / Received From": row.issued_to || row.received_from || "", "Mobile No": row.issued_mobile || row.received_mobile || "", Relation: row.relation || "",
      "Permission Sought": row.permission_sought == null ? "" : (row.permission_sought ? "Yes" : "No"), "Permission Mode": row.permission_mode || "",
      "From Box": row.from_box_name || "", "From Slot": row.from_slot || "", "To Box": row.box_name || "", "To Slot": row.to_slot || "", Remarks: row.remarks || "",
    }));
    return { title: "DSC In & Out Register", fileName: "DSC-In-Out-Register", sheetName: "DSC In Out", rows: mapped, emptyRow: { SN: "", "Date & Time": "", Movement: "", "DSC Name": "", Organisation: "", "Token Name": "", Authority: "", "Issued To / Received From": "", "Mobile No": "", Relation: "", "Permission Sought": "", "Permission Mode": "", "From Box": "", "From Slot": "", "To Box": "", "To Slot": "", Remarks: "" } };
  }
  if (type === "expiry") {
    const today = new Date();
    const expiryFrom = String(req.query.expiryFrom || today.toISOString().slice(0, 10));
    const expiryTo = String(req.query.expiryTo || new Date(today.getTime() + 90 * 86400000).toISOString().slice(0, 10));
    const rows = await collectExportPages((page) => dsc.listDsc({ ...req.query, expiryFrom, expiryTo, page, pageSize: 100 }, req.profile, req.user.id), "records");
    const mapped = rows.map((row, index) => ({
      SN: index + 1, "DSC Holder Name": row.holder_name || "", Organisation: row.entity_name || row.client_name || "", "DSC Class": row.certificate_class || "",
      Authority: row.authority || "", "Token Name": row.token_name || row.token_make || "", "Expiry Date": row.expiry_date || "", Status: row.status || "",
      Custody: row.current_custody || "", Box: row.box_type || row.box?.box_code || "", Slot: row.slot_position || "",
    }));
    return { title: "DSC Expiry Register", subtitle: `Period: ${expiryFrom} to ${expiryTo}`, fileName: "DSC-Expiry-Register", sheetName: "Expiry Register", rows: mapped, emptyRow: { SN: "", "DSC Holder Name": "", Organisation: "", "DSC Class": "", Authority: "", "Token Name": "", "Expiry Date": "", Status: "", Custody: "", Box: "", Slot: "" } };
  }
  if (type === "fresh") {
    const rows = await collectExportPages((page) => dsc.listGeneric("dsc_fresh_issues", { ...req.query, page, pageSize: 100 }, req, "application_date"), "records");
    const mapped = rows.map((row, index) => ({
      SN: index + 1, "Client Name": row.holder_name || "", "Organisation Name": row.organization_name || row.client_name || "", "DSC Class": row.class_type || "",
      Authority: row.authority || "", "Issue Date": row.actual_issue_date || "", "Expiry Date": row.valid_to || "", Status: row.status || "", "Kept with Us": row.keep_in_custody ? "Yes" : "No",
    }));
    return { title: "Fresh DSC Issue Tracker", fileName: "Fresh-DSC-Issue-Tracker", sheetName: "Fresh DSC Issues", rows: mapped, emptyRow: { SN: "", "Client Name": "", "Organisation Name": "", "DSC Class": "", Authority: "", "Issue Date": "", "Expiry Date": "", Status: "", "Kept with Us": "" } };
  }
  const rows = await collectExportPages((page) => dsc.listDsc({ ...req.query, page, pageSize: 100 }, req.profile, req.user.id), "records");
  const mapped = rows.map(mapMasterRow);
  return { title: "DSC Register", fileName: "DSC-Register", sheetName: "DSC Register", rows: mapped, emptyRow: { "DSC Holder Name": "", "Entity Name": "", Designation: "", "C/O": "", PAN: "", "Mobile No": "", Email: "", "DSC Type": "", "DSC Class": "", "Token Name": "", "Box Type": "", "Slot Position": "", "Issue Date": "", "Valid From": "", "Valid To": "", Status: "", Remarks: "" } };
}

function drawPdfReport(doc, report) {
  const rows = report.rows.length ? report.rows : [report.emptyRow];
  const headers = Object.keys(rows[0]);
  const left = doc.page.margins.left; const usableWidth = doc.page.width - left - doc.page.margins.right;
  const weights = headers.map((header) => Math.min(20, Math.max(6, header.length, ...rows.slice(0, 40).map((row) => String(row[header] ?? "").length))));
  const totalWeight = weights.reduce((sum, value) => sum + value, 0); const widths = weights.map((value) => usableWidth * value / totalWeight);
  const drawHeading = () => {
    doc.font("Helvetica-Bold").fontSize(14).text("Muhammad & Associates", { align: "center" });
    doc.font("Helvetica").fontSize(9).text("Chartered Accountants", { align: "center" });
    doc.font("Helvetica-Bold").fontSize(11).text(report.title, { align: "center" });
    if (report.subtitle) doc.font("Helvetica").fontSize(8).text(report.subtitle, { align: "center" });
    doc.moveDown(0.6);
  };
  const drawRow = (row, header = false) => {
    const y = doc.y; const fontSize = headers.length > 12 ? 5.2 : 6.2;
    doc.font(header ? "Helvetica-Bold" : "Helvetica").fontSize(fontSize);
    const heights = headers.map((key, index) => doc.heightOfString(String(row[key] ?? ""), { width: Math.max(8, widths[index] - 4) }));
    const height = Math.min(54, Math.max(header ? 18 : 15, ...heights.map((value) => value + 6)));
    if (y + height > doc.page.height - doc.page.margins.bottom) { doc.addPage(); drawHeading(); drawRow(Object.fromEntries(headers.map((key) => [key, key])), true); return drawRow(row, false); }
    let x = left;
    headers.forEach((key, index) => { if (header) doc.save().fillColor("#e8f1ff").rect(x, y, widths[index], height).fill().restore(); doc.rect(x, y, widths[index], height).strokeColor("#9fb3c8").stroke(); doc.fillColor("#102a43").text(String(row[key] ?? ""), x + 2, y + 3, { width: Math.max(8, widths[index] - 4), height: height - 5 }); x += widths[index]; });
    doc.y = y + height;
  };
  drawHeading();
  drawRow(Object.fromEntries(headers.map((key) => [key, key])), true);
  rows.forEach((row) => drawRow(row));
}

module.exports = router;
