import { randomInt } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

// Sin 0/O ni 1/I para que el código se pueda dictar sin confusiones.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const newCode = () => Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("")

/** Genera un código de invitación de 8 caracteres, vigente 7 días. Solo el dueño del hogar. */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Hogar inválido" }, { status: 400 })

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const code = newCode()
  const { error } = await supabase.from("household_invites").insert({ code, household_id: id, created_by: user.id })
  if (error) return NextResponse.json({ error: "Solo quien creó el hogar puede invitar" }, { status: 403 })
  return NextResponse.json({ code, expiresInDays: 7 })
}
