/* APEX 27 service worker: offline support with fresh app shell. */
const CACHE = 'apex-27-v35';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('apex-27-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const r = e.request; const u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return; // never touch AI API calls
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (r.mode === 'navigate') {
      // Network first for the page itself, so an update reaches the device; cached copy when offline.
      try { const res = await fetch(r); if (res.ok) cache.put('./index.html', res.clone()); return res; }
      catch (err) { return (await cache.match('./index.html')) || Response.error(); }
    }
    const hit = await cache.match(r, { ignoreSearch: true });
    if (hit) return hit;
    try { const res = await fetch(r); if (res.ok) cache.put(r, res.clone()); return res; }
    catch (err) { return Response.error(); }
  })());
});
