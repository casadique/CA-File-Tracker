const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

// The backup copies encrypted credential columns without decrypting or changing
// them. A local workstation therefore does not need the production encryption
// key merely to make a byte-for-byte restorable database snapshot.
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env"), quiet: true });
if (!process.env.CLIENT_CREDENTIALS_ENCRYPTION_KEY) {
  process.env.CLIENT_CREDENTIALS_ENCRYPTION_KEY = "backup-export-does-not-decrypt-values";
}

const {
  BACKUP_VERSION,
  createCompleteBackup,
  checksumFor,
} = require("../src/services/completeBackupService");

function checksumWithoutIntegrity(payload) {
  const { integrity: _integrity, ...core } = payload;
  return checksumFor(core);
}

function safeStamp(value) {
  return String(value).replace(/[:.]/g, "-");
}

async function main() {
  const payload = await createCompleteBackup("Performance baseline");
  if (payload.version !== BACKUP_VERSION) throw new Error("Unexpected backup format version.");
  if (!payload.integrity?.checksum || payload.integrity.checksum !== checksumWithoutIntegrity(payload)) {
    throw new Error("Backup checksum verification failed before writing.");
  }
  if (!payload.state || !Array.isArray(payload.state.files)) {
    throw new Error("Backup is missing the central state or file collection.");
  }

  const outputDirectory = path.resolve(__dirname, "..", "data", "backups");
  const outputPath = path.join(outputDirectory, `performance-baseline-${safeStamp(payload.exportedAt)}.json`);
  await fs.mkdir(outputDirectory, { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(payload), { encoding: "utf8", flag: "wx" });

  const saved = JSON.parse(await fs.readFile(outputPath, "utf8"));
  if (saved.integrity?.checksum !== checksumWithoutIntegrity(saved)) {
    throw new Error("Backup checksum verification failed after reading the saved file.");
  }
  if (saved.backupSummary?.files !== payload.backupSummary?.files) {
    throw new Error("Backup record-count verification failed.");
  }

  const bytes = (await fs.stat(outputPath)).size;
  const fileSha256 = crypto.createHash("sha256").update(await fs.readFile(outputPath)).digest("hex");
  console.log(JSON.stringify({
    ok: true,
    outputPath,
    bytes,
    fileSha256,
    complete: saved.complete,
    warningCount: saved.warnings?.length || 0,
    unavailableTableCount: saved.unavailableTables?.length || 0,
    summary: saved.backupSummary,
  }));
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, message: error.message }));
  process.exitCode = 1;
});
