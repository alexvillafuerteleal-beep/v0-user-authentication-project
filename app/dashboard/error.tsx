"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, RefreshCcw, Home } from "lucide-react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Reportar a Sentry si está configurado
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      import("@sentry/nextjs").then(({ captureException }) => {
        captureException(error)
      })
    }
    console.error("[DashboardError]", error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Error al cargar el dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            No se pudo cargar la información. Esto puede deberse a una conexión inestable
            o un problema temporal.
          </p>
          {error.message && (
            <p className="text-xs font-mono bg-muted rounded p-2 text-muted-foreground">
              {error.message}
            </p>
          )}
          <div className="flex gap-3">
            <Button onClick={reset} className="flex-1" size="sm">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
            <Button
              onClick={() => (window.location.href = "/dashboard")}
              variant="outline"
              className="flex-1"
              size="sm"
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
