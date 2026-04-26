"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, BarChart3, TrendingUp, TrendingDown, FileDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const SERVICE_LABELS: Record<string, string> = {
  electricity: "Electricidad CFE", water: "Agua CONAGUA",
  gas: "Gas PEMEX", internet: "Internet TELMEX",
}
const DEMO_INVOICES = [
  { id: "1", service: "Electricidad CFE", date: "01 Marzo 2026", amount: 2750.00, status: "Pagada", periodo: "Febrero 2026", folio: "CFE-2026-001234" },
  { id: "2", service: "Agua CONAGUA", date: "05 Marzo 2026", amount: 1040.50, status: "Pagada", periodo: "Febrero 2026", folio: "CNA-2026-005678" },
  { id: "3", service: "Gas PEMEX", date: "10 Marzo 2026", amount: 1507.75, status: "Pagada", periodo: "Febrero 2026", folio: "PMX-2026-009012" },
  { id: "4", service: "Internet TELMEX", date: "15 Marzo 2026", amount: 2062.90, status: "Pendiente", periodo: "Marzo 2026", folio: "TLM-2026-003456" },
]
const DEMO_REPORTS = [
  { period: "Enero 2026", total: 6890.15, trend: "+5%", services: 4, prevTotal: 6562.05 },
  { period: "Febrero 2026", total: 7080.00, trend: "+2.8%", services: 4, prevTotal: 6890.15 },
  { period: "Marzo 2026", total: 7361.15, trend: "+4%", services: 4, prevTotal: 7080.00 },
]

type Invoice = { id: string; service: string; date: string; amount: number; status: string; periodo: string; folio: string }
type Report = { period: string; total: number; trend: string; services: number; prevTotal: number }

export default function EstadosCuentaPage() {
  const { toast } = useToast()
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>(DEMO_INVOICES)
  const [reports, setReports] = useState<Report[]>(DEMO_REPORTS)

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: txs, error } = await supabase
          .from("transactions")
          .select("id, service_type, amount, transaction_date, status, receipt_number")
          .eq("user_id", user.id)
          .order("transaction_date", { ascending: false })
          .limit(50)
        if (error || !txs?.length) return
        const fmtDate = (iso: string) =>
          new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })
        const fmtPeriod = (iso: string) =>
          new Date(iso).toLocaleDateString("es-MX", { month: "long", year: "numeric" })
            .replace(/^\w/, c => c.toUpperCase())
        const mapped: Invoice[] = txs.map(t => ({
          id: t.id,
          service: SERVICE_LABELS[t.service_type] || t.service_type,
          date: fmtDate(t.transaction_date),
          amount: t.amount,
          status: t.status === "completed" ? "Pagada" : "Pendiente",
          periodo: fmtPeriod(t.transaction_date),
          folio: t.receipt_number || `TXN-${t.id.slice(0, 8).toUpperCase()}`,
        }))
        setInvoices(mapped)
        // Build monthly reports
        const monthMap: Record<string, { total: number; services: Set<string> }> = {}
        txs.filter(t => t.status === "completed").forEach(t => {
          const key = fmtPeriod(t.transaction_date)
          if (!monthMap[key]) monthMap[key] = { total: 0, services: new Set() }
          monthMap[key].total += t.amount
          monthMap[key].services.add(t.service_type)
        })
        const periods = Object.keys(monthMap).slice(-3)
        if (periods.length >= 2) {
          const built: Report[] = periods.map((p, i) => {
            const curr = monthMap[p].total
            const prev = i > 0 ? monthMap[periods[i - 1]].total : 0
            const pct = prev ? ((curr - prev) / prev * 100) : 0
            return {
              period: p, total: curr,
              trend: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`,
              services: monthMap[p].services.size,
              prevTotal: prev,
            }
          })
          setReports(built)
        }
      } catch (e) { console.error("[Estados] Error:", e) }
    }
    load()
  }, [])

  const downloadInvoicePDF = (invoice: typeof invoices[0]) => {
    const htmlContent = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Factura - ${invoice.service}</title>
<style>
  body{font-family:Arial,sans-serif;padding:40px;color:#1a1a1a;max-width:600px;margin:0 auto}
  .header{background:linear-gradient(135deg,#0ea5e9,#06b6d4);color:white;padding:24px;border-radius:12px;margin-bottom:24px}
  .header h1{margin:0;font-size:22px}.header p{margin:4px 0 0;opacity:.85;font-size:13px}
  .row{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #e5e7eb}
  .label{color:#6b7280;font-size:14px}.value{font-weight:600;font-size:14px}
  .total{background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin-top:24px;display:flex;justify-content:space-between;align-items:center}
  .total-amount{font-size:28px;font-weight:800;color:#16a34a}
  .badge{background:${invoice.status === "Pagada" ? "#dcfce7" : "#fef9c3"};color:${invoice.status === "Pagada" ? "#15803d" : "#a16207"};padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600}
  .footer{text-align:center;margin-top:40px;color:#9ca3af;font-size:11px}
</style></head><body>
<div class="header"><h1>PagoIA — Comprobante de Servicio</h1><p>Folio: ${invoice.folio}</p></div>
<div class="row"><span class="label">Servicio</span><span class="value">${invoice.service}</span></div>
<div class="row"><span class="label">Periodo</span><span class="value">${invoice.periodo}</span></div>
<div class="row"><span class="label">Fecha de Emisión</span><span class="value">${invoice.date}</span></div>
<div class="row"><span class="label">Estado</span><span class="badge">${invoice.status}</span></div>
<div class="total"><span style="font-size:16px;font-weight:600">Total</span><span class="total-amount">$${invoice.amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</span></div>
<div class="footer">Generado por PagoIA · ${new Date().toLocaleDateString("es-MX")} · Comprobante digital</div>
<script>window.onload=()=>window.print()</script>
</body></html>`
    const win = window.open("", "_blank")
    if (win) {
      win.document.write(htmlContent)
      win.document.close()
      toast({ title: "📄 PDF generado", description: `Factura de ${invoice.service} lista para guardar` })
    }
  }

  const downloadAllCSV = () => {
    const headers = ["Folio", "Servicio", "Fecha", "Periodo", "Monto (MXN)", "Estado"]
    const rows = invoices.map(i => [i.folio, i.service, i.date, i.periodo, i.amount.toFixed(2), i.status])
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `estados-cuenta-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: "✅ CSV descargado", description: `${invoices.length} facturas exportadas correctamente` })
  }

  const downloadReportPDF = (report: typeof reports[0]) => {
    const trendUp = report.trend.startsWith("+")
    const htmlContent = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Informe ${report.period}</title>
<style>
  body{font-family:Arial,sans-serif;padding:40px;color:#1a1a1a;max-width:600px;margin:0 auto}
  .header{background:linear-gradient(135deg,#0ea5e9,#7c3aed);color:white;padding:24px;border-radius:12px;margin-bottom:24px}
  .header h1{margin:0;font-size:22px}.header p{margin:4px 0 0;opacity:.85;font-size:13px}
  .kpi{text-align:center;padding:20px;background:#f8fafc;border-radius:10px;margin-bottom:12px;border:1px solid #e2e8f0}
  .kpi-value{font-size:36px;font-weight:800;color:#0ea5e9}.kpi-label{color:#6b7280;font-size:13px;margin-top:4px}
  .trend{font-size:18px;font-weight:700;color:${trendUp ? "#dc2626" : "#16a34a"}}
  .footer{text-align:center;margin-top:40px;color:#9ca3af;font-size:11px}
</style></head><body>
<div class="header"><h1>Informe Mensual — ${report.period}</h1><p>Generado por PagoIA</p></div>
<div class="kpi"><div class="kpi-value">$${report.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</div><div class="kpi-label">Total Pagado</div></div>
<div class="kpi"><div class="kpi-value">${report.services}</div><div class="kpi-label">Servicios Pagados</div></div>
<div class="kpi"><div class="trend">${report.trend} vs mes anterior</div><div class="kpi-label">Mes anterior: $${report.prevTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</div></div>
<div class="footer">Generado por PagoIA · ${new Date().toLocaleDateString("es-MX")}</div>
<script>window.onload=()=>window.print()</script>
</body></html>`
    const win = window.open("", "_blank")
    if (win) {
      win.document.write(htmlContent)
      win.document.close()
      toast({ title: "📊 Informe PDF generado", description: `Reporte de ${report.period} listo para guardar` })
    }
  }

  const viewDetail = (report: typeof reports[0]) => {
    setSelectedReport(report)
    setDetailOpen(true)
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Estados de Cuenta</h1>
          <p className="text-muted-foreground">Accede a tus informes y facturas detalladas</p>
        </div>
        <Button
          variant="outline"
          onClick={downloadAllCSV}
          className="gap-2 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary"
        >
          <FileDown className="w-4 h-4" />
          Exportar Todo (.CSV)
        </Button>
      </div>

      <Tabs defaultValue="facturas" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="facturas">Facturas</TabsTrigger>
          <TabsTrigger value="informes">Informes Mensuales</TabsTrigger>
        </TabsList>

        <TabsContent value="facturas" className="space-y-3 mt-6">
          {invoices.map((invoice) => (
            <Card key={invoice.id} className="hover:border-primary/50 transition-all hover:shadow-md group">
              <CardContent className="flex items-center justify-between p-4 sm:p-5 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{invoice.service}</p>
                    <p className="text-xs text-muted-foreground">{invoice.date} · {invoice.folio}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="font-bold text-foreground text-sm">${invoice.amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
                    <Badge variant="outline" className={`text-xs ${invoice.status === "Pagada" ? "border-green-500/40 text-green-600 bg-green-500/10" : "border-amber-500/40 text-amber-600 bg-amber-500/10"}`}>
                      {invoice.status === "Pagada" ? "✅" : "⏳"} {invoice.status}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadInvoicePDF(invoice)}
                    className="gap-1.5 border-primary/30 hover:bg-primary/10 hover:text-primary hover:border-primary text-xs h-8"
                  >
                    <Download className="h-3.5 w-3.5" />
                    PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="informes" className="space-y-4 mt-6">
          <div className="grid md:grid-cols-3 gap-4">
            {reports.map((report, idx) => {
              const trendUp = report.trend.startsWith("+")
              return (
                <Card key={idx} className="hover:border-primary/50 transition-all hover:shadow-md group">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{report.period}</CardTitle>
                      <BarChart3 className="w-4 h-4 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Pagado</p>
                      <p className="text-2xl font-bold text-primary">${report.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {trendUp
                        ? <TrendingUp className="w-4 h-4 text-red-500 shrink-0" />
                        : <TrendingDown className="w-4 h-4 text-green-500 shrink-0" />
                      }
                      <span className={`text-sm font-semibold ${trendUp ? "text-red-600" : "text-green-600"}`}>
                        {report.trend} vs mes anterior
                      </span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs gap-1 border-border hover:bg-secondary/70"
                        onClick={() => viewDetail(report)}
                      >
                        Ver Detalle
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadReportPDF(report)}
                        className="gap-1 border-primary/30 hover:bg-primary/10 hover:text-primary hover:border-primary"
                      >
                        <Download className="h-3.5 w-3.5" />
                        PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Report Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Detalle — {selectedReport?.period}</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary/10 rounded-xl p-4 text-center border border-primary/20">
                  <p className="text-2xl font-bold text-primary">${selectedReport.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Pagado</p>
                </div>
                <div className="bg-secondary rounded-xl p-4 text-center border border-border">
                  <p className="text-2xl font-bold text-foreground">{selectedReport.services}</p>
                  <p className="text-xs text-muted-foreground mt-1">Servicios</p>
                </div>
              </div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-1">
                <p className="text-sm text-muted-foreground">Mes anterior: <span className="font-semibold text-foreground">${selectedReport.prevTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span></p>
                <p className={`text-sm font-semibold ${selectedReport.trend.startsWith("+") ? "text-red-600" : "text-green-600"}`}>
                  Variación: {selectedReport.trend}
                </p>
              </div>
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-white gap-2"
                onClick={() => { downloadReportPDF(selectedReport); setDetailOpen(false) }}
              >
                <Download className="w-4 h-4" />
                Descargar PDF
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
