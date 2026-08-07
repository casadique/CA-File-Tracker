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
    const result = await saveBackupToFolder("manual", true);
    const payload = result.payload || await apiJson("/api/state/backup");
    const fileName = `ca-file-tracker-complete-backup-${todayDate()}`;
    downloadJson(fileName, payload);
    if (payload.complete) {
      toast("Complete backup downloaded, including Client Master, users, invoices, bills and transactions.");
    } else {
      toast(`Backup downloaded with ${payload.warnings?.length || 0} coverage warning(s).`);
    }
    if (result.archiveWarning) toast("Backup downloaded, but the server archive could not be retained.");
  } catch (error) {
    toast(error.message || "Complete backup could not be generated.");
  }
}

function handleBackupRestore(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  if (state.currentRole !== "Admin") return toast("Only Admin can restore backups.");
  if (!confirm("Restore this complete backup? Current central app data and Client Master records will be replaced or updated.")) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const payload = JSON.parse(String(reader.result || "{}"));
      const incomingState = payload.state || payload;
      if (apiToken() && sessionStorage.getItem(API_MODE_KEY) === "supabase") {
        const result = await apiJson("/api/state/restore", {
          method: "POST",
          body: JSON.stringify({
            state: incomingState,
            clientMaster: payload.clientMaster || payload.client_master || [],
            backupVersion: payload.version || "legacy",
            integrity: payload.integrity || null,
          }),
        });
        restoreSharedData(result.state || incomingState, `Central backup restored; ${result.clients?.restored || 0} Client Master record(s) restored`, { targetPage: "dashboard", skipRemote: true });
        return;
      }
      restoreSharedData(incomingState, "Backup restored", { targetPage: "dashboard", fullRemote: true });
    } catch (error) {
      toast(error.message || "Backup restore failed. Please choose a valid JSON backup.");
    }
  };
  reader.readAsText(file);
}
