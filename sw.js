// Bump CACHE_VERSION to invalidate clients on deploy.
const CACHE_VERSION = "v110";
const APP_SHELL = `slo-shell-${CACHE_VERSION}`;
const DATA_CACHE = `slo-data-${CACHE_VERSION}`;

const SHELL_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./src/main.js",
  "./src/config.js",
  "./src/data-loader.js",
  "./src/state.js",
  "./src/firebase-sync.js",
  "./src/engine/words.js",
  "./src/engine/verbs.js",
  "./src/engine/sentences.js",
  "./src/engine/learn.js",
  "./src/ui/dom.js",
  "./src/ui/menu.js",
  "./src/ui/words.js",
  "./src/ui/verbs.js",
  "./src/ui/sentences.js",
  "./src/ui/learn.js",
  "./src/ui/besednjak.js",
  "./src/ui/slovar.js",
  "./src/ui/grammar.js",
  "./src/ui/auth-bar.js",
  "./icons/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(APP_SHELL).then((c) => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== APP_SHELL && k !== DATA_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Don't intercept Firebase or other CDN requests.

  // Data files: network-first with cache fallback (so words update fast).
  if (url.pathname.includes("/data/")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(DATA_CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // App shell: cache-first.
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      if (res && res.status === 200) {
        const copy = res.clone();
        caches.open(APP_SHELL).then((c) => c.put(req, copy));
      }
      return res;
    }))
  );
});
