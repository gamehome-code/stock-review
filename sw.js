// Service Worker v3 - 先清除所有旧缓存，然后注销自己
// 下次用户访问时将不再有SW控制，确保加载最新代码
const CACHE_NAME = 'stock-review-v3';

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
  // 注销自身，让浏览器不再受SW控制
  self.registration.unregister();
});

self.addEventListener('fetch', e => {
  // network-first 策略，确保总是获取最新资源
  e.respondWith(
    fetch(e.request).then(resp => {
      const clone = resp.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
      return resp;
    }).catch(() => caches.match(e.request))
  );
});
