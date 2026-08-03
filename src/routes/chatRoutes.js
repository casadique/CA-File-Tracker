const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { getAppState } = require("../services/appStateService");
const { sendChatMessage, markChatMessagesRead, visibleChatMessages } = require("../services/chatService");
const { dispatchChatNotification } = require("../services/pushNotificationService");

const router = express.Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const state = await getAppState();
    res.json({
      ok: true,
      chatMessages: visibleChatMessages(state, req.profile, req.user.id),
      chatGroups: state.chatGroups || [],
      readChatMessages: state.readChatMessages || [],
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const result = await sendChatMessage(req.body || {}, req.user.id, req.profile);
    const message = result.message || null;
    res.json({
      ok: true,
      message,
      chatMessages: message ? [message] : visibleChatMessages(result.state, req.profile, req.user.id),
      chatGroups: result.state.chatGroups || [],
      readChatMessages: result.state.readChatMessages || [],
    });
    if (message) dispatchChatNotification(result.state, message).catch((error) => console.error("Desktop chat notification failed:", error.message));
  } catch (error) {
    next(error);
  }
});

router.post("/read", requireAuth, async (req, res, next) => {
  try {
    const state = await markChatMessagesRead(req.body || {}, req.user.id, req.profile);
    res.json({
      ok: true,
      readChatMessages: state.readChatMessages || [],
      chatMessages: visibleChatMessages(state, req.profile, req.user.id),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
