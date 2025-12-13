self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

const CACHE_VERSION = "v20251213";
const RUNTIME_CACHE = `hims-runtime-${CACHE_VERSION}`;

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key === RUNTIME_CACHE) {
            return Promise.resolve();
          }
          return caches.delete(key);
        })
      )
    ).then(() => clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const acceptHeader = event.request.headers.get("accept") ?? "";
  const url = new URL(event.request.url);

  if (acceptHeader.includes("text/html")) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  if (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.open(RUNTIME_CACHE).then((cache) =>
      cache.match(event.request).then((cachedResponse) => {
        const networkFetch = fetch(event.request)
          .then((response) => {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => cachedResponse);

        return cachedResponse ?? networkFetch;
      })
    )
  );
});
