import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import {
  createAlertAndPush,
  sendDueReminderNotifications,
} from "@/lib/notifications/push"

const bodySchema = z.object({
  type: z.enum(["test", "due-reminders", "payment-completed", "payment-status-changed"]),
  userId: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(120).optional(),
  body: z.string().trim().min(1).max(500).optional(),
  url: z.string().trim().optional(),
  tag: z.string().trim().optional(),
  alertType: z.enum(["info", "warning", "success", "error"]).optional(),
  daysAhead: z.number().int().min(0).max(30).optional(),
})

function hasInternalAccess(req: NextRequest) {
  const cronSecret = req.headers.get("x-cron-secret")
  const internalToken = req.headers.get("x-internal-token")

  return Boolean(
    (process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET) ||
      (process.env.INTERNAL_API_TOKEN &&
        internalToken === process.env.INTERNAL_API_TOKEN)
  )
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const internalAccess = hasInternalAccess(req)

    if (!user && !internalAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const parsedBody = bodySchema.safeParse(await req.json())

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.flatten() },
        { status: 400 }
      )
    }

    const { type, userId, title, body, url, tag, alertType, daysAhead } = parsedBody.data
    const userScopedClient = user ? supabase : undefined

    if (type === "due-reminders") {
      const result = await sendDueReminderNotifications(
        daysAhead || 3,
        userId || user?.id,
        userScopedClient
      )
      return NextResponse.json({ success: true, type, ...result })
    }

    const targetUserId = userId || user?.id

    if (!targetUserId) {
      return NextResponse.json(
        { error: "No se pudo determinar el usuario destino de la notificación" },
        { status: 400 }
      )
    }

    const resolvedTitle =
      title ||
      (type === "payment-completed"
        ? "Pago completado"
        : type === "payment-status-changed"
          ? "Estado de pago actualizado"
          : "Notificación de prueba")

    const resolvedBody =
      body ||
      (type === "payment-completed"
        ? "Tu pago fue acreditado correctamente."
        : type === "payment-status-changed"
          ? "Hay una actualización en el estado de tu pago."
          : "Esta es una prueba de notificaciones push de PagoIA.")

    const result = await createAlertAndPush({
      userId: targetUserId,
      title: resolvedTitle,
      message: resolvedBody,
      alertType: alertType || (type === "payment-completed" ? "success" : "info"),
      url: url || "/dashboard/notificaciones",
      tag: tag || `manual-${type}`,
      supabaseClient: userScopedClient,
    })

    return NextResponse.json({
      success: true,
      type,
      push: result,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: `No se pudo enviar la notificación: ${errorMessage}` },
      { status: 500 }
    )
  }
}