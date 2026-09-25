// Aviator service worker (hand-rolled, no bundler integration).
//   - navigations: network-first, fall back to cached page, then /offline
//   - hashed build assets and icons: cache-first
//   - /api/* and non-GET: never touched (Claude + weather always go to network)
// Bump CACHE_VERSION after a breaking change to invalidate everything.

const CACHE_VERSION = "v2";
const RUNTIME_CACHE = `aviator-runtime-${CACHE_VERSION}`;
const PRECACHE = `aviator-precache-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";

const PRECACHE_URLS = [OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"];

// The full list of static pages lives at /precache.json (generated at build
// time from the checklist and maneuver ids) so never-visited pages work offline.
async function precacheAll(cache) {
  await Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)));
  try {
    const res = await fetch("/precache.json", { cache: "no-cache" });
    if (!res.ok) return;
    const { urls } = await res.json();
    await Promise.allSettled(urls.map((url) => cache.add(url)));
  } catch (err) {
    console.warn("precache list unavailable", err);
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => precacheAll(cache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== RUNTIME_CACHE && key !== PRECACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  // Client-side navigation payloads: pass through. If they fail offline the
  // router falls back to a full page navigation, which is served below.
  if (request.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) return;

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const precached = await caches.match(request, { cacheName: PRECACHE });
          if (precached) return precached;
          const offline = await caches.match(OFFLINE_URL);
          return offline || Response.error();
        })
    );
  }
});
