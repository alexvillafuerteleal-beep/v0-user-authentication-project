"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, AlertCircle, CheckCircle } from "lucide-react"
import { Logo } from "@/components/brand/logo"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Supabase sends the token as a hash fragment; the SSR client handles it automatically
  useEffect(() => {
    // Nothing to do — supabase-js picks up the hash token on its own
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) { setError(error.message); return }
      setDone(true)
      setTimeout(() => router.push("/auth/login"), 3000)
    } catch {
      setError("Ocurrió un error inesperado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-20 right-1/4 w-64 h-64 bg-brand-spark/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

      <Card className="w-full max-w-md bg-card border-border relative z-10">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Logo markClassName="h-12 w-12" wordmarkClassName="text-2xl" />
          </div>
          <CardTitle className="text-2xl text-foreground">Nueva Contraseña</CardTitle>
          <CardDescription className="text-muted-foreground">
            Ingresa tu nueva contraseña para completar el restablecimiento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {done ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <p className="font-semibold text-foreground">¡Contraseña actualizada!</p>
              <p className="text-sm text-muted-foreground">Serás redirigido al inicio de sesión en unos segundos...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Nueva Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 bg-secondary border-border text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-foreground">Confirmar Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="Repite tu nueva contraseña"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    className="pl-10 bg-secondary border-border text-foreground"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {loading ? "Guardando..." : "Establecer Nueva Contraseña"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
