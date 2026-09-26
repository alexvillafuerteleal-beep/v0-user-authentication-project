import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { computeUserForecasts } from "@/lib/forecast-service"
import { MODEL_VERSION, mape } from "@/lib/forecast"

/**
 * Pronóstico del próximo recibo por servicio (promedio ponderado con estacionalidad e
 * intervalo) y el error histórico del modelo (MAPE) sobre las predicciones ya cerradas.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const forecasts = await computeUserForecasts(supabase, user.id)
    const predictions = forecasts
      .filter((f) => f.forecast.method !== "sin-datos")
      .map((f) => ({
        service_type: f.service_type,
        provider: f.provider,
        billing_period: f.billing_period,
        predicted_amount: f.forecast.predicted,
        lower_bound: f.forecast.lower,
        upper_bound: f.forecast.upper,
        confidence_score: f.forecast.confidence,
        method: f.forecast.method,
        history_points: f.history.length,
        current_period: f.current,
      }))

    // Predicciones pasadas con monto real: sirven para medir qué tan bien pronostica el modelo.
    const { data: closed } = await supabase
      .from("predictions")
      .select("predicted_amount, actual_amount")
      .eq("user_id", user.id)
      .not("actual_amount", "is", null)

    return NextResponse.json({
      source: "modelo",
      model: MODEL_VERSION,
      predictions,
      summary: {
        totalPredictedSpend: Math.round(predictions.reduce((sum, p) => sum + p.predicted_amount, 0) * 100) / 100,
        averageConfidence: predictions.length
          ? Math.round((predictions.reduce((sum, p) => sum + p.confidence_score, 0) / predictions.length) * 100) / 100
          : 0,
        mapePercent: mape((closed ?? []).map((p) => ({ predicted: Number(p.predicted_amount), actual: Number(p.actual_amount) }))),
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: `No se pudieron obtener las predicciones: ${errorMessage}` }, { status: 500 })
  }
}
