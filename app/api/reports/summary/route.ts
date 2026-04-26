import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function buildRange(searchParams: URLSearchParams) {
  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")
  const now = new Date()

  const from = fromParam
    ? new Date(fromParam)
    : new Date(now.getFullYear(), now.getMonth(), 1)
  const to = toParam
    ? new Date(toParam)
    : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  return { from, to }
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

    const { from, to } = buildRange(req.nextUrl.searchParams)

    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("id, service_type, amount, status, provider, transaction_date")
      .eq("user_id", user.id)
      .gte("transaction_date", from.toISOString())
      .lte("transaction_date", to.toISOString())
      .order("transaction_date", { ascending: false })

    if (transactionsError) {
      throw new Error(transactionsError.message)
    }

    const { data: pendingPayments, error: pendingError } = await supabase
      .from("pending_payments")
      .select("id, service_type, amount, status, payment_method, expires_at")
      .eq("user_id", user.id)
      .in("status", ["requires_action", "processing"])

    if (pendingError) {
      throw new Error(pendingError.message)
    }

    const totalPaid = (transactions || []).reduce(
      (sum, transaction) => sum + Number(transaction.amount || 0),
      0
    )

    const breakdownByService = Object.values(
      (transactions || []).reduce<Record<string, { service: string; total: number; count: number }>>(
        (accumulator, transaction) => {
          const key = transaction.service_type || "otros"
          const current = accumulator[key] || {
            service: key,
            total: 0,
            count: 0,
          }

          current.total += Number(transaction.amount || 0)
          current.count += 1
          accumulator[key] = current
          return accumulator
        },
        {}
      )
    ).sort((left, right) => right.total - left.total)

    const pendingTotal = (pendingPayments || []).reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    )

    return NextResponse.json({
      period: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
      totals: {
        totalPaid: Number(totalPaid.toFixed(2)),
        transactionCount: transactions?.length || 0,
        averageTicket:
          transactions?.length ? Number((totalPaid / transactions.length).toFixed(2)) : 0,
        pendingTotal: Number(pendingTotal.toFixed(2)),
        pendingCount: pendingPayments?.length || 0,
      },
      breakdownByService,
      recentTransactions: (transactions || []).slice(0, 10),
      pendingPayments: pendingPayments || [],
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: `No se pudo generar el resumen: ${errorMessage}` },
      { status: 500 }
    )
  }
}