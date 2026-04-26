import { NextRequest, NextResponse } from "next/server"
import { generateVoucher } from "@/lib/pdf/voucher-generator"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  const { transactionId } = await params
  const authHeader = req.headers.get("authorization")

  // Verify user is authenticated
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    const supabase = createAdminClient()

    // Get transaction details
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .select(
        `
        id,
        user_id,
        amount,
        status,
        provider,
        receipt_number,
        transaction_date,
        service_type
      `
      )
      .eq("id", transactionId)
      .single()

    if (txError || !transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      )
    }

    // Get user details
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", transaction.user_id)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      )
    }

    // Generate PDF
    const pdf = await generateVoucher({
      userId: transaction.user_id,
      userName: profile.full_name || "Usuario",
      transactionId: transaction.id,
      amount: transaction.amount,
      service: transaction.service_type || "Servicio General",
      paymentMethod: transaction.provider || "Stripe",
      date: new Date(transaction.transaction_date),
      reference: transaction.receipt_number,
    })

    // Return PDF
    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="comprobante-${transactionId}.pdf"`,
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Error generating voucher:", errorMessage)
    return NextResponse.json(
      { error: "Failed to generate voucher" },
      { status: 500 }
    )
  }
}
