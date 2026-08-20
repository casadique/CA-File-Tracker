async function saveBackupToFolder(reason = "manual", includePayload = false) {
  if (location.protocol === "file:") throw new Error("Server backup requires the hosted application.");
  const result = await apiJson("/api/backup", {
    method: "POST",
    body: JSON.stringify({ reason, includePayload }),
  });
  if (!includePayload && !result.archive) throw new Error(result.archiveWarning || "Server backup archive was not retained.");
  return result;
}

async function downloadFullBackup() {
  if (!canUseBackupPage()) return toast("Only Admin and Manager can create full backups.");
  try {
    const response = await fetchCompleteBackupDownload();
    const filename = response.headers.get("Content-Disposition")?.match(/filename="?([^";]+)"?/i)?.[1]
      || `ca-file-tracker-complete-backup-${todayDate()}.json`;
    const text = await response.text();
    const payload = JSON.parse(text);
    const blob = new Blob([text], { type: "application/json" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    const archiveWarning = decodeURIComponent(response.headers.get("X-Backup-Archive-Warning") || "");
    const summary = payload.backupSummary || {};
    toast(`Backup downloaded: ${summary.files || 0} files, ${summary.clientMaster || 0} clients, ${summary.transactions || 0} transactions and ${summary.attachments || 0} attachments.`);
    if (archiveWarning) toast("Backup downloaded, but the server archive could not be retained.");
  } catch (error) {
    toast(error.message || "Complete backup could not be generated.");
  }
}

async function fetchCompleteBackupDownload() {
  const mode = document.querySelector("#backupMode")?.value || "full";
  const request = () => fetch("/api/backup/download", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(apiToken() ? { Authorization: `Bearer ${apiToken()}` } : {}) },
    body: JSON.stringify({ reason: "manual", mode }),
  });
  let response = await request();
  if (response.status === 401 && await refreshApiSession()) response = await request();
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Complete backup could not be generated.");
  }
  return response;
}

function handleBackupRestore(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  if (state.currentRole !== "Admin") return toast("Only Admin can restore backups.");
  if (!confirm("Restore this backup by merging it with current data? Existing records will not be deleted. Matching record IDs will be updated, new records will be added, and the same backup cannot be restored twice.")) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const payload = JSON.parse(String(reader.result || "{}"));
      const incomingState = payload.state || payload;
      if (apiToken() && sessionStorage.getItem(API_MODE_KEY) === "supabase") {
        const result = await apiJson("/api/state/restore", {
          method: "POST",
          body: JSON.stringify(payload.version === "ca-file-tracker-complete-v3" ? { backup: payload } : { state: incomingState, clientMaster: payload.clientMaster || payload.client_master || [], backupVersion: payload.version || "legacy", integrity: payload.integrity || null }),
        });
        restoreSharedData(result.state || incomingState, result.merged ? `Backup merged safely; ${result.storage?.restored || 0} attachment(s) restored and ${result.storage?.skipped || 0} existing attachment(s) kept.` : `Central backup restored; ${result.clients?.restored || 0} Client Master record(s) restored`, { targetPage: "dashboard", skipRemote: true });
        return;
      }
      restoreSharedData(incomingState, "Backup restored", { targetPage: "dashboard", fullRemote: true });
    } catch (error) {
      toast(error.message || "Backup restore failed. Please choose a valid JSON backup.");
    }
  };
  reader.readAsText(file);
}
