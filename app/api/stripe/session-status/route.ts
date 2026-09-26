import Stripe from "stripe"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "")

/**
 * Estado de una sesión de Checkout al volver de Stripe. Con OXXO la sesión regresa
 * como "unpaid": la ficha se generó pero el pago todavía no llega.
 */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id")
  if (!sessionId || !sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "session_id inválido" }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.metadata?.userId !== user.id) {
      return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 })
    }
    return NextResponse.json({ paymentStatus: session.payment_status })
  } catch {
    return NextResponse.json({ error: "No se pudo consultar la sesión" }, { status: 502 })
  }
}
