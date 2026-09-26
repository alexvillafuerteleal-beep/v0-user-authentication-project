import type { SupabaseClient } from "@supabase/supabase-js"
import { detectAnomaly, forecastNext, groupByPeriod, periodKey, periodsPerYear, type Anomaly, type Forecast, type PeriodAmount } from "@/lib/forecast"

export type ServiceForecast = {
  service_type: string
  provider: string | null
  /** Periodo que se pronostica (el siguiente al actual). */
  billing_period: string
  forecast: Forecast
  history: PeriodAmount[]
  /** Comparación del periodo actual contra su historia previa, si ya hay pagos este periodo. */
  current: { period: string; amount: number; anomaly: Anomaly } | null
}

type Tx = { service_type: string | null; provider: string | null; amount: number; transaction_date: string }

/** Periodo siguiente al que contiene `date` (un mes o un bimestre después). */
export function nextPeriodKey(serviceType: string, date = new Date()) {
  const step = periodsPerYear(serviceType) === 6 ? 2 : 1
  return periodKey(serviceType, new Date(date.getFullYear(), date.getMonth() + step, 1))
}

/** Pronóstico por servicio a partir de los pagos completados del usuario. */
export function forecastsFromTransactions(transactions: Tx[], now = new Date()): ServiceForecast[] {
  const byService = new Map<string, Tx[]>()
  for (const tx of transactions) {
    if (!tx.service_type) continue
    const list = byService.get(tx.service_type) ?? []
    list.push(tx)
    byService.set(tx.service_type, list)
  }

  return [...byService.entries()].map(([serviceType, txs]) => {
    const history = groupByPeriod(
      serviceType,
      txs.map((t) => ({ amount: Number(t.amount), date: t.transaction_date })),
    )
    const currentKey = periodKey(serviceType, now)
    const last = history[history.length - 1]
    const previous = last?.period === currentKey ? history.slice(0, -1) : history
    const perYear = periodsPerYear(serviceType)
    return {
      service_type: serviceType,
      provider: txs[txs.length - 1]?.provider ?? null,
      billing_period: nextPeriodKey(serviceType, now),
      forecast: forecastNext(history, perYear),
      history,
      current:
        last?.period === currentKey
          ? { period: currentKey, amount: last.amount, anomaly: detectAnomaly(previous, last.amount, forecastNext(previous, perYear)) }
          : null,
    }
  })
}

export async function computeUserForecasts(supabase: SupabaseClient, userId: string, now = new Date()) {
  const { data, error } = await supabase
    .from("transactions")
    .select("service_type, provider, amount, transaction_date")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("transaction_date", { ascending: true })
  if (error) throw new Error(error.message)
  return forecastsFromTransactions((data ?? []) as Tx[], now)
}
