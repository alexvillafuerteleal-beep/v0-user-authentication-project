"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Filter, Calendar } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface DbTransaction {
  id: string
  user_id: string
  service_type: string
  amount: number
  transaction_date: string
  status: string
  provider?: string | null
  receipt_number?: string | null
}

interface UiTransaction {
  id: string
  service: string
  serviceType: string
  amount: number
  date: string
  dateISO: string
  status: string
  method: string
  receipt: string
}

const serviceLabelMap: Record<string, string> = {
  cfe: "Electricidad (CFE)",
  electricity: "Electricidad (CFE)",
  conagua: "Agua (CONAGUA)",
  water: "Agua (CONAGUA)",
  gas: "Gas (PEMEX)",
  pemex: "Gas (PEMEX)",
  internet: "Internet (TELMEX)",
  telmex: "Internet (TELMEX)",
  phone: "Telefonia",
  tv: "Television",
  insurance: "Seguros",
}

function formatServiceName(serviceType: string | null | undefined) {
  if (!serviceType) return "Servicio"
  const key = serviceType.toLowerCase()
  return serviceLabelMap[key] || serviceType
}

function formatServiceNameWithProvider(serviceType: string | null | undefined, provider?: string | null) {
  if (!serviceType) return provider || "Servicio"
  const key = serviceType.toLowerCase()
  const typeLabel = serviceLabelMap[key]
  if (!typeLabel) return provider || serviceType
  // Si hay proveedor real en BD, mostrarlo. Si no, usar el mapeado por defecto
  if (provider && provider !== "Stripe") {
    const base = typeLabel.split("(")[0].trim()
    return `${base} (${provider})`
  }
  return typeLabel
}

function mapTransaction(tx: DbTransaction): UiTransaction {
  const txDate = new Date(tx.transaction_date)
  return {
    id: tx.id,
    service: formatServiceNameWithProvider(tx.service_type, tx.provider),
    serviceType: (tx.service_type || "").toLowerCase(),
    amount: tx.amount || 0,
    date: txDate.toLocaleDateString("es-MX"),
    dateISO: txDate.toISOString(),
    status: tx.status || "pending",
    method: tx.provider || "Stripe",
    receipt: tx.receipt_number || `REC-${tx.id.slice(0, 8).toUpperCase()}`,
  }
}

function statusBadgeClass(status: string) {
  const normalized = status.toLowerCase()
  if (normalized === "completed") return "bg-green-500/20 text-green-600 border-green-500/30"
  if (normalized === "failed") return "bg-red-500/20 text-red-600 border-red-500/30"
  return "bg-amber-500/20 text-amber-600 border-amber-500/30"
}

function statusLabel(status: string) {
  const normalized = status.toLowerCase()
  if (normalized === "completed") return "Completado"
  if (normalized === "failed") return "Fallido"
  return "Pendiente"
}

function escapeCsv(value: string | number) {
  const raw = String(value)
  if (raw.includes(",") || raw.includes('"') || raw.includes("\n")) {
    return `"${raw.replace(/"/g, '""')}"`
  }
  return raw
}

export default function HistorialPage() {
  const [transactions, setTransactions] = useState<UiTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filterService, setFilterService] = useState("todos")
  const [searchDate, setSearchDate] = useState("")
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let mounted = true
    let userId: string | null = null

    const loadTransactions = async () => {
      try {
        setLoading(true)
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          if (mounted) setTransactions([])
          return
        }

        userId = user.id
        const { data, error } = await supabase
          .from("transactions")
          .select("id, user_id, service_type, amount, transaction_date, status, provider, receipt_number")
          .eq("user_id", user.id)
          .order("transaction_date", { ascending: false })
          .limit(200)

        if (error) throw error

        if (mounted) {
          setTransactions((data || []).map((tx) => mapTransaction(tx as DbTransaction)))
        }
      } catch (error) {
        console.error("[Historial] Error loading transactions:", error)
        if (mounted) {
          toast({
            title: "No se pudo cargar el historial",
            description: "Intenta nuevamente en unos segundos.",
            variant: "destructive",
          })
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void loadTransactions()

    const channel = supabase
      .channel("historial-transacciones-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        (payload) => {
          const incomingUserId =
            (payload.new as { user_id?: string } | null)?.user_id ||
            (payload.old as { user_id?: string } | null)?.user_id

          if (userId && incomingUserId !== userId) {
            return
          }

          if (payload.eventType === "INSERT" && payload.new) {
            const tx = mapTransaction(payload.new as DbTransaction)
            setTransactions((prev) => [tx, ...prev.filter((item) => item.id !== tx.id)])

            if ((tx.status || "").toLowerCase() === "completed") {
              toast({
                title: "Pago recibido en tiempo real",
                description: `${tx.service} · $${tx.amount.toLocaleString("es-MX")} MXN`,
                duration: 3500,
              })
            }
            return
          }

          if (payload.eventType === "UPDATE" && payload.new) {
            const tx = mapTransaction(payload.new as DbTransaction)
            setTransactions((prev) => prev.map((item) => (item.id === tx.id ? tx : item)))
            return
          }

          if (payload.eventType === "DELETE" && payload.old) {
            const oldId = (payload.old as { id?: string }).id
            if (!oldId) return
            setTransactions((prev) => prev.filter((item) => item.id !== oldId))
          }
        },
      )
      .subscribe()

    return () => {
      mounted = false
      void supabase.removeChannel(channel)
    }
  }, [supabase, toast])

  const filteredTransactions = transactions.filter(t => {
    const serviceMatch =
      filterService === "todos" ||
      t.service.toLowerCase().includes(filterService.toLowerCase()) ||
      t.serviceType.includes(filterService.toLowerCase())
    const dateMatch = !searchDate || t.dateISO.startsWith(searchDate)
    return serviceMatch && dateMatch
  })

  const downloadCSV = () => {
    const headers = ["ID", "Servicio", "Monto (MXN)", "Fecha", "Estado", "Método", "Recibo"]
    const csv = [
      headers.join(","),
      ...filteredTransactions.map(t => 
        [
          escapeCsv(t.id),
          escapeCsv(t.service),
          escapeCsv(t.amount),
          escapeCsv(t.date),
          escapeCsv(statusLabel(t.status)),
          escapeCsv(t.method),
          escapeCsv(t.receipt),
        ].join(",")
      )
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `historial-pagos-${new Date().toISOString().split('T')[0]}.csv`)
    link.click()

    toast({
      title: "✅ Descarga completada",
      description: `${filteredTransactions.length} registros descargados en CSV`,
      duration: 3000,
    })
  }

  const downloadPDF = () => {
    const htmlContent = `
      <html>
        <head>
          <title>Historial de Pagos</title>
          <style>
            body { font-family: Arial; margin: 20px; background-color: #0a1929; color: #fff; }
            h1 { color: #00d4aa; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; background-color: #0d2137; }
            th { background-color: #1a3a5c; padding: 10px; text-align: left; border: 1px solid #1e4976; }
            td { padding: 10px; border: 1px solid #1e4976; }
            tr:nth-child(even) { background-color: #0d2137; }
            .footer { margin-top: 20px; text-align: center; color: #8b9bb4; font-size: 12px; }
            .summary { margin: 20px 0; padding: 10px; background-color: #1a3a5c; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>📊 Historial de Pagos - PagoIA</h1>
          <p>Generado: ${new Date().toLocaleString()}</p>
          
          <div class="summary">
            <strong>Total Transacciones:</strong> ${filteredTransactions.length}<br>
            <strong>Monto Total:</strong> $${filteredTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()} MXN
          </div>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Servicio</th>
                <th>Monto (MXN)</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Método</th>
                <th>Recibo</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTransactions.map(t => `
                <tr>
                  <td>${t.id}</td>
                  <td>${t.service}</td>
                  <td>$${t.amount.toLocaleString()}</td>
                  <td>${t.date}</td>
                  <td>${statusLabel(t.status)}</td>
                  <td>${t.method}</td>
                  <td>${t.receipt}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div class="footer">
            <p>Este documento es un comprobante de tus transacciones en PagoIA</p>
            <p>Para más información, visita: www.pagoIA.com</p>
          </div>
        </body>
      </html>
    `

    const printWindow = window.open('', '', 'width=800,height=600')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.print()
      
      toast({
        title: "✅ Abriendo PDF",
        description: "Usa la opción de Imprimir para guardar como PDF",
        duration: 3000,
      })
    }
  }

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Historial de Pagos</h1>
        <p className="text-muted-foreground">
          Visualiza y descarga tu historial de transacciones en tiempo real
        </p>
      </div>

      {/* Filtros */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground text-lg flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Servicio</label>
              <Select value={filterService} onValueChange={setFilterService}>
                <SelectTrigger className="bg-secondary/50 border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="todos">Todos los servicios</SelectItem>
                  <SelectItem value="electricidad">Electricidad</SelectItem>
                  <SelectItem value="agua">Agua</SelectItem>
                  <SelectItem value="gas">Gas</SelectItem>
                  <SelectItem value="internet">Internet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Buscar por Fecha</label>
              <Input 
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="bg-secondary/50 border-border text-foreground"
              />
            </div>

            <div className="flex items-end gap-2">
              <Button 
                variant="outline"
                className="flex-1 border-border hover:bg-secondary text-foreground text-sm"
                onClick={() => {
                  setFilterService("todos")
                  setSearchDate("")
                }}
              >
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Transacciones</p>
            <p className="text-2xl font-bold text-green-600">{filteredTransactions.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-cyan-500/10 border-primary/30">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Monto Total</p>
            <p className="text-2xl font-bold text-primary">${totalAmount.toLocaleString()} MXN</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/30">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Promedio</p>
            <p className="text-2xl font-bold text-blue-600">${filteredTransactions.length > 0 ? Math.round(totalAmount / filteredTransactions.length).toLocaleString() : 0} MXN</p>
          </CardContent>
        </Card>
      </div>

      {/* Botones de Descarga */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white gap-2 h-10"
          onClick={downloadCSV}
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Descargar Excel (.CSV)</span>
          <span className="sm:hidden">Descargar CSV</span>
        </Button>

        <Button 
          className="flex-1 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent text-white gap-2 h-10"
          onClick={downloadPDF}
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Descargar PDF (.PDF)</span>
          <span className="sm:hidden">Descargar PDF</span>
        </Button>
      </div>

      {/* Tabla de Transacciones */}
      <Card className="bg-card border-border overflow-hidden">
        <CardHeader>
          <CardTitle className="text-foreground">Transacciones en Vivo</CardTitle>
          <CardDescription>
            Mostrando {filteredTransactions.length} de {transactions.length} registros
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Cargando transacciones...</p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-semibold">ID</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Servicio</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-semibold">Monto</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Fecha</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Estado</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Método</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Recibo</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((t, idx) => (
                  <tr key={t.id} className={`border-b border-border/50 ${idx % 2 === 0 ? 'bg-secondary/20' : ''} hover:bg-secondary/30 transition-colors`}>
                    <td className="py-3 px-4 text-foreground font-semibold">#{t.id.slice(0, 8)}</td>
                    <td className="py-3 px-4 text-foreground">{t.service}</td>
                    <td className="py-3 px-4 text-right text-accent font-bold">${t.amount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-foreground text-xs">{t.date}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border font-semibold ${statusBadgeClass(t.status)}`}>
                        {statusLabel(t.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-foreground text-xs">
                      <span className="inline-block px-2 py-1 rounded bg-primary/20 text-primary">
                        {t.method}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-foreground text-xs font-mono">{t.receipt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}

          {!loading && filteredTransactions.length === 0 && (
            <div className="text-center py-10">
              <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No hay transacciones que coincidan con los filtros</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
