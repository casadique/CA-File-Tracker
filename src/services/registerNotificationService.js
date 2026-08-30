const crypto = require("crypto");
const { supabaseAdmin } = require("../config/supabase");
const { patchAppState } = require("./appStateService");
const { sendToUser } = require("./pushNotificationService");

async function notifyRegisterUser({ recipientProfileId, eventKey, eventType, title, message, route, category, actor }) {
  if (!recipientProfileId || !eventKey) return { skipped: true };
  const { data: recipient, error } = await supabaseAdmin
    .from("app_users")
    .select("id,auth_user_id,email,name,is_active")
    .eq("id", recipientProfileId)
    .maybeSingle();
  if (error) throw error;
  if (!recipient?.auth_user_id || recipient.is_active === false) return { skipped: true };

  const eventId = `register-${crypto.createHash("sha256").update(eventKey).digest("hex").slice(0, 32)}`;
  const payload = { title, body: message, route, category, relatedRecordId: route };
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("notification_events")
    .upsert({
      event_id: eventId,
      event_key: eventKey,
      recipient_user_id: recipient.auth_user_id,
      event_type: eventType,
      file_id: "",
      payload,
      in_app_created_at: new Date().toISOString(),
      desktop_status: "queued",
      updated_at: new Date().toISOString(),
    }, { onConflict: "event_key", ignoreDuplicates: true })
    .select("event_id")
    .maybeSingle();
  if (insertError) throw insertError;
  if (!inserted) return { duplicate: true };

  await patchAppState((state) => {
    const notice = {
      id: eventId,
      event_id: eventId,
      event_key: eventKey,
      changeType: eventType,
      changeText: message,
      fileName: title,
      targetUserId: recipient.id,
      targetUserAuthId: recipient.auth_user_id,
      targetUserEmail: recipient.email,
      targetUserName: recipient.name,
      changedBy: actor?.name || actor?.email || "System",
      category,
      route,
      createdAt: Date.now(),
      created_at: new Date().toISOString(),
    };
    state.fileNotifications = [notice, ...(state.fileNotifications || []).filter((row) => (row.event_key || row.eventKey) !== eventKey)].slice(0, 800);
    return state;
  }, actor?.authUserId || null);

  sendToUser(recipient.auth_user_id, {
    id: eventId,
    eventKey,
    category,
    title,
    body: message,
    route,
  }).catch((pushError) => console.error("Register notification push failed:", pushError.message));
  return { created: true, eventId };
}

module.exports = { notifyRegisterUser };
