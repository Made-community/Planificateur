// Service worker minimal : l'appli reste toujours à jour (réseau d'abord).
// Hors connexion, on réaffiche la dernière page ouverte. Aucune donnée privée n'est mise en cache
// (les appels à Supabase ne passent jamais par ici).
const CACHE = "made-shell-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return; // uniquement notre propre site
  if (req.mode !== "navigate") return;                                       // uniquement la page principale
  e.respondWith((async () => {
    try {
      const fresh = await fetch(req);
      const c = await caches.open(CACHE);
      c.put("./", fresh.clone());
      return fresh;
    } catch (err) {
      const cached = await caches.match("./");
      return cached || new Response("Hors connexion", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }
  })());
});
