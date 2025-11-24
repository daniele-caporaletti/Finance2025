const CACHE_NAME = 'finance-2025-v2';
const urlsToCache = [
  '/',
  '/index.html',
  // Nota: Rimosso index.tsx perché in produzione non esiste (viene compilato) e causava il fallimento dell'installazione del SW.
];

// Installazione del Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Attivazione e pulizia vecchie cache
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Gestione delle richieste di rete
self.addEventListener('fetch', event => {
  // 1. Ignora chiamate API Google Script (Network Only)
  if (event.request.url.includes('script.google.com')) {
    return;
  }

  // 2. Gestione Navigazione (SPA Fallback)
  // Se l'utente naviga verso una pagina, prova la rete.
  // Se la rete fallisce O se il server restituisce 404 (Page not found), restituisci index.html dalla cache.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Se la risposta è valida (200), usala. Se è 404, usa la cache.
          if (!response || response.status === 404) {
             return caches.match('/index.html');
          }
          return response;
        })
        .catch(() => {
          // Se sei offline, usa la cache
          return caches.match('/index.html');
        })
    );
    return;
  }

  // 3. Asset Statici (Immagini, JS, CSS)
  // Stale-While-Revalidate: Usa subito la cache se c'è, ma aggiornala in background
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return networkResponse;
      }).catch(() => {
         // Se il fetch di aggiornamento fallisce, non fa niente (abbiamo già la cache o falliremo)
      });
      return cachedResponse || fetchPromise;
    })
  );
});