import { daysUntil } from "@/lib/due-dates"

/**
 * Pagos automáticos: decide qué recibos pendientes se cobran hoy. No toca Stripe ni la base,
 * así se puede probar sin red.
 *
 * Regla: un recibo pendiente se cobra cuando faltan `days_before` días o menos para su fecha
 * límite (o venció hace 5 días como máximo), su servicio y proveedor coinciden con el pago
 * programado y su monto no pasa el tope. Cada recibo se intenta una sola vez.
 */

export const MAX_OVERDUE_DAYS = 5
/** Stripe no acepta cargos menores a $10 MXN. */
export const MIN_CHARGE_MXN = 10

export type ScheduleRow = {
  id: string
  user_id: string
  user_service_id: string
  max_amount: number | string
  days_before: number
  active: boolean
}

export type ServiceRow = { id: string; user_id: string; service_type: string; provider: string | null }

export type PendingRow = {
  id: string
  user_id: string
  service_type: string
  provider: string | null
  amount: number | string
  due_date: string | null
  status: string
}

export type AutopayDecision =
  | { kind: "charge"; schedule: ScheduleRow; pending: PendingRow; amount: number }
  | { kind: "over_limit"; schedule: ScheduleRow; pending: PendingRow; amount: number }
  | { kind: "too_small"; schedule: ScheduleRow; pending: PendingRow; amount: number }

const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase()

export function planAutopay({
  schedules,
  services,
  pendings,
  attempted,
  today,
}: {
  schedules: ScheduleRow[]
  services: ServiceRow[]
  pendings: PendingRow[]
  attempted: Set<string>
  today: Date
}): AutopayDecision[] {
  const decisions: AutopayDecision[] = []
  const taken = new Set<string>()

  for (const schedule of schedules) {
    if (!schedule.active) continue
    const service = services.find((s) => s.id === schedule.user_service_id && s.user_id === schedule.user_id)
    if (!service) continue

    const candidates = pendings
      .filter(
        (p) =>
          p.user_id === schedule.user_id &&
          p.status === "pending" &&
          p.due_date &&
          p.service_type === service.service_type &&
          (!p.provider || !service.provider || norm(p.provider) === norm(service.provider)) &&
          !attempted.has(p.id) &&
          !taken.has(p.id),
      )
      .map((p) => ({ p, days: daysUntil(new Date(`${p.due_date}T12:00:00`), today) }))
      .filter(({ days }) => days <= schedule.days_before && days >= -MAX_OVERDUE_DAYS)
      .sort((a, b) => a.days - b.days)

    for (const { p } of candidates) {
      taken.add(p.id)
      const amount = Math.round(Number(p.amount) * 100) / 100
      const kind = amount < MIN_CHARGE_MXN ? "too_small" : amount > Number(schedule.max_amount) ? "over_limit" : "charge"
      decisions.push({ kind, schedule, pending: p, amount })
    }
  }
  return decisions
}

/** Los cargos reales solo salen con llaves de prueba, salvo que se permita modo real a propósito. */
export function autopayChargesAllowed(secretKey = process.env.STRIPE_SECRET_KEY, allowLive = process.env.AUTOPAY_ALLOW_LIVE) {
  if (!secretKey) return false
  return secretKey.startsWith("sk_test_") || secretKey.startsWith("rk_test_") || allowLive === "true"
}
