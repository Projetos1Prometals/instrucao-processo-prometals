// Service worker - Instrução de Processo Prometals
// Estratégia: rede primeiro (sempre pega a versão nova quando online),
// com cache de reserva para funcionar offline / instalar como app.
const CACHE = 'prometals-v11';
const CORE = [
  './',
  './index.html',
  './estilo.css',
  './script.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {})
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Só cuida dos arquivos do próprio app; deixa Supabase e resto passar direto.
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return resp;
      })
      .catch(() =>
        caches.match(req).then((r) => r || caches.match('./index.html'))
      )
  );
});
