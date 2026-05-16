const CACHE = 'nexusiq-v3';
const ASSETS = ['/', '/index.html'];

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if(e.request.url.includes('supabase.co') ||
     e.request.url.includes('fonts.googleapis') ||
     e.request.url.includes('fonts.gstatic')) return;
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
