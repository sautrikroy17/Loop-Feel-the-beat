/**
 * Loop Service Worker
 * - Caches the app shell for instant startup on mobile
 * - Network-first for all API/data requests (never cache music)
 * - Cache-first for static assets (fonts, icons, CSS, JS)
 */

const CACHE_NAME = 'loop-shell-v1';

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];

// Install: pre-cache shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: smart caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Always use network for:
  // - API calls / server functions
  // - Supabase
  // - YouTube / external
  const isApiCall =
    url.pathname.startsWith('/_server') ||
    url.pathname.startsWith('/api') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('youtube') ||
    url.hostname.includes('ytimg') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('scdn.co') ||
    url.hostname.includes('spotify');

  if (isApiCall) {
    // Network-only: never cache API/music data
    event.respondWith(fetch(request));
    return;
  }

  // For navigation requests (HTML pages): network first, fall back to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache fresh page for offline fallback
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match('/') || caches.match(request))
    );
    return;
  }

  // For static assets (JS, CSS, fonts, images): cache first, network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Only cache successful same-origin or CDN responses
        if (
          response.ok &&
          (url.origin === self.location.origin ||
            url.hostname.includes('fonts.googleapis.com') ||
            url.hostname.includes('fonts.gstatic.com'))
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
