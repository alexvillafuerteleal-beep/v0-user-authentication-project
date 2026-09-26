import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { autopayChargesAllowed } from "@/lib/autopay"

const PutSchema = z.object({
  user_service_id: z.string().uuid(),
  max_amount: z.number().positive().max(20000),
  days_before: z.number().int().min(0).max(10),
  active: z.boolean(),
})

async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

const missingTable = (message?: string) => Boolean(message && /does not exist|schema cache/i.test(message))

export async function GET() {
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const [profile, schedules, runs, services] = await Promise.all([
    supabase.from("payment_profiles").select("card_brand, card_last4, card_exp, payment_method_id").eq("user_id", user.id).maybeSingle(),
    supabase.from("scheduled_payments").select("id, user_service_id, max_amount, days_before, active").eq("user_id", user.id),
    supabase
      .from("autopay_runs")
      .select("id, pending_payment_id, amount, status, reason, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("user_services").select("id, service_type, provider, last_amount, due_date").eq("user_id", user.id).order("created_at"),
  ])

  if (missingTable(profile.error?.message) || missingTable(schedules.error?.message)) {
    return NextResponse.json({ available: false, services: services.data ?? [] })
  }

  const card = profile.data?.payment_method_id
    ? { brand: profile.data.card_brand, last4: profile.data.card_last4, exp: profile.data.card_exp }
    : null

  return NextResponse.json({
    available: true,
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
    testMode: (process.env.STRIPE_SECRET_KEY ?? "").includes("_test_"),
    chargesAllowed: autopayChargesAllowed(),
    card,
    schedules: schedules.data ?? [],
    runs: runs.data ?? [],
    services: services.data ?? [],
  })
}

/** Crea o actualiza el pago automático de un servicio. */
export async function PUT(req: NextRequest) {
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const parsed = PutSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })

  const { data: service } = await supabase.from("user_services").select("id").eq("id", parsed.data.user_service_id).eq("user_id", user.id).maybeSingle()
  if (!service) return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 })

  if (parsed.data.active) {
    const { data: profile } = await supabase.from("payment_profiles").select("payment_method_id").eq("user_id", user.id).maybeSingle()
    if (!profile?.payment_method_id) return NextResponse.json({ error: "Primero guarda una tarjeta" }, { status: 409 })
  }

  const { error } = await supabase
    .from("scheduled_payments")
    .upsert({ user_id: user.id, ...parsed.data }, { onConflict: "user_service_id" })
  if (error) return NextResponse.json({ error: "No se pudo guardar el pago automático" }, { status: 500 })
  return NextResponse.json({ ok: true })
}
