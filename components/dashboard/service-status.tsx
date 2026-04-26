"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Zap } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ServicePayment {
  id: string
  user_id?: string
  service_name: string
  service_icon: string
  amount: number
  transaction_date: string
  status: string
}

const statusColors: Record<string, string> = {
  completed: "bg-green-500/10 text-green-700 border-green-200",
  pending: "bg-amber-500/10 text-amber-700 border-amber-200",
  failed: "bg-red-500/10 text-red-700 border-red-200",
}

export function ServiceStatus() {
  const [services, setServices] = useState<ServicePayment[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    void loadServicePayments()
  }, [])

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    const channel = supabase
      .channel("service-status-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        (payload) => {
          const eventUserId =
            (payload.new as { user_id?: string } | null)?.user_id ||
            (payload.old as { user_id?: string } | null)?.user_id

          if (eventUserId !== userId) return
          void loadServicePayments(userId)
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId])

  const loadServicePayments = async (forcedUserId?: string) => {
    try {
      const supabase = createClient()

      let activeUserId = forcedUserId
      if (!activeUserId) {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        activeUserId = user?.id
      }

      if (!activeUserId) {
        setLoading(false)
        return
      }

      setUserId(activeUserId)

      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("id, user_id, service_type, amount, transaction_date, status")
        .eq("user_id", activeUserId)
        .eq("status", "completed")
        .gte("transaction_date", todayStart.toISOString())
        .order("transaction_date", { ascending: false })
        .limit(50)

      if (error) throw error

      const serviceMap: Record<string, ServicePayment> = {}
      const serviceIcons: Record<string, string> = {
        cfe: "⚡",
        conagua: "💧",
        pemex: "🔥",
        telmex: "📡",
        telefonica: "📱",
        television: "📺",
        streaming: "🎬",
        seguros: "🛡️",
        tenencia: "🚗",
        predial: "🏠",
      }

      const serviceNames: Record<string, string> = {
        cfe: "CFE - Electricidad",
        conagua: "CONAGUA - Agua",
        pemex: "PEMEX - Gas",
        telmex: "TELMEX - Internet",
        telefonica: "Telefonía Celular",
        television: "Televisión por Cable",
        streaming: "Streaming y Suscripciones",
        seguros: "Seguros",
        tenencia: "Tenencia Vehicular",
        predial: "Impuestos Prediales",
      }

      transactions?.forEach((tx: { id: string; user_id: string; service_type: string; amount: number; transaction_date: string; status: string }) => {
        const serviceKey = tx.service_type?.toLowerCase() || "otros"
        if (!serviceMap[serviceKey]) {
          serviceMap[serviceKey] = {
            id: tx.id,
            user_id: tx.user_id,
            service_name: serviceNames[serviceKey] || tx.service_type,
            service_icon: serviceIcons[serviceKey] || "💳",
            amount: tx.amount || 0,
            transaction_date: tx.transaction_date,
            status: tx.status,
          }
        }
      })

      const serviceList = Object.values(serviceMap).slice(0, 10)
      setServices(serviceList)
    } catch (error) {
      console.error("[ServiceStatus] Error loading services:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatElapsed = (isoDate: string) => {
    const diffMs = Date.now() - new Date(isoDate).getTime()
    const minutes = Math.floor(diffMs / (1000 * 60))
    if (minutes < 1) return "hace instantes"
    if (minutes < 60) return `hace ${minutes} min`
    const hours = Math.floor(minutes / 60)
    return `hace ${hours} h`
  }

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Estado de Servicios</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando servicios pagados...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-colors">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Estado de Servicios Pagados en Vivo
        </CardTitle>
      </CardHeader>
      <CardContent>
        {services.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aun no hay pagos completados hoy en tiempo real</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="p-3 bg-secondary/50 rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{service.service_icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground text-sm">{service.service_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(service.transaction_date).toLocaleDateString("es-MX")}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    className={`text-xs border ${statusColors[service.status] || statusColors.completed}`}
                    variant="outline"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Pagado
                  </Badge>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">Monto:</span>
                  <span className="text-sm font-bold text-foreground">${service.amount.toFixed(2)} MXN</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">Confirmado:</span>
                  <span className="text-xs font-semibold text-emerald-600">{formatElapsed(service.transaction_date)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
