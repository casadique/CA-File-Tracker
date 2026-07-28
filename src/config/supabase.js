const { createClient } = require("@supabase/supabase-js");
const { env } = require("./env");

function createSupabaseClient(accessToken = "") {
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {},
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function createSupabaseAdminClient() {
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

module.exports = {
  createSupabaseClient,
  supabaseAdmin: createSupabaseAdminClient(),
};
