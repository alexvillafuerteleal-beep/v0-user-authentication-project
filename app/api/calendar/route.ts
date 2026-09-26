import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { dueDateInMonth, parseDueDay, toISODate } from "@/lib/due-dates"

export type CalendarEvent = {
  date: string
  kind: "vence" | "pendiente" | "pagado"
  service_type: string
  title: string
  amount: number | null
  user_service_id?: string
}

/** Vencimientos, pagos pendientes y pagos hechos de un mes (?month=AAAA-MM). */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const monthParam = req.nextUrl.searchParams.get("month") ?? toISODate(new Date()).slice(0, 7)
  if (!/^\d{4}-\d{2}$/.test(monthParam)) return NextResponse.json({ error: "Mes inválido" }, { status: 400 })
  const [year, month] = monthParam.split("-").map(Number)
  const from = toISODate(new Date(year, month - 1, 1))
  const to = toISODate(new Date(year, month, 0))

  const [{ data: services }, { data: pending }, { data: paid }] = await Promise.all([
    supabase.from("user_services").select("id, service_type, provider, due_date, last_amount, status").eq("user_id", user.id),
    supabase.from("pending_payments").select("service_type, provider, amount, due_date, status").eq("user_id", user.id).gte("due_date", from).lte("due_date", to),
    supabase
      .from("transactions")
      .select("service_type, provider, amount, transaction_date")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .gte("transaction_date", `${from}T00:00:00`)
      .lte("transaction_date", `${to}T23:59:59`),
  ])

  const events: CalendarEvent[] = []
  for (const s of services ?? []) {
    const day = parseDueDay(s.due_date)
    if (!day) continue
    events.push({
      date: toISODate(dueDateInMonth(day, year, month - 1)),
      kind: "vence",
      service_type: s.service_type,
      title: s.provider ?? s.service_type,
      amount: s.last_amount != null ? Number(s.last_amount) : null,
      user_service_id: s.id,
    })
  }
  for (const p of pending ?? []) {
    if (p.status !== "pending" || !p.due_date) continue
    events.push({ date: p.due_date, kind: "pendiente", service_type: p.service_type, title: p.provider ?? p.service_type, amount: Number(p.amount) })
  }
  for (const t of paid ?? []) {
    events.push({
      date: t.transaction_date.slice(0, 10),
      kind: "pagado",
      service_type: t.service_type ?? "other",
      title: t.provider ?? t.service_type ?? "Pago",
      amount: Number(t.amount),
    })
  }

  events.sort((a, b) => a.date.localeCompare(b.date))
  return NextResponse.json({ month: monthParam, events, services: services ?? [] })
}
