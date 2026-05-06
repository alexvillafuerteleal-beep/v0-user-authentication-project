// ============================================================
// PagoIA Service Worker - Offline support + Push Notifications
// ============================================================

const CACHE_NAME = "pagoia-v1"
const STATIC_CACHE_NAME = "pagoia-static-v1"

// Recursos a cachear para soporte offline
const STATIC_ASSETS = [
  "/",
  "/auth/login",
  "/dashboard",
  "/manifest.json",
  "/icon-dark-32x32.png",
  "/icon-light-32x32.png",
]

// ─── Instalación: pre-cachear assets estáticos ───────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Continuar aunque algún asset falle (assets opcionales)
      })
    })
  )
  self.skipWaiting()
})

// ─── Activación: limpiar caches anteriores ───────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  )
  self.clients.claim()
})

// ─── Fetch: Network-first para API, Cache-first para estáticos ─
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Solo interceptar requests del mismo origen
  if (url.origin !== self.location.origin) return

  // Para API routes: siempre red (datos en tiempo real)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: "Sin conexión. Verifica tu internet." }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      )
    )
    return
  }

  // Para assets estáticos: Cache-first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/providers/") ||
    /\.(png|jpg|jpeg|svg|webp|avif|ico|woff2?)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          const clone = response.clone()
          caches.open(STATIC_CACHE_NAME).then((cache) => cache.put(request, clone))
          return response
        })
      })
    )
    return
  }

  // Para páginas: Network-first con fallback a cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        return response
      })
      .catch(() =>
        caches.match(request).then(
          (cached) =>
            cached ||
            new Response("<h1>Sin conexión</h1><p>Revisa tu internet y recarga la página.</p>", {
              headers: { "Content-Type": "text/html" },
            })
        )
      )
  )
})

// ─── Push Notifications ──────────────────────────────────────
self.addEventListener("push", (event) => {
  let payload = {
    title: "PagoIA",
    body: "Tienes una nueva notificación.",
    url: "/dashboard/notificaciones",
    icon: "/icon-dark-32x32.png",
    badge: "/icon-dark-32x32.png",
    data: {},
  }

  try {
    payload = {
      ...payload,
      ...(event.data ? event.data.json() : {}),
    }
  } catch (_error) {
    payload.body = event.data ? event.data.text() : payload.body
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      tag: payload.tag || "pagoia-notification",
      requireInteraction: Boolean(payload.requireInteraction),
      data: {
        url: payload.url,
        ...(payload.data || {}),
      },
    })
  )
})

// ─── Click en notificación ───────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || "/dashboard/notificaciones"

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if ("focus" in client) {
          client.focus()
          client.postMessage({ type: "notification-click", url: targetUrl })
          return client.navigate ? client.navigate(targetUrl) : client
        }
      }

      return self.clients.openWindow(targetUrl)
    })
  )
})