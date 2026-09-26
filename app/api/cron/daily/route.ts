import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createAlertAndPush } from "@/lib/notifications/push"
import { sendEmail } from "@/lib/notifications/email"
import { computeUserForecasts } from "@/lib/forecast-service"
import { MODEL_VERSION } from "@/lib/forecast"
import { daysUntil, nextDueDate, parseDueDay, toISODate } from "@/lib/due-dates"

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
 * 4. Envía los recordatorios de vencimiento (push y correo).
 * 5. Borra las imágenes de recibos confirmados hace más de 30 días.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()
  const monthKey = toISODate(now).slice(0, 7)
  const stats = { users: 0, predictions: 0, anomalies: 0, budgetAlerts: 0, reminders: 0, emails: 0, receiptsPurged: 0, errors: 0 }

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
        let email: string | null | undefined
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
          const body = `${service.provider ?? "Tu servicio"} vence el ${due.toLocaleDateString("es-MX", { day: "numeric", month: "long" })}.${amount}`

          let sent = false
          if (r.channel === "push") {
            await createAlertAndPush({ userId, supabaseClient: admin, alertType: "info", title, message: body, url: "/dashboard/servicios" })
            sent = true
          } else {
            if (email === undefined) email = (await admin.auth.admin.getUserById(userId)).data.user?.email ?? null
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

  // 5. Retención: las imágenes de recibos confirmados se borran a los 30 días.
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
