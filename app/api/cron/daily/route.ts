import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createAlertAndPush } from "@/lib/notifications/push"
import { sendEmail } from "@/lib/notifications/email"
import { normalizeMxPhone, sendWhatsAppTemplate } from "@/lib/notifications/whatsapp"
import { computeUserForecasts } from "@/lib/forecast-service"
import { MODEL_VERSION } from "@/lib/forecast"
import { daysUntil, nextDueDate, parseDueDay, toISODate } from "@/lib/due-dates"
import { autopayChargesAllowed, planAutopay, type PendingRow, type ScheduleRow, type ServiceRow } from "@/lib/autopay"
import { chargeOffSession, getStripe, type PaymentProfile } from "@/lib/payments/autopay-stripe"
import type { SupabaseClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const maxDuration = 60

const SERVICE_LABELS: Record<string, string> = {
  electricity: "luz",
  water: "agua",
  gas: "gas",
  internet: "internet",
  phone: "teléfono",
}
const label = (serviceType: string) => SERVICE_LABELS[serviceType] ?? serviceType
const money = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" })
const RECEIPT_RETENTION_DAYS = 30

/**
 * Tarea diaria (Vercel Cron, protegida con CRON_SECRET). Usa service role porque
 * recorre a todos los usuarios; nunca se expone al navegador.
 * 1. Guarda el pronóstico del siguiente periodo y cierra predicciones pasadas con su monto real.
 * 2. Avisa si el recibo del periodo actual salió fuera de lo normal.
 * 3. Avisa al pasar el porcentaje de alerta del presupuesto.
 * 4. Envía los recordatorios de vencimiento (push, correo y WhatsApp).
 * 5. Cobra los pagos automáticos de recibos pendientes que no pasan su tope.
 * 6. Borra las imágenes de recibos confirmados hace más de 30 días.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()
  const monthKey = toISODate(now).slice(0, 7)
  const stats = { users: 0, predictions: 0, anomalies: 0, budgetAlerts: 0, reminders: 0, emails: 0, whatsapp: 0, receiptsPurged: 0, errors: 0 }

  const alertExists = async (userId: string, source: string) => {
    const { count } = await admin.from("alerts").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("source", source)
    return (count ?? 0) > 0
  }

  const { data: serviceRows } = await admin.from("user_services").select("id, user_id, service_type, provider, due_date, last_amount, status")
  const userIds = [...new Set((serviceRows ?? []).map((r) => r.user_id as string))]
  stats.users = userIds.length

  for (const userId of userIds) {
    try {
      const forecasts = await computeUserForecasts(admin, userId, now)

      // 1. Pronósticos y cierre de predicciones pasadas.
      for (const f of forecasts) {
        if (f.forecast.method === "sin-datos") continue
        const { error } = await admin.from("predictions").upsert(
          {
            user_id: userId,
            service_type: f.service_type,
            billing_period: f.billing_period,
            month_year: f.billing_period,
            predicted_amount: f.forecast.predicted,
            lower_bound: f.forecast.lower,
            upper_bound: f.forecast.upper,
            confidence_score: f.forecast.confidence,
            model_version: MODEL_VERSION,
            prediction_date: toISODate(now),
          },
          { onConflict: "user_id,service_type,billing_period" },
        )
        if (!error) stats.predictions++
        for (const h of f.history) {
          await admin
            .from("predictions")
            .update({ actual_amount: h.amount })
            .eq("user_id", userId)
            .eq("service_type", f.service_type)
            .eq("billing_period", h.period)
            .is("actual_amount", null)
        }

        // 2. Anomalías del periodo actual.
        if (f.current?.anomaly.isAnomaly) {
          const source = `anomaly:${f.service_type}:${f.current.period}`
          if (!(await alertExists(userId, source))) {
            const up = f.current.anomaly.changePct >= 0
            await createAlertAndPush({
              userId,
              supabaseClient: admin,
              source,
              alertType: "warning",
              title: `Tu recibo de ${label(f.service_type)} salió ${up ? "más alto" : "más bajo"} de lo normal`,
              message: `Este periodo pagaste ${money(f.current.amount)}, ${Math.abs(f.current.anomaly.changePct)}% ${up ? "más" : "menos"} de lo esperado. Revisa si hubo una fuga, un cobro extra o un cambio de tarifa.`,
              url: "/dashboard/comparativo",
            })
            stats.anomalies++
          }
        }
      }

      // 3. Presupuestos del mes.
      const { data: budgets } = await admin.from("budgets").select("service_type, period_limit, alert_at_pct").eq("user_id", userId)
      if (budgets?.length) {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        const { data: spentRows } = await admin
          .from("transactions")
          .select("service_type, amount")
          .eq("user_id", userId)
          .eq("status", "completed")
          .gte("transaction_date", monthStart)
        for (const b of budgets) {
          const spent = (spentRows ?? []).filter((t) => t.service_type === b.service_type).reduce((s, t) => s + Number(t.amount), 0)
          const pct = (spent / Number(b.period_limit)) * 100
          if (pct < b.alert_at_pct) continue
          const source = `budget:${b.service_type}:${monthKey}:${pct >= 100 ? "over" : "near"}`
          if (await alertExists(userId, source)) continue
          await createAlertAndPush({
            userId,
            supabaseClient: admin,
            source,
            alertType: pct >= 100 ? "error" : "warning",
            title: pct >= 100 ? `Rebasaste tu presupuesto de ${label(b.service_type)}` : `Vas en ${Math.round(pct)}% de tu presupuesto de ${label(b.service_type)}`,
            message: `Llevas ${money(spent)} de ${money(Number(b.period_limit))} este mes.`,
            url: "/dashboard/presupuestos",
          })
          stats.budgetAlerts++
        }
      }

      // 4. Recordatorios de vencimiento.
      const { data: reminders } = await admin.from("reminders").select("id, user_service_id, channel, days_before, last_sent_at").eq("user_id", userId)
      if (reminders?.length) {
        let contact: { email: string | null; phone: string | null } | undefined
        const getContact = async () => {
          if (!contact) {
            const authUser = (await admin.auth.admin.getUserById(userId)).data.user
            contact = { email: authUser?.email ?? null, phone: normalizeMxPhone(authUser?.user_metadata?.phone) }
          }
          return contact
        }
        for (const r of reminders) {
          const service = (serviceRows ?? []).find((s) => s.id === r.user_service_id)
          const dueDay = parseDueDay(service?.due_date)
          if (!service || !dueDay || service.status === "paid") continue
          const due = nextDueDate(dueDay, now)
          const days = daysUntil(due, now)
          if (days !== r.days_before) continue
          if (r.last_sent_at && daysUntil(new Date(r.last_sent_at), now) > -20) continue // ya se envió este ciclo

          const amount = service.last_amount ? ` Monto aproximado: ${money(Number(service.last_amount))}.` : ""
          const when = days === 0 ? "hoy" : days === 1 ? "mañana" : `en ${days} días`
          const title = `Tu recibo de ${label(service.service_type)} vence ${when}`
          const dueLabel = due.toLocaleDateString("es-MX", { day: "numeric", month: "long" })
          const body = `${service.provider ?? "Tu servicio"} vence el ${dueLabel}.${amount}`

          let sent = false
          if (r.channel === "push") {
            await createAlertAndPush({ userId, supabaseClient: admin, alertType: "info", title, message: body, url: "/dashboard/servicios" })
            sent = true
          } else if (r.channel === "whatsapp") {
            const { phone } = await getContact()
            if (phone) {
              sent = await sendWhatsAppTemplate({
                to: phone,
                params: [label(service.service_type), `${when} (${dueLabel})`, service.last_amount ? money(Number(service.last_amount)) : "por confirmar"],
              })
            }
            if (sent) stats.whatsapp++
          } else {
            const { email } = await getContact()
            if (email) sent = await sendEmail({ to: email, subject: title, text: `${body}\n\nPaga desde PagoIA: ${process.env.NEXT_PUBLIC_APP_URL ?? ""}/dashboard/servicios` })
            if (sent) stats.emails++
          }
          if (sent) {
            await admin.from("reminders").update({ last_sent_at: now.toISOString() }).eq("id", r.id)
            stats.reminders++
          }
        }
      }
    } catch (error) {
      stats.errors++
      console.error(`[cron/daily] usuario ${userId}:`, error)
    }
  }

  // 5. Pagos automáticos (solo con llaves de prueba de Stripe, salvo AUTOPAY_ALLOW_LIVE=true).
  if (autopayChargesAllowed()) {
    try {
      Object.assign(stats, await runAutopay(admin, (serviceRows ?? []) as ServiceRow[], now))
    } catch (error) {
      stats.errors++
      console.error("[cron/daily] pagos automáticos:", error)
    }
  }

  // 6. Retención: las imágenes de recibos confirmados se borran a los 30 días.
  const cutoff = new Date(now.getTime() - RECEIPT_RETENTION_DAYS * 86_400_000).toISOString()
  const { data: oldReceipts } = await admin
    .from("receipts")
    .select("id, storage_path")
    .eq("status", "confirmed")
    .lt("confirmed_at", cutoff)
    .neq("storage_path", "eliminado")
    .limit(200)
  if (oldReceipts?.length) {
    await admin.storage.from("receipts").remove(oldReceipts.map((r) => r.storage_path))
    await admin.from("receipts").update({ storage_path: "eliminado" }).in("id", oldReceipts.map((r) => r.id))
    stats.receiptsPurged = oldReceipts.length
  }

  return NextResponse.json({ ok: true, ...stats })
}

/**
 * Cobra los recibos pendientes con pago automático. Antes de cobrar registra el intento en
 * autopay_runs (pending_payment_id es único), así dos corridas simultáneas nunca cobran dos veces.
 */
async function runAutopay(admin: SupabaseClient, services: ServiceRow[], now: Date) {
  const result = { autopayCharged: 0, autopayFailed: 0, autopaySkipped: 0 }
  const { data: schedules, error } = await admin
    .from("scheduled_payments")
    .select("id, user_id, user_service_id, max_amount, days_before, active")
    .eq("active", true)
  if (error || !schedules?.length) return result

  const userIds = [...new Set(schedules.map((s) => s.user_id as string))]
  const [{ data: pendings }, { data: profiles }] = await Promise.all([
    admin.from("pending_payments").select("id, user_id, service_type, provider, amount, due_date, status").in("user_id", userIds).eq("status", "pending"),
    admin.from("payment_profiles").select("*").in("user_id", userIds),
  ])
  if (!pendings?.length) return result
  const { data: runs } = await admin.from("autopay_runs").select("pending_payment_id").in("pending_payment_id", pendings.map((p) => p.id))

  const decisions = planAutopay({
    schedules: schedules as ScheduleRow[],
    services,
    pendings: pendings as PendingRow[],
    attempted: new Set((runs ?? []).map((r) => r.pending_payment_id as string)),
    today: now,
  })
  const stripe = getStripe()

  const notifyOnce = async (userId: string, source: string, alert: Omit<Parameters<typeof createAlertAndPush>[0], "userId" | "supabaseClient" | "source">) => {
    const { count } = await admin.from("alerts").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("source", source)
    if ((count ?? 0) === 0) await createAlertAndPush({ userId, supabaseClient: admin, source, ...alert })
  }

  for (const d of decisions) {
    const { pending, schedule, amount } = d
    const userId = schedule.user_id
    const what = `${label(pending.service_type)}${pending.provider ? ` (${pending.provider})` : ""}`

    if (d.kind !== "charge") {
      result.autopaySkipped++
      await notifyOnce(userId, `autopay-skip:${pending.id}`, {
        alertType: "warning",
        title: `No cobramos tu recibo de ${label(pending.service_type)}`,
        message:
          d.kind === "over_limit"
            ? `El recibo es de ${money(amount)} y tu tope es de ${money(Number(schedule.max_amount))}. Págalo tú o sube el tope en Pagos automáticos.`
            : `El recibo es de ${money(amount)} y Stripe no acepta cargos menores a $10. Págalo desde Mis Pagos.`,
        url: "/dashboard/programados",
      })
      continue
    }

    const profile = (profiles ?? []).find((p) => p.user_id === userId) as PaymentProfile | undefined
    if (!profile?.payment_method_id) {
      result.autopaySkipped++
      await notifyOnce(userId, `autopay-nocard:${pending.id}`, {
        alertType: "warning",
        title: "Tu pago automático no tiene tarjeta",
        message: `Guarda una tarjeta en Pagos automáticos para cobrar tu recibo de ${what}.`,
        url: "/dashboard/programados",
      })
      continue
    }

    // Reserva el intento. Si ya existe (otra corrida), no se cobra.
    const { data: run, error: runError } = await admin
      .from("autopay_runs")
      .insert({ user_id: userId, scheduled_payment_id: schedule.id, pending_payment_id: pending.id, amount, status: "processing" })
      .select("id")
      .single()
    if (runError || !run) continue

    const charge = await chargeOffSession(stripe, profile, {
      pendingPaymentId: pending.id,
      amount,
      serviceType: pending.service_type,
      description: `Pago automático de ${what}`,
    })
    await admin
      .from("autopay_runs")
      .update({ status: charge.status, stripe_payment_intent: charge.paymentIntentId, reason: charge.status === "failed" ? charge.reason : null })
      .eq("id", run.id)

    if (charge.status === "failed") {
      result.autopayFailed++
      await createAlertAndPush({
        userId,
        supabaseClient: admin,
        source: `autopay-failed:${pending.id}`,
        alertType: "error",
        title: `No se pudo cobrar tu recibo de ${label(pending.service_type)}`,
        message: `${charge.reason} Monto: ${money(amount)}.`,
        url: "/dashboard/servicios",
      })
      continue
    }

    result.autopayCharged++
    await admin.from("transactions").insert({
      user_id: userId,
      service_type: pending.service_type,
      provider: pending.provider ?? "Pago automático",
      amount,
      status: charge.status === "succeeded" ? "completed" : "pending",
      receipt_number: charge.paymentIntentId,
      transaction_date: now.toISOString(),
    })
    await admin.from("pending_payments").update({ status: "paid" }).eq("id", pending.id)
    await admin.from("user_services").update({ status: "paid" }).eq("id", schedule.user_service_id).eq("user_id", userId)
    await createAlertAndPush({
      userId,
      supabaseClient: admin,
      source: `autopay-ok:${pending.id}`,
      alertType: "success",
      title: `✅ Pagamos tu recibo de ${label(pending.service_type)}`,
      message: `Cobramos ${money(amount)} a tu tarjeta ${profile.card_brand ?? ""} •••• ${profile.card_last4 ?? ""}. El comprobante está en Historial.`,
      url: "/dashboard/historial",
    })
  }
  return result
}
