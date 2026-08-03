const CACHE_NAME = "ca-file-tracker-shell-v2";
const OFFLINE_URL = "/offline.html";
const NOTIFICATION_ICON = "/assets/ca-india-logo.png";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.pathname.startsWith("/api/")) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
  }
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data?.json() || {};
  } catch (_error) {
    payload = { body: event.data?.text() || "You have a new CA File Tracker update." };
  }
  const id = String(payload.id || payload.eventId || `push-${Date.now()}`);
  const notification = {
    id,
    category: payload.category || "announcement",
    route: payload.route || "/?page=dashboard",
    relatedRecordId: payload.relatedRecordId || "",
  };
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    windows.forEach((client) => client.postMessage({ type: "DESKTOP_PUSH_RECEIVED", notification }));
    await self.registration.showNotification(payload.title || "CA File Tracker", {
      body: payload.body || "You have a new update.",
      icon: payload.icon || NOTIFICATION_ICON,
      badge: payload.badge || NOTIFICATION_ICON,
      tag: payload.tag || id,
      renotify: false,
      silent: payload.sound === false,
      requireInteraction: Boolean(payload.requireInteraction),
      data: notification,
    });
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const notification = event.notification.data || {};
  const route = new URL(notification.route || "/?page=dashboard", self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
    if (existing) {
      existing.postMessage({ type: "OPEN_DESKTOP_NOTIFICATION", notification });
      if ("navigate" in existing) await existing.navigate(route);
      return existing.focus();
    }
    return self.clients.openWindow(route);
  })());
});
