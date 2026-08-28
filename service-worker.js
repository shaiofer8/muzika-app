// service-worker.js -- minimal offline-first cache for the PWA/TWA wrapper.
// Static site, no backend (same principle as sofrim-yamim): cache the app
// shell on install, serve from cache first, fall back to network for
// anything not pre-cached (e.g. future asset additions).
const CACHE_NAME = "muzika-app-v2";
const APP_SHELL = [
  "/",
  "/index.html",
  "/style.css",
  "/i18n.js",
  "/lang.js",
  "/app.js",
  "/score.js",
  "/share.js",
  "/songs/he.js",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => cached);
    })
  );
});
