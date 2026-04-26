"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        setError(error.message)
        return
      }

      setSent(true)
    } catch {
      setError("Ocurrió un error inesperado")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="absolute top-20 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <Card className="w-full max-w-md bg-card border-border relative z-10">
          <CardContent className="pt-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">¡Correo enviado!</h2>
            <p className="text-muted-foreground">
              Revisa tu bandeja de entrada en <strong className="text-foreground">{email}</strong> y haz clic en el
              enlace para restablecer tu contraseña.
            </p>
            <p className="text-sm text-muted-foreground">
              Si no ves el correo, revisa tu carpeta de spam.
            </p>
            <Button asChild className="w-full bg-primary hover:bg-primary/90">
              <Link href="/auth/login">Volver a Iniciar Sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-20 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

      <Card className="w-full max-w-md bg-card border-border relative z-10">
        <CardHeader className="text-center">
          <Link href="/auth/login" className="flex items-center justify-center gap-2 mb-4 hover:opacity-80 transition-all duration-300">
            <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="sgFP" cx="35%" cy="35%">
                  <stop offset="0%" stopColor="#00D9FF" />
                  <stop offset="70%" stopColor="#00A8FF" />
                  <stop offset="100%" stopColor="#0066FF" />
                </radialGradient>
                <filter id="glowFP" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <circle cx="32" cy="32" r="28" fill="url(#sgFP)" opacity="0.12" />
              <circle cx="32" cy="32" r="26" fill="none" stroke="url(#sgFP)" strokeWidth="1" opacity="0.25" />
              <text x="32" y="38" fontSize="18" fontWeight="bold" textAnchor="middle" fill="#00D9FF" opacity="0.9" filter="url(#glowFP)" fontFamily="system-ui, -apple-system, sans-serif">Pg</text>
            </svg>
            <span className="text-xl font-bold text-foreground">PagoIA</span>
          </Link>
          <CardTitle className="text-2xl text-foreground">Recuperar Contraseña</CardTitle>
          <CardDescription className="text-muted-foreground">
            Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? "Enviando..." : "Enviar Enlace de Recuperación"}
            </Button>
          </form>

          <Link
            href="/auth/login"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Iniciar Sesión
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
