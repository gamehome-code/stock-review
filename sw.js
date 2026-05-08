const CACHE_NAME = 'stock-review-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/api.js',
  '/js/market.js',
  '/js/technical.js',
  '/js/fundamental.js',
  '/js/trade-log.js',
  '/js/sentiment.js',
  '/manifest.json',
  '/icons/icon-192.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // JS/CSS 文件使用 network-first（确保获取最新版本）
  if (url.endsWith('.js') || url.endsWith('.css')) {
    e.respondWith(
      fetch(url).then(resp => {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(url, clone));
        return resp;
      }).catch(() => caches.match(url))
    );
  } else if (url.includes('/api/') || url.includes('eastmoney')) {
    // API 请求不缓存
    e.respondWith(fetch(url));
  } else {
    // 其他资源 cache-first
    e.respondWith(
      caches.match(url).then(r => r || fetch(url))
    );
  }
});
