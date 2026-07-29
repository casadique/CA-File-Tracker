const { createClient } = require("@supabase/supabase-js");
const { env } = require("./env");

function createSupabaseClient(accessToken = "") {
  assertSupabaseConfigured();
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {},
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function createSupabaseAdminClient() {
  assertSupabaseConfigured();
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function assertSupabaseConfigured() {
  if (!env.isConfigured) {
    throw new Error(`Missing required environment variables: ${env.missing.join(", ")}`);
  }
}

const supabaseAdmin = new Proxy({}, {
  get(_target, prop) {
    return createSupabaseAdminClient()[prop];
  },
});

module.exports = {
  createSupabaseClient,
  supabaseAdmin,
};
