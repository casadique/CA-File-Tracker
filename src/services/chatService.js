const crypto = require("crypto");
const { patchAppState } = require("./appStateService");

async function sendChatMessage(payload, authUserId, profile) {
  return patchAppState((state) => {
    const now = new Date();
    const sender = resolveUser(state, { id: profile?.id, authUserId, email: profile?.email, name: profile?.name }) || {};
    const targetType = payload.targetType === "personal" ? "personal" : "group";
    const targetUser = targetType === "personal" ? resolveUser(state, { id: payload.targetUserId, email: payload.targetUserEmail, name: payload.targetUserName }) : null;
    const text = String(payload.text || "").trim();
    const attachments = Array.isArray(payload.attachments) ? payload.attachments : [];
    if (!text && !attachments.length) {
      const error = new Error("Please type a message or attach a file.");
      error.status = 400;
      throw error;
    }
    if (targetType === "personal" && !targetUser) {
      const error = new Error("Please select a valid team member.");
      error.status = 400;
      throw error;
    }
    if (targetType === "personal" && String(targetUser.id || "") === String(sender.id || userId)) {
      const error = new Error("Please select another team member.");
      error.status = 400;
      throw error;
    }
    const message = {
      id: crypto.randomUUID(),
      sender_id: sender.id || profile?.id || authUserId,
      authSenderId: authUserId,
      userId: sender.id || profile?.id || authUserId,
      user: sender.name || profile?.name || "Team Member",
      userEmail: sender.email || profile?.email || "",
      role: sender.role || profile?.role || "",
      receiver_id: targetType === "personal" ? targetUser.id || "" : "",
      targetUserId: targetType === "personal" ? targetUser.id || "" : "",
      targetUserName: targetType === "personal" ? targetUser.name || "" : "",
      targetUserEmail: targetType === "personal" ? targetUser.email || "" : "",
      group_id: targetType === "group" ? "team" : "",
      groupId: targetType === "group" ? "team" : "",
      groupName: targetType === "group" ? "Team Chat" : "",
      targetType,
      message: text,
      text,
      message_type: attachments.length ? "attachment" : "text",
      attachments,
      status: "sent",
      delivered_at: now.toISOString(),
      deliveredAt: now.toISOString(),
      read_at: null,
      readAt: null,
      created_at: now.toISOString(),
      createdAt: now.getTime(),
      date: now.toISOString().slice(0, 10),
      time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
    state.chatMessages = [...(state.chatMessages || []), message]
      .sort((a, b) => chatTime(a) - chatTime(b))
      .slice(-1000);
    return state;
  }, authUserId);
}

function visibleChatMessages(state, profile, authUserId) {
  const user = resolveUser(state, { id: profile?.id, authUserId, email: profile?.email, name: profile?.name }) || {};
  if (["Admin", "Manager"].includes(profile?.role)) return state.chatMessages || [];
  return (state.chatMessages || []).filter((message) => {
    if ((message.targetType || "group") === "group") return true;
    return sameIdentity(user, message.userId, message.userEmail, message.user)
      || sameIdentity(user, message.targetUserId, message.targetUserEmail, message.targetUserName);
  });
}

function resolveUser(state, identity = {}) {
  const users = state.users || [];
  const cleanId = String(identity.id || identity.authUserId || "").toLowerCase();
  const cleanEmail = String(identity.email || "").toLowerCase();
  const cleanName = String(identity.name || "").trim().toLowerCase();
  return users.find((user) => cleanId && [user.id, user.authUserId].map((v) => String(v || "").toLowerCase()).includes(cleanId))
    || users.find((user) => cleanEmail && String(user.email || "").toLowerCase() === cleanEmail)
    || users.find((user) => cleanName && String(user.name || "").trim().toLowerCase() === cleanName);
}

function sameIdentity(user, id, email, name) {
  const userIds = [user.id, user.authUserId].map((value) => String(value || "").toLowerCase()).filter(Boolean);
  const cleanId = String(id || "").toLowerCase();
  const cleanEmail = String(email || "").toLowerCase();
  const cleanName = String(name || "").trim().toLowerCase();
  return (cleanId && userIds.includes(cleanId))
    || (cleanEmail && cleanEmail === String(user.email || "").toLowerCase())
    || (cleanName && cleanName === String(user.name || "").trim().toLowerCase());
}

function chatTime(message = {}) {
  return Number(message.createdAt || 0) || Date.parse(message.created_at || `${message.date || ""} ${message.time || ""}`) || 0;
}

module.exports = { sendChatMessage, visibleChatMessages };
