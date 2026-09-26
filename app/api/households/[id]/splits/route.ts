import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { splitAmounts } from "@/lib/splits"

const BodySchema = z.object({
  description: z.string().trim().min(1).max(120),
  total_amount: z.number().positive().max(1_000_000),
  transaction_id: z.string().uuid().optional(),
  shares: z.array(z.object({ user_id: z.string().uuid(), share_pct: z.number().positive().max(100) })).min(2).max(12),
})

/** Divide un pago entre los miembros. La parte de quien lo registra queda como pagada. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Hogar inválido" }, { status: 400 })

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const parsed = BodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  const { description, total_amount, transaction_id, shares } = parsed.data

  const totalPct = shares.reduce((s, x) => s + x.share_pct, 0)
  if (Math.abs(totalPct - 100) > 0.01) return NextResponse.json({ error: "Los porcentajes deben sumar 100%" }, { status: 400 })
  if (new Set(shares.map((s) => s.user_id)).size !== shares.length) {
    return NextResponse.json({ error: "Cada persona puede aparecer una sola vez" }, { status: 400 })
  }

  const { data: members } = await supabase.rpc("get_household_members", { hid: id })
  const memberIds = new Set((members ?? []).map((m: { user_id: string }) => m.user_id))
  if (!memberIds.has(user.id) || shares.some((s) => !memberIds.has(s.user_id))) {
    return NextResponse.json({ error: "Todas las personas deben ser miembros del hogar" }, { status: 403 })
  }

  const amounts = splitAmounts(total_amount, shares.map((s) => s.share_pct))
  const now = new Date().toISOString()
  const { error } = await supabase.from("bill_splits").insert(
    shares.map((s, i) => ({
      household_id: id,
      transaction_id: transaction_id ?? null,
      created_by: user.id,
      description,
      total_amount,
      user_id: s.user_id,
      share_pct: s.share_pct,
      amount_owed: amounts[i],
      status: s.user_id === user.id ? "paid" : "pending",
      paid_at: s.user_id === user.id ? now : null,
    })),
  )
  if (error) return NextResponse.json({ error: "No se pudo dividir el pago" }, { status: 500 })
  return NextResponse.json({ ok: true })
}
