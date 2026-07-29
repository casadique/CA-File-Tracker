const crypto = require("crypto");
const { supabaseAdmin } = require("../config/supabase");
const { getAppState, patchAppState } = require("./appStateService");

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

async function recoverAdminUser({ email, password, name = "CA Sadique" }) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPassword = String(password || "");
  if (!cleanEmail || !cleanPassword || cleanPassword.length < 8) {
    const error = new Error("Admin email and a password of at least 8 characters are required.");
    error.status = 400;
    throw error;
  }

  const { data: listed, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) throw listError;

  const existingAuthUser = (listed.users || []).find((user) => String(user.email || "").trim().toLowerCase() === cleanEmail);
  let authUser = existingAuthUser;
  if (authUser) {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
      password: cleanPassword,
      email_confirm: true,
      user_metadata: { name, role: "Admin" },
    });
    if (error) throw error;
    authUser = data.user;
  } else {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: cleanPassword,
      email_confirm: true,
      user_metadata: { name, role: "Admin" },
    });
    if (error) throw error;
    authUser = data.user;
  }

  const profilePayload = {
    id: crypto.randomUUID(),
    auth_user_id: authUser.id,
    email: cleanEmail,
    name,
    role: "Admin",
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  const { error: deleteByEmailError } = await supabaseAdmin
    .from("app_users")
    .delete()
    .eq("email", cleanEmail);
  if (deleteByEmailError) throw deleteByEmailError;

  const { error: deleteByAuthError } = await supabaseAdmin
    .from("app_users")
    .delete()
    .eq("auth_user_id", authUser.id);
  if (deleteByAuthError) throw deleteByAuthError;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("app_users")
    .insert(profilePayload)
    .select("*")
    .single();
  if (profileError) throw profileError;

  let legacyWarning = "";
  try {
    await patchLegacyUserList(profile);
  } catch (error) {
    legacyWarning = error.message || "Legacy app state profile sync failed.";
  }
  return { authUser, profile, legacyWarning };
}

async function profileForAuthUser(authUser) {
  const email = String(authUser?.email || "").trim().toLowerCase();
  if (!authUser?.id || !email) return null;

  const { data: byAuthId, error: byAuthError } = await supabaseAdmin
    .from("app_users")
    .select("*")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();
  if (byAuthError) throw byAuthError;
  if (byAuthId) return byAuthId;

  const { data: byEmail, error: byEmailError } = await supabaseAdmin
    .from("app_users")
    .select("*")
    .eq("email", email)
    .maybeSingle();
  if (byEmailError) throw byEmailError;
  if (byEmail) {
    return upsertProfile({
      ...byEmail,
      auth_user_id: authUser.id,
      is_active: byEmail.is_active !== false,
    });
  }

  const state = await getAppState();
  const legacyUser = (state.users || []).find((user) => String(user.email || "").trim().toLowerCase() === email);
  const metadata = authUser.user_metadata || {};
  const profile = {
    auth_user_id: authUser.id,
    email,
    name: legacyUser?.name || metadata.name || email,
    role: legacyUser?.role || metadata.role || (email === "casadique@gmail.com" ? "Admin" : "Staff"),
    is_active: legacyUser?.isActive !== false,
  };
  return upsertProfile(profile);
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
  recoverAdminUser,
  profileForAuthUser,
};
