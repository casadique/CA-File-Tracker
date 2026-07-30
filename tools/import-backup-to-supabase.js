require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const backupPath = process.argv[2] || path.join("data", "site-data.json");
const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this import.");
}
if (!fs.existsSync(backupPath)) throw new Error(`Backup not found: ${backupPath}`);

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function publicUser(user, authUserId = "") {
  return {
    id: user.id,
    profileId: user.profileId || "",
    authUserId,
    name: user.name,
    email: String(user.email || "").trim().toLowerCase(),
    role: user.role || "Staff",
    isActive: true,
    source: "supabase-auth",
  };
}

async function ensureAuthUser(user) {
  const email = String(user.email || "").trim().toLowerCase();
  if (!email) return null;

  const { data: created, error } = await supabase.auth.admin.createUser({
    email,
    password: user.password || `Temp@${Math.random().toString(36).slice(2, 10)}1`,
    email_confirm: true,
    user_metadata: { name: user.name, role: user.role },
  });

  if (error && !/already registered|already been registered|already exists/i.test(error.message || "")) {
    throw error;
  }

  if (created?.user) return created.user;

  const { data: list, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;
  return list.users.find((item) => String(item.email || "").toLowerCase() === email) || null;
}

async function main() {
  const payload = JSON.parse(fs.readFileSync(backupPath, "utf8"));
  const state = payload.state || payload;
  const users = state.users || [];
  const nextUsers = [];

  for (const user of users) {
    const authUser = await ensureAuthUser(user);
    if (!authUser) continue;
    const profile = {
      auth_user_id: authUser.id,
      email: String(user.email || "").trim().toLowerCase(),
      name: user.name || user.email,
      role: user.role || "Staff",
      is_active: true,
    };
    const { data, error } = await supabase
      .from("app_users")
      .upsert(profile, { onConflict: "auth_user_id" })
      .select("*")
      .single();
    if (error) throw error;
    nextUsers.push(publicUser({ ...user, profileId: data.id }, data.auth_user_id));
  }

  state.users = nextUsers;
  state.invites = [];
  state.revokedAccess = state.revokedAccess || [];

  const { error } = await supabase
    .from("app_state")
    .upsert({
      id: "default",
      state,
      updated_at: new Date().toISOString(),
    });
  if (error) throw error;

  console.log(JSON.stringify({
    importedFiles: state.files?.length || 0,
    importedUsers: nextUsers.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
