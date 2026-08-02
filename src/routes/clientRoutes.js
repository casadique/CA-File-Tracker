const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const clients = require("../services/clientService");

const router = express.Router();

router.get("/search", requireAuth, async (req, res, next) => {
  try { res.json(await clients.listClients({ search: req.query.q, status: "Active", page: 1, pageSize: Math.min(20, Number(req.query.limit) || 20) })); } catch (error) { next(error); }
});
router.get("/", requireAuth, requireRole("Admin", "Manager"), async (req, res, next) => {
  try { res.json(await clients.listClients(req.query)); } catch (error) { next(error); }
});
router.get("/export", requireAuth, requireRole("Admin", "Manager"), async (req, res, next) => {
  try { res.json({ clients: await clients.allClients(req.query) }); } catch (error) { next(error); }
});
router.post("/import", requireAuth, requireRole("Admin", "Manager"), async (req, res, next) => {
  try { res.json(await clients.importClients(req.body.clients || [], req.user.id)); } catch (error) { next(error); }
});
router.post("/link-unlinked-files", requireAuth, requireRole("Admin", "Manager"), async (req, res, next) => {
  try { res.json(await clients.linkUnlinkedFiles(req.user.id)); } catch (error) { next(error); }
});
router.get("/migration/preview", requireAuth, requireRole("Admin"), async (_req, res, next) => {
  try { res.json(await clients.migrationPreview()); } catch (error) { next(error); }
});
router.post("/migration/apply", requireAuth, requireRole("Admin"), async (req, res, next) => {
  try { res.json(await clients.applyMigration(req.user.id, req.body.confirmation)); } catch (error) { next(error); }
});
router.get("/:id/profile", requireAuth, requireRole("Admin", "Manager"), async (req, res, next) => {
  try { res.json(await clients.clientProfile(req.params.id)); } catch (error) { next(error); }
});
router.get("/:id/audit", requireAuth, requireRole("Admin", "Manager"), async (req, res, next) => {
  try { res.json({ events: await clients.clientAudit(req.params.id) }); } catch (error) { next(error); }
});
router.get("/:id", requireAuth, requireRole("Admin", "Manager"), async (req, res, next) => {
  try { res.json({ client: await clients.getClient(req.params.id) }); } catch (error) { next(error); }
});
router.post("/", requireAuth, requireRole("Admin", "Manager"), async (req, res, next) => {
  try { res.status(201).json(await clients.createClient(req.body, req.user.id, { acceptWarnings: req.body.acceptWarnings === true })); } catch (error) { if (error.warnings) res.status(error.status || 400).json({ error: error.message, warnings: error.warnings }); else next(error); }
});
router.put("/:id", requireAuth, requireRole("Admin", "Manager"), async (req, res, next) => {
  try { res.json(await clients.updateClient(req.params.id, req.body, req.user.id, { acceptWarnings: req.body.acceptWarnings === true })); } catch (error) { if (error.warnings) res.status(error.status || 400).json({ error: error.message, warnings: error.warnings }); else next(error); }
});
router.post("/:id/status", requireAuth, requireRole("Admin", "Manager"), async (req, res, next) => {
  try { res.json({ client: await clients.setClientStatus(req.params.id, req.body.status, req.user.id) }); } catch (error) { next(error); }
});
router.post("/:id/selection", requireAuth, async (req, res, next) => {
  try { res.json(await clients.recordClientSelection(req.params.id, req.user.id, req.body.context)); } catch (error) { next(error); }
});
router.post("/:id/sync-active-files", requireAuth, requireRole("Admin", "Manager"), async (req, res, next) => {
  try { res.json(await clients.syncClientToActiveFiles(req.params.id, req.user.id)); } catch (error) { next(error); }
});

module.exports = router;
