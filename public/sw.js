// Меняйте версию при выпуске новой оболочки: старый кэш удалится при активации.
// Версия меняется при выпуске новой оболочки, чтобы старые хэши Vite
// не оставались в кэше после деплоя на GitHub Pages.
const CACHE = 'planeta-5plus-shell-v11'
const CORE = [
  './', './index.html', './manifest.webmanifest', './icon.svg',
  './assets/world/manifest.json',
  './assets/world/city-background-plaza-v1.jpg',
  './assets/world/city-districts-panorama-v1.jpg',
  './assets/world/russian/foundation-v1.png',
  './assets/world/russian/floor-standard-v2.png',
  './assets/world/russian/floor-x2-v2.png',
  './assets/world/russian/floor-x3-v2.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const requestUrl = new URL(event.request.url)
  // Vite-модули нельзя кэшировать: иначе локальный dev-сервер может
  // показывать предыдущую версию интерфейса после правок.
  if (requestUrl.origin === self.location.origin &&
      (requestUrl.pathname.startsWith('/src/') ||
       requestUrl.pathname.startsWith('/@vite/') ||
       requestUrl.pathname.startsWith('/node_modules/.vite/'))) return

  // HTML и хэшированные Vite-ресурсы должны обновляться сразу после деплоя.
  // При отсутствии сети используем последнюю рабочую копию из кэша.
  const isShellOrAsset = requestUrl.origin === self.location.origin &&
    (event.request.mode === 'navigate' ||
      requestUrl.pathname.endsWith('.html') ||
      requestUrl.pathname.includes('/assets/'))
  if (isShellOrAsset) {
    event.respondWith(
      fetch(event.request).then((response) => {
        const copy = response.clone()
        caches.open(CACHE).then((cache) => cache.put(event.request, copy))
        return response
      }).catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html'))),
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone()
      caches.open(CACHE).then((cache) => cache.put(event.request, copy))
      return response
    }).catch(() => caches.match('./index.html'))),
  )
})
