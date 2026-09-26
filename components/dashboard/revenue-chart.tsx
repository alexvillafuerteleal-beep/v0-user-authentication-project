"use client"

import { useEffect, useMemo, useState } from "react"
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { createClient } from "@/lib/supabase/client"
import { forecastNext, type Forecast } from "@/lib/forecast"

interface ChartPoint {
  key: string
  month: string
  expenses: number
  forecast?: Forecast
}

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
const money = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })

/**
 * Gasto real de los últimos 8 meses (agrupado por año y mes) y, en magenta, el pronóstico
 * del mes siguiente con su intervalo. El pronóstico usa los meses con pagos registrados.
 */
export function RevenueChart() {
  const [points, setPoints] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data: transactions, error } = await supabase
          .from("transactions")
          .select("amount, transaction_date")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .order("transaction_date", { ascending: true })
        if (error) throw error

        const totals = new Map<string, number>()
        for (const tx of transactions ?? []) {
          const key = monthKey(new Date(tx.transaction_date))
          totals.set(key, (totals.get(key) ?? 0) + Number(tx.amount || 0))
        }

        // Solo meses con pagos: un mes sin registros es un dato faltante, no un gasto de $0.
        const now = new Date()
        const history = [...totals.entries()]
          .sort(([a], [b]) => (a < b ? -1 : 1))
          .map(([period, amount]) => ({ period, amount }))

        const chart: ChartPoint[] = []
        for (let i = 7; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          chart.push({ key: monthKey(d), month: MONTHS[d.getMonth()], expenses: Math.round((totals.get(monthKey(d)) ?? 0) * 100) / 100 })
        }
        const forecast = forecastNext(history, 12)
        const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        if (forecast.method !== "sin-datos") {
          chart.push({ key: monthKey(next), month: `${MONTHS[next.getMonth()]}*`, expenses: forecast.predicted, forecast })
        }
        setPoints(chart)
      } catch (error) {
        console.error("[RevenueChart] Error loading data:", error)
        setPoints([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const forecast = useMemo(() => points.find((p) => p.forecast)?.forecast, [points])

  if (loading) return <div className="h-[300px] animate-pulse rounded-lg bg-muted/40" aria-label="Cargando gráfica" />
  if (points.length === 0) return <p className="py-16 text-center text-sm text-muted-foreground">Aún no hay pagos para graficar.</p>

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={points} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.6} />
          <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(value: number) => (value >= 1000 ? `$${(value / 1000).toFixed(value % 1000 ? 1 : 0)}k` : `$${value}`)}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const p = payload[0].payload as ChartPoint
              return (
                <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
                  <p className="font-medium">{p.forecast ? `${p.month.replace("*", "")} · estimado` : p.month}</p>
                  <p className="font-mono tabular-nums">{money(p.expenses)}</p>
                  {p.forecast && (
                    <p className="text-xs text-muted-foreground">
                      Entre {money(p.forecast.lower)} y {money(p.forecast.upper)}
                    </p>
                  )}
                </div>
              )
            }}
          />
          <Bar dataKey="expenses" radius={[4, 4, 0, 0]} name="Gasto">
            {points.map((p) => (
              <Cell key={p.key} fill={p.forecast ? "var(--brand-spark)" : "var(--chart-1)"} fillOpacity={p.forecast ? 0.75 : 1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-chart-1" aria-hidden="true" /> Gasto real
        </span>
        {forecast && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-brand-spark/75" aria-hidden="true" />
            Próximo mes: <strong className="font-mono text-foreground tabular-nums">{money(forecast.predicted)}</strong>
            (entre {money(forecast.lower)} y {money(forecast.upper)}, confianza {Math.round(forecast.confidence * 100)}%)
          </span>
        )}
      </div>
    </div>
  )
}
