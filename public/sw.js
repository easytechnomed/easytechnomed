const CACHE_NAME = "easytechnomed-cache-v1";
const OFFLINE_URL = "/offline.html";

// Assets to cache immediately on installation
const ASSETS_TO_CACHE = [
  OFFLINE_URL,
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
  "/logo/logobg.png",
];

// Install event: cache the offline fallback page and core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching offline fallback page and assets");
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate event: clean up older caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[Service Worker] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: handle offline fallbacks and asset caching
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Ignore requests with unsupported schemes (like chrome-extension, data, ftp, etc.)
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // 1. Navigation requests (HTML page loads)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch((error) => {
        console.log("[Service Worker] Navigation failed, serving offline page:", error);
        return caches.open(CACHE_NAME).then((cache) => {
          return cache.match(OFFLINE_URL);
        });
      })
    );
    return;
  }

  // 2. Static assets (images, CSS, JS, manifest)
  const isStaticAsset =
    ASSETS_TO_CACHE.includes(url.pathname) ||
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".webmanifest");

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then((networkResponse) => {
          // Check if we received a valid response
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
            return networkResponse;
          }

          // Cache the new static asset
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        }).catch(() => {
          // Silent catch for assets if network is down
        });
      })
    );
    return;
  }

  // 3. Fallback to normal network requests for everything else (API requests, etc.)
  event.respondWith(fetch(event.request).catch(() => {}));
});
