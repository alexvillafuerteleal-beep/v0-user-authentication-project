import Stripe from "stripe"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAlertAndPush } from "@/lib/notifications/push"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "")

const refundSchema = z.object({
  transactionId: z.string().uuid().optional(),
  paymentIntentId: z.string().min(3).optional(),
  amount: z.number().positive().optional(),
  reason: z
    .enum(["duplicate", "fraudulent", "requested_by_customer"])
    .default("requested_by_customer"),
  notes: z.string().trim().max(500).optional(),
})

function normalizeAmount(requestedAmount: number | undefined, originalAmount: number) {
  if (requestedAmount === undefined) {
    return Number(originalAmount.toFixed(2))
  }

  if (requestedAmount > originalAmount) {
    throw new Error("El monto del reembolso no puede exceder el monto original")
  }

  return Number(requestedAmount.toFixed(2))
}

async function resolvePaymentIntentId(receiptNumber: string) {
  if (receiptNumber.startsWith("pi_")) {
    return receiptNumber
  }

  if (receiptNumber.startsWith("cs_")) {
    const session = await stripe.checkout.sessions.retrieve(receiptNumber)

    if (!session.payment_intent) {
      throw new Error("No se encontró el payment intent asociado a la sesión de checkout")
    }

    return typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent.id
  }

  throw new Error("No se pudo resolver el payment intent para la transacción indicada")
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const refundId = req.nextUrl.searchParams.get("refundId")
    const transactionId = req.nextUrl.searchParams.get("transactionId")

    if (!refundId && !transactionId) {
      return NextResponse.json(
        { error: "Se requiere refundId o transactionId" },
        { status: 400 }
      )
    }

    let query = supabase.from("refunds").select("*").eq("user_id", user.id)

    if (refundId) {
      query = query.eq("id", refundId)
    }

    if (transactionId) {
      query = query.eq("transaction_id", transactionId)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({
      refunds: data || [],
      count: data?.length || 0,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: `No se pudo obtener la información del reembolso: ${errorMessage}` },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsedBody = refundSchema.safeParse(body)

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.flatten() },
        { status: 400 }
      )
    }

    const { transactionId, paymentIntentId, amount, reason, notes } = parsedBody.data

    let transactionQuery = supabase
      .from("transactions")
      .select("id, user_id, amount, status, service_type, provider, receipt_number")
      .eq("user_id", user.id)
      .eq("status", "completed")

    if (transactionId) {
      transactionQuery = transactionQuery.eq("id", transactionId)
    } else if (paymentIntentId) {
      transactionQuery = transactionQuery.eq("receipt_number", paymentIntentId)
    }

    const { data: transaction, error: transactionError } = await transactionQuery.maybeSingle()

    if (transactionError) {
      throw new Error(transactionError.message)
    }

    if (!transaction) {
      return NextResponse.json(
        { error: "No se encontró una transacción elegible para reembolso" },
        { status: 404 }
      )
    }

    const resolvedPaymentIntentId =
      paymentIntentId || (await resolvePaymentIntentId(transaction.receipt_number))
    const normalizedRefundAmount = normalizeAmount(amount, Number(transaction.amount))

    const stripeRefund = await stripe.refunds.create({
      payment_intent: resolvedPaymentIntentId,
      amount: Math.round(normalizedRefundAmount * 100),
      reason,
      metadata: {
        userId: user.id,
        transactionId: transaction.id,
        notes: notes || "",
      },
    })

    const { data: refundRecord, error: refundInsertError } = await supabase
      .from("refunds")
      .insert({
        user_id: user.id,
        transaction_id: transaction.id,
        stripe_refund_id: stripeRefund.id,
        stripe_payment_intent_id: resolvedPaymentIntentId,
        amount: normalizedRefundAmount,
        currency: stripeRefund.currency || "mxn",
        reason,
        status: stripeRefund.status || "pending",
        metadata: {
          notes: notes || null,
          receiptNumber: transaction.receipt_number,
          provider: transaction.provider,
          serviceType: transaction.service_type,
        },
      })
      .select()
      .single()

    if (refundInsertError) {
      throw new Error(refundInsertError.message)
    }

    await createAlertAndPush({
      userId: user.id,
      title: "Reembolso solicitado",
      message: `Se solicitó un reembolso por $${normalizedRefundAmount.toFixed(2)} MXN para ${transaction.service_type}. Stripe lo está procesando con estado ${stripeRefund.status || "pending"}.`,
      alertType: "info",
      url: "/dashboard/notificaciones",
      tag: `refund-${stripeRefund.id}`,
      supabaseClient: supabase,
    })

    return NextResponse.json({
      success: true,
      refund: refundRecord,
      stripeRefundId: stripeRefund.id,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: `No se pudo procesar el reembolso: ${errorMessage}` },
      { status: 500 }
    )
  }
}