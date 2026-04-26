"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Bell, Shield, Palette, Eye, Volume2, Mail, Loader2, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getUserPreferences, updateUserPreferences } from "@/lib/supabase/services"
import type { UserPreferences } from "@/lib/supabase/services"

export default function ConfiguracionPage() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [reminderPrefs, setReminderPrefs] = useState({ remind7d: true, remind3d: true, remindDay: true })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalPreferences, setOriginalPreferences] = useState<UserPreferences | null>(null)
  
  const [preferences, setPreferences] = useState<UserPreferences>({
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    alert_notifications: true,
    weekly_report: true,
    profile_public: false,
    share_data: false,
    analytics_enabled: true,
    theme: "dark",
    zoom: "normal",
  })

  useEffect(() => {
    const loadPreferences = async () => {
      setLoading(true)
      const prefs = await getUserPreferences()
      setPreferences(prefs)
      setOriginalPreferences(prefs)
      setHasChanges(false)
      const savedReminders = localStorage.getItem("pagoIA_reminders")
      if (savedReminders) {
        try { setReminderPrefs(JSON.parse(savedReminders)) } catch {}
      }
      setLoading(false)
    }
    loadPreferences()
  }, [])

  const handleToggleNotification = (key: keyof UserPreferences) => {
    const newPrefs = {
      ...preferences,
      [key]: !preferences[key as keyof typeof preferences]
    }
    setPreferences(newPrefs)
    setHasChanges(JSON.stringify(newPrefs) !== JSON.stringify(originalPreferences))
    setSaved(false)
  }

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    const newPrefs = { ...preferences, theme: newTheme }
    setPreferences(newPrefs)
    setTheme(newTheme)
    setHasChanges(JSON.stringify(newPrefs) !== JSON.stringify(originalPreferences))
    setSaved(false)
  }

  const handleZoomChange = (zoom: "small" | "normal" | "large") => {
    const newPrefs = { ...preferences, zoom }
    setPreferences(newPrefs)
    
    // Aplicar zoom al documento
    const zoomValues = { small: "0.85", normal: "1", large: "1.15" }
    document.documentElement.style.fontSize = zoomValues[zoom] === "1" ? "16px" : `${parseFloat(zoomValues[zoom]) * 16}px`
    
    setHasChanges(JSON.stringify(newPrefs) !== JSON.stringify(originalPreferences))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateUserPreferences(preferences)
      localStorage.setItem("pagoIA_reminders", JSON.stringify(reminderPrefs))
      setSaving(false)
      setOriginalPreferences(preferences)
      setHasChanges(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setSaving(false)
      console.error("Error al guardar:", err)
    }
  }

  const handleCancel = () => {
    if (originalPreferences) {
      setPreferences(originalPreferences)
      setTheme(originalPreferences.theme)
      
      // Resetear zoom
      const zoomValues = { small: "0.85", normal: "1", large: "1.15" }
      document.documentElement.style.fontSize = zoomValues[originalPreferences.zoom] === "1" ? "16px" : `${parseFloat(zoomValues[originalPreferences.zoom]) * 16}px`
      
      // Restaurar recordatorios
      const savedReminders = localStorage.getItem("pagoIA_reminders")
      if (savedReminders) {
        try { setReminderPrefs(JSON.parse(savedReminders)) } catch {}
      } else {
        setReminderPrefs({ remind7d: true, remind3d: true, remindDay: true })
      }

      setHasChanges(false)
      setSaved(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground">Personaliza tu experiencia en PagoIA</p>
      </div>

      {saved && (
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="pt-6 flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            <span>Cambios guardados exitosamente</span>
          </CardContent>
        </Card>
      )}

      {/* Notification Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-foreground">Notificaciones</CardTitle>
              <CardDescription>Controla cómo y cuándo recibir alertas</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { 
              key: "email_notifications", 
              label: "Notificaciones por Email", 
              desc: "Recibe alertas importantes en tu correo" 
            },
            { 
              key: "push_notifications", 
              label: "Notificaciones Push", 
              desc: "Alertas en tiempo real en tu navegador" 
            },
            { 
              key: "sms_notifications", 
              label: "Mensajes por SMS", 
              desc: "Avisos críticos por texto" 
            },
            { 
              key: "alert_notifications", 
              label: "Alertas de Vencimientos", 
              desc: "Recordatorios de pagos próximos" 
            },
            { 
              key: "weekly_report", 
              label: "Reporte Semanal", 
              desc: "Resumen de tu actividad cada semana" 
            },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors">
              <div>
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
              <Switch
                checked={preferences[item.key as keyof UserPreferences] as boolean}
                onCheckedChange={() => handleToggleNotification(item.key as keyof UserPreferences)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Email Alerts Settings */}
      <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-blue-500" />
            <div>
              <CardTitle className="text-foreground">📧 Alertas por Email - Vencimientos</CardTitle>
              <CardDescription>Recibe recordatorios de pagos próximos</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-xl">⏰</span>
              <div>
                <p className="font-medium text-foreground">Recordatorio 7 días antes</p>
                <p className="text-sm text-muted-foreground">Se enviará un email 7 días antes del vencimiento</p>
              </div>
              <Switch
                checked={reminderPrefs.remind7d}
                onCheckedChange={() => { setReminderPrefs(p => ({...p, remind7d: !p.remind7d})); setHasChanges(true); setSaved(false) }}
                className="ml-auto"
              />
            </div>
            
            <Separator className="bg-border/50" />
            
            <div className="flex items-start gap-3">
              <span className="text-xl">📅</span>
              <div>
                <p className="font-medium text-foreground">Recordatorio 3 días antes</p>
                <p className="text-sm text-muted-foreground">Segundo aviso 3 días antes del vencimiento</p>
              </div>
              <Switch
                checked={reminderPrefs.remind3d}
                onCheckedChange={() => { setReminderPrefs(p => ({...p, remind3d: !p.remind3d})); setHasChanges(true); setSaved(false) }}
                className="ml-auto"
              />
            </div>

            <Separator className="bg-border/50" />
            
            <div className="flex items-start gap-3">
              <span className="text-xl">🔔</span>
              <div>
                <p className="font-medium text-foreground">Recordatorio el día del vencimiento</p>
                <p className="text-sm text-muted-foreground">Notificación en el día exacto del pago</p>
              </div>
              <Switch
                checked={reminderPrefs.remindDay}
                onCheckedChange={() => { setReminderPrefs(p => ({...p, remindDay: !p.remindDay})); setHasChanges(true); setSaved(false) }}
                className="ml-auto"
              />
            </div>

            <Separator className="bg-border/50" />

            <div className="bg-amber-500/20 border border-amber-500/30 p-3 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">💡 Consejo:</p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Habilita todos los recordatorios para no perder ningún pago importante
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300 font-medium">✅ Estado de Alertas:</p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Todas las alertas están activas. Recibirás notificaciones por email en tu correo registrado.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-500" />
            <div>
              <CardTitle className="text-foreground">Privacidad y Seguridad</CardTitle>
              <CardDescription>Controla tu privacidad y datos</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { 
              key: "profile_public", 
              label: "Perfil Público", 
              desc: "Permite que otros usuarios vean tu perfil" 
            },
            { 
              key: "share_data", 
              label: "Compartir Datos", 
              desc: "Ayuda a mejorar PagoIA compartiendo datos anónimos" 
            },
            { 
              key: "analytics_enabled", 
              label: "Análisis", 
              desc: "Permitir análisis de uso para personalizar tu experiencia" 
            },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors">
              <div>
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
              <Switch
                checked={preferences[item.key as keyof UserPreferences] as boolean}
                onCheckedChange={() => handleToggleNotification(item.key as keyof UserPreferences)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-purple-500" />
            <div>
              <CardTitle className="text-foreground">Apariencia</CardTitle>
              <CardDescription>Personaliza cómo se ve PagoIA</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium text-foreground mb-3">Tema</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "light", label: "Claro", icon: "☀️" },
                { value: "dark", label: "Oscuro", icon: "🌙" },
                { value: "system", label: "Sistema", icon: "💻" },
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => handleThemeChange(t.value as "light" | "dark" | "system")}
                  className={`p-3 rounded-lg border-2 transition-colors text-center space-y-2 ${
                    preferences.theme === t.value
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/50 hover:bg-secondary"
                  }`}
                >
                  <span className="text-2xl block">{t.icon}</span>
                  <span className="text-sm font-medium text-foreground">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator className="bg-border" />

          <div>
            <p className="font-medium text-foreground">Zoom</p>
            <p className="text-sm text-muted-foreground mb-3">Ajusta el tamaño del texto</p>
            <div className="flex gap-2">
              {[
                { value: "small" as const, label: "Pequeño" },
                { value: "normal" as const, label: "Normal" },
                { value: "large" as const, label: "Grande" }
              ].map((size) => (
                <Button
                  key={size.value}
                  onClick={() => handleZoomChange(size.value)}
                  variant={preferences.zoom === size.value ? "default" : "outline"}
                  className={preferences.zoom === size.value ? "bg-primary hover:bg-primary/90" : "border-border text-foreground"}
                >
                  {size.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Plan de Suscripción</CardTitle>
          <CardDescription>Información de tu plan actual</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">Plan Free</p>
                <p className="text-sm text-muted-foreground">Características básicas incluidas</p>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                Activo
              </Badge>
            </div>
          </div>
          <Button
            className="w-full bg-primary hover:bg-primary/90"
            onClick={() => toast({ title: "🚀 Plan Pro", description: "Próximamente disponible. ¡Te avisaremos cuando esté listo!" })}
          >
            Actualizar a Plan Pro
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="bg-card border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
          <CardDescription>Acciones que no se pueden deshacer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => router.push("/dashboard/perfil")}>
            Cambiar Contraseña
          </Button>
          <Button variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => router.push("/dashboard/perfil")}>
            Descargar Mis Datos
          </Button>
          <Button variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => router.push("/dashboard/perfil")}>
            Eliminar Cuenta
          </Button>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex gap-2 sticky bottom-0 bg-background/95 backdrop-blur p-4 border-t border-border rounded-lg">
        <Button 
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="bg-primary hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar cambios"
          )}
        </Button>
        <Button 
          onClick={handleCancel}
          disabled={!hasChanges}
          variant="outline" 
          className="border-border text-foreground hover:bg-secondary disabled:opacity-50"
        >
          Cancelar
        </Button>
      </div>
    </div>
  )
}
