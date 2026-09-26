/**
 * Pronóstico explicable del próximo recibo, sin librerías de ML:
 * promedio ponderado de los últimos 3 periodos, ajustado por el mismo periodo del
 * año anterior (estacionalidad), con un intervalo de ±1.5 desviaciones estándar de
 * los errores históricos. Pensado para poder explicarse frente al comité de residencia.
 */

export const MODEL_VERSION = "wma3-seasonal-v1"

export type PeriodAmount = { period: string; amount: number }

export type Forecast = {
  predicted: number
  lower: number
  upper: number
  /** 0–1, a partir del error porcentual medio en la historia. */
  confidence: number
  method: "sin-datos" | "promedio" | "ponderado" | "ponderado-estacional"
}

const WEIGHTS = [0.5, 0.3, 0.2] // del periodo más reciente al más antiguo

const round2 = (n: number) => Math.round(n * 100) / 100
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
const stdDev = (xs: number[]) => {
  if (xs.length < 2) return 0
  const m = mean(xs)
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1))
}

/** CFE factura por bimestre; el resto de los servicios, por mes. */
export function periodsPerYear(serviceType: string) {
  return serviceType === "electricity" ? 6 : 12
}

/** Clave del periodo de facturación: "2026-B5" (bimestre) o "2026-09" (mes). */
export function periodKey(serviceType: string, date: Date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  return periodsPerYear(serviceType) === 6 ? `${year}-B${Math.ceil(month / 2)}` : `${year}-${String(month).padStart(2, "0")}`
}

/** Suma pagos por periodo y los ordena del más viejo al más nuevo. */
export function groupByPeriod(serviceType: string, payments: { amount: number; date: string | Date }[]): PeriodAmount[] {
  const totals = new Map<string, number>()
  for (const p of payments) {
    const key = periodKey(serviceType, new Date(p.date))
    totals.set(key, (totals.get(key) ?? 0) + Number(p.amount || 0))
  }
  return [...totals.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([period, amount]) => ({ period, amount: round2(amount) }))
}

function weightedAverage(amounts: number[]) {
  const recent = amounts.slice(-3).reverse()
  const weights = WEIGHTS.slice(0, recent.length)
  const total = weights.reduce((a, b) => a + b, 0)
  return recent.reduce((sum, amount, i) => sum + amount * weights[i], 0) / total
}

/**
 * Pronostica el siguiente periodo. `perYear` es 12 para servicios mensuales y 6 para bimestrales.
 * La historia debe venir ordenada del periodo más viejo al más nuevo.
 */
export function forecastNext(history: PeriodAmount[], perYear = 12): Forecast {
  const amounts = history.map((h) => h.amount).filter((a) => Number.isFinite(a))
  if (amounts.length === 0) return { predicted: 0, lower: 0, upper: 0, confidence: 0, method: "sin-datos" }

  if (amounts.length < 3) {
    const predicted = mean(amounts)
    return { predicted: round2(predicted), lower: round2(predicted * 0.8), upper: round2(predicted * 1.2), confidence: 0.4, method: "promedio" }
  }

  let predicted = weightedAverage(amounts)
  let method: Forecast["method"] = "ponderado"

  // Estacionalidad: cómo se comparó el mismo periodo del año pasado con los 3 anteriores a él.
  const sameLastYear = amounts.length - perYear
  if (sameLastYear >= 3) {
    const baseline = weightedAverage(amounts.slice(0, sameLastYear))
    if (baseline > 0) {
      predicted *= clamp(amounts[sameLastYear] / baseline, 0.7, 1.5)
      method = "ponderado-estacional"
    }
  }

  // Errores de un paso hacia adelante sobre la historia (backtest).
  const errors: number[] = []
  const pctErrors: number[] = []
  for (let i = 3; i < amounts.length; i++) {
    const guess = weightedAverage(amounts.slice(0, i))
    errors.push(amounts[i] - guess)
    if (amounts[i] > 0) pctErrors.push(Math.abs(amounts[i] - guess) / amounts[i])
  }
  const spread = Math.max(stdDev(errors) * 1.5, predicted * 0.05)
  const confidence = pctErrors.length > 0 ? clamp(1 - mean(pctErrors), 0.3, 0.95) : 0.5

  return {
    predicted: round2(predicted),
    lower: round2(Math.max(0, predicted - spread)),
    upper: round2(predicted + spread),
    confidence: round2(confidence),
    method,
  }
}

export type Anomaly = { isAnomaly: boolean; changePct: number; zScore: number }

/** Un recibo es anómalo si cae fuera del intervalo pronosticado o si su puntaje z pasa de 2. */
export function detectAnomaly(history: PeriodAmount[], actual: number, forecast = forecastNext(history)): Anomaly {
  const amounts = history.map((h) => h.amount)
  const sd = stdDev(amounts)
  const zScore = sd > 0 ? (actual - mean(amounts)) / sd : 0
  const reference = forecast.predicted || mean(amounts) || 0
  const changePct = reference > 0 ? round2(((actual - reference) / reference) * 100) : 0
  const outside = forecast.method !== "sin-datos" && (actual < forecast.lower || actual > forecast.upper)
  return { isAnomaly: amounts.length >= 3 && (outside || Math.abs(zScore) > 2), changePct, zScore: round2(zScore) }
}

/** Error porcentual absoluto medio entre pronósticos y montos reales, en porcentaje. */
export function mape(pairs: { predicted: number; actual: number }[]) {
  const valid = pairs.filter((p) => p.actual > 0)
  if (valid.length === 0) return null
  return round2((mean(valid.map((p) => Math.abs(p.actual - p.predicted) / p.actual)) * 100))
}
