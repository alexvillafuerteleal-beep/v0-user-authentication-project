import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

/** Hogares del usuario con sus miembros y las divisiones de pagos. */
export async function GET() {
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: households, error } = await supabase.from("households").select("id, name, owner_id, created_at").order("created_at")
  if (error) return NextResponse.json({ available: false, households: [] })

  const result = await Promise.all(
    (households ?? []).map(async (h) => {
      const [{ data: members }, { data: splits }] = await Promise.all([
        supabase.rpc("get_household_members", { hid: h.id }),
        supabase
          .from("bill_splits")
          .select("id, description, total_amount, user_id, created_by, share_pct, amount_owed, status, created_at")
          .eq("household_id", h.id)
          .order("created_at", { ascending: false })
          .limit(50),
      ])
      return { ...h, isOwner: h.owner_id === user.id, members: members ?? [], splits: splits ?? [] }
    }),
  )

  const { data: transactions } = await supabase
    .from("transactions")
    .select("id, service_type, provider, amount, transaction_date")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("transaction_date", { ascending: false })
    .limit(10)

  return NextResponse.json({ available: true, userId: user.id, households: result, recentTransactions: transactions ?? [] })
}

export async function POST(req: NextRequest) {
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const parsed = z.object({ name: z.string().trim().min(1).max(60) }).safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Escribe un nombre de hasta 60 caracteres" }, { status: 400 })

  const { data: household, error } = await supabase
    .from("households")
    .insert({ name: parsed.data.name, owner_id: user.id })
    .select("id")
    .single()
  if (error || !household) return NextResponse.json({ error: "No se pudo crear el hogar" }, { status: 500 })

  const { error: memberError } = await supabase.from("household_members").insert({ household_id: household.id, user_id: user.id, role: "owner" })
  if (memberError) return NextResponse.json({ error: "El hogar se creó, pero no se pudo agregarte como miembro" }, { status: 500 })
  return NextResponse.json({ id: household.id })
}
