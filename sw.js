const CACHE_NAME = 'nexus-iq-v6.2';

// Al instalar: NO cachear index.html, solo recursos estáticos externos
self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE_NAME).then(function(cache){
    return cache.addAll([]); // nada en instalación
  }));
  self.skipWaiting();
});

// Activar: eliminar cachés viejos
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

// Fetch: SIEMPRE ir a la red para index.html y Supabase
// Para el resto: red primero, caché como respaldo
self.addEventListener('fetch', function(e){
  const url = e.request.url;

  // index.html y Supabase: SIEMPRE red, nunca caché
  if(url.includes('index.html') || url.includes('supabase.co') ||
     url.endsWith('/') || url.includes('github.io/NEXUS-IQ')){
    e.respondWith(
      fetch(e.request).catch(function(){
        return caches.match(e.request);
      })
    );
    return;
  }

  // Google Fonts y otros externos: red primero
  if(url.includes('googleapis.com') || url.includes('fonts.gstatic')){
    e.respondWith(fetch(e.request).catch(function(){ return caches.match(e.request); }));
    return;
  }

  // Resto: red primero, caché como respaldo
  e.respondWith(
    fetch(e.request).then(function(response){
      if(response && response.status === 200 && e.request.method === 'GET'){
        const clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(e.request, clone); });
      }
      return response;
    }).catch(function(){
      return caches.match(e.request);
    })
  );
});
