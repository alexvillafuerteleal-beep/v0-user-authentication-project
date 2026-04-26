"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Droplet, Zap, Flame, Wifi, Edit2, Loader2, Phone, Tv, ShieldCheck, RefreshCw } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface ServiceItem {
  dbId: string | null
  icon: React.ElementType
  name: string
  id: string
  company: string
  amount: number
  dueDate: string
  status: string
}

const serviceIconMap: Record<string, React.ElementType> = {
  electricity: Zap,
  water: Droplet,
  gas: Flame,
  internet: Wifi,
  phone: Phone,
  tv: Tv,
  insurance: ShieldCheck,
}

const serviceNameMap: Record<string, string> = {
  electricity: "Electricidad",
  water: "Agua",
  gas: "Gas",
  internet: "Internet",
  phone: "Telefonía",
  tv: "Televisión",
  insurance: "Seguros",
}

function computeStatus(dueDayOfMonth: number): string {
  const today = new Date()
  const dueDate = new Date(today.getFullYear(), today.getMonth(), dueDayOfMonth)
  const diff = (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  if (diff < 0) return "Vencida"
  if (diff <= 5) return "Próxima"
  return "Próxima"
}

function formatDueDate(dueDayOfMonth: number): string {
  const today = new Date()
  const d = new Date(today.getFullYear(), today.getMonth(), dueDayOfMonth)
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
}

function parseDayFromString(dateStr: string): number {
  const parts = dateStr.split("/")
  return parseInt(parts[0]) || 1
}

export default function MisServiciosPage() {
  const [services, setServices] = useState<ServiceItem[]>([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState({ amount: 0, dueDate: "", company: "" })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newService, setNewService] = useState({ name: "", company: "", amount: "", dueDate: "", type: "electricity" })
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null)
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const loadServices = useCallback(async () => {
    setLoadingServices(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("user_services")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["active", "paid"])  // mostrar tanto activos como pagados
        .order("created_at", { ascending: true })

      if (error) throw error

      if (data && data.length > 0) {
        const mapped: ServiceItem[] = data.map((row) => ({
          dbId: row.id,
          icon: serviceIconMap[row.service_type] ?? Zap,
          name: serviceNameMap[row.service_type] ?? row.service_type,
          id: row.service_type + "-" + row.id,
          company: row.provider,
          amount: row.last_amount ?? 0,
          dueDate: row.due_date ? formatDueDate(row.due_date) : "—",
          status: row.status === "paid" ? "Pagada" : (row.due_date ? computeStatus(row.due_date) : "Próxima"),
        }))
        setServices(mapped)
      } else {
        // Default services seeded locally if user has no services yet
        setServices([
          { dbId: null, icon: Zap, name: "Electricidad", id: "electricity-default", company: "CFE", amount: 2750, dueDate: "20/04/2026", status: "Vencida" },
          { dbId: null, icon: Droplet, name: "Agua", id: "water-default", company: "CONAGUA", amount: 1040, dueDate: "15/04/2026", status: "Pagada" },
          { dbId: null, icon: Flame, name: "Gas", id: "gas-default", company: "PEMEX Gas", amount: 1507, dueDate: "18/04/2026", status: "Próxima" },
          { dbId: null, icon: Wifi, name: "Internet", id: "internet-default", company: "TELMEX", amount: 2062, dueDate: "25/04/2026", status: "Próxima" },
        ])
      }
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar los servicios", variant: "destructive" })
    } finally {
      setLoadingServices(false)
    }
  }, [supabase, toast])

  useEffect(() => { loadServices() }, [loadServices])

  // Maneja retorno desde Stripe (success / cancelled)
  useEffect(() => {
    const payment = searchParams.get("payment")
    const service = searchParams.get("service")
    const provider = searchParams.get("provider")

    if (payment === "success") {
      const desc = service && provider
        ? `Pago de ${service} — ${provider} procesado exitosamente.`
        : `Pago de ${service || "servicio"} procesado exitosamente.`
      toast({ title: "✅ Pago completado", description: desc, duration: 6000 })
      loadServices() // Recargar para reflejar estado actualizado
      // Limpiar query params sin recargar la página
      router.replace("/dashboard/servicios", { scroll: false })
    } else if (payment === "cancelled") {
      toast({ title: "❌ Pago cancelado", description: "Puedes intentarlo de nuevo cuando quieras.", variant: "destructive", duration: 4000 })
      router.replace("/dashboard/servicios", { scroll: false })
    }
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleEditClick = (service: ServiceItem) => {
    setEditingId(service.id)
    setEditData({ amount: service.amount, dueDate: service.dueDate, company: service.company })
    setDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingId) return
    const service = services.find((s) => s.id === editingId)
    if (!service) return

    const dueDay = parseDayFromString(editData.dueDate)

    try {
      if (service.dbId) {
        const { error } = await supabase
          .from("user_services")
          .update({ provider: editData.company, last_amount: editData.amount, due_date: dueDay })
          .eq("id", service.dbId)
        if (error) throw error
      }

      setServices(services.map((s) =>
        s.id === editingId ? { ...s, amount: editData.amount, dueDate: editData.dueDate, company: editData.company } : s
      ))

      toast({ title: "✅ Servicio actualizado", description: "Los cambios se guardaron correctamente", duration: 3000 })
      setDialogOpen(false)
      setEditingId(null)
    } catch {
      toast({ title: "Error", description: "No se pudo actualizar el servicio", variant: "destructive" })
    }
  }

  const handleAddService = async () => {
    if (!newService.name || !newService.company || !newService.amount || !newService.dueDate) {
      toast({ title: "⚠️ Completa todos los campos", variant: "destructive" })
      return
    }
    const dueDay = parseDayFromString(newService.dueDate)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No autenticado")

      const { data: inserted, error } = await supabase
        .from("user_services")
        .insert({
          user_id: user.id,
          service_type: newService.type,
          provider: newService.company,
          last_amount: parseFloat(newService.amount),
          due_date: dueDay,
          status: "active",
        })
        .select()
        .single()

      if (error) throw error

      const IconComponent = serviceIconMap[newService.type] || Zap
      const newEntry: ServiceItem = {
        dbId: inserted.id,
        icon: IconComponent,
        name: newService.name || serviceNameMap[newService.type] || newService.type,
        id: newService.type + "-" + inserted.id,
        company: newService.company,
        amount: parseFloat(newService.amount),
        dueDate: formatDueDate(dueDay),
        status: computeStatus(dueDay),
      }
      setServices((prev) => [...prev.filter((s) => s.dbId !== null), newEntry])
      setNewService({ name: "", company: "", amount: "", dueDate: "", type: "electricity" })
      setAddDialogOpen(false)
      toast({ title: "✅ Servicio agregado", description: `${newEntry.name} fue guardado en tu cuenta` })
    } catch {
      toast({ title: "Error", description: "No se pudo guardar el servicio", variant: "destructive" })
    }
  }

  const handlePayment = async (service: ServiceItem) => {
    setPaymentLoading(service.id)

    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: service.amount,
          service: service.name,
          serviceId: service.dbId ?? service.id,
          provider: service.company,        // ← nombre del proveedor (TELMEX, CFE…)
          serviceType: service.id.split("-")[0], // ← tipo (internet, electricity…)
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al crear la sesión de pago")
      }

      const { url } = await response.json()

      if (url) {
        toast({
          title: "💳 Redirigiendo a Stripe...",
          description: `Pago de ${service.name} (${service.company}): $${service.amount.toLocaleString()} MXN`,
          duration: 2000,
        })
        setTimeout(() => { window.location.href = url }, 1000)
      }
    } catch (error) {
      toast({
        title: "❌ Error en el pago",
        description: error instanceof Error ? error.message : "Intenta nuevamente",
        variant: "destructive",
      })
    } finally {
      setPaymentLoading(null)
    }
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Mis Servicios</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Gestiona tus servicios y pagos vinculados</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="border-border/50 hover:bg-secondary/70"
            onClick={loadServices}
            disabled={loadingServices}
            title="Actualizar servicios"
          >
            <RefreshCw className={`w-4 h-4 ${loadingServices ? "animate-spin" : ""}`} />
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-full sm:w-auto"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar Servicio
          </Button>
        </div>
      </div>

      {loadingServices ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card p-6 space-y-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-secondary" />
                <div className="h-6 w-24 bg-secondary rounded" />
              </div>
              <div className="h-5 w-3/4 bg-secondary rounded mt-4" />
              <div className="h-4 w-1/2 bg-secondary rounded" />
              <div className="h-10 bg-secondary rounded mt-2" />
            </div>
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {services.map((service) => (
          <Card key={service.id} className="hover:border-primary/50 transition-all hover:shadow-lg group cursor-pointer bg-gradient-to-br from-card to-card/80 border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <service.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-lg font-bold text-accent group-hover:scale-110 transition-transform origin-right">${service.amount.toLocaleString()} MXN</span>
              </div>
              <CardTitle className="text-base sm:text-lg mt-3 text-foreground">{service.name}</CardTitle>
              <CardDescription className="text-xs sm:text-sm">{service.company}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">📅 Vencimiento</p>
                <p className="font-bold text-foreground text-sm">{service.dueDate}</p>
              </div>
              
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">📊 Estado</p>
                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors ${
                  service.status === "Pagada" 
                    ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-600 border border-green-500/30" 
                    : service.status === "Vencida" 
                    ? "bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-600 border border-red-500/30" 
                    : "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-600 border border-amber-500/30"
                }`}>
                  {service.status === "Pagada" && "✅"}
                  {service.status === "Vencida" && "⚠️"}
                  {service.status === "Próxima" && "🕐"}
                  {service.status}
                </span>
              </div>

              <div className="pt-2 flex gap-2">
                <Dialog open={dialogOpen && editingId === service.id} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 border-border/50 hover:bg-secondary/70 text-xs sm:text-sm h-9"
                      onClick={() => handleEditClick(service)}
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      Editar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border w-full sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">Editar {service.name}</DialogTitle>
                      <DialogDescription className="text-sm">
                        Actualiza los datos del servicio de {service.company}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-foreground text-sm">Empresa</Label>
                        <Input 
                          value={editData.company}
                          onChange={(e) => setEditData({...editData, company: e.target.value})}
                          className="border-border bg-secondary/50 text-foreground mt-1.5 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-foreground text-sm">Monto (MXN)</Label>
                        <Input 
                          type="number"
                          value={editData.amount}
                          onChange={(e) => setEditData({...editData, amount: parseFloat(e.target.value)})}
                          className="border-border bg-secondary/50 text-foreground mt-1.5 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-foreground text-sm">Fecha de Vencimiento</Label>
                        <Input 
                          type="text"
                          placeholder="DD/MM/YYYY"
                          value={editData.dueDate}
                          onChange={(e) => setEditData({...editData, dueDate: e.target.value})}
                          className="border-border bg-secondary/50 text-foreground mt-1.5 text-sm"
                        />
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button 
                          variant="outline"
                          className="flex-1 border-border hover:bg-secondary text-foreground text-sm"
                          onClick={() => setDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          className="flex-1 bg-primary hover:bg-primary/90 text-sm"
                          onClick={handleSaveEdit}
                        >
                          Guardar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button 
                  size="sm" 
                  className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white disabled:opacity-50 text-xs sm:text-sm h-9"
                  onClick={() => handlePayment(service)}
                  disabled={paymentLoading === service.id}
                >
                  {paymentLoading === service.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      <span className="hidden sm:inline">Procesando...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      💳
                      <span className="hidden sm:inline ml-1">Pagar</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}
      {/* Add Service Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="bg-card border-border w-full sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Agregar Nuevo Servicio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-foreground text-sm">Tipo de Servicio</Label>
              <select
                value={newService.type}
                onChange={(e) => setNewService({ ...newService, type: e.target.value })}
                className="w-full mt-1.5 rounded-md border border-border bg-secondary/50 text-foreground text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="electricity">⚡ Electricidad</option>
                <option value="water">💧 Agua</option>
                <option value="gas">🔥 Gas</option>
                <option value="internet">📶 Internet</option>
                <option value="phone">📱 Telefonía</option>
                <option value="tv">📺 Televisión</option>
                <option value="insurance">🛡️ Seguros</option>
              </select>
            </div>
            <div>
              <Label className="text-foreground text-sm">Nombre del Servicio</Label>
              <Input
                placeholder="Ej: Luz de casa"
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                className="border-border bg-secondary/50 text-foreground mt-1.5 text-sm"
              />
            </div>
            <div>
              <Label className="text-foreground text-sm">Empresa / Proveedor</Label>
              <Input
                placeholder="Ej: CFE, TELMEX..."
                value={newService.company}
                onChange={(e) => setNewService({ ...newService, company: e.target.value })}
                className="border-border bg-secondary/50 text-foreground mt-1.5 text-sm"
              />
            </div>
            <div>
              <Label className="text-foreground text-sm">Monto a Pagar (MXN)</Label>
              <Input
                type="number"
                placeholder="Ej: 1500"
                value={newService.amount}
                onChange={(e) => setNewService({ ...newService, amount: e.target.value })}
                className="border-border bg-secondary/50 text-foreground mt-1.5 text-sm"
              />
            </div>
            <div>
              <Label className="text-foreground text-sm">Fecha de Vencimiento</Label>
              <Input
                type="text"
                placeholder="DD/MM/YYYY"
                value={newService.dueDate}
                onChange={(e) => setNewService({ ...newService, dueDate: e.target.value })}
                className="border-border bg-secondary/50 text-foreground mt-1.5 text-sm"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-border text-foreground text-sm"
                onClick={() => setAddDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90 text-sm"
                onClick={handleAddService}
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
