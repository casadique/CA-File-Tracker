const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { createTodo, deleteTodo, listTodos, todoDashboard, todoHistory, todoMeta, todoPageData, updateTodo } = require("../services/todoService");
const { dispatchFileNotifications } = require("../services/pushNotificationService");

const router = express.Router();

router.use(requireAuth);

router.get("/meta", async (req, res, next) => { try { res.json(await todoMeta(req.user.id, req.profile)); } catch (error) { next(error); } });
router.get("/dashboard", async (req, res, next) => { try { res.json(await todoDashboard(req.user.id, req.profile, req.query)); } catch (error) { next(error); } });
router.get("/export", async (req, res, next) => { try { res.json({ tasks: await listTodos(req.user.id, req.profile, req.query) }); } catch (error) { next(error); } });
router.get("/", async (req, res, next) => { try { res.json(await todoPageData(req.user.id, req.profile, req.query)); } catch (error) { next(error); } });
router.get("/:id/history", async (req, res, next) => { try { res.json({ history: await todoHistory(req.params.id, req.user.id, req.profile) }); } catch (error) { next(error); } });
router.post("/", async (req, res, next) => {
  try {
    const result = await createTodo(req.body || {}, req.user.id, req.profile);
    res.status(201).json({ ok: true, task: result.task });
    dispatchFileNotifications(result.state, result.notices).catch((error) => console.error("To-Do assignment notification failed:", error.message));
  } catch (error) { next(error); }
});
router.patch("/:id", async (req, res, next) => {
  try {
    const result = await updateTodo(req.params.id, req.body || {}, req.user.id, req.profile);
    res.json({ ok: true, task: result.task });
    dispatchFileNotifications(result.state, result.notices).catch((error) => console.error("To-Do update notification failed:", error.message));
  } catch (error) { next(error); }
});
router.delete("/:id", async (req, res, next) => { try { await deleteTodo(req.params.id, req.user.id, req.profile); res.json({ ok: true }); } catch (error) { next(error); } });

module.exports = router;
