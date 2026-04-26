"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createClient, isSupabaseClientConfigured } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Mail, Lock, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isSupabaseClientConfigured()) {
      setError("La autenticación quedará disponible cuando se complete la configuración pendiente.")
      return
    }

    setLoading(true)

    const supabase = createClient()

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch {
      setError("Ocurrió un error inesperado")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)

    if (!isSupabaseClientConfigured()) {
      setError("El acceso con Google quedará disponible cuando se complete la configuración pendiente.")
      return
    }

    setGoogleLoading(true)

    const supabase = createClient()

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
        setGoogleLoading(false)
      }
    } catch {
      setError("Ocurrió un error al conectar con Google")
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute top-20 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

      <Card className="w-full max-w-md bg-card border-border relative z-10">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4 hover:opacity-80 transition-all duration-300">
            <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="sphereGradient3" cx="35%" cy="35%">
                  <stop offset="0%" stopColor="#00D9FF" />
                  <stop offset="70%" stopColor="#00A8FF" />
                  <stop offset="100%" stopColor="#0066FF" />
                </radialGradient>
                <filter id="neonGlow3" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="strongGlow3" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <circle cx="32" cy="32" r="28" fill="url(#sphereGradient3)" opacity="0.12" />
              <circle cx="32" cy="32" r="26" fill="none" stroke="url(#sphereGradient3)" strokeWidth="1" opacity="0.25" />
              <circle cx="32" cy="32" r="24" fill="none" stroke="#00FF88" strokeWidth="0.8" opacity="0.15" strokeDasharray="3,2" />
              <text x="32" y="38" fontSize="18" fontWeight="bold" textAnchor="middle" fill="#00D9FF" opacity="0.9" filter="url(#strongGlow3)" fontFamily="system-ui, -apple-system, sans-serif">Pg</text>
              <circle cx="32" cy="18" r="1.8" fill="#00FF88" filter="url(#neonGlow3)" />
              <circle cx="42" cy="22" r="1.6" fill="#00D9FF" filter="url(#neonGlow3)" />
              <circle cx="48" cy="30" r="1.5" fill="#00FF88" filter="url(#neonGlow3)" />
              <circle cx="16" cy="30" r="1.5" fill="#00FF88" filter="url(#neonGlow3)" />
              <circle cx="22" cy="46" r="1.6" fill="#00D9FF" filter="url(#neonGlow3)" />
              <circle cx="42" cy="46" r="1.6" fill="#00D9FF" filter="url(#neonGlow3)" />
              <line x1="32" y1="18" x2="42" y2="22" stroke="#00D9FF" strokeWidth="0.8" opacity="0.4" />
              <line x1="42" y1="22" x2="48" y2="30" stroke="#00FF88" strokeWidth="0.8" opacity="0.4" />
              <line x1="48" y1="30" x2="42" y2="46" stroke="#00D9FF" strokeWidth="0.8" opacity="0.4" />
              <line x1="42" y1="46" x2="22" y2="46" stroke="#00FF88" strokeWidth="0.8" opacity="0.4" />
              <line x1="22" y1="46" x2="16" y2="30" stroke="#00D9FF" strokeWidth="0.8" opacity="0.4" />
              <line x1="16" y1="30" x2="32" y2="18" stroke="#00FF88" strokeWidth="0.8" opacity="0.4" />
            </svg>
            <span className="text-xl font-bold text-foreground">PagoIA</span>
          </Link>
          <CardTitle className="text-2xl text-foreground">Iniciar Sesión</CardTitle>
          <CardDescription className="text-muted-foreground">
            Ingresa tus credenciales para acceder a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

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

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              {loading ? <Spinner className="mr-2" /> : null}
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>

            <div className="text-right">
              <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">O continúa con</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full border-border text-foreground hover:bg-secondary"
          >
            {googleLoading ? (
              <Spinner className="mr-2" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {googleLoading ? "Conectando..." : "Google"}
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿No tienes una cuenta?{" "}
            <Link href="/auth/register" className="text-primary hover:underline font-medium">
              Regístrate
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
