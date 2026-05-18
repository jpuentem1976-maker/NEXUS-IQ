const CACHE_NAME = 'nexus-iq-v6';
const ASSETS = [
  './',
  './index.html'
];

// Instalar: guarda el index.html en caché
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activar: elimina cachés viejos
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network First para Supabase, Cache First para el resto
self.addEventListener('fetch', function(e){
  const url = e.request.url;

  // Supabase y Google Fonts siempre van a la red (datos en tiempo real)
  if(url.includes('supabase.co') || url.includes('googleapis.com') || url.includes('fonts.gstatic')){
    e.respondWith(fetch(e.request).catch(function(){ return caches.match(e.request); }));
    return;
  }

  // Para el resto: intenta red primero, si falla usa caché
  e.respondWith(
    fetch(e.request)
      .then(function(response){
        // Guarda en caché la respuesta fresca
        if(response && response.status === 200 && e.request.method === 'GET'){
          const clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(e.request, clone); });
        }
        return response;
      })
      .catch(function(){
        // Sin red: sirve desde caché
        return caches.match(e.request).then(function(cached){
          return cached || caches.match('./index.html');
        });
      })
  );
});
