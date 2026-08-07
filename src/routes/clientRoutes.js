const express = require("express");
const rateLimit = require("express-rate-limit");
const { requireAuth, requireRole } = require("../middleware/auth");
const clients = require("../services/clientService");

const router = express.Router();
const credentialLimiter = rateLimit({ windowMs: 60 * 1000, limit: 12, standardHeaders: true, legacyHeaders: false });

function profilePermissions(profile = {}) {
  const raw = profile.permissions || profile.role_permissions || [];
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") return Object.entries(raw).filter(([, enabled]) => enabled).map(([name]) => name);
  return String(raw || "").split(",").map((item) => item.trim()).filter(Boolean);
}

function requireClientPermission(permission) {
  return (req, res, next) => {
    if (req.profile?.role === "Admin" || profilePermissions(req.profile).includes(permission)) return next();
    res.status(403).json({ error: "You do not have the required client permission." });
  };
}

function containsCredentials(value = {}) {
  return ["itPassword", "gstUser", "gstPassword", "tracesLogin", "tracesPassword"].some((key) => Object.prototype.hasOwnProperty.call(value, key) && String(value[key] || "") !== "");
}

function canUseCredentials(req, permission) {
  return req.profile?.role === "Admin" || profilePermissions(req.profile).includes(permission);
}

router.get("/search", requireAuth, async (req, res, next) => {
  try { res.json(await clients.listClients({ search: req.query.q, status: "Active", page: 1, pageSize: Math.min(50, Number(req.query.limit) || 20) })); } catch (error) { next(error); }
});
router.get("/", requireAuth, requireRole("Admin", "Manager"), async (req, res, next) => {
  try { res.json(await clients.listClients(req.query)); } catch (error) { next(error); }
});
router.get("/export", requireAuth, requireRole("Admin", "Manager"), async (req, res, next) => {
  try { res.json({ clients: await clients.clientsForExport(req.query, canUseCredentials(req, "view_client_credentials")) }); } catch (error) { next(error); }
});
router.get("/masters", requireAuth, async (_req, res, next) => {
  try { res.json(await clients.listClientMasters()); } catch (error) { next(error); }
});
router.post("/masters/:kind", requireAuth, requireClientPermission("manage_client_masters"), async (req, res, next) => {
  try { res.json({ value: await clients.saveClientMasterValue(req.params.kind, req.body) }); } catch (error) { next(error); }
});
router.put("/masters/:kind/:id", requireAuth, requireClientPermission("manage_client_masters"), async (req, res, next) => {
  try { res.json({ value: await clients.saveClientMasterValue(req.params.kind, { ...req.body, id: req.params.id }) }); } catch (error) { next(error); }
});
router.post("/import", requireAuth, requireRole("Admin", "Manager"), async (req, res, next) => {
  try {
    if ((req.body.clients || []).some(containsCredentials) && !canUseCredentials(req, "edit_client_credentials")) return res.status(403).json({ error: "Credential import requires explicit permission." });
    res.json(await clients.importClients(req.body.clients || [], req.user.id));
  } catch (error) { next(error); }
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
router.get("/:id/credentials", credentialLimiter, requireAuth, requireClientPermission("view_client_credentials"), async (req, res, next) => {
  try { res.set("Cache-Control", "no-store, private"); res.set("Pragma", "no-cache"); res.json(await clients.getClientCredentials(req.params.id, req.user.id, req.query.serviceType)); } catch (error) { next(error); }
});
router.put("/:id/credentials", credentialLimiter, requireAuth, requireClientPermission("edit_client_credentials"), async (req, res, next) => {
  try { res.set("Cache-Control", "no-store, private"); res.json(await clients.updateClientCredentials(req.params.id, req.body, req.user.id)); } catch (error) { next(error); }
});
router.get("/:id", requireAuth, requireRole("Admin", "Manager"), async (req, res, next) => {
  try { res.json({ client: await clients.getClient(req.params.id) }); } catch (error) { next(error); }
});
router.post("/", requireAuth, requireRole("Admin", "Manager"), async (req, res, next) => {
  try { if (containsCredentials(req.body) && !canUseCredentials(req, "edit_client_credentials")) return res.status(403).json({ error: "You do not have permission to edit client credentials." }); res.status(201).json(await clients.createClient(req.body, req.user.id, { acceptWarnings: req.body.acceptWarnings === true })); } catch (error) { if (error.warnings) res.status(error.status || 400).json({ error: error.message, warnings: error.warnings }); else next(error); }
});
router.put("/:id", requireAuth, requireRole("Admin", "Manager"), async (req, res, next) => {
  try { if (containsCredentials(req.body) && !canUseCredentials(req, "edit_client_credentials")) return res.status(403).json({ error: "You do not have permission to edit client credentials." }); res.json(await clients.updateClient(req.params.id, req.body, req.user.id, { acceptWarnings: req.body.acceptWarnings === true })); } catch (error) { if (error.warnings) res.status(error.status || 400).json({ error: error.message, warnings: error.warnings }); else next(error); }
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
