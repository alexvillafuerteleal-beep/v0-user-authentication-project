"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit2, Trash2, Check, X } from "lucide-react"

interface Service {
  id: string
  name: string
  description: string
  category: string
  icon: string
  price: number
  is_active: boolean
  created_at: string
}

interface FormData {
  name: string
  description: string
  category: string
  icon: string
  price: number
  is_active: boolean
}

const initialFormData: FormData = {
  name: "",
  description: "",
  category: "",
  icon: "",
  price: 0,
  is_active: true,
}

export function AdminServicesPanel() {
  const [services, setServices] = useState<Service[]>([])
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { toast } = useToast()

  const internalToken = process.env.NEXT_PUBLIC_INTERNAL_API_TOKEN || ""

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services", {
        method: "GET",
      })

      if (!response.ok) throw new Error("Failed to fetch services")

      const data = await response.json()
      setServices(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los servicios",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.category) {
      toast({
        title: "Error",
        description: "Nombre y categoría son requeridos",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const url = editingId ? "/api/services" : "/api/services"
      const method = editingId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-internal-token": process.env.NEXT_PUBLIC_INTERNAL_API_TOKEN || "",
        },
        body: JSON.stringify({
          ...(editingId && { id: editingId }),
          ...formData,
        }),
      })

      if (!response.ok) throw new Error("Failed to save service")

      toast({
        title: "Éxito",
        description: editingId ? "Servicio actualizado" : "Servicio creado",
      })

      setFormData(initialFormData)
      setEditingId(null)
      fetchServices()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el servicio",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/services?id=${id}`, {
        method: "DELETE",
        headers: {
          "x-internal-token": process.env.NEXT_PUBLIC_INTERNAL_API_TOKEN || "",
        },
      })

      if (!response.ok) throw new Error("Failed to delete service")

      toast({
        title: "Éxito",
        description: "Servicio eliminado",
      })

      fetchServices()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el servicio",
        variant: "destructive",
      })
    } finally {
      setDeleteId(null)
    }
  }

  const handleEdit = (service: Service) => {
    setFormData({
      name: service.name,
      description: service.description,
      category: service.category,
      icon: service.icon,
      price: service.price,
      is_active: service.is_active,
    })
    setEditingId(service.id)
  }

  const handleCancel = () => {
    setFormData(initialFormData)
    setEditingId(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Gestión de Servicios</span>
            <Dialog>
              <DialogTrigger asChild>
                <Button onClick={handleCancel} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nuevo Servicio
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Editar Servicio" : "Nuevo Servicio"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Nombre</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Ej: Electricidad"
                    />
                  </div>

                  <div>
                    <Label>Descripción</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Ej: Suministro de energía eléctrica"
                    />
                  </div>

                  <div>
                    <Label>Categoría</Label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full px-3 py-2 border bg-background rounded-md"
                    >
                      <option value="">Seleccionar</option>
                      <option value="Servicios Básicos">Servicios Básicos</option>
                      <option value="Telecomunicaciones">Telecomunicaciones</option>
                      <option value="Entretenimiento">Entretenimiento</option>
                      <option value="Seguros">Seguros</option>
                      <option value="Membresías">Membresías</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>

                  <div>
                    <Label>Icono (emoji)</Label>
                    <Input
                      value={formData.icon}
                      onChange={(e) =>
                        setFormData({ ...formData, icon: e.target.value })
                      }
                      placeholder="Ej: ⚡"
                      maxLength={2}
                    />
                  </div>

                  <div>
                    <Label>Precio (MXN)</Label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price: parseFloat(e.target.value),
                        })
                      }
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({ ...formData, is_active: e.target.checked })
                      }
                      id="active"
                    />
                    <Label htmlFor="active">Activo</Label>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Guardando..." : "Guardar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Nombre</th>
                  <th className="text-left py-3 px-4">Categoría</th>
                  <th className="text-left py-3 px-4">Precio</th>
                  <th className="text-center py-3 px-4">Activo</th>
                  <th className="text-right py-3 px-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{service.icon}</span>
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {service.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{service.category}</td>
                    <td className="py-3 px-4">${service.price.toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">
                      {service.is_active ? (
                        <Check className="w-4 h-4 text-green-600 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-red-600 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(service)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editar Servicio</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                              <div>
                                <Label>Nombre</Label>
                                <Input
                                  value={formData.name}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      name: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <Label>Descripción</Label>
                                <Input
                                  value={formData.description}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      description: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <Label>Categoría</Label>
                                <select
                                  value={formData.category}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      category: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border bg-background rounded-md"
                                >
                                  <option value="">Seleccionar</option>
                                  <option value="Servicios Básicos">
                                    Servicios Básicos
                                  </option>
                                  <option value="Telecomunicaciones">
                                    Telecomunicaciones
                                  </option>
                                  <option value="Entretenimiento">
                                    Entretenimiento
                                  </option>
                                  <option value="Seguros">Seguros</option>
                                  <option value="Membresías">Membresías</option>
                                  <option value="Otros">Otros</option>
                                </select>
                              </div>
                              <div>
                                <Label>Icono</Label>
                                <Input
                                  value={formData.icon}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      icon: e.target.value,
                                    })
                                  }
                                  maxLength={2}
                                />
                              </div>
                              <div>
                                <Label>Precio</Label>
                                <Input
                                  type="number"
                                  value={formData.price}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      price: parseFloat(e.target.value),
                                    })
                                  }
                                  step="0.01"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={formData.is_active}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      is_active: e.target.checked,
                                    })
                                  }
                                  id="active-edit"
                                />
                                <Label htmlFor="active-edit">Activo</Label>
                              </div>
                              <div className="flex gap-2 justify-end">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={handleCancel}
                                >
                                  Cancelar
                                </Button>
                                <Button type="submit" disabled={loading}>
                                  {loading ? "Guardando..." : "Guardar"}
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                        <AlertDialog open={deleteId === service.id}>
                          <AlertDialogContent>
                            <AlertDialogTitle>Eliminar Servicio</AlertDialogTitle>
                            <AlertDialogDescription>
                              ¿Está seguro de que desea eliminar "{service.name}"?
                            </AlertDialogDescription>
                            <div className="flex gap-2 justify-end">
                              <AlertDialogCancel
                                onClick={() => setDeleteId(null)}
                              >
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(service.id)}
                              >
                                Eliminar
                              </AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(service.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {services.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No hay servicios registrados. Crea uno nuevo.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
