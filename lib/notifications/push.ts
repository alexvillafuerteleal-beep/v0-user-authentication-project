import type { SupabaseClient } from "@supabase/supabase-js"
import webpush from "web-push"
import { createAdminClient } from "@/lib/supabase/admin"

interface PushSubscriptionRecord {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  expiration_time: number | null
  is_active: boolean
  user_agent: string | null
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
  icon?: string
  badge?: string
  requireInteraction?: boolean
  data?: Record<string, unknown>
}

type DatabaseClient = SupabaseClient<any, any, any>

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || ""
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:soporte@pagoia.com"

if (publicVapidKey && privateVapidKey) {
  webpush.setVapidDetails(vapidSubject, publicVapidKey, privateVapidKey)
}

export function isPushConfigured() {
  return Boolean(publicVapidKey && privateVapidKey)
}

export function getPublicVapidKey() {
  return publicVapidKey
}

function getSupabaseClient(supabaseClient?: DatabaseClient) {
  return supabaseClient ?? createAdminClient()
}

function formatNotificationPayload(payload: PushPayload) {
  return JSON.stringify({
    icon: "/icon-dark-32x32.png",
    badge: "/icon-dark-32x32.png",
    url: "/dashboard/notificaciones",
    requireInteraction: false,
    ...payload,
  })
}

function getNextDueDate(dayOfMonth: number, baseDate = new Date()) {
  const currentMonthDays = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth() + 1,
    0
  ).getDate()

  const normalizedToday = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate()
  )

  const dueThisMonth = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    Math.min(dayOfMonth, currentMonthDays)
  )

  if (dueThisMonth >= normalizedToday) {
    return dueThisMonth
  }

  const nextMonthBase = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1)
  const nextMonthDays = new Date(
    nextMonthBase.getFullYear(),
    nextMonthBase.getMonth() + 1,
    0
  ).getDate()

  return new Date(
    nextMonthBase.getFullYear(),
    nextMonthBase.getMonth(),
    Math.min(dayOfMonth, nextMonthDays)
  )
}

function getDaysUntil(targetDate: Date, baseDate = new Date()) {
  const oneDay = 24 * 60 * 60 * 1000
  const normalizedToday = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate()
  )
  const normalizedTarget = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate()
  )

  return Math.round((normalizedTarget.getTime() - normalizedToday.getTime()) / oneDay)
}

async function markSubscriptionInactive(
  subscriptionId: string,
  supabaseClient?: DatabaseClient
) {
  const supabase = getSupabaseClient(supabaseClient)

  await supabase
    .from("push_subscriptions")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId)
}

async function sendPushToSubscription(
  subscription: PushSubscriptionRecord,
  payload: PushPayload,
  supabaseClient?: DatabaseClient
) {
  if (!isPushConfigured()) {
    return { ok: false, skipped: true, reason: "Push no configurado" }
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        expirationTime: subscription.expiration_time,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      formatNotificationPayload(payload)
    )
  const supabase = getSupabaseClient(supabaseClient)

    await supabase
      .from("push_subscriptions")
      .update({
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id)

    return { ok: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const statusCode =
      typeof error === "object" && error !== null && "statusCode" in error
        ? Number((error as { statusCode?: number }).statusCode)
        : undefined

    if (statusCode === 404 || statusCode === 410) {
      await markSubscriptionInactive(subscription.id, supabaseClient)
    }

    return { ok: false, skipped: false, reason: errorMessage }
  }
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
  supabaseClient?: DatabaseClient
) {
  const supabase = getSupabaseClient(supabaseClient)

  const { data: preferences } = await supabase
    .from("user_preferences")
    .select("push_notifications, alert_notifications")
    .eq("user_id", userId)
    .maybeSingle()

  if (
    preferences &&
    (preferences.push_notifications === false ||
      preferences.alert_notifications === false)
  ) {
    return { sent: 0, failed: 0, skipped: 1 }
  }

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth, expiration_time, is_active, user_agent")
    .eq("user_id", userId)
    .eq("is_active", true)

  if (error) {
    throw new Error(`No se pudieron obtener las suscripciones push: ${error.message}`)
  }

  if (!subscriptions?.length) {
    return { sent: 0, failed: 0, skipped: 0 }
  }

  const results = await Promise.all(
    subscriptions.map((subscription) =>
      sendPushToSubscription(
        subscription as PushSubscriptionRecord,
        payload,
        supabase
      )
    )
  )

  return {
    sent: results.filter((result) => result.ok).length,
    failed: results.filter((result) => !result.ok && !result.skipped).length,
    skipped: results.filter((result) => result.skipped).length,
  }
}

export async function createAlertAndPush({
  userId,
  title,
  message,
  alertType,
  url,
  tag,
  sendPush = true,
  supabaseClient,
}: {
  userId: string
  title: string
  message: string
  alertType: string
  url?: string
  tag?: string
  sendPush?: boolean
  supabaseClient?: DatabaseClient
}) {
  const supabase = getSupabaseClient(supabaseClient)

  const { error } = await supabase.from("alerts").insert({
    user_id: userId,
    title,
    message,
    alert_type: alertType,
    url: url || null,
  })

  if (error) {
    throw new Error(`No se pudo crear la alerta: ${error.message}`)
  }

  if (!sendPush) {
    return { sent: 0, failed: 0, skipped: 1 }
  }

  return sendPushToUser(
    userId,
    {
    title,
    body: message,
    url,
    tag,
    },
    supabase
  )
}

export async function sendDueReminderNotifications(
  daysAhead = 3,
  targetUserId?: string,
  supabaseClient?: DatabaseClient
) {
  const supabase = getSupabaseClient(supabaseClient)
  let query = supabase
    .from("user_services")
    .select("id, user_id, service_type, provider, due_date, last_amount, status")
    .eq("status", "active")

  if (targetUserId) {
    query = query.eq("user_id", targetUserId)
  }

  const { data: services, error } = await query

  if (error) {
    throw new Error(`No se pudieron cargar los servicios del usuario: ${error.message}`)
  }

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  let notified = 0

  for (const service of services || []) {
    const dueDate = getNextDueDate(Number(service.due_date || 0))
    const daysUntil = getDaysUntil(dueDate)

    if (daysUntil < 0 || daysUntil > daysAhead) {
      continue
    }

    const title =
      daysUntil === 0
        ? `Vence hoy: ${service.provider}`
        : `Vence en ${daysUntil} día${daysUntil === 1 ? "" : "s"}: ${service.provider}`

    const { data: existingAlert } = await supabase
      .from("alerts")
      .select("id")
      .eq("user_id", service.user_id)
      .eq("title", title)
      .gte("created_at", startOfToday.toISOString())
      .limit(1)
      .maybeSingle()

    if (existingAlert) {
      continue
    }

    const formattedDate = new Intl.DateTimeFormat("es-MX", {
      dateStyle: "long",
    }).format(dueDate)

    const lastAmount = Number(service.last_amount || 0).toFixed(2)
    const message = `Tu servicio ${service.provider} vence el ${formattedDate}. Último monto registrado: $${lastAmount} MXN.`

    await createAlertAndPush({
      userId: service.user_id,
      title,
      message,
      alertType: "warning",
      url: `/dashboard/servicios?payment=reminder&service=${service.service_type}`,
      tag: `due-${service.id}-${daysUntil}`,
      supabaseClient: supabase,
    })

    notified += 1
  }

  return {
    reviewed: services?.length || 0,
    notified,
    daysAhead,
  }
}