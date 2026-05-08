// Service Worker - 清除所有旧缓存并注销自身
self.addEventListener('install', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
  self.registration.unregister();
});

self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request));
});
