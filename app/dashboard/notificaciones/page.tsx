"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Trash2, AlertTriangle, Info, CheckCircle2, Bell } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Alert {
  id: string
  user_id: string
  title: string
  message: string
  type: "info" | "warning" | "error" | "success"
  is_read: boolean
  created_at: string
}

type FilterType = "all" | "info" | "warning" | "error" | "success"

export default function NotificacionesPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>("all")
  const [markingRead, setMarkingRead] = useState<string | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("user_id", user?.id ?? "")
        .order("created_at", { ascending: false })

      if (error) throw error
      setAlerts((data as Alert[]) || [])
    } catch (error) {
      console.error("Error loading alerts:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las notificaciones",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      setMarkingRead(id)
      const { error } = await supabase
        .from("alerts")
        .update({ is_read: true })
        .eq("id", id)

      if (error) throw error

      setAlerts(alerts.map((a) => (a.id === id ? { ...a, is_read: true } : a)))
      toast({ title: "Éxito", description: "Notificación marcada como leída" })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar",
        variant: "destructive",
      })
    } finally {
      setMarkingRead(null)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setDeleting(id)
      const { error } = await supabase
        .from("alerts")
        .delete()
        .eq("id", id)

      if (error) throw error

      setAlerts(alerts.filter((a) => a.id !== id))
      toast({ title: "Éxito", description: "Notificación eliminada" })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar",
        variant: "destructive",
      })
    } finally {
      setDeleting(null)
    }
  }

  const handleClearAll = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from("alerts")
        .delete()
        .eq("user_id", user?.id ?? "")

      if (error) throw error

      setAlerts([])
      toast({ title: "Éxito", description: "Todas las notificaciones fueron eliminadas" })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron eliminar",
        variant: "destructive",
      })
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from("alerts")
        .update({ is_read: true })
        .eq("user_id", user?.id ?? "")
        .eq("is_read", false)

      if (error) throw error

      setAlerts(alerts.map((a) => ({ ...a, is_read: true })))
      toast({ title: "Éxito", description: "Todas las notificaciones marcadas como leídas" })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar",
        variant: "destructive",
      })
    }
  }

  const filteredAlerts = filter === "all" ? alerts : alerts.filter((a) => a.type === filter)
  const unreadCount = alerts.filter((a) => !a.is_read).length

  const getIconForType = (type: string) => {
    switch (type) {
      case "error":
        return <AlertTriangle className="w-4 h-4" />
      case "warning":
        return <AlertTriangle className="w-4 h-4" />
      case "success":
        return <CheckCircle2 className="w-4 h-4" />
      case "info":
      default:
        return <Info className="w-4 h-4" />
    }
  }

  const getColorForType = (type: string) => {
    switch (type) {
      case "error":
        return "bg-red-500/10 border-red-500/30 text-red-600"
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/30 text-yellow-600"
      case "success":
        return "bg-green-500/10 border-green-500/30 text-green-600"
      case "info":
      default:
        return "bg-blue-500/10 border-blue-500/30 text-blue-600"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Bell className="w-8 h-8" />
          Notificaciones
        </h1>
        <p className="text-muted-foreground mt-2">Gestiona tus alertas y notificaciones</p>
      </div>

      {/* Stats and Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Notificaciones sin leer</p>
                <p className="text-3xl font-bold text-foreground mt-1">{unreadCount}</p>
              </div>
              <Badge variant="default" className="text-lg px-3 py-1">
                {unreadCount}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total de notificaciones</p>
            <p className="text-3xl font-bold text-foreground mt-1">{alerts.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={handleMarkAllAsRead}
          disabled={unreadCount === 0}
          className="bg-primary hover:bg-primary/90"
        >
          Marcar todas como leídas
        </Button>
        <Button
          onClick={handleClearAll}
          disabled={alerts.length === 0}
          variant="outline"
          className="border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          Limpiar todas
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-sm font-medium text-foreground self-center">Filtrar por tipo:</span>
        {[
          { label: "Todas", value: "all" as FilterType },
          { label: "Información", value: "info" as FilterType },
          { label: "Advertencias", value: "warning" as FilterType },
          { label: "Errores", value: "error" as FilterType },
          { label: "Éxito", value: "success" as FilterType },
        ].map((btn) => (
          <Button
            key={btn.value}
            onClick={() => setFilter(btn.value)}
            variant={filter === btn.value ? "default" : "outline"}
            className={filter === btn.value ? "bg-primary" : "border-border"}
            size="sm"
          >
            {btn.label}
          </Button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <Card className="bg-card border-border">
            <CardContent className="pt-6 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-foreground" />
              <p className="text-muted-foreground">Cargando notificaciones...</p>
            </CardContent>
          </Card>
        ) : filteredAlerts.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="pt-6 text-center">
              <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground">No hay notificaciones en esta categoría</p>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => (
            <Card
              key={alert.id}
              className={`bg-card border border-border transition-opacity ${
                alert.is_read ? "opacity-75" : "opacity-100"
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Type Badge */}
                    <div className={`p-2 rounded-lg ${getColorForType(alert.type)}`}>
                      {getIconForType(alert.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{alert.title}</h3>
                        {!alert.is_read && <Badge>Nuevo</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 break-words">
                        {alert.message}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-2">
                        {new Date(alert.created_at).toLocaleDateString("es-MX", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {!alert.read && (
                      <Button
                        onClick={() => handleMarkAsRead(alert.id)}
                        disabled={markingRead === alert.id}
                        variant="outline"
                        size="sm"
                        className="border-border text-foreground hover:bg-secondary"
                      >
                        {markingRead === alert.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Marcar leído"
                        )}
                      </Button>
                    )}
                    <Button
                      onClick={() => handleDelete(alert.id)}
                      disabled={deleting === alert.id}
                      variant="outline"
                      size="sm"
                      className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    >
                      {deleting === alert.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
