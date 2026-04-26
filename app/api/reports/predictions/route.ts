import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: storedPredictions, error: predictionsError } = await supabase
      .from("predictions")
      .select("service_type, predicted_amount, actual_amount, confidence_score, month_year, prediction_date")
      .eq("user_id", user.id)
      .order("prediction_date", { ascending: false })

    if (predictionsError) {
      throw new Error(predictionsError.message)
    }

    if (storedPredictions && storedPredictions.length > 0) {
      const totalPredictedSpend = storedPredictions.reduce(
        (sum, prediction) => sum + Number(prediction.predicted_amount || 0),
        0
      )

      return NextResponse.json({
        source: "database",
        predictions: storedPredictions,
        summary: {
          totalPredictedSpend: Number(totalPredictedSpend.toFixed(2)),
          averageConfidence: Number(
            (
              storedPredictions.reduce(
                (sum, prediction) => sum + Number(prediction.confidence_score || 0),
                0
              ) / storedPredictions.length
            ).toFixed(2)
          ),
        },
      })
    }

    const { data: userServices, error: servicesError } = await supabase
      .from("user_services")
      .select("service_type, provider, last_amount")
      .eq("user_id", user.id)
      .eq("status", "active")

    if (servicesError) {
      throw new Error(servicesError.message)
    }

    const monthYear = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      1
    )
      .toISOString()
      .slice(0, 7)

    const generatedPredictions = (userServices || []).map((service) => ({
      service_type: service.service_type,
      provider: service.provider,
      predicted_amount: Number(Number(service.last_amount || 0).toFixed(2)),
      actual_amount: null,
      confidence_score: 0.65,
      month_year: monthYear,
      source: "fallback",
    }))

    return NextResponse.json({
      source: "fallback",
      predictions: generatedPredictions,
      summary: {
        totalPredictedSpend: Number(
          generatedPredictions
            .reduce((sum, prediction) => sum + Number(prediction.predicted_amount), 0)
            .toFixed(2)
        ),
        averageConfidence: generatedPredictions.length ? 0.65 : 0,
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: `No se pudieron obtener las predicciones: ${errorMessage}` },
      { status: 500 }
    )
  }
}