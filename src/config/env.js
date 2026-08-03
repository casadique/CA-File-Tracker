const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });
dotenv.config();

const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "CLIENT_CREDENTIALS_ENCRYPTION_KEY"];
function readEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return {
    missing,
    isConfigured: missing.length === 0,
    isProduction: process.env.NODE_ENV === "production",
    port: Number(process.env.PORT || 3000),
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    adminRecoveryToken: process.env.ADMIN_RECOVERY_TOKEN || "",
    clientCredentialsEncryptionKey: process.env.CLIENT_CREDENTIALS_ENCRYPTION_KEY || "",
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET || "ca-file-tracker-attachments",
    corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map((item) => item.trim()) : true,
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 300),
  };
}

module.exports = { env: readEnv() };
