import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

/** Marca una parte como pagada. RLS permite hacerlo a quien la debe o a quien dividió el pago. */
export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ splitId: string }> }) {
  const { splitId } = await params
  if (!z.string().uuid().safeParse(splitId).success) return NextResponse.json({ error: "Parte inválida" }, { status: 400 })

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data, error } = await supabase
    .from("bill_splits")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", splitId)
    .eq("status", "pending")
    .select("id")
  if (error || !data?.length) return NextResponse.json({ error: "No se pudo marcar como pagada" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
