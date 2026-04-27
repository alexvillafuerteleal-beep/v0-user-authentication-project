import Stripe from "stripe"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "")

export async function POST(req: NextRequest) {
  try {
    console.log("[API] POST /api/stripe/create-checkout-session - Starting")
    
    const { amount, service, serviceId, provider, serviceType } = await req.json()

    console.log(`[API] Payment request: service=${service}, provider=${provider}, amount=${amount}`)

    if (!amount || !service || !serviceId) {
      console.warn("[API] Missing required fields")
      return NextResponse.json(
        { error: "Missing required fields: amount, service, serviceId" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.warn("[API] No authenticated user found")
      return NextResponse.json(
        { error: "You must be logged in to make payments" },
        { status: 401 }
      )
    }

    console.log(`[API] Processing card payment for user: ${user.id}`)

    // Resolver base URL para permitir despliegue en cualquier hosting/dominio.
    const forwardedProto = req.headers.get("x-forwarded-proto")
    const forwardedHost = req.headers.get("x-forwarded-host")
    const requestOrigin = req.nextUrl.origin
    const resolvedBaseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (forwardedHost
        ? `${forwardedProto || "https"}://${forwardedHost}`
        : requestOrigin)

    // Crear sesión de checkout con Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "mxn",
            product_data: {
              name: provider ? `Pago de ${service} — ${provider}` : `Pago de ${service}`,
              description: provider
                ? `Servicio: ${service} | Proveedor: ${provider} | Monto: $${amount} MXN`
                : `Pago de servicio de ${service} por $${amount} MXN`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${resolvedBaseUrl}/dashboard/servicios?payment=success&service=${encodeURIComponent(service)}&provider=${encodeURIComponent(provider || "")}&serviceId=${serviceId}`,
      cancel_url: `${resolvedBaseUrl}/dashboard/servicios?payment=cancelled`,
      metadata: {
        userId: user.id,
        serviceId: serviceId,
        serviceType: serviceType || serviceId,
        service: service,
        provider: provider || "Desconocido",
        amount: amount.toString(),
      },
    })

    console.log(`[API] Checkout session created: ${session.id}`)

    return NextResponse.json({
      sessionId: session.id,
      clientSecret: session.client_secret,
      url: session.url,
      status: "success",
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
    console.error("[API] Unexpected error:", errorMessage)
    console.error("[API] Full error object:", error)
    return NextResponse.json(
      { error: `Failed to create checkout session: ${errorMessage}` },
      { status: 500 }
    )
  }
}
