"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, TrendingUp, Clock } from "lucide-react"
import { getAlerts, markAlertAsRead } from "@/lib/supabase/services"
import { createClient } from "@/lib/supabase/client"
import type { Alert } from "@/lib/supabase/services"

export function SmartAlerts() {
  const router = useRouter()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void loadAlerts()

    const supabase = createClient()
    const channel = supabase
      .channel("smart-alerts-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts" },
        () => {
          void loadAlerts()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  async function loadAlerts() {
    setLoading(true)
    const data = await getAlerts(true) // Solo no leídas
    setAlerts(data.slice(0, 3)) // Últimas 3
    setLoading(false)
  }

  async function handleMarkAsRead(alertId: string) {
    await markAlertAsRead(alertId)
    setAlerts((prev) => prev.filter((a) => a.id !== alertId))
  }

  async function handleOpenAlert(alert: Alert) {
    await markAlertAsRead(alert.id)
    setAlerts((prev) => prev.filter((a) => a.id !== alert.id))

    if (alert.url) {
      router.push(alert.url)
      return
    }

    router.push("/dashboard/notificaciones")
  }

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Alertas Inteligentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando alertas...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-colors">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          Alertas Inteligentes (IA)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay alertas nuevas</p>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 bg-secondary/50 rounded-lg border-l-2 border-amber-500 hover:bg-secondary transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">{alert.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                  </div>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {alert.alert_type === "increase" ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <Clock className="w-3 h-3 mr-1" />
                    )}
                    {alert.alert_type === "increase" ? "Aumento" : "Próximo"}
                  </Badge>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleOpenAlert(alert)}
                  >
                    {alert.url ? "Ver detalle" : "Abrir centro"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => handleMarkAsRead(alert.id)}
                  >
                    Marcar leída
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
