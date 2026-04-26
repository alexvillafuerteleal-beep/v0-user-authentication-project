"use client"

import { useEffect, useState } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AdminServicesPanel } from "@/components/admin/services-panel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          redirect("/auth/login")
        }

        // Simple check: user with admin email or specific condition
        // In production, check roles table
        const isAdminUser =
          user.email?.includes("admin") ||
          user.email === "test@example.com" // Allow test user for demo

        setIsAdmin(isAdminUser)
        setLoading(false)
      } catch (error) {
        console.error("Error checking admin status:", error)
        setLoading(false)
      }
    }

    checkAdmin()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-10">
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="w-5 h-5" />
              Acceso Denegado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-600">
              No tienes permisos para acceder al panel administrativo. Solo los administradores pueden gestionar servicios.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Panel Administrativo</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona todos los servicios disponibles en la plataforma
        </p>
      </div>

      <AdminServicesPanel />
    </div>
  )
}
