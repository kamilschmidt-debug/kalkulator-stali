"use strict";

const PREFIX = `kalkulator-stali:${self.registration.scope}:`;
const CACHE = `${PREFIX}v1`;
const INDEX = new URL("index.html", self.registration.scope).href;
const MANIFEST = new URL("manifest.webmanifest", self.registration.scope).href;

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll([INDEX, MANIFEST]);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const nazwy = await caches.keys();
    await Promise.all(nazwy
      .filter(n => n.startsWith(PREFIX) && n !== CACHE)
      .map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET" || !req.url.startsWith(self.registration.scope)) return;

  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const odpowiedz = await fetch(req);
        if (odpowiedz.ok) {
          const cache = await caches.open(CACHE);
          await cache.put(INDEX, odpowiedz.clone());
        }
        return odpowiedz;
      } catch {
        const cache = await caches.open(CACHE);
        return (await cache.match(INDEX)) || Response.error();
      }
    })());
  } else if (req.url === MANIFEST) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      return (await cache.match(req)) || fetch(req);
    })());
  }
});