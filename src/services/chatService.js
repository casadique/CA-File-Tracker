const crypto = require("crypto");
const { patchAppState } = require("./appStateService");

async function sendChatMessage(payload, authUserId, profile) {
  return patchAppState((state) => {
    const now = new Date();
    const sender = resolveUser(state, { id: profile?.id, authUserId, email: profile?.email, name: profile?.name }) || {};
    const targetType = payload.targetType === "personal" ? "personal" : "group";
    const targetUser = targetType === "personal" ? resolveUser(state, { id: payload.targetUserId, email: payload.targetUserEmail, name: payload.targetUserName }) : null;
    const groupId = targetType === "group" ? String(payload.groupId || payload.group_id || "team").trim() || "team" : "";
    const groupName = targetType === "group" ? String(payload.groupName || payload.group_name || (groupId === "team" ? "Team Chat" : "Group Chat")).trim() : "";
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
    if (targetType === "personal" && [sender.id, sender.authUserId, profile?.id, authUserId].map(String).includes(String(targetUser.id || ""))) {
      const error = new Error("Please select another team member.");
      error.status = 400;
      throw error;
    }
    const clientMessageId = String(payload.clientMessageId || payload.client_message_id || "").trim();
    if (clientMessageId) {
      const existing = (state.chatMessages || []).find((row) => row.client_message_id === clientMessageId || row.clientMessageId === clientMessageId);
      if (existing) return state;
    }
    const message = {
      id: crypto.randomUUID(),
      client_message_id: clientMessageId || crypto.randomUUID(),
      clientMessageId: clientMessageId || "",
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
      group_id: groupId,
      groupId,
      groupName,
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
      createdAt: now.toISOString(),
      date: now.toISOString().slice(0, 10),
      time: "",
    };
    state.chatMessages = [...(state.chatMessages || []), message]
      .sort((a, b) => chatTime(a) - chatTime(b))
      .slice(-1000);
    return state;
  }, authUserId);
}

async function markChatMessagesRead(payload, authUserId, profile) {
  return patchAppState((state) => {
    const user = resolveUser(state, { id: profile?.id, authUserId, email: profile?.email, name: profile?.name }) || {};
    const visibleIds = new Set(visibleChatMessages(state, profile, authUserId)
      .filter((message) => !sameIdentity(user, message.userId, message.userEmail, message.user))
      .map((message) => message.id)
      .filter(Boolean));
    const messageIds = (Array.isArray(payload.messageIds) ? payload.messageIds : [])
      .map((id) => String(id || "").trim())
      .filter((id) => id && visibleIds.has(id));
    const keys = messageIds.map((id) => chatReadKey(id, user, authUserId));
    state.readChatMessages = [...new Set([...(state.readChatMessages || []), ...keys])];
    return state;
  }, authUserId);
}

function visibleChatMessages(state, profile, authUserId) {
  const user = resolveUser(state, { id: profile?.id, authUserId, email: profile?.email, name: profile?.name }) || {};
  if (["Admin", "Manager", "Staff Manager"].includes(profile?.role)) return state.chatMessages || [];
  return (state.chatMessages || []).filter((message) => {
    if ((message.targetType || "group") === "group") {
      const groupId = message.groupId || message.group_id || "team";
      if (groupId === "team") return true;
      const group = (state.chatGroups || []).find((item) => item.id === groupId);
      return Boolean(group?.memberIds?.includes(user.id) || sameIdentity(user, message.userId, message.userEmail, message.user));
    }
    return sameIdentity(user, message.userId, message.userEmail, message.user)
      || sameIdentity(user, message.targetUserId, message.targetUserEmail, message.targetUserName);
  });
}

function chatReadKey(messageId, user = {}, authUserId = "") {
  const reader = String(user.id || user.email || authUserId || user.authUserId || user.name || "guest").trim().toLowerCase();
  return `${reader}::${messageId}`;
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

module.exports = { sendChatMessage, markChatMessagesRead, visibleChatMessages };
