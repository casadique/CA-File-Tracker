const express = require("express");
const XLSX = require("xlsx");
const PDFDocument = require("pdfkit");
const { requireAuth, requireRole } = require("../middleware/auth");
const complaints = require("../services/complaintService");

const router = express.Router();
router.use(requireAuth);

router.get("/dashboard", async (req, res, next) => { try { res.json(await complaints.dashboard(req.profile, req.user.id)); } catch (error) { next(error); } });
router.get("/categories", async (req, res, next) => { try { res.json({ categories: await complaints.categories(req.query.all === "true") }); } catch (error) { next(error); } });
router.post("/categories", requireRole("Admin"), async (req, res, next) => { try { res.status(201).json({ category: await complaints.saveCategory(req.body || {}, req) }); } catch (error) { next(error); } });
router.put("/categories/:id", requireRole("Admin"), async (req, res, next) => { try { res.json({ category: await complaints.saveCategory({ ...req.body, id: req.params.id }, req) }); } catch (error) { next(error); } });
router.get("/settings", requireRole("Admin", "Manager", "Staff Manager"), async (_req, res, next) => { try { res.json({ settings: await complaints.settings() }); } catch (error) { next(error); } });
router.put("/settings", requireRole("Admin"), async (req, res, next) => { try { res.json({ settings: await complaints.saveSettings(req.body || {}, req) }); } catch (error) { next(error); } });
router.get("/export/:format", requireRole("Admin", "Manager", "Staff Manager"), exportComplaints);
router.get("/", async (req, res, next) => { try { res.json(await complaints.listComplaints(req.query || {}, req.profile, req.user.id)); } catch (error) { next(error); } });
router.post("/", async (req, res, next) => { try { res.status(201).json(await complaints.createComplaint(req.body || {}, req)); } catch (error) { next(error); } });
router.get("/:id", async (req, res, next) => { try { res.json(await complaints.getComplaint(req.params.id, req.profile, req.user.id)); } catch (error) { next(error); } });
router.put("/:id", async (req, res, next) => { try { res.json(await complaints.updateComplaint(req.params.id, req.body || {}, req)); } catch (error) { next(error); } });
router.post("/:id/status", async (req, res, next) => { try { res.json(await complaints.changeStatus(req.params.id, req.body || {}, req)); } catch (error) { next(error); } });
router.post("/:id/activity", async (req, res, next) => { try { res.json(await complaints.addNote(req.params.id, req.body || {}, req)); } catch (error) { next(error); } });

async function exportComplaints(req, res, next) {
  try {
    const rows = [];
    for (let page = 1; page <= 100; page += 1) {
      const result = await complaints.listComplaints({ ...req.query, page, pageSize: 100 }, req.profile, req.user.id);
      rows.push(...result.complaints);
      if (page >= result.pageCount) break;
    }
    const exportRows = rows.map((row) => ({
      "Complaint No.": row.complaint_no, "Complaint Date": formatDate(row.complaint_at), Client: row.client_name,
      PAN: row.pan_reg_no || "", Source: row.source, Category: row.category_name, Service: row.service_type || "",
      Subject: row.subject, Priority: row.priority, Severity: row.severity, Status: row.status,
      "Assigned To": row.assigned?.name || row.assigned_team || "", "SLA Due": formatDate(row.sla_due_at),
      "Resolution Date": row.resolution_date || "", "Root Cause": row.root_cause || "", "Resolution Summary": row.resolution_summary || "",
    }));
    if (req.params.format === "xlsx") return sendWorkbook(res, exportRows, "Complaint Register", "complaint-register.xlsx");
    if (req.params.format === "pdf") return sendPdf(res, exportRows, "Complaint Register", "complaint-register.pdf");
    res.status(400).json({ error: "Export format must be xlsx or pdf." });
  } catch (error) { next(error); }
}

function sendWorkbook(res, rows, sheetName, filename) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = Object.keys(rows[0] || { Message: "" }).map((key) => ({ wch: Math.min(45, Math.max(12, key.length + 2)) }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  res.set({ "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store" });
  res.send(buffer);
}

function sendPdf(res, rows, title, filename) {
  res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store" });
  const doc = new PDFDocument({ margin: 36, size: "A4", layout: "landscape" });
  doc.pipe(res); doc.fontSize(16).text("Muhammad & Associates", { align: "center" });
  doc.fontSize(10).text("Chartered Accountants", { align: "center" }); doc.moveDown(0.5);
  doc.fontSize(13).text(title, { align: "center" }); doc.moveDown();
  rows.forEach((row) => { doc.fontSize(8).text(`${row["Complaint No."]} | ${row["Complaint Date"]} | ${row.Client} | ${row.Subject} | ${row.Priority} | ${row.Status}`); doc.moveDown(0.35); });
  doc.end();
}

function formatDate(value) { return value ? new Date(value).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : ""; }

module.exports = router;
