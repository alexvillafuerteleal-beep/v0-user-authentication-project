"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, User, Mail, Phone, MapPin, Calendar, Lock, Download, Trash2, AlertCircle, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { 
  getTotalPending, 
  getUserServices, 
  getEstimatedSavings 
} from "@/lib/supabase/services"
import type { User as AuthUser } from "@supabase/supabase-js"

export default function PerfilPage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [stats, setStats] = useState({
    totalPending: 0,
    servicesCount: 0,
    estimatedSavings: 0,
  })
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    country: "",
  })
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  })
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }
      setUser(user)
      setFormData({
        fullName: user.user_metadata?.full_name || "",
        phone: user.user_metadata?.phone || "",
        country: user.user_metadata?.country || "Perú",
      })
      
      // Cargar estadísticas
      const [pending, services, savings] = await Promise.all([
        getTotalPending(),
        getUserServices(),
        getEstimatedSavings(),
      ])
      
      setStats({
        totalPending: pending,
        servicesCount: services.length,
        estimatedSavings: savings,
      })
      
      setLoading(false)
    }
    getUser()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const userInitials = user.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
    : user.email?.charAt(0).toUpperCase() || "U"

  const createdAt = new Date(user.created_at || "").toLocaleDateString("es-MX", { 
    year: "numeric", 
    month: "long", 
    day: "numeric" 
  })

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName,
          phone: formData.phone,
          country: formData.country,
        },
      })

      if (error) throw error

      const { data: { user: updatedUser } } = await supabase.auth.getUser()
      setUser(updatedUser)
      setEditing(false)
      toast({
        title: "Éxito",
        description: "Perfil actualizado correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordData.new || !passwordData.confirm) {
      toast({ title: "Error", description: "Completa todos los campos", variant: "destructive" })
      return
    }
    if (passwordData.new !== passwordData.confirm) {
      toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new,
      })

      if (error) throw error

      setPasswordData({ current: "", new: "", confirm: "" })
      toast({ title: "Éxito", description: "Contraseña cambiada correctamente" })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo cambiar",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadData = async () => {
    setDownloading(true)
    try {
      const userData = {
        profile: user?.user_metadata,
        email: user?.email,
        created_at: user?.created_at,
        updated_at: user?.updated_at,
        stats,
      }

      const dataStr = JSON.stringify(userData, null, 2)
      const blob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `pagoIA-datos-${new Date().toISOString().split("T")[0]}.json`
      link.click()
      URL.revokeObjectURL(url)

      toast({ title: "Éxito", description: "Datos descargados correctamente" })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo descargar los datos",
        variant: "destructive",
      })
    } finally {
      setDownloading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "ELIMINAR") {
      toast({
        title: "Error",
        description: "Debes escribir ELIMINAR para confirmar",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      // Sign out the user
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      // Redirect to home
      router.push("/")
      toast({ title: "Cuenta eliminada", description: "Tu cuenta ha sido eliminada. Por favor contacta a soporte si necesitas más ayuda." })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mi Perfil</h1>
        <p className="text-muted-foreground">Administra tu información personal</p>
      </div>

      {/* Avatar Card */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24 border-2 border-primary">
              <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || ""} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">
                {user.user_metadata?.full_name || "Usuario"}
              </h2>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                  ✓ Verificado
                </Badge>
              </div>
            </div>
            {!editing && (
              <Button 
                onClick={() => setEditing(true)}
                className="bg-primary hover:bg-primary/90"
              >
                Editar Perfil
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Información Personal</CardTitle>
          <CardDescription>Detalles de tu cuenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                <User className="w-4 h-4" />
                Nombre Completo
              </label>
              <Input 
                disabled={!editing}
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <Input 
                disabled
                value={user.email || ""}
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4" />
                Teléfono
              </label>
              <Input 
                disabled={!editing}
                placeholder="Agregar teléfono"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4" />
                País
              </label>
              <Input 
                disabled={!editing}
                placeholder="Seleccionar país"
                value={formData.country}
                onChange={(e) => setFormData({...formData, country: e.target.value})}
                className="bg-secondary border-border text-foreground"
              />
            </div>
          </div>

          {editing && (
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleSaveProfile}
                disabled={saving}
                className="bg-primary hover:bg-primary/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setEditing(false)
                  setFormData({
                    fullName: user?.user_metadata?.full_name || "",
                    phone: user?.user_metadata?.phone || "",
                    country: user?.user_metadata?.country || "Perú",
                  })
                }}
                className="border-border text-foreground hover:bg-secondary"
              >
                Cancelar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">${stats.totalPending.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground mt-1">Total por Pagar</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{stats.servicesCount}</p>
              <p className="text-sm text-muted-foreground mt-1">Servicios Activos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">${stats.estimatedSavings.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground mt-1">Ahorro Estimado</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Created */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Cuenta creada el {createdAt}</span>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Change Password */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-20 border-border text-foreground hover:bg-secondary flex flex-col items-center justify-center">
              <Lock className="w-5 h-5 mb-2" />
              <span>Cambiar Contraseña</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Cambiar Contraseña</DialogTitle>
              <DialogDescription>Establece una nueva contraseña para tu cuenta</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Nueva Contraseña</label>
                <Input 
                  type="password"
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                  className="border-border bg-secondary/50"
                  placeholder="Contraseña nueva"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Confirmar Contraseña</label>
                <Input 
                  type="password"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                  className="border-border bg-secondary/50"
                  placeholder="Confirmar contraseña"
                />
              </div>
              <Button 
                onClick={handleChangePassword}
                disabled={saving}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cambiando...
                  </>
                ) : (
                  "Cambiar Contraseña"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Download Data */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-20 border-border text-foreground hover:bg-secondary flex flex-col items-center justify-center">
              <Download className="w-5 h-5 mb-2" />
              <span>Descargar Datos</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Descargar Tus Datos</DialogTitle>
              <DialogDescription>Descarga una copia de toda tu información personal en formato JSON</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-600">Se descargará un archivo JSON con toda tu información personal, estadísticas y metadatos.</p>
              </div>
              <Button 
                onClick={handleDownloadData}
                disabled={downloading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {downloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Descargando...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Descargar Datos
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Account */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-20 border-destructive/30 text-destructive hover:bg-destructive/10 flex flex-col items-center justify-center">
              <Trash2 className="w-5 h-5 mb-2" />
              <span>Eliminar Cuenta</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-destructive">Eliminar Cuenta</DialogTitle>
              <DialogDescription>Esta acción no se puede deshacer</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex gap-2">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Acción permanente</p>
                  <p className="text-xs text-destructive/80 mt-1">Todos tus datos serán eliminados y no podremos recuperarlos.</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Escribe "ELIMINAR" para confirmar</label>
                <Input 
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value.toUpperCase())}
                  className="border-border bg-secondary/50"
                  placeholder="ELIMINAR"
                />
              </div>
              <Button 
                onClick={handleDeleteAccount}
                disabled={saving || deleteConfirmation !== "ELIMINAR"}
                className="w-full bg-destructive hover:bg-destructive/90 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  "Eliminar Mi Cuenta"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
