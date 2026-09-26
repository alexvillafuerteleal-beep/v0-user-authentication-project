import Stripe from "stripe"
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Operaciones de Stripe para pagos automáticos. Todas reciben el cliente admin de Supabase
 * porque payment_profiles solo se escribe desde el servidor.
 */

export function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || "")
}

export type PaymentProfile = {
  user_id: string
  stripe_customer_id: string
  payment_method_id: string | null
  card_brand: string | null
  card_last4: string | null
  card_exp: string | null
}

export async function getProfile(admin: SupabaseClient, userId: string) {
  const { data } = await admin.from("payment_profiles").select("*").eq("user_id", userId).maybeSingle()
  return (data as PaymentProfile | null) ?? null
}

/** Devuelve el cliente de Stripe del usuario; lo crea la primera vez. */
export async function getOrCreateCustomer(stripe: Stripe, admin: SupabaseClient, user: { id: string; email?: string | null }) {
  const existing = await getProfile(admin, user.id)
  if (existing) return existing.stripe_customer_id

  const customer = await stripe.customers.create({ email: user.email ?? undefined, metadata: { userId: user.id } })
  const { error } = await admin.from("payment_profiles").insert({ user_id: user.id, stripe_customer_id: customer.id })
  if (error) {
    // Otra petición lo creó al mismo tiempo: se usa el que quedó guardado.
    const again = await getProfile(admin, user.id)
    if (again) return again.stripe_customer_id
    throw error
  }
  return customer.id
}

/**
 * Guarda la tarjeta de una sesión de Checkout en modo "setup". Se llama al volver de Stripe
 * y desde el webhook; es idempotente. Devuelve null si la sesión no es de este usuario.
 */
export async function saveCardFromSetupSession(stripe: Stripe, admin: SupabaseClient, session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  if (session.mode !== "setup" || session.status !== "complete" || !userId) return null

  const profile = await getProfile(admin, userId)
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id
  if (!profile || profile.stripe_customer_id !== customerId) return null

  const setupIntent =
    typeof session.setup_intent === "string" ? await stripe.setupIntents.retrieve(session.setup_intent) : session.setup_intent
  const pmId = typeof setupIntent?.payment_method === "string" ? setupIntent.payment_method : setupIntent?.payment_method?.id
  if (!pmId) return null
  if (profile.payment_method_id === pmId) return { brand: profile.card_brand, last4: profile.card_last4 }

  const pm = await stripe.paymentMethods.retrieve(pmId)
  const card = pm.card
  await admin
    .from("payment_profiles")
    .update({
      payment_method_id: pmId,
      card_brand: card?.brand ?? null,
      card_last4: card?.last4 ?? null,
      card_exp: card ? `${String(card.exp_month).padStart(2, "0")}/${String(card.exp_year).slice(-2)}` : null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)

  // Solo se conserva una tarjeta por usuario.
  if (profile.payment_method_id) {
    await stripe.paymentMethods.detach(profile.payment_method_id).catch(() => undefined)
  }
  return { brand: card?.brand ?? null, last4: card?.last4 ?? null }
}

export type ChargeResult =
  | { status: "succeeded" | "processing"; paymentIntentId: string }
  | { status: "failed"; paymentIntentId: string | null; reason: string }

/** Cobra un recibo sin que el usuario esté presente. La llave de idempotencia evita cobrar dos veces. */
export async function chargeOffSession(
  stripe: Stripe,
  profile: PaymentProfile,
  charge: { pendingPaymentId: string; amount: number; description: string; serviceType: string },
): Promise<ChargeResult> {
  try {
    const pi = await stripe.paymentIntents.create(
      {
        amount: Math.round(charge.amount * 100),
        currency: "mxn",
        customer: profile.stripe_customer_id,
        payment_method: profile.payment_method_id!,
        off_session: true,
        confirm: true,
        description: charge.description,
        metadata: {
          userId: profile.user_id,
          pendingPaymentId: charge.pendingPaymentId,
          serviceType: charge.serviceType,
          autopay: "true",
        },
      },
      { idempotencyKey: `autopay-${charge.pendingPaymentId}` },
    )
    if (pi.status === "succeeded") return { status: "succeeded", paymentIntentId: pi.id }
    if (pi.status === "processing") return { status: "processing", paymentIntentId: pi.id }
    return { status: "failed", paymentIntentId: pi.id, reason: `Estado inesperado: ${pi.status}` }
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      const reason =
        error.code === "authentication_required"
          ? "Tu banco pidió confirmar el cargo. Paga este recibo desde la app."
          : error.code === "card_declined" || error.type === "StripeCardError"
            ? "Tu banco rechazó el cargo. Revisa tu saldo o cambia de tarjeta."
            : "No se pudo procesar el cargo."
      return { status: "failed", paymentIntentId: error.payment_intent?.id ?? null, reason }
    }
    throw error
  }
}
