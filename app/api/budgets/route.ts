import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const PutSchema = z.object({
  service_type: z.string().min(2).max(30),
  period_limit: z.number().positive().max(1_000_000),
  alert_at_pct: z.number().int().min(10).max(100).default(80),
})

async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

/** Presupuestos del usuario y lo que lleva gastado este mes en cada servicio. */
export async function GET() {
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const [{ data: budgets, error }, { data: services }, { data: spentRows }] = await Promise.all([
    supabase.from("budgets").select("service_type, period_limit, alert_at_pct").eq("user_id", user.id),
    supabase.from("user_services").select("service_type, provider, last_amount").eq("user_id", user.id),
    supabase.from("transactions").select("service_type, amount").eq("user_id", user.id).eq("status", "completed").gte("transaction_date", monthStart),
  ])
  const spent: Record<string, number> = {}
  for (const t of spentRows ?? []) if (t.service_type) spent[t.service_type] = (spent[t.service_type] ?? 0) + Number(t.amount)

  const types = [...new Set([...(services ?? []).map((s) => s.service_type), ...(budgets ?? []).map((b) => b.service_type)])].filter(Boolean)
  return NextResponse.json({
    available: !error,
    month: now.toLocaleDateString("es-MX", { month: "long", year: "numeric" }),
    items: types.map((type) => {
      const budget = budgets?.find((b) => b.service_type === type)
      const service = services?.find((s) => s.service_type === type)
      return {
        service_type: type,
        provider: service?.provider ?? null,
        last_amount: service?.last_amount ?? null,
        spent: Math.round((spent[type] ?? 0) * 100) / 100,
        period_limit: budget ? Number(budget.period_limit) : null,
        alert_at_pct: budget?.alert_at_pct ?? 80,
      }
    }),
  })
}

export async function PUT(req: NextRequest) {
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const parsed = PutSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })

  const { error } = await supabase.from("budgets").upsert({ user_id: user.id, ...parsed.data }, { onConflict: "user_id,service_type" })
  if (error) return NextResponse.json({ error: "No se pudo guardar el presupuesto" }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const serviceType = req.nextUrl.searchParams.get("service_type")
  if (!serviceType) return NextResponse.json({ error: "Falta service_type" }, { status: 400 })
  await supabase.from("budgets").delete().eq("user_id", user.id).eq("service_type", serviceType)
  return NextResponse.json({ ok: true })
}
