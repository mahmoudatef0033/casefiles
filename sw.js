/* ملفات مباحث — Service Worker
   الاستراتيجية: الشبكة أولاً (عشان التحديثات توصل فوراً وقت الإيفينت)،
   والنسخة المحفوظة احتياطي لو مفيش إنترنت. Firebase والخطوط بتروح للشبكة مباشرة. */
const CACHE = "mm-pwa-v26";
const CORE = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png",
              "icon-maskable-512.png", "apple-touch-icon.png", "favicon.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return Promise.allSettled(CORE.map(function (u) { return c.add(new Request(u, { cache: "reload" })); })); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;           /* Firebase / خطوط / QR: مباشرة من الشبكة */
  e.respondWith(
    fetch(new Request(req, { cache: "no-cache" }))
      .then(function (res) {
        if (res && res.ok) { const cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, cp); }); }
        return res;
      })
      .catch(function () {
        return caches.match(req, { ignoreSearch: true }).then(function (r) {
          return r || (req.mode === "navigate" ? caches.match("index.html") : Response.error());
        });
      })
  );
});
