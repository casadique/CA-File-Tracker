const crypto = require("crypto");
const { supabaseAdmin } = require("../config/supabase");
const { patchAppState } = require("./appStateService");

async function createUser({ email, password, name, role }) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!cleanEmail || !password || !name || !role) {
    const error = new Error("Name, email, password and role are required.");
    error.status = 400;
    throw error;
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: cleanEmail,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  });
  if (error) throw error;

  const profile = await upsertProfile({
    auth_user_id: data.user.id,
    email: cleanEmail,
    name,
    role,
    is_active: true,
  });

  await patchLegacyUserList(profile);
  return profile;
}

async function updateUser(userId, patch) {
  if (patch.password) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: patch.password });
    if (error) throw error;
  }

  const profile = await upsertProfile({
    auth_user_id: userId,
    email: patch.email,
    name: patch.name,
    role: patch.role,
    is_active: patch.is_active,
  });
  await patchLegacyUserList(profile);
  return profile;
}

async function setUserActive(userId, isActive) {
  const { data, error } = await supabaseAdmin
    .from("app_users")
    .update({ is_active: Boolean(isActive), updated_at: new Date().toISOString() })
    .eq("auth_user_id", userId)
    .select("*")
    .single();
  if (error) throw error;
  await patchLegacyUserList(data);
  return data;
}

async function sendPasswordReset(email) {
  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(String(email || "").trim().toLowerCase());
  if (error) throw error;
  return { ok: true };
}

async function upsertProfile(profile) {
  const payload = {
    id: profile.id || crypto.randomUUID(),
    auth_user_id: profile.auth_user_id,
    email: String(profile.email || "").trim().toLowerCase(),
    name: profile.name,
    role: profile.role,
    is_active: profile.is_active !== false,
    updated_at: new Date().toISOString(),
  };
  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

  const { data, error } = await supabaseAdmin
    .from("app_users")
    .upsert(payload, { onConflict: "auth_user_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

async function patchLegacyUserList(profile) {
  await patchAppState((state) => {
    const users = state.users || [];
    const index = users.findIndex((user) => user.email === profile.email || user.authUserId === profile.auth_user_id);
    const publicUser = {
      id: profile.id,
      authUserId: profile.auth_user_id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      isActive: profile.is_active,
      source: "supabase-auth",
    };
    if (index >= 0) users[index] = { ...users[index], ...publicUser, password: "" };
    else users.push(publicUser);
    state.users = users;
    return state;
  }, profile.auth_user_id);
}

module.exports = {
  createUser,
  updateUser,
  setUserActive,
  sendPasswordReset,
};
