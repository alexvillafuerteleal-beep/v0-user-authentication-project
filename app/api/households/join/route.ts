import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

/** Canjea un código de invitación. La validación ocurre en la función SQL join_household. */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const parsed = z.object({ code: z.string().trim().min(6).max(12) }).safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Código inválido" }, { status: 400 })

  const { data, error } = await supabase.rpc("join_household", { invite_code: parsed.data.code })
  if (error) return NextResponse.json({ error: "El código no existe o ya venció" }, { status: 400 })
  return NextResponse.json({ householdId: data })
}
