// Rural Insights - Service Worker (Development Mode)
// Versão minimalista para desenvolvimento - evita conflitos com Vite

const CACHE_NAME = 'rural-insights-dev-v1.0.2';
const API_CACHE_NAME = 'rural-insights-api-dev-v1.0.2';

console.log('🌱 Rural Insights Service Worker loaded');
console.log('📦 Cache Strategy: network-first for all, minimal caching');
console.log('⏰ Cache TTL: API 5min only');

// Install - Cache mínimo
self.addEventListener('install', (event) => {
  console.log('🌱 Rural Insights SW: Installing (Dev Mode)...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Caching minimal assets');
      return cache.addAll([
        '/manifest.json'
      ]);
    }).then(() => {
      self.skipWaiting();
    })
  );
});

// Activate - Limpa caches antigos
self.addEventListener('activate', (event) => {
  console.log('✅ Rural Insights SW: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Limpa caches antigos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Assume controle imediatamente
      self.clients.claim()
    ])
  );
});

// Fetch - APENAS para APIs do backend, ignora tudo do Vite
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // APENAS intercepta APIs do backend (porta 8000)
  if (url.port === '8000' && url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(event.request));
  }
  
  // Para todo resto (Vite assets, React, CSS, etc.), deixa passar direto
});

// Handler simplificado para APIs
async function handleAPIRequest(request) {
  try {
    // Sempre tenta network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache apenas se for GET e resposta ok
      if (request.method === 'GET') {
        const cache = await caches.open(API_CACHE_NAME);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    // Só usa cache se network falhar E for GET
    if (request.method === 'GET') {
      console.log('📡 API offline, trying cache:', request.url);
      const cache = await caches.open(API_CACHE_NAME);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Fallback para erro
    return new Response(JSON.stringify({
      success: false,
      error: 'Offline: API não disponível',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Message handler para comunicação com a app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});