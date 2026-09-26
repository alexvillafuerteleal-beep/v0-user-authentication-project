import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const PutSchema = z.object({
  user_service_id: z.string().uuid(),
  channels: z.array(z.enum(["push", "email"])).max(2),
  days_before: z.number().int().min(0).max(15),
})

async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function GET() {
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { data, error } = await supabase.from("reminders").select("user_service_id, channel, days_before").eq("user_id", user.id)
  if (error) return NextResponse.json({ error: "No se pudieron leer los recordatorios" }, { status: 500 })
  return NextResponse.json({ reminders: data ?? [], emailEnabled: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM) })
}

/** Reemplaza los recordatorios de un servicio. Sin canales, los desactiva. */
export async function PUT(req: NextRequest) {
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const parsed = PutSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  const { user_service_id, channels, days_before } = parsed.data

  const { data: service } = await supabase.from("user_services").select("id").eq("id", user_service_id).eq("user_id", user.id).maybeSingle()
  if (!service) return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 })

  await supabase.from("reminders").delete().eq("user_id", user.id).eq("user_service_id", user_service_id)
  if (channels.length > 0) {
    const { error } = await supabase
      .from("reminders")
      .insert(channels.map((channel) => ({ user_id: user.id, user_service_id, channel, days_before })))
    if (error) return NextResponse.json({ error: "No se pudieron guardar los recordatorios" }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
