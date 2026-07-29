require("dotenv").config({ path: require("path").join(__dirname, "..", ".env"), override: true });
require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data, error } = await supabase
    .from("app_state")
    .select("state, updated_at")
    .eq("id", "default")
    .maybeSingle();

  if (error) throw error;
  const state = data?.state || {};
  console.log(JSON.stringify({
    supabaseUrl: process.env.SUPABASE_URL,
    updatedAt: data?.updated_at || null,
    files: state.files?.length || 0,
    users: state.users?.length || 0,
    firstFile: state.files?.[0]?.name || null,
    rabiyathFiles: (state.files || []).filter((file) => {
      const text = `${file.assignedStaff || ""} ${file.assignedStaffEmail || ""}`.toLowerCase();
      return text.includes("rabiyath") || text.includes("ckrabiyath@gmail.com");
    }).length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
