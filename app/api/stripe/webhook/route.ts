import Stripe from "stripe"
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createAlertAndPush } from "@/lib/notifications/push"
import { saveCardFromSetupSession } from "@/lib/payments/autopay-stripe"

function getWebhookRuntime() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

  if (!stripeSecretKey || !webhookSecret) {
    return {
      error: "Stripe webhook no configurado todavía.",
    } as const
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      error: "Supabase admin no configurado todavía.",
    } as const
  }

  return {
    stripe: new Stripe(stripeSecretKey),
    webhookSecret,
  } as const
}

export async function POST(req: NextRequest) {
  const runtime = getWebhookRuntime()

  if ("error" in runtime) {
    return NextResponse.json({ error: runtime.error }, { status: 503 })
  }

  const body = await req.text()
  const signature = req.headers.get("stripe-signature") || ""

  let event: Stripe.Event

  try {
    event = runtime.stripe.webhooks.constructEvent(
      body,
      signature,
      runtime.webhookSecret
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Webhook signature verification failed:", errorMessage)
    return NextResponse.json(
      { error: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    )
  }

  console.log(`Processing webhook event: ${event.type}`)

  try {
    // Pagos por tarjeta completados
    if (event.type === "checkout.session.completed") {
      await handleCheckoutSessionCompleted(event, runtime.stripe)
    }

    // OXXO: la ficha se paga después; Stripe avisa si se pagó o si venció.
    if (event.type === "checkout.session.async_payment_succeeded") {
      await handleAsyncPayment(event, true)
    }
    if (event.type === "checkout.session.async_payment_failed") {
      await handleAsyncPayment(event, false)
    }

    // Chargebacks/Disputas
    if (event.type === "charge.dispute.created") {
      await handleChargeDispute(event, runtime.stripe)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Error processing webhook:", errorMessage)
    // No retornar error para evitar reintentos infinitos de Stripe
  }

  return NextResponse.json({ received: true })
}

/**
 * Maneja finalización de sesión de checkout (pagos por tarjeta)
 */
async function handleCheckoutSessionCompleted(event: Stripe.Event, stripe: Stripe) {
  const session = event.data.object as Stripe.Checkout.Session

  // Tarjeta guardada para pagos automáticos: no hay cobro que registrar.
  if (session.mode === "setup") {
    await saveCardFromSetupSession(stripe, createAdminClient(), session)
    return
  }

  try {
    const supabase = createAdminClient()

    const userId = session.metadata?.userId
    const serviceId = session.metadata?.serviceId
    const serviceType = session.metadata?.serviceType || serviceId
    const serviceName = session.metadata?.service
    const provider = session.metadata?.provider || "Stripe"
    const amount = parseFloat(session.metadata?.amount || "0")

    if (!userId) {
      console.error("User ID not found in session metadata")
      return
    }

    // Con OXXO la sesión se completa al generar la ficha, pero el pago llega después.
    // receipt_number guarda el id de la sesión para cerrar la transacción en handleAsyncPayment.
    if (session.payment_status === "unpaid") {
      const { error: pendingError } = await supabase.from("transactions").insert({
        user_id: userId,
        service_type: serviceType,
        amount: amount,
        status: "pending",
        provider: provider,
        receipt_number: session.id,
        transaction_date: new Date().toISOString(),
      })
      if (pendingError) console.error("Pending OXXO transaction insert error:", pendingError)
      await createAlertAndPush({
        userId,
        title: `Ficha OXXO lista: ${serviceName}`,
        message: `Paga $${amount.toFixed(2)} MXN en cualquier OXXO en los próximos 3 días. Te avisaremos cuando se confirme el pago.`,
        alertType: "warning",
        url: "/dashboard/historial",
        tag: `oxxo-voucher-${session.id}`,
      })
      return
    }

    // Registrar transacción completada con el proveedor real
    const { error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        service_type: serviceType,
        amount: amount,
        status: "completed",
        provider: provider,
        receipt_number: session.id,
        transaction_date: new Date().toISOString(),
      })

    if (txError) {
      console.error("Transaction insert error:", txError)
      return
    }

    // Marcar el servicio como pagado en user_services (si existe en DB)
    if (serviceId && !serviceId.includes("-default")) {
      await supabase
        .from("user_services")
        .update({ status: "paid" })
        .eq("id", serviceId)
        .eq("user_id", userId)
    }

    await createAlertAndPush({
      userId,
      title: `✅ Pago de ${serviceName} completado`,
      message: `Se procesó un pago de $${amount.toFixed(2)} MXN a ${provider}. Transacción: ${session.id.slice(-8).toUpperCase()}. Descarga tu comprobante desde Historial.`,
      alertType: "success",
      url: `/dashboard/servicios?payment=success&service=${encodeURIComponent(serviceName ?? serviceId ?? "")}`,
      tag: `payment-completed-${session.id}`,
    })

    console.log(`Payment completed for user ${userId}: ${serviceName} (${provider}) - $${amount} MXN`)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Error processing checkout completion:", errorMessage)
  }
}

/**
 * Resultado de un pago asíncrono (ficha OXXO pagada o vencida).
 */
async function handleAsyncPayment(event: Stripe.Event, succeeded: boolean) {
  const session = event.data.object as Stripe.Checkout.Session
  const userId = session.metadata?.userId
  if (!userId) return

  const supabase = createAdminClient()
  const serviceId = session.metadata?.serviceId
  const serviceName = session.metadata?.service ?? "tu servicio"
  const amount = parseFloat(session.metadata?.amount || "0")

  await supabase
    .from("transactions")
    .update({ status: succeeded ? "completed" : "failed" })
    .eq("receipt_number", session.id)
    .eq("user_id", userId)

  if (succeeded && serviceId && !serviceId.includes("-default")) {
    await supabase.from("user_services").update({ status: "paid" }).eq("id", serviceId).eq("user_id", userId)
  }

  await createAlertAndPush({
    userId,
    title: succeeded ? `✅ Pago de ${serviceName} confirmado` : `La ficha OXXO de ${serviceName} venció`,
    message: succeeded
      ? `OXXO confirmó tu pago de $${amount.toFixed(2)} MXN. Descarga tu comprobante desde Historial.`
      : `No se registró el pago de $${amount.toFixed(2)} MXN. Puedes generar una ficha nueva desde Mis Pagos.`,
    alertType: succeeded ? "success" : "error",
    url: succeeded ? "/dashboard/historial" : "/dashboard/servicios",
    tag: `oxxo-${succeeded ? "paid" : "expired"}-${session.id}`,
  })
}

/**
 * Maneja disputas/chargebacks (cliente disputa el cargo)
 */
async function handleChargeDispute(event: Stripe.Event, stripe: Stripe) {
  const dispute = event.data.object as Stripe.Dispute

  try {
    const supabase = createAdminClient()

    // Obtener información del charge
    const charge = await stripe.charges.retrieve(dispute.charge as string)
    const userId = charge.metadata?.userId

    if (!userId) {
      console.error("User ID not found in charge metadata")
      return
    }

    await createAlertAndPush({
      userId,
      title: "Disputa de pago",
      message: `Se ha reportado una disputa para el cargo ${dispute.charge}. El monto en disputa es $${(dispute.amount / 100).toFixed(2)} MXN. Revisaremos el caso dentro de 7-10 días hábiles.`,
      alertType: "error",
      url: "/dashboard/notificaciones",
      tag: `dispute-${dispute.id}`,
    })

    console.log(`Dispute created for user ${userId}: ${dispute.id}`)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Error processing dispute:", errorMessage)
  }
}
