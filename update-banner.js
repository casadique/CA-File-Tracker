(function applicationUpdateBanner() {
  "use strict";

  const RELEASE_STORAGE_KEY = "ca-file-tracker-loaded-release";
  const POLL_INTERVAL_MS = 60 * 1000;
  const REQUEST_TIMEOUT_MS = 8000;
  let loadedRelease = "";
  let availableRelease = "";
  let checking = false;
  let monitorStarted = false;

  function storedRelease() {
    try { return sessionStorage.getItem(RELEASE_STORAGE_KEY) || ""; } catch { return ""; }
  }

  function storeRelease(release) {
    try { sessionStorage.setItem(RELEASE_STORAGE_KEY, release); } catch { /* Memory state remains sufficient. */ }
  }

  function loggedInShell() {
    return document.querySelector("#app .app-shell .content");
  }

  function ensureBanner() {
    const content = loggedInShell();
    if (!content) return null;
    let banner = content.querySelector("#applicationUpdateBanner");
    if (banner) return banner;
    banner = document.createElement("section");
    banner.id = "applicationUpdateBanner";
    banner.className = "app-update-banner";
    banner.hidden = true;
    banner.setAttribute("role", "status");
    banner.setAttribute("aria-live", "polite");
    banner.innerHTML = `
      <p><strong>An update is ready.</strong> Reload to use the latest CA File Tracker version.</p>
      <button type="button" class="app-update-reload-button">Reload latest version</button>
    `;
    const topbar = content.querySelector(".topbar");
    if (topbar) topbar.insertAdjacentElement("afterend", banner);
    else content.prepend(banner);
    banner.querySelector(".app-update-reload-button").addEventListener("click", () => {
      const button = banner.querySelector(".app-update-reload-button");
      button.textContent = "Reloading...";
      button.setAttribute("aria-busy", "true");
      if (availableRelease) storeRelease(availableRelease);
      try { window.persistTransactionEntryDrafts?.(); } catch { /* beforeunload also protects drafts. */ }
      window.location.reload();
      window.setTimeout(() => {
        button.textContent = "Reload latest version";
        button.removeAttribute("aria-busy");
      }, 2500);
    });
    return banner;
  }

  function showUpdate(release) {
    availableRelease = release;
    const banner = ensureBanner();
    if (!banner || !banner.hidden) return;
    banner.dataset.release = release;
    banner.hidden = false;
  }

  async function fetchRelease() {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`/api/release?check=${Date.now()}`, {
        cache: "no-store",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      if (!response.ok) return "";
      const payload = await response.json();
      return String(payload.release || "").trim();
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function checkForUpdate() {
    if (checking || !loggedInShell() || availableRelease) return;
    checking = true;
    try {
      const release = await fetchRelease();
      if (!release) return;
      if (!loadedRelease) {
        loadedRelease = storedRelease() || release;
        if (!storedRelease()) storeRelease(release);
      }
      if (release !== loadedRelease) showUpdate(release);
    } catch (error) {
      if (error?.name !== "AbortError") console.debug("Application update check deferred.", error);
    } finally {
      checking = false;
    }
  }

  function startMonitor() {
    if (monitorStarted || !loggedInShell()) return;
    monitorStarted = true;
    loadedRelease = storedRelease();
    checkForUpdate();
    window.setInterval(checkForUpdate, POLL_INTERVAL_MS);
    window.addEventListener("focus", checkForUpdate);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) checkForUpdate();
    });
    navigator.serviceWorker?.addEventListener("message", (event) => {
      if (event.data?.type === "CHECK_APP_RELEASE") checkForUpdate();
    });
  }

  const shellObserver = new MutationObserver(() => {
    if (!loggedInShell()) return;
    ensureBanner();
    startMonitor();
  });
  shellObserver.observe(document.querySelector("#app") || document.body, { childList: true, subtree: true });
  ensureBanner();
  startMonitor();
})();
