import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { SERVICE_TYPES } from "@/lib/ai/receipt"

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

const BodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("confirm"),
    fields: z.object({
      provider: z.string().min(1).max(80),
      service_type: z.enum(SERVICE_TYPES),
      amount: z.number().positive().max(1_000_000),
      due_date: isoDate.nullable(),
      period_start: isoDate.nullable().optional(),
      period_end: isoDate.nullable().optional(),
      consumption: z.number().nonnegative().nullable().optional(),
    }),
  }),
  z.object({ action: z.literal("reject") }),
])

/** Confirma (con las correcciones del usuario) o descarta un recibo escaneado. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Recibo inválido" }, { status: 400 })

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const parsed = BodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.issues }, { status: 400 })

  const { data: receipt } = await supabase.from("receipts").select("id, status").eq("id", id).eq("user_id", user.id).maybeSingle()
  if (!receipt) return NextResponse.json({ error: "Recibo no encontrado" }, { status: 404 })
  if (receipt.status !== "pending_review") return NextResponse.json({ error: "Este recibo ya se revisó" }, { status: 409 })

  if (parsed.data.action === "reject") {
    await supabase.from("receipts").update({ status: "rejected" }).eq("id", id).eq("user_id", user.id)
    return NextResponse.json({ ok: true })
  }

  const f = parsed.data.fields
  const { error: updateError } = await supabase
    .from("receipts")
    .update({ ...f, status: "confirmed", confirmed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
  if (updateError) return NextResponse.json({ error: "No se pudo confirmar el recibo" }, { status: 500 })

  const { data: pending, error: pendingError } = await supabase
    .from("pending_payments")
    .insert({ user_id: user.id, service_type: f.service_type, provider: f.provider, amount: f.amount, due_date: f.due_date })
    .select("id")
    .single()
  if (pendingError) return NextResponse.json({ error: "El recibo se guardó, pero no se pudo crear el pago pendiente" }, { status: 500 })

  return NextResponse.json({ ok: true, pendingPaymentId: pending.id })
}
