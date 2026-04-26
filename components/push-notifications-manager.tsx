"use client"

import { useEffect } from "react"
import { createClient, isSupabaseClientConfigured } from "@/lib/supabase/client"
import { getUserPreferences } from "@/lib/supabase/services"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index)
  }

  return outputArray
}

export function PushNotificationsManager() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      typeof Notification === "undefined"
    ) {
      return
    }

    if (!isSupabaseClientConfigured()) {
      return
    }

    const supabase = createClient()
    let isActive = true

    async function syncDueReminders() {
      const todayKey = new Date().toISOString().slice(0, 10)
      const alreadySynced =
        window.localStorage.getItem("pagoia-due-reminders-last-sync") === todayKey

      if (alreadySynced) {
        return
      }

      try {
        await fetch("/api/notifications/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "due-reminders",
            daysAhead: 3,
          }),
        })

        window.localStorage.setItem("pagoia-due-reminders-last-sync", todayKey)
      } catch (error) {
        console.error("Due reminders sync error:", error)
      }
    }

    async function syncPushSubscription() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!isActive || !user) {
          return
        }

        const preferences = await getUserPreferences()
        if (!preferences.push_notifications) {
          await syncDueReminders()
          return
        }

        await syncDueReminders()

        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        })

        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!publicKey) {
          return
        }

        let permission = Notification.permission
        const alreadyRequested =
          window.localStorage.getItem("pagoia-push-permission-requested") === "true"

        if (permission === "default" && !alreadyRequested) {
          window.localStorage.setItem("pagoia-push-permission-requested", "true")
          permission = await Notification.requestPermission()
        }

        if (permission !== "granted") {
          return
        }

        const existingSubscription = await registration.pushManager.getSubscription()
        const subscription =
          existingSubscription ||
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          }))

        await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscription: subscription.toJSON(),
          }),
        })
      } catch (error) {
        console.error("Push registration error:", error)
      }
    }

    syncPushSubscription()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: import('@supabase/supabase-js').AuthChangeEvent, session: import('@supabase/supabase-js').Session | null) => {
      if (session?.user) {
        syncPushSubscription()
      }
    })

    return () => {
      isActive = false
      subscription.unsubscribe()
    }
  }, [])

  return null
}