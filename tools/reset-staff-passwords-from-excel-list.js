require("dotenv").config({ path: require("path").join(__dirname, "..", ".env"), override: true });
require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

const users = [
  { name: "Sidharth", role: "Staff", email: "sidharthkorom@gmail.com", password: "Sidharth@456" },
  { name: "Althaf", role: "Staff", email: "althafmk2210@gmail.com", password: "Althaf@2210" },
  { name: "Shada", role: "Staff", email: "shadapp004@gmail.com", password: "Shada@004" },
  { name: "Abhinandana", role: "Staff", email: "abhinandanakmadhu@gmail.com", password: "Staff2026" },
  { name: "Naveen", role: "Staff", email: "naveenvv001@gmail.com", password: "Naveen@001" },
  { name: "Rabiyath", role: "Staff", email: "ckrabiyath@gmail.com", password: "Rabiyath@789" },
  { name: "Rizwana", role: "Staff", email: "rizwanashir06@gmail.com", password: "Rizwana@06" },
  { name: "Anusree", role: "Staff", email: "anusreekvmathil@gmail.com", password: "Anusree@741" },
  { name: "Nisha", role: "Staff", email: "nishagireesh986@gmail.com", password: "Nisha@986" },
  { name: "Sneha", role: "Staff", email: "snehasantosh1952002@gmail.com", password: "Sneha@002" },
  { name: "Shurafa", role: "Staff", email: "shurafasameer00@gmail.com", password: "Shurafa@00" },
  { name: "Shadiya", role: "Staff", email: "shadiyasadiq7@gmail.com", password: "Shadiya@007" },
  { name: "Mirsab", role: "Staff", email: "abdulkareemc796@gmail.com", password: "Mirsab@796" },
  { name: "Dheeraj", role: "Staff", email: "dheerajvv11@gmail.com", password: "Dheeraj@11" },
  { name: "Rasha", role: "Staff", email: "rashamp7@gmail.com", password: "Rasha@007" },
  { name: "Arya", role: "Staff", email: "aryatv142001@gmail.com", password: "Arya@001" },
  { name: "Najmunnisa", role: "Manager", email: "pvnajmunnisa123@gmail.com", password: "Najma@696" },
  { name: "Chindu", role: "Manager", email: "craveendran06@gmail.com", password: "Chindu#357" },
  { name: "Sreeshna", role: "Staff", email: "sreeshna@gmail.com", password: "sreeshna@123" },
];

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findAuthUser(email) {
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const found = data.users.find((user) => String(user.email || "").toLowerCase() === email);
    if (found) return found;
    if (data.users.length < 100) return null;
    page += 1;
  }
}

async function upsertAppProfile(authUserId, item) {
  const { error } = await supabase
    .from("app_users")
    .upsert({
      auth_user_id: authUserId,
      email: item.email,
      name: item.name,
      role: item.role,
      is_active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "auth_user_id" });

  if (error) throw error;
}

async function main() {
  let updated = 0;
  let created = 0;

  for (const item of users) {
    item.email = item.email.trim().toLowerCase();
    const existing = await findAuthUser(item.email);

    if (existing) {
      const { error } = await supabase.auth.admin.updateUserById(existing.id, {
        password: item.password,
        email_confirm: true,
        user_metadata: { name: item.name, role: item.role },
      });
      if (error) throw error;
      await upsertAppProfile(existing.id, item);
      updated += 1;
      console.log(`Updated ${item.email}`);
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: item.email,
      password: item.password,
      email_confirm: true,
      user_metadata: { name: item.name, role: item.role },
    });
    if (error) throw error;
    await upsertAppProfile(data.user.id, item);
    created += 1;
    console.log(`Created ${item.email}`);
  }

  console.log(`Done. Updated: ${updated}. Created: ${created}. Total: ${users.length}.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
