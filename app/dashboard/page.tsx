"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { SmartAlerts } from "@/components/dashboard/smart-alerts"
import { ServiceStatus } from "@/components/dashboard/service-status"
import { PaymentMethodSelector } from "@/components/dashboard/payment-method-selector"
import { SpendingAnalysis } from "@/components/dashboard/spending-analysis"
import { PendingPayments } from "@/components/dashboard/pending-payments"
import { Zap, DollarSign, TrendingUp, AlertCircle, Calendar, Wifi, CheckCircle2, XCircle, CreditCard, BarChart3, Receipt, ArrowRight } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface DashboardStats {
  totalPaid: number
  recentCount: number
  thisMonthTotal: number
  averageMonthly: number
}

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [stats, setStats] = useState<DashboardStats>({
    totalPaid: 0,
    recentCount: 0,
    thisMonthTotal: 0,
    averageMonthly: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount, transaction_date, status")
        .eq("user_id", user.id)
        .eq("status", "completed")

      if (transactions) {
        let totalPaid = 0
        let thisMonthTotal = 0
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()

        transactions.forEach((tx: { amount: number; transaction_date: string; status: string }) => {
          totalPaid += tx.amount || 0
          const txDate = new Date(tx.transaction_date)
          if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
            thisMonthTotal += tx.amount || 0
          }
        })

        const averageMonthly = transactions.length > 0 ? totalPaid / Math.max(1, Math.ceil((Date.now() - new Date(transactions[0].transaction_date).getTime()) / (1000 * 60 * 60 * 24 * 30))) : 0

        setStats({
          totalPaid,
          recentCount: transactions.length,
          thisMonthTotal,
          averageMonthly: Math.round(averageMonthly),
        })
      }
    } catch (error) {
      console.error("[Dashboard] Error loading stats:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const paymentStatus = searchParams.get("payment")
    const service = searchParams.get("service")

    if (paymentStatus === "success") {
      toast({
        title: "✅ Pago Realizado Exitosamente",
        description: `Tu pago para ${service || "el servicio"} ha sido procesado correctamente.`,
        duration: 5000,
      })
      loadDashboardStats() // Recargar stats cuando hay un pago nuevo
    } else if (paymentStatus === "cancelled") {
      toast({
        title: "❌ Pago Cancelado",
        description: "El proceso de pago fue cancelado.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }, [searchParams, toast])
  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground flex items-center gap-2">
            📊 Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {loading ? "Cargando métricas..." : `${stats.recentCount} transacciones · Datos actualizados en tiempo real`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-500/10 text-green-600 border border-green-500/30 rounded-full">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Sistema activo
          </span>
        </div>
      </div>

      {/* ── Acciones rápidas ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: CreditCard, label: "Pagar Servicio", desc: "Ir a servicios", href: "/dashboard/servicios", color: "from-primary/20 to-cyan-500/10 border-primary/30 text-primary" },
          { icon: Receipt, label: "Ver Facturas", desc: "Descargar PDFs", href: "/dashboard/estados", color: "from-green-500/20 to-emerald-500/10 border-green-500/30 text-green-600" },
          { icon: BarChart3, label: "Comparativo", desc: "Análisis mensual", href: "/dashboard/comparativo", color: "from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-600" },
          { icon: AlertCircle, label: "Notificaciones", desc: "Ver alertas", href: "/dashboard/notificaciones", color: "from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-600" },
        ].map((item) => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className={`group bg-gradient-to-br ${item.color} border rounded-xl p-4 text-left hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]`}
          >
            <item.icon className="w-5 h-5 mb-2 opacity-80 group-hover:opacity-100" />
            <p className="font-semibold text-sm text-foreground leading-tight">{item.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
          </button>
        ))}
      </div>

      {/* ── KPIs principales ── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30 hover:border-cyan-500/50 transition-all hover:shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Pagado</p>
                <p className="text-xl sm:text-2xl font-bold text-cyan-600 mt-1 truncate">
                  {loading ? "..." : `$${stats.totalPaid.toLocaleString("es-MX", { minimumFractionDigits: 0 })}`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">MXN acumulado</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4 text-cyan-600" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-700 rounded-full font-semibold">
                {stats.recentCount} transacciones
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30 hover:border-green-500/50 transition-all hover:shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Este Mes</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1 truncate">
                  {loading ? "..." : `$${stats.thisMonthTotal.toLocaleString("es-MX", { minimumFractionDigits: 0 })}`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Abril 2026</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-700 rounded-full font-semibold">
                Datos reales
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/30 hover:border-blue-500/50 transition-all hover:shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Promedio Mensual</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600 mt-1 truncate">
                  {loading ? "..." : `$${stats.averageMonthly.toLocaleString("es-MX", { minimumFractionDigits: 0 })}`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">MXN por mes</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-700 rounded-full font-semibold">
                Calculado
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30 hover:border-amber-500/50 transition-all hover:shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Vencimientos</p>
                <p className="text-xl sm:text-2xl font-bold text-amber-600 mt-1">3 próximos</p>
                <p className="text-xs text-muted-foreground mt-1">En 7 días</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <div className="mt-3">
              <button onClick={() => router.push("/dashboard/servicios")} className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-700 rounded-full font-semibold hover:bg-amber-500/30 transition-colors">
                Ver servicios →
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Pronóstico de Gastos Chart */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-foreground text-base sm:text-lg">📈 Pronóstico de Gastos (IA)</CardTitle>
            <Select defaultValue="month">
              <SelectTrigger className="w-32 bg-secondary border-border text-foreground text-sm">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mes</SelectItem>
                <SelectItem value="year">Este Año</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <RevenueChart />
          </CardContent>
        </Card>

        {/* Side Stats Cards */}
        <div className="space-y-4">
          {/* Próximos Vencimientos */}
          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30 hover:border-amber-500/50 transition-colors cursor-pointer group" onClick={() => router.push("/dashboard/servicios")}>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-amber-500/25 flex items-center justify-center text-xl shrink-0">⏰</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">Próximos Vencimientos</h3>
                  <p className="text-2xl font-bold text-amber-600 mt-1">3 servicios</p>
                  <p className="text-xs text-muted-foreground mt-1">En los próximos 7 días</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-600 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
              </div>
            </CardContent>
          </Card>

          {/* Estado del Sistema */}
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30 hover:border-green-500/50 transition-colors">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-green-500/25 flex items-center justify-center text-xl shrink-0">✅</div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground">Estado del Sistema</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs bg-green-500/20 text-green-700 rounded-full border border-green-500/30 font-semibold">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      Conectado
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Supabase · Stripe activos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ir a Historial */}
          <Card className="bg-gradient-to-br from-primary/10 to-cyan-500/10 border-primary/30 hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => router.push("/dashboard/historial")}>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center text-xl shrink-0">📋</div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground">Historial de Pagos</h3>
                  <p className="text-xs text-muted-foreground mt-1">Descarga CSV o PDF</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Smart Widgets Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SmartAlerts />
        <ServiceStatus />
      </div>

      {/* Pagos Pendientes */}
      <PendingPayments />

      {/* Payment and Analysis Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PaymentMethodSelector />
        <SpendingAnalysis />
      </div>
    </div>
  )
}
