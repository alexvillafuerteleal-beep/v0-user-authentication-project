"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Download, FileDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const DEFAULT_CURRENT = {
  name: "Marzo 2026",
  total: 7366,
  count: 4,
  average: 1841.5,
  services: [
    { name: "Electricidad (CFE)", currentAmount: 2750, previousAmount: 2650, change: 3.8 },
    { name: "Agua (CONAGUA)", currentAmount: 1040, previousAmount: 980, change: 6.1 },
    { name: "Gas (PEMEX)", currentAmount: 1507, previousAmount: 1450, change: 3.9 },
    { name: "Internet (TELMEX)", currentAmount: 2062, previousAmount: 2000, change: 3.1 },
  ]
}
const DEFAULT_PREV = { name: "Febrero 2026", total: 7080, count: 4, average: 1770 }

export default function ComparativoPage() {
  const { toast } = useToast()
  const [currentMonth, setCurrentMonth] = useState(DEFAULT_CURRENT)
  const [previousMonth, setPreviousMonth] = useState(DEFAULT_PREV)

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const now = new Date()
        const startCurr = new Date(now.getFullYear(), now.getMonth(), 1)
        const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const fmt = (d: Date) =>
          d.toLocaleDateString("es-MX", { month: "long", year: "numeric" })
           .replace(/^\w/, c => c.toUpperCase())
        const [{ data: cTx }, { data: pTx }] = await Promise.all([
          supabase.from("transactions").select("amount, service_type")
            .eq("user_id", user.id).gte("transaction_date", startCurr.toISOString()).eq("status", "completed"),
          supabase.from("transactions").select("amount, service_type")
            .eq("user_id", user.id).gte("transaction_date", startPrev.toISOString())
            .lt("transaction_date", startCurr.toISOString()).eq("status", "completed"),
        ])
        const labels: Record<string, string> = {
          electricity: "Electricidad (CFE)", water: "Agua (CONAGUA)",
          gas: "Gas (PEMEX)", internet: "Internet (TELMEX)",
        }
        const agg = (rows: { service_type: string; amount: number }[]) =>
          rows.reduce((a, t) => ({ ...a, [t.service_type]: (a[t.service_type] || 0) + t.amount }), {} as Record<string, number>)
        const cMap = agg(cTx ?? [])
        const pMap = agg(pTx ?? [])
        const keys = [...new Set([...Object.keys(cMap), ...Object.keys(pMap)])]
        if (!keys.length) return
        const services = keys.map(k => ({
          name: labels[k] || k,
          currentAmount: cMap[k] || 0,
          previousAmount: pMap[k] || 0,
          change: pMap[k] ? ((cMap[k] || 0) - pMap[k]) / pMap[k] * 100 : 0,
        }))
        const cTotal = services.reduce((s, i) => s + i.currentAmount, 0)
        const pTotal = services.reduce((s, i) => s + i.previousAmount, 0)
        if (cTotal + pTotal === 0) return
        const cCount = services.filter(s => s.currentAmount > 0).length || 1
        const pCount = services.filter(s => s.previousAmount > 0).length || 1
        setCurrentMonth({ name: fmt(now), total: cTotal, count: cCount, average: cTotal / cCount, services })
        setPreviousMonth({ name: fmt(startPrev), total: pTotal, count: pCount, average: pTotal / pCount })
      } catch (e) { console.error("[Comparativo] Error:", e) }
    }
    load()
  }, [])

  const calculateChange = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100
    return {
      absolute: current - previous,
      percent: change.toFixed(1),
      trend: change >= 0 ? "up" : "down"
    }
  }

  const totalChange = calculateChange(currentMonth.total, previousMonth.total)
  const averageChange = calculateChange(currentMonth.average, previousMonth.average)

  const downloadComparisonCSV = () => {
    const headers = ["Servicio", `${currentMonth.name} (MXN)`, `${previousMonth.name} (MXN)`, "Cambio Abs.", "Cambio %"]
    const rows = currentMonth.services.map(s => {
      const ch = calculateChange(s.currentAmount, s.previousAmount)
      return [s.name, s.currentAmount, s.previousAmount, `${ch.trend === "up" ? "+" : "-"}${Math.abs(ch.absolute)}`, `${ch.percent}%`]
    })
    rows.push(["", "", "", "", ""])
    rows.push(["TOTAL", currentMonth.total, previousMonth.total, `${totalChange.trend === "up" ? "+" : "-"}${Math.abs(totalChange.absolute)}`, `${totalChange.percent}%`])
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `comparativo-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: "✅ CSV exportado", description: "Comparativo descargado correctamente" })
  }

  const downloadComparisonPDF = () => {
    const rows = currentMonth.services.map(s => {
      const ch = calculateChange(s.currentAmount, s.previousAmount)
      return `<tr><td>${s.name}</td><td>$${s.currentAmount.toLocaleString()}</td><td>$${s.previousAmount.toLocaleString()}</td><td style="color:${ch.trend === "up" ? "#dc2626" : "#16a34a"}">${ch.trend === "up" ? "+" : "-"}${ch.percent}%</td></tr>`
    }).join("")
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Comparativo</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#1a1a1a;max-width:700px;margin:0 auto}.header{background:linear-gradient(135deg,#0ea5e9,#7c3aed);color:white;padding:24px;border-radius:12px;margin-bottom:24px}.header h1{margin:0;font-size:22px}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#f1f5f9;padding:12px;text-align:left;font-size:13px}td{padding:12px;border-bottom:1px solid #e5e7eb;font-size:14px}.footer{text-align:center;margin-top:40px;color:#9ca3af;font-size:11px}</style></head><body><div class="header"><h1>Comparativo — ${currentMonth.name} vs ${previousMonth.name}</h1><p>Generado por PagoIA</p></div><table><thead><tr><th>Servicio</th><th>Marzo 2026</th><th>Febrero 2026</th><th>Variación</th></tr></thead><tbody>${rows}</tbody></table><div class="footer">PagoIA · ${new Date().toLocaleDateString("es-MX")}</div><script>window.onload=()=>window.print()</script></body></html>`
    const win = window.open("", "_blank")
    if (win) { win.document.write(html); win.document.close(); toast({ title: "📊 PDF generado", description: "Comparativo listo para guardar" }) }
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground flex items-center gap-2">
            📊 Análisis Comparativo
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">Compara tus gastos del mes actual con el anterior</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadComparisonCSV} className="gap-2 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary text-sm">
            <FileDown className="w-4 h-4" />
            CSV
          </Button>
          <Button variant="outline" onClick={downloadComparisonPDF} className="gap-2 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary text-sm">
            <Download className="w-4 h-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* KPIs Comparison */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Actual */}
        <Card className="bg-gradient-to-br from-primary/10 to-cyan-500/10 border-primary/30">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">💵 Total Marzo 2026</p>
              <p className="text-3xl font-bold text-primary">${currentMonth.total.toLocaleString()} MXN</p>
              <p className="text-xs text-muted-foreground">4 servicios pagados</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Anterior */}
        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/20 border-border">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">📅 Total Febrero 2026</p>
              <p className="text-3xl font-bold text-foreground">${previousMonth.total.toLocaleString()} MXN</p>
              <p className="text-xs text-muted-foreground">4 servicios pagados</p>
            </div>
          </CardContent>
        </Card>

        {/* Variación Total */}
        <Card className={`bg-gradient-to-br ${totalChange.trend === "up" ? "from-red-500/10 to-pink-500/10 border-red-500/30" : "from-green-500/10 to-emerald-500/10 border-green-500/30"}`}>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">📈 Cambio Total</p>
              <div className="flex items-center gap-2">
                {totalChange.trend === "up" ? (
                  <>
                    <TrendingUp className="w-6 h-6 text-red-500" />
                    <p className="text-3xl font-bold text-red-600">+${Math.abs(totalChange.absolute).toLocaleString()}</p>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-6 h-6 text-green-500" />
                    <p className="text-3xl font-bold text-green-600">${Math.abs(totalChange.absolute).toLocaleString()}</p>
                  </>
                )}
              </div>
              <Badge className={totalChange.trend === "up" ? "bg-red-500/20 text-red-600 border-red-500/30" : "bg-green-500/20 text-green-600 border-green-500/30"}>
                {totalChange.percent}% {totalChange.trend === "up" ? "↑" : "↓"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Promedio Comparison */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">💰 Promedio por Servicio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Marzo (Actual)</span>
                <span className="text-lg font-bold text-primary">${currentMonth.average.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gradient-to-r from-primary to-cyan-500 h-2 rounded-full"></div>
            </div>

            <div className="">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Febrero (Anterior)</span>
                <span className="text-lg font-bold text-foreground">${previousMonth.average.toFixed(2)}</span>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full"></div>
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                {averageChange.trend === "up" ? (
                  <TrendingUp className="w-4 h-4 text-red-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-green-500" />
                )}
                <span className={`font-semibold ${averageChange.trend === "up" ? "text-red-600" : "text-green-600"}`}>
                  {averageChange.trend === "up" ? "+" : "-"}${Math.abs(averageChange.absolute).toFixed(2)} ({averageChange.percent}%)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insights */}
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-foreground">🎯 Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-xl">📊</span>
              <div>
                <p className="font-medium text-foreground text-sm">Gastos Incrementados</p>
                <p className="text-xs text-muted-foreground">Tu gasto total aumentó en ${totalChange.absolute.toLocaleString()} ({totalChange.percent}%)</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-xl">⚡</span>
              <div>
                <p className="font-medium text-foreground text-sm">Todos los Servicios Activos</p>
                <p className="text-xs text-muted-foreground">4 servicios fueron pagados en ambos meses</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div>
                <p className="font-medium text-foreground text-sm">Recomendación</p>
                <p className="text-xs text-muted-foreground">Considera revisar el consumo de servicios para optimizar tu gasto</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services Comparison */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Comparativo por Servicio
          </CardTitle>
          <CardDescription>Variación mes a mes para cada servicio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentMonth.services.map((service) => {
              const change = calculateChange(service.currentAmount, service.previousAmount)
              return (
                <div key={service.name} className="p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors border border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{service.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Marzo: <span className="font-semibold text-primary">${service.currentAmount.toLocaleString()}</span>
                        {" "} vs Febrero: <span className="font-semibold text-foreground">${service.previousAmount.toLocaleString()}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={change.trend === "up" ? "bg-red-500/20 text-red-600 border-red-500/30" : "bg-green-500/20 text-green-600 border-green-500/30"}>
                        {change.trend === "up" ? "+" : "-"}${Math.abs(change.absolute).toLocaleString()} ({change.percent}%)
                      </Badge>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full ${change.trend === "up" ? "bg-gradient-to-r from-red-500 to-red-400" : "bg-gradient-to-r from-green-500 to-green-400"}`}
                      style={{
                        width: `${(service.currentAmount / Math.max(service.currentAmount, service.previousAmount)) * 100}%`
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">📋 Resumen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">Periodo Evaluado:</span> Febrero vs Marzo 2026
          </p>
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">Total Febrero:</span> ${previousMonth.total.toLocaleString()} MXN
          </p>
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">Total Marzo:</span> ${currentMonth.total.toLocaleString()} MXN
          </p>
          <p className={totalChange.trend === "up" ? "text-red-600" : "text-green-600"}>
            <span className="font-semibold">Variación:</span> {totalChange.trend === "up" ? "+" : ""}{totalChange.percent}% ({totalChange.trend === "up" ? "Aumento" : "Disminución"})
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
