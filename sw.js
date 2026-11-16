/* H Notes shell — service worker
   الهدف: أن تفتح الصفحة حتى بلا إنترنت لتعرض رسالة «لا يوجد اتصال» بدل صفحة خطأ المتصفح.
   غيّر رقم النسخة أدناه إذا عدّلت index.html وأردت إجبار التحديث. */
const CACHE = 'hn-shell-v6';
const ASSETS = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/ping.txt')) return;          // اختبار الاتصال يذهب دائماً للشبكة

  if (req.mode === 'navigate') {                            // افتح فوراً من الذاكرة وحدّث في الخلفية
    const net = fetch(req).then(function (res) {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(function (c) { c.put('index.html', copy); }); }
      return res;
    }).catch(function () { return null; });
    e.waitUntil(net);
    e.respondWith(caches.match('index.html').then(function (hit) {
      return hit || net.then(function (r) { return r || new Response('offline', { status: 503 }); });
    }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) { return hit || fetch(req); }));
});
