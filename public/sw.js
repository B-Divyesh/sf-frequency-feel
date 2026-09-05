const CACHE = 'frequency-feel-v3';
const SHELL = [
  '/assets/hero-frequency-line.webp',
  '/assets/hero-frequency-line-720.webp',
  '/assets/sf-frequency-feel-social.webp',
  '/assets/sf-frequency-feel-apple-touch.png',
  '/favicon.svg',
];

async function precacheShell() {
  const cache = await caches.open(CACHE);
  const response = await fetch('/');
  const html = await response.clone().text();
  await cache.put('/', response);
  const builtAssets = [...html.matchAll(/(?:src|href)="(\/[^"?]+\.(?:js|css))"/g)].map((match) => match[1]);
  await cache.addAll([...SHELL, ...builtAssets]);
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheShell());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(event.request, { ignoreSearch: event.request.mode === 'navigate' });
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok) event.waitUntil(cache.put(event.request, response.clone()));
      return response;
    } catch {
      if (event.request.mode === 'navigate') return (await cache.match('/')) || Response.error();
      return Response.error();
    }
  })());
});
