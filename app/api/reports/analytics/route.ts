import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function inferPaymentMethod(provider: string | null) {
  const normalizedProvider = (provider || "").toLowerCase()

  if (normalizedProvider.includes("oxxo")) {
    return "oxxo"
  }

  if (
    normalizedProvider.includes("bank") ||
    normalizedProvider.includes("transfer") ||
    normalizedProvider.includes("mx_bank_account")
  ) {
    return "bank_transfer"
  }

  return "card"
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

    const months = Math.max(
      1,
      Math.min(Number(req.nextUrl.searchParams.get("months") || "6"), 24)
    )
    const from = new Date()
    from.setMonth(from.getMonth() - months)

    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("id, amount, provider, service_type, status, transaction_date")
      .eq("user_id", user.id)
      .gte("transaction_date", from.toISOString())
      .order("transaction_date", { ascending: true })

    if (transactionsError) {
      throw new Error(transactionsError.message)
    }

    const { data: predictions, error: predictionsError } = await supabase
      .from("predictions")
      .select("service_type, predicted_amount, actual_amount, confidence_score")
      .eq("user_id", user.id)

    if (predictionsError) {
      throw new Error(predictionsError.message)
    }

    const monthlyTrend = Object.values(
      (transactions || []).reduce<Record<string, { month: string; total: number; count: number }>>(
        (accumulator, transaction) => {
          const date = new Date(transaction.transaction_date)
          const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
          const current = accumulator[month] || { month, total: 0, count: 0 }
          current.total += Number(transaction.amount || 0)
          current.count += 1
          accumulator[month] = current
          return accumulator
        },
        {}
      )
    )

    const paymentMethodDistribution = Object.entries(
      (transactions || []).reduce<Record<string, number>>((accumulator, transaction) => {
        const method = inferPaymentMethod(transaction.provider)
        accumulator[method] = (accumulator[method] || 0) + 1
        return accumulator
      }, {})
    ).map(([method, count]) => ({ method, count }))

    const serviceRanking = Object.values(
      (transactions || []).reduce<Record<string, { service: string; total: number; count: number }>>(
        (accumulator, transaction) => {
          const service = transaction.service_type || "otros"
          const current = accumulator[service] || { service, total: 0, count: 0 }
          current.total += Number(transaction.amount || 0)
          current.count += 1
          accumulator[service] = current
          return accumulator
        },
        {}
      )
    ).sort((left, right) => right.total - left.total)

    const predictionAccuracy =
      predictions && predictions.length > 0
        ? Number(
            (
              predictions.reduce((sum, prediction) => {
                if (prediction.actual_amount == null || Number(prediction.predicted_amount) === 0) {
                  return sum
                }

                const predicted = Number(prediction.predicted_amount)
                const actual = Number(prediction.actual_amount)
                const accuracy = 1 - Math.abs(actual - predicted) / predicted
                return sum + Math.max(accuracy, 0)
              }, 0) / predictions.length
            ).toFixed(2)
          )
        : null

    return NextResponse.json({
      windowMonths: months,
      monthlyTrend,
      paymentMethodDistribution,
      serviceRanking,
      predictionAccuracy,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: `No se pudo generar la analítica: ${errorMessage}` },
      { status: 500 }
    )
  }
}