import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { resolveBaseUrl } from "@/lib/app-url"
import { getOrCreateCustomer, getProfile, getStripe, saveCardFromSetupSession } from "@/lib/payments/autopay-stripe"

export const runtime = "nodejs"

async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/** Abre Stripe Checkout en modo "setup" para guardar una tarjeta sin cobrar nada. */
export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "Stripe no está configurado" }, { status: 503 })

  try {
    const stripe = getStripe()
    const admin = createAdminClient()
    const customer = await getOrCreateCustomer(stripe, admin, user)
    const base = resolveBaseUrl(req)
    const session = await stripe.checkout.sessions.create({
      mode: "setup",
      currency: "mxn",
      customer,
      payment_method_types: ["card"],
      metadata: { userId: user.id, purpose: "autopay" },
      setup_intent_data: { metadata: { userId: user.id } },
      success_url: `${base}/dashboard/programados?tarjeta=lista&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/dashboard/programados`,
    })
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("[autopay/card] POST:", error)
    return NextResponse.json({ error: "No se pudo abrir Stripe. Verifica que la migración de pagos automáticos esté aplicada." }, { status: 500 })
  }
}

/** Al volver de Stripe: confirma la sesión y guarda la tarjeta (el webhook hace lo mismo). */
export async function GET(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const sessionId = req.nextUrl.searchParams.get("session_id")
  if (!sessionId?.startsWith("cs_")) return NextResponse.json({ error: "Sesión inválida" }, { status: 400 })

  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["setup_intent"] })
    if (session.metadata?.userId !== user.id) return NextResponse.json({ error: "Sesión inválida" }, { status: 403 })
    const card = await saveCardFromSetupSession(stripe, createAdminClient(), session)
    if (!card) return NextResponse.json({ error: "No se pudo guardar la tarjeta" }, { status: 409 })
    return NextResponse.json({ ok: true, card })
  } catch (error) {
    console.error("[autopay/card] GET:", error)
    return NextResponse.json({ error: "No se pudo confirmar la tarjeta" }, { status: 500 })
  }
}

/** Quita la tarjeta guardada y pausa todos los pagos automáticos. */
export async function DELETE() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const admin = createAdminClient()
  const profile = await getProfile(admin, user.id)
  if (profile?.payment_method_id) {
    await getStripe().paymentMethods.detach(profile.payment_method_id).catch(() => undefined)
  }
  await admin
    .from("payment_profiles")
    .update({ payment_method_id: null, card_brand: null, card_last4: null, card_exp: null, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
  await admin.from("scheduled_payments").update({ active: false }).eq("user_id", user.id)
  return NextResponse.json({ ok: true })
}
