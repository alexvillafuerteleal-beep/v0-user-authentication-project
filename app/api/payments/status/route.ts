import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "")

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Obtener el paymentIntentId del query param
    const paymentIntentId = req.nextUrl.searchParams.get("paymentIntentId")

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "paymentIntentId query parameter is required" },
        { status: 400 }
      )
    }

    // Obtener registro del pago pendiente
    const { data: pendingPayment, error: dbError } = await supabase
      .from("pending_payments")
      .select("*")
      .eq("stripe_payment_intent_id", paymentIntentId)
      .eq("user_id", user.id)
      .single()

    if (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      )
    }

    // Obtener estado actual del Payment Intent desde Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    // Construir respuesta con información combinada
    const response = {
      id: pendingPayment.id,
      status: paymentIntent.status, // 'requires_action', 'processing', 'succeeded', 'requires_payment_method', 'canceled'
      amount: pendingPayment.amount,
      currency: "mxn",
      service: pendingPayment.service_type,
      paymentMethod: pendingPayment.payment_method,
      createdAt: pendingPayment.created_at,
      expiresAt: pendingPayment.expires_at,
      completedAt: pendingPayment.completed_at,

      // Información específica de OXXO
      ...(pendingPayment.payment_method === "oxxo" && {
        oxxo: {
          expiresAt: pendingPayment.oxxo_expires_at,
          instructions: "Ve a tu tienda OXXO más cercana y realiza el pago",
          referenceNumber: pendingPayment.oxxo_reference_number || null,
        },
      }),

      // Información específica de Transferencia Bancaria
      ...(pendingPayment.payment_method === "bank_transfer" && {
        bankTransfer: {
          expiresAt: pendingPayment.bank_transfer_expires_at,
          instructions: "Realiza una transferencia bancaria al número de cuenta proporcionado",
          accountLast4: pendingPayment.bank_account_last4,
        },
      }),

      // Información de error si aplica
      ...(paymentIntent.last_payment_error && {
        error: {
          message: paymentIntent.last_payment_error.message,
          code: paymentIntent.last_payment_error.code,
          type: paymentIntent.last_payment_error.type,
        },
      }),
    }

    return NextResponse.json(response)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Error retrieving payment status:", errorMessage)
    return NextResponse.json(
      { error: `Failed to retrieve payment status: ${errorMessage}` },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("[API] POST /api/payments/status - Starting")
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.warn("[API] No authenticated user found")
      return NextResponse.json(
        { count: 0, payments: [], error: "Not authenticated" },
        { status: 200 } // Retornar 200 con lista vacía en lugar de 401
      )
    }

    console.log(`[API] Fetching payments for user: ${user.id}`)

    // Obtener todos los pagos pendientes del usuario
    const { data: pendingPayments, error: dbError } = await supabase
      .from("pending_payments")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["requires_action", "processing"])
      .order("created_at", { ascending: false })

    if (dbError) {
      console.warn("[API] Database query error:", dbError.message)
      // Si la tabla no existe aún, retornar lista vacía
      if (dbError.code === "42P01") {
        console.log("[API] Table pending_payments does not exist yet")
        return NextResponse.json({ count: 0, payments: [] })
      }
      return NextResponse.json(
        { count: 0, payments: [], error: dbError.message },
        { status: 200 }
      )
    }

    console.log(`[API] Found ${pendingPayments?.length || 0} pending payments`)

    // Si no hay pagos, retornar json vacío
    if (!pendingPayments || pendingPayments.length === 0) {
      return NextResponse.json({ count: 0, payments: [] })
    }

    // Enriquecer con información de Stripe
    const enrichedPayments = await Promise.all(
      pendingPayments.map(async (payment) => {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(
            payment.stripe_payment_intent_id
          )

          return {
            id: payment.id,
            paymentIntentId: payment.stripe_payment_intent_id,
            status: paymentIntent.status,
            amount: payment.amount,
            service: payment.service_type,
            paymentMethod: payment.payment_method,
            createdAt: payment.created_at,
            expiresAt: payment.expires_at,
          }
        } catch (stripeError) {
          console.warn(
            `[API] Error retrieving Stripe payment intent ${payment.stripe_payment_intent_id}:`,
            stripeError instanceof Error ? stripeError.message : String(stripeError)
          )
          // Retornar el pago sin datos de Stripe
          return {
            id: payment.id,
            paymentIntentId: payment.stripe_payment_intent_id,
            status: payment.status,
            amount: payment.amount,
            service: payment.service_type,
            paymentMethod: payment.payment_method,
            createdAt: payment.created_at,
            expiresAt: payment.expires_at,
          }
        }
      })
    )

    // Filtrar nulls (no debería haber, pero por seguridad)
    const validPayments = enrichedPayments.filter(Boolean)

    console.log(`[API] Returning ${validPayments.length} payments`)
    return NextResponse.json({
      count: validPayments.length,
      payments: validPayments,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("[API] Unexpected error retrieving pending payments:", errorMessage)
    return NextResponse.json(
      { count: 0, payments: [], error: errorMessage },
      { status: 200 } // Retornar 200 con fallback en lugar de 500
    )
  }
}
