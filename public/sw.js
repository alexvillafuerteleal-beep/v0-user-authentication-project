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