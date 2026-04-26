"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Bell, AlertCircle, CheckCircle2, Info } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getAlerts, markAlertAsRead } from "@/lib/supabase/services"
import type { Alert } from "@/lib/supabase/services"

export function NotificationsDropdown() {
  const router = useRouter()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void loadAlerts()

    const supabase = createClient()
    const channel = supabase
      .channel("notifications-dropdown-live")
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
    const data = await getAlerts(false)
    setAlerts(data.slice(0, 5))
    setUnreadCount(data.filter(a => !a.is_read).length)
    setLoading(false)
  }

  const getIconByType = (type: string) => {
    switch (type) {
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      default:
        return <Info className="w-4 h-4 text-blue-500" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 bg-card border-border" align="end" forceMount>
        <DropdownMenuLabel className="font-semibold text-foreground">
          Notificaciones ({unreadCount})
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center text-muted-foreground text-sm">
              Cargando notificaciones...
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-3 text-center text-muted-foreground text-sm">
              No hay notificaciones
            </div>
          ) : (
            alerts.map((alert) => {
              const handleNotificationClick = async () => {
                if (!alert.is_read) {
                  await markAlertAsRead(alert.id)
                }

                if (alert.url) {
                  router.push(alert.url)
                } else {
                  router.push("/dashboard/notificaciones")
                }

                setAlerts((prev) =>
                  prev.map((item) => (item.id === alert.id ? { ...item, is_read: true } : item)),
                )
                setUnreadCount((prev) => Math.max(0, prev - (alert.is_read ? 0 : 1)))
              }

              return (
                <div
                  key={alert.id}
                  onClick={handleNotificationClick}
                  className={`p-3 hover:bg-secondary transition-colors border-b border-border/50 last:border-b-0 ${
                    alert.url ? "cursor-pointer" : "cursor-default"
                  } ${!alert.is_read ? "bg-primary/5" : ""}`}
                >
                  <div className="flex gap-3">
                    <div className="mt-1">
                      {getIconByType(alert.alert_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm line-clamp-1">
                        {alert.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {alert.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(alert.created_at).toLocaleDateString("es-MX")}
                      </p>
                      {alert.url && (
                        <p className="text-xs text-cyan-600 mt-1 font-semibold">→ Ir al pago</p>
                      )}
                    </div>
                    {!alert.is_read && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        <DropdownMenuSeparator className="bg-border" />
        <div className="p-2">
          <Button 
            variant="outline" 
            className="w-full border-border text-foreground hover:bg-secondary text-sm"
            onClick={() => router.push("/dashboard/notificaciones")}
          >
            Ver todas las notificaciones
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
